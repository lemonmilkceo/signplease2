import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContractInput {
  workerName: string;
  hourlyWage: number;
  startDate: string;
  workDays: string[];
  workStartTime: string;
  workEndTime: string;
  workLocation: string;
  jobDescription?: string;
  employerName: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const contractData: ContractInput = await req.json();

    const systemPrompt = `당신은 대한민국 근로기준법을 완벽히 이해하는 전문 법률 AI입니다.
주어진 정보를 바탕으로 법적 효력이 있는 표준근로계약서를 작성해주세요.

중요 규칙:
1. 2025년 최저시급은 10,030원입니다.
2. 주휴수당, 연장근로수당(1.5배), 야간근로수당(1.5배) 규정을 포함해야 합니다.
3. 4대 보험 가입 의무를 명시해야 합니다.
4. 근로계약서 교부 의무를 명시해야 합니다.
5. 쉬운 한국어로 작성하되, 법적 효력이 있도록 정확하게 작성하세요.`;

    const userPrompt = `다음 정보로 근로계약서를 작성해주세요:

사업주: ${contractData.employerName}
근로자: ${contractData.workerName}
시급: ${contractData.hourlyWage.toLocaleString()}원
근무 시작일: ${contractData.startDate}
근무 요일: ${contractData.workDays.join(', ')}
근무 시간: ${contractData.workStartTime} ~ ${contractData.workEndTime}
근무 장소: ${contractData.workLocation}
${contractData.jobDescription ? `업무 내용: ${contractData.jobDescription}` : ''}

계약서를 마크다운 형식으로 작성해주세요. 각 조항에 번호를 붙이고, 중요한 부분은 강조해주세요.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI 크레딧이 부족합니다. 관리자에게 문의해주세요." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI 서비스 오류");
    }

    const data = await response.json();
    const contractContent = data.choices?.[0]?.message?.content;

    if (!contractContent) {
      throw new Error("계약서 생성 실패");
    }

    return new Response(
      JSON.stringify({ contractContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-contract:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "알 수 없는 오류" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
