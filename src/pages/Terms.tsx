import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

const Terms = () => {
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
          <h1 className="font-bold text-lg">서비스 이용약관</h1>
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

          {/* 제1조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제1조 (목적)</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              이 약관은 싸인해주세요(이하 "회사")가 제공하는 근로계약서 작성 및 관리 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 이용자의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          {/* 제2조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제2조 (정의)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① "서비스"란 회사가 제공하는 근로계약서 작성, 전자서명, AI 법률검토, 계약서 관리 등의 제반 서비스를 의미합니다.</p>
              <p>② "이용자"란 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</p>
              <p>③ "회원"이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사가 제공하는 서비스를 이용할 수 있는 자를 말합니다.</p>
              <p>④ "사업주"란 근로계약서를 작성하여 근로자에게 제공하는 고용주 또는 사업자를 의미합니다.</p>
              <p>⑤ "근로자"란 사업주로부터 근로계약서를 수령하고 전자서명하는 피고용인을 의미합니다.</p>
              <p>⑥ "크레딧"이란 서비스 이용을 위해 회사가 발행하는 선불형 포인트를 의미합니다.</p>
            </div>
          </section>

          {/* 제3조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제3조 (약관의 효력 및 변경)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.</p>
              <p>② 회사는 합리적인 사유가 발생할 경우 관련 법령에 위배되지 않는 범위 내에서 이 약관을 개정할 수 있습니다.</p>
              <p>③ 회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행 약관과 함께 서비스 내에 그 적용일자 7일 전부터 공지합니다. 다만, 회원에게 불리하게 약관내용을 변경하는 경우에는 최소 30일 이상의 사전 유예기간을 두고 공지합니다.</p>
              <p>④ 회원이 개정약관에 동의하지 않는 경우 회원탈퇴를 요청할 수 있으며, 개정약관 시행일까지 거부의사를 표시하지 않으면 약관의 변경에 동의한 것으로 간주합니다.</p>
            </div>
          </section>

          {/* 제4조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제4조 (서비스의 제공)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① 회사는 다음과 같은 서비스를 제공합니다:</p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>AI 기반 근로계약서 자동 작성 서비스</li>
                <li>전자서명 및 계약서 관리 서비스</li>
                <li>AI 노무사 법률검토 서비스</li>
                <li>근로자-사업주 간 채팅 서비스</li>
                <li>커리어 관리 및 기록 서비스</li>
                <li>기타 회사가 추가 개발하거나 제휴를 통해 제공하는 서비스</li>
              </ul>
              <p>② 회사는 서비스의 품질 향상을 위해 서비스의 내용을 변경할 수 있으며, 이 경우 변경된 서비스의 내용과 제공일자를 명시하여 공지합니다.</p>
            </div>
          </section>

          {/* 제5조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제5조 (회원가입)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.</p>
              <p>② 회사는 다음 각 호에 해당하는 신청에 대하여는 승낙을 하지 않거나 사후에 이용계약을 해지할 수 있습니다:</p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                <li>실명이 아니거나 타인의 명의를 이용한 경우</li>
                <li>허위의 정보를 기재하거나, 회사가 요구하는 내용을 기재하지 않은 경우</li>
                <li>만 14세 미만 아동이 법정대리인의 동의를 얻지 않은 경우</li>
                <li>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
              </ul>
            </div>
          </section>

          {/* 제6조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제6조 (회원정보의 변경)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① 회원은 개인정보관리화면을 통하여 언제든지 본인의 개인정보를 열람하고 수정할 수 있습니다.</p>
              <p>② 회원은 회원가입신청 시 기재한 사항이 변경되었을 경우 온라인으로 수정하거나 전자우편 기타 방법으로 회사에 그 변경사항을 알려야 합니다.</p>
              <p>③ 제2항의 변경사항을 회사에 알리지 않아 발생한 불이익에 대해 회사는 책임지지 않습니다.</p>
            </div>
          </section>

          {/* 제7조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제7조 (크레딧 및 유료서비스)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① 회사는 서비스 이용을 위한 크레딧을 유료로 판매하며, 크레딧의 가격 및 사용조건은 서비스 내에 별도로 게시합니다.</p>
              <p>② 크레딧은 구매 후 사용기한 내에 사용하여야 하며, 사용하지 않은 크레딧은 환불 정책에 따라 처리됩니다.</p>
              <p>③ 회사가 무상으로 제공하는 무료 크레딧은 환불 대상에서 제외됩니다.</p>
              <p>④ 크레딧의 환불은 전자상거래 등에서의 소비자보호에 관한 법률에 따라 처리됩니다.</p>
              <p>⑤ 다음 각 호의 경우 환불이 제한될 수 있습니다:</p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>크레딧을 이미 사용한 경우 (사용한 크레딧 제외 후 환불)</li>
                <li>이벤트, 프로모션 등으로 무상 지급된 크레딧</li>
                <li>제3자에게 양도하거나 부정한 방법으로 취득한 크레딧</li>
              </ul>
            </div>
          </section>

          {/* 제8조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제8조 (전자서명의 효력)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① 본 서비스를 통해 작성된 전자서명은 전자서명법 제3조에 따라 법적 효력을 가집니다.</p>
              <p>② 회원은 전자서명 시 본인 명의로 직접 서명하여야 하며, 타인의 명의로 서명하거나 타인의 서명을 도용해서는 안 됩니다.</p>
              <p>③ 전자서명된 계약서는 당사자 간의 합의로서 효력을 가지며, 분쟁 발생 시 법적 증거자료로 활용될 수 있습니다.</p>
              <p>④ 회사는 전자서명의 진정성 입증을 위해 서명 시점, IP 주소, 기기정보 등을 기록할 수 있습니다.</p>
            </div>
          </section>

          {/* 제9조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제9조 (AI 서비스의 한계)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① AI 기반 계약서 작성 및 법률검토 서비스는 인공지능 기술을 활용한 참고용 서비스이며, 전문 변호사 또는 공인노무사의 법률자문을 대체하지 않습니다.</p>
              <p>② 회원은 AI 서비스 결과물을 최종 의사결정의 참고자료로만 활용해야 하며, 중요한 법적 사안에 대해서는 반드시 전문가의 조언을 받아야 합니다.</p>
              <p>③ 회사는 AI 서비스의 결과물에 대해 정확성, 완전성, 적법성을 보장하지 않으며, AI 서비스 이용으로 인해 발생하는 법적 분쟁이나 손해에 대해 책임지지 않습니다.</p>
            </div>
          </section>

          {/* 제10조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제10조 (회사의 의무)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① 회사는 관련 법령과 이 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며, 지속적이고 안정적으로 서비스를 제공하기 위하여 최선을 다합니다.</p>
              <p>② 회사는 회원이 안전하게 서비스를 이용할 수 있도록 개인정보보호를 위한 보안시스템을 갖추어야 하며, 개인정보처리방침을 공시하고 준수합니다.</p>
              <p>③ 회사는 서비스 이용과 관련하여 회원으로부터 제기된 의견이나 불만이 정당하다고 인정할 경우 이를 처리하여야 합니다.</p>
            </div>
          </section>

          {/* 제11조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제11조 (회원의 의무)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① 회원은 다음 행위를 하여서는 안 됩니다:</p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>신청 또는 변경 시 허위내용의 등록</li>
                <li>타인의 정보 도용</li>
                <li>회사가 게시한 정보의 변경</li>
                <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등)의 송신 또는 게시</li>
                <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
                <li>서비스를 이용하여 불법적인 근로계약을 체결하는 행위</li>
                <li>최저임금법 등 노동관계법령을 위반하는 내용의 계약서를 작성하는 행위</li>
              </ul>
              <p>② 회원은 관계 법령, 이 약관의 규정, 이용안내 및 서비스와 관련하여 공지한 주의사항, 회사가 통지하는 사항 등을 준수하여야 합니다.</p>
            </div>
          </section>

          {/* 제12조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제12조 (서비스 이용의 제한 및 정지)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① 회사는 회원이 이 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우, 서비스 이용을 제한하거나 정지할 수 있습니다.</p>
              <p>② 회사는 전항에도 불구하고, 주민등록법을 위반한 명의도용 및 결제도용, 저작권법 및 컴퓨터프로그램보호법을 위반한 불법프로그램의 제공 및 운영방해, 정보통신망법을 위반한 불법통신 및 해킹, 악성프로그램의 배포, 접속권한 초과행위 등과 같이 관련 법령을 위반한 경우에는 즉시 영구이용정지를 할 수 있습니다.</p>
              <p>③ 본 조에 따른 이용정지 시 크레딧 및 기타 혜택 등도 모두 소멸되며, 회사는 이에 대해 별도로 보상하지 않습니다.</p>
            </div>
          </section>

          {/* 제13조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제13조 (회원탈퇴 및 자격상실)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① 회원은 회사에 언제든지 탈퇴를 요청할 수 있으며, 회사는 즉시 회원탈퇴를 처리합니다.</p>
              <p>② 회원탈퇴 시 회원의 개인정보는 개인정보처리방침에 따라 처리되며, 잔여 유료 크레딧이 있는 경우 환불 정책에 따라 처리됩니다.</p>
              <p>③ 회원탈퇴 후에도 작성된 근로계약서는 법적 보존 의무에 따라 일정 기간 보관될 수 있습니다.</p>
            </div>
          </section>

          {/* 제14조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제14조 (저작권 및 지적재산권)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① 서비스 내의 모든 콘텐츠에 대한 저작권 및 지적재산권은 회사에 귀속됩니다.</p>
              <p>② 회원은 서비스를 이용함으로써 얻은 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.</p>
              <p>③ 회원이 작성한 근로계약서의 저작권은 해당 회원에게 귀속됩니다.</p>
            </div>
          </section>

          {/* 제15조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제15조 (면책조항)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① 회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력적인 사유가 발생한 경우 서비스 제공에 대한 책임이 면제됩니다.</p>
              <p>② 회사는 회원의 귀책사유로 인한 서비스 이용 장애에 대해 책임지지 않습니다.</p>
              <p>③ 회사는 회원이 서비스를 이용하여 기대하는 수익을 얻지 못하거나 상실한 것에 대하여 책임을 지지 않습니다.</p>
              <p>④ 회사는 회원 상호간 또는 회원과 제3자 간에 서비스를 매개로 발생한 분쟁에 대해 개입할 의무가 없으며, 이로 인한 손해를 배상할 책임도 없습니다.</p>
              <p>⑤ 회사는 근로계약서의 내용이 근로기준법 등 관련 법령에 적합한지 여부를 보증하지 않으며, 계약 내용에 대한 법적 책임은 계약 당사자에게 있습니다.</p>
            </div>
          </section>

          {/* 제16조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제16조 (손해배상)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① 회사가 고의 또는 중대한 과실로 회원에게 손해를 입힌 경우, 회사는 회원에게 발생한 실제 손해를 배상합니다.</p>
              <p>② 회원이 이 약관을 위반하여 회사에 손해를 입힌 경우, 해당 회원은 회사에 발생한 손해를 배상하여야 합니다.</p>
            </div>
          </section>

          {/* 제17조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제17조 (분쟁해결)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① 회사와 회원 간에 서비스 이용과 관련하여 분쟁이 발생한 경우, 양 당사자는 성실하게 협의하여 해결하도록 노력합니다.</p>
              <p>② 제1항의 협의에도 불구하고 분쟁이 해결되지 않는 경우, 양 당사자는 콘텐츠분쟁조정위원회의 조정을 받을 수 있습니다.</p>
              <p>③ 본 약관에 명시되지 않은 사항에 대해서는 전자상거래 등에서의 소비자보호에 관한 법률, 약관의 규제 등에 관한 법률, 정보통신망 이용촉진 및 정보보호 등에 관한 법률 등 관련 법령에 따릅니다.</p>
            </div>
          </section>

          {/* 제18조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">제18조 (재판관할)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① 서비스 이용으로 발생한 분쟁에 대해 소송이 제기되는 경우 회사의 본사 소재지를 관할하는 법원을 전속관할법원으로 합니다.</p>
            </div>
          </section>

          {/* 부칙 */}
          <section className="space-y-3 pt-4 border-t border-border">
            <h2 className="text-lg font-bold text-foreground">부칙</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>① 이 약관은 2026년 1월 12일부터 시행합니다.</p>
              <p>② 이 약관 시행 이전에 가입한 회원도 이 약관의 적용을 받습니다.</p>
            </div>
          </section>

          {/* 회사 정보 */}
          <section className="space-y-3 pt-4 border-t border-border">
            <h2 className="text-lg font-bold text-foreground">회사 정보</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-1">
              <p>상호: 싸인해주세요</p>
              <p>대표자: [대표자명]</p>
              <p>사업자등록번호: [사업자등록번호]</p>
              <p>주소: [회사 주소]</p>
              <p>이메일: support@signhaeyo.com</p>
              <p>고객센터: 1588-0000</p>
            </div>
          </section>

          <div className="h-8" />
        </motion.div>
      </ScrollArea>
    </div>
  );
};

export default Terms;
