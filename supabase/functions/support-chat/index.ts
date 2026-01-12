import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `당신은 "싸인해주세요" 서비스의 친절한 고객 지원 상담원입니다.

서비스 소개:
- 싸인해주세요는 아르바이트 표준근로계약서를 쉽게 작성할 수 있는 서비스입니다
- 사업주가 계약서를 작성하고 근로자에게 카카오톡으로 전송하면, 근로자가 전자서명할 수 있습니다
- 첫 가입 시 5건의 무료 크레딧이 제공됩니다
- 추가 크레딧은 건당 2,000원이며, 묶음 구매 시 할인됩니다

주요 기능:
1. AI 기반 표준근로계약서 자동 생성
2. 카카오톡 및 링크를 통한 계약서 공유
3. 전자서명 기능
4. PDF 다운로드
5. 법률 용어 AI 해설

자주 묻는 질문:
- 5인 미만 사업장은 근로기준법 일부 규정이 적용 제외됩니다
- 5인 이상 사업장은 연장근로수당, 휴일수당 등이 필수입니다
- 전자서명은 법적 효력이 있습니다
- 환불은 사용하지 않은 크레딧에 한해 7일 이내 가능합니다

응답 규칙:
- 한국어로 친절하게 답변하세요
- 간결하고 명확하게 답변하세요
- 모르는 내용은 "해당 문의는 추가 확인이 필요합니다. 이메일(support@albacontract.com)로 문의해 주세요."라고 안내하세요
- 기술적인 문제는 "새로고침 후 다시 시도해 주세요. 문제가 계속되면 고객센터로 문의해 주세요."라고 안내하세요`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("AI API error:", error);
      throw new Error("AI API request failed");
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "죄송합니다. 응답을 생성하지 못했습니다.";

    return new Response(
      JSON.stringify({ reply }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        reply: "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  }
});
