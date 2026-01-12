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
    const { type, title, content, email, userName, userId } = await req.json();
    
    // 여기서 실제로는 이메일 발송이나 DB 저장을 할 수 있습니다
    // 현재는 로깅만 수행
    console.log("=== 새로운 고객 문의 접수 ===");
    console.log(`문의 유형: ${type}`);
    console.log(`제목: ${title}`);
    console.log(`내용: ${content}`);
    console.log(`답변 이메일: ${email}`);
    console.log(`작성자: ${userName} (${userId || '비회원'})`);
    console.log(`접수 시간: ${new Date().toISOString()}`);
    console.log("============================");

    // TODO: 실제 서비스에서는 아래 기능을 구현할 수 있습니다
    // 1. 문의 내역을 DB에 저장
    // 2. 관리자에게 이메일 알림 발송
    // 3. 고객에게 접수 확인 이메일 발송

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "문의가 성공적으로 접수되었습니다." 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Inquiry submission error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
