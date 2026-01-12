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

    const isOver5 = contractData.businessSize === 'over5';
    
    const systemPrompt = `당신은 대한민국 노동법 전문 법률 자문가입니다. 2026년 최신 근로기준법을 기준으로 계약서를 분석해주세요.

**응답 형식 (반드시 JSON 형식으로 응답):**
{
  "grade": "완벽" | "양호" | "나쁨",
  "summary": "한 줄 요약",
  "issues": ["문제점1", "문제점2"],
  "advice": "상세 조언 (3줄 이내)"
}

**등급 기준:**
- 완벽: 법적 문제 없음, 모든 필수 항목 충족
- 양호: 경미한 보완 필요, 법적 효력에 큰 문제 없음
- 나쁨: 심각한 법적 문제 있음, 즉시 수정 필요

**체크 항목:**
- 최저시급 준수 여부 (2026년 기준 10,360원)
- 주휴수당 포함 시 12,432원 이상인지
- 기본급과 주휴수당 명확히 구분 여부
- 휴게시간 명시 여부
- 근무일수 명시 여부
${isOver5 ? '- 5인 이상 사업장: 연장/휴일/연차 수당 항목별 금액 명시 여부 (법적 의무)' : '- 5인 미만 사업장: 연장/휴일/연차 수당은 법적 의무 없음 (검토 제외)'}

**중요: ${isOver5 ? '5인 이상 사업장이므로 연장근로수당, 휴일근로수당, 연차유급휴가수당이 반드시 명시되어야 합니다.' : '5인 미만 사업장이므로 연장근로수당, 휴일근로수당, 연차유급휴가수당에 대한 법적 의무가 없습니다. 이 항목들이 없어도 문제가 아닙니다.'}**

반드시 위 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요.`;

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
      // 단위당 금액 필드 사용
      if (details.overtimePerHour) items.push(`연장근로수당: 시간당 ${details.overtimePerHour.toLocaleString()}원`);
      if (details.holidayPerDay) items.push(`휴일근로수당: 일당 ${details.holidayPerDay.toLocaleString()}원`);
      if (details.annualLeavePerDay) items.push(`연차유급휴가수당: 일당 ${details.annualLeavePerDay.toLocaleString()}원`);
      wageDetailsText = items.length > 0 ? `포괄임금 수당 명시: ${items.join(', ')}` : '수당 세부: 미기재';
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
    const rawContent = data.choices?.[0]?.message?.content || "";
    
    // JSON 파싱 시도
    let result;
    try {
      // JSON 블록 추출 (```json ... ``` 형식 처리)
      let jsonStr = rawContent;
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      // JSON 파싱 실패 시 기본 응답
      result = {
        grade: "양호",
        summary: "분석이 완료되었습니다.",
        issues: [],
        advice: rawContent
      };
    }

    return new Response(JSON.stringify(result), {
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
