import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border"
      >
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">개인정보처리방침</h1>
          <div className="w-9" />
        </div>
      </motion.div>

      <ScrollArea className="h-[calc(100vh-65px)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 space-y-6"
        >
          <div className="text-sm text-muted-foreground mb-4">
            최종 수정일: 2026년 1월 12일
          </div>

          {/* 서문 */}
          <section className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              싸인해주세요(이하 "회사")는 정보통신망 이용촉진 및 정보보호 등에 관한 법률, 개인정보 보호법 등 관련 법령을 준수하며, 이용자의 개인정보 보호를 매우 중요시합니다. 회사는 이 개인정보처리방침을 통하여 이용자의 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보 보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
            </p>
          </section>

          {/* 제1조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제1조 (개인정보의 수집 항목)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① 회사는 회원가입, 서비스 이용 등을 위해 아래와 같은 개인정보를 수집합니다.</p>
              <div className="pl-2 space-y-2">
                <p><strong>1. 필수 수집 항목</strong></p>
                <ul className="list-disc list-inside pl-2 space-y-1">
                  <li>이메일 주소, 비밀번호 (회원가입 및 로그인)</li>
                  <li>이름, 휴대폰 번호 (본인확인 및 서비스 제공)</li>
                  <li>생년월일, 성별 (근로계약서 작성)</li>
                  <li>주민등록번호 뒤 7자리 중 첫 1자리 (성별 확인용, 저장하지 않음)</li>
                </ul>
                <p><strong>2. 선택 수집 항목</strong></p>
                <ul className="list-disc list-inside pl-2 space-y-1">
                  <li>은행명, 계좌번호 (급여 지급용)</li>
                  <li>사업장명, 사업장 주소 (사업주 정보)</li>
                </ul>
                <p><strong>3. 서비스 이용 과정에서 자동 수집되는 정보</strong></p>
                <ul className="list-disc list-inside pl-2 space-y-1">
                  <li>IP 주소, 쿠키, 서비스 이용 기록</li>
                  <li>기기 정보 (기기 식별자, OS 종류, 버전)</li>
                  <li>접속 일시, 접속 로그</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 제2조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제2조 (개인정보의 수집 방법)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>회사는 다음과 같은 방법으로 개인정보를 수집합니다:</p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>회원가입 및 서비스 이용 과정에서 이용자가 직접 입력</li>
                <li>서비스 이용 과정에서 자동으로 생성 및 수집</li>
                <li>고객센터를 통한 상담 과정에서 수집</li>
              </ul>
            </div>
          </section>

          {/* 제3조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제3조 (개인정보의 수집 및 이용 목적)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>회사는 수집한 개인정보를 다음의 목적을 위해 이용합니다:</p>
              <div className="pl-2 space-y-2">
                <p><strong>1. 회원 관리</strong></p>
                <ul className="list-disc list-inside pl-2 space-y-1">
                  <li>회원제 서비스 이용에 따른 본인확인</li>
                  <li>개인 식별, 불량회원의 부정 이용 방지</li>
                  <li>가입 의사 확인, 연령 확인</li>
                  <li>불만처리 등 민원처리, 고지사항 전달</li>
                </ul>
                <p><strong>2. 서비스 제공</strong></p>
                <ul className="list-disc list-inside pl-2 space-y-1">
                  <li>근로계약서 작성 및 관리</li>
                  <li>전자서명 서비스 제공</li>
                  <li>AI 법률검토 서비스 제공</li>
                  <li>사업주-근로자 간 연결 및 채팅</li>
                  <li>콘텐츠 제공, 맞춤 서비스 제공</li>
                </ul>
                <p><strong>3. 마케팅 및 광고 활용</strong></p>
                <ul className="list-disc list-inside pl-2 space-y-1">
                  <li>이벤트 및 광고성 정보 제공 (선택 동의 시)</li>
                  <li>서비스 이용 통계 분석</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 제4조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제4조 (개인정보의 보유 및 이용 기간)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① 회사는 회원이 회원자격을 유지하는 동안 개인정보를 보유·이용합니다.</p>
              <p>② 회원탈퇴 시 개인정보는 즉시 파기됩니다. 단, 다음의 경우 명시한 기간 동안 보관합니다:</p>
              <div className="pl-2 space-y-2">
                <p><strong>1. 관련 법령에 따른 보관</strong></p>
                <ul className="list-disc list-inside pl-2 space-y-1">
                  <li>전자상거래법에 따른 계약 및 청약철회 기록: 5년</li>
                  <li>전자상거래법에 따른 대금결제 및 재화 공급 기록: 5년</li>
                  <li>전자상거래법에 따른 소비자 불만 또는 분쟁처리 기록: 3년</li>
                  <li>통신비밀보호법에 따른 서비스 이용 기록: 3개월</li>
                  <li>근로기준법에 따른 근로계약서 보관: 3년</li>
                </ul>
                <p><strong>2. 회사 내부 방침에 따른 보관</strong></p>
                <ul className="list-disc list-inside pl-2 space-y-1">
                  <li>부정 이용 방지를 위한 기록: 탈퇴 후 1년</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 제5조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제5조 (개인정보의 제3자 제공)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① 회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:</p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              </ul>
              <p>② 근로계약 체결 목적으로 사업주와 근로자 간에 다음 정보가 상호 제공됩니다:</p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>사업주 → 근로자: 사업장명, 사업주명, 근무지 주소</li>
                <li>근로자 → 사업주: 이름, 연락처, 서명 (계약서 서명 시)</li>
              </ul>
            </div>
          </section>

          {/* 제6조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제6조 (개인정보 처리의 위탁)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① 회사는 서비스 제공을 위해 필요한 범위 내에서 개인정보 처리 업무를 위탁하고 있습니다:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse border border-border mt-2">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-2 text-left">수탁업체</th>
                      <th className="border border-border p-2 text-left">위탁 업무</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border p-2">Supabase Inc.</td>
                      <td className="border border-border p-2">클라우드 서버 운영 및 데이터 저장</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-2">[결제대행사]</td>
                      <td className="border border-border p-2">결제 처리</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-2">② 회사는 위탁계약 체결 시 개인정보 보호법에 따라 위탁업무 수행목적 외 개인정보 처리 금지, 재위탁 제한, 안전성 확보조치 등을 명확히 규정하고 관리·감독하고 있습니다.</p>
            </div>
          </section>

          {/* 제7조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제7조 (이용자의 권리와 행사 방법)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① 이용자는 언제든지 다음의 권리를 행사할 수 있습니다:</p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>개인정보 열람 요구</li>
                <li>오류 등이 있을 경우 정정 요구</li>
                <li>삭제 요구</li>
                <li>처리정지 요구</li>
              </ul>
              <p>② 위 권리 행사는 서비스 내 '회원정보' 메뉴 또는 고객센터를 통해 할 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다.</p>
              <p>③ 이용자가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우, 회사는 정정 또는 삭제를 완료할 때까지 해당 개인정보를 이용하거나 제공하지 않습니다.</p>
            </div>
          </section>

          {/* 제8조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제8조 (개인정보의 파기)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.</p>
              <p>② 파기 방법:</p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>전자적 파일 형태: 복구 및 재생이 불가능한 방법으로 영구 삭제</li>
                <li>종이 문서: 분쇄기로 분쇄하거나 소각</li>
              </ul>
            </div>
          </section>

          {/* 제9조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제9조 (개인정보의 안전성 확보 조치)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육</li>
                <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
                <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
              </ul>
            </div>
          </section>

          {/* 제10조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제10조 (쿠키의 설치·운영 및 거부)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① 회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.</p>
              <p>② 쿠키는 웹사이트를 운영하는데 이용되는 서버가 이용자의 브라우저에 보내는 소량의 정보이며 이용자들의 기기 저장공간에 저장됩니다.</p>
              <p>③ 이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다. 웹브라우저에서 옵션을 설정함으로써 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 모든 쿠키의 저장을 거부할 수 있습니다.</p>
            </div>
          </section>

          {/* 제11조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제11조 (개인정보 보호책임자)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다:</p>
              <div className="bg-muted/50 p-4 rounded-lg mt-2">
                <p><strong>개인정보 보호책임자</strong></p>
                <p>성명: [담당자명]</p>
                <p>직책: [직책]</p>
                <p>이메일: privacy@signhaeyo.com</p>
                <p>전화: 1588-0000</p>
              </div>
            </div>
          </section>

          {/* 제12조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제12조 (권익침해 구제방법)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>이용자는 개인정보침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터 등에 분쟁해결이나 상담 등을 신청할 수 있습니다:</p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>개인정보분쟁조정위원회: (국번없이) 1833-6972 (www.kopico.go.kr)</li>
                <li>개인정보침해신고센터: (국번없이) 118 (privacy.kisa.or.kr)</li>
                <li>대검찰청: (국번없이) 1301 (www.spo.go.kr)</li>
                <li>경찰청: (국번없이) 182 (ecrm.cyber.go.kr)</li>
              </ul>
            </div>
          </section>

          {/* 제13조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제13조 (개인정보 처리방침의 변경)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① 이 개인정보처리방침은 2026년 1월 12일부터 적용됩니다.</p>
              <p>② 이전의 개인정보 처리방침은 아래에서 확인하실 수 있습니다.</p>
              <p className="text-xs">- 이전 버전 없음 (최초 시행)</p>
            </div>
          </section>

          <div className="h-8" />
        </motion.div>
      </ScrollArea>
    </div>
  );
};

export default Privacy;
