import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `당신은 대한민국 노동법 전문 법률 자문가입니다. 2026년 최신 근로기준법을 기준으로 계약서를 분석해주세요.

**응답 규칙:**
- 총 5줄 이내로 핵심만 간결하게
- 문제가 있으면 ⚠️, 좋으면 ✅ 표시
- 가장 중요한 1~2가지만 언급
- 기본급과 주휴수당이 명확히 구분되어 있는지 확인
- 5인 이상 사업장의 경우 수당 항목별 금액 명시 여부 필수 확인

2026년 기준: 최저시급 10,360원, 주휴수당 포함 시 12,432원
주휴수당: 주 15시간 이상 근무 시 발생, 1일 소정근로시간 × 시급
5인 이상 사업장: 포괄임금 계약 시 연장/휴일/연차 수당 항목과 금액을 명시해야 법적 효력 인정`;

    const businessSizeText = contractData.businessSize === 'over5' ? '5인 이상' : contractData.businessSize === 'under5' ? '5인 미만' : '미선택';
    
    // 주휴수당 계산 정보
    let wageBreakdownText = '';
    if (contractData.wageBreakdown) {
      const wb = contractData.wageBreakdown;
      if (wb.isWeeklyHolidayEligible) {
        wageBreakdownText = `월급 내역: 기본급 ${wb.baseWage?.toLocaleString()}원 + 주휴수당 ${wb.weeklyHolidayPay?.toLocaleString()}원 = 총 ${wb.totalWage?.toLocaleString()}원 (주 ${wb.weeklyWorkHours}시간)`;
      } else {
        wageBreakdownText = `월급 내역: 기본급 ${wb.baseWage?.toLocaleString()}원 (주휴수당 미발생 - 주 ${wb.weeklyWorkHours}시간, 15시간 미만)`;
      }
    }
    
    let wageDetailsText = '';
    if (contractData.businessSize === 'over5' && contractData.comprehensiveWageDetails) {
      const details = contractData.comprehensiveWageDetails;
      const items = [];
      if (details.overtimeAllowance) items.push(`연장근로수당: 월 ${details.overtimeAllowance.toLocaleString()}원`);
      if (details.holidayAllowance) items.push(`휴일근로수당: 월 ${details.holidayAllowance.toLocaleString()}원`);
      if (details.annualLeaveAllowance) items.push(`연차유급휴가수당: 연 ${details.annualLeaveAllowance.toLocaleString()}원`);
      wageDetailsText = items.length > 0 ? `수당 세부: ${items.join(', ')}` : '수당 세부: 미기재';
    }

    const contractSummary = `사업장: ${businessSizeText}, 시급: ${contractData.hourlyWage?.toLocaleString()}원 ${contractData.includeWeeklyHolidayPay ? '(주휴수당 포함)' : ''}, 근무: ${contractData.workStartTime}~${contractData.workEndTime}, 휴게: ${contractData.breakTimeMinutes ? `${contractData.breakTimeMinutes}분` : '미기재'}, 주${contractData.workDaysPerWeek || '?'}일, 포괄임금: ${contractData.isComprehensiveWage ? '예' : '아니오'}${wageDetailsText ? `, ${wageDetailsText}` : ''}${wageBreakdownText ? `, ${wageBreakdownText}` : ''}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `다음 근로계약서를 분석하고 법적 조언을 해주세요:\n${contractSummary}` }
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI 서비스 사용량을 초과했습니다." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI 분석에 실패했습니다." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const advice = data.choices?.[0]?.message?.content || "조언을 생성할 수 없습니다.";

    return new Response(JSON.stringify({ advice }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Legal advice error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
