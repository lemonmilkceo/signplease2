import html2pdf from 'html2pdf.js';

export interface ContractPDFData {
  employerName: string;
  workerName: string;
  hourlyWage: number;
  monthlyWage?: number;
  wageType?: 'hourly' | 'monthly';
  startDate: string;
  endDate?: string;
  noEndDate?: boolean;
  workStartTime: string;
  workEndTime: string;
  workDays: string[];
  workDaysPerWeek?: number;
  workLocation: string;
  businessName?: string;
  jobDescription?: string;
  breakTimeMinutes?: number;
  employerSignature?: string | null;
  workerSignature?: string | null;
  signedAt?: string | null;
  includeWeeklyHolidayPay?: boolean;
  wageBreakdown?: {
    baseWage: number;
    weeklyHolidayPay: number;
    totalWage: number;
    weeklyWorkHours: number;
    isWeeklyHolidayEligible: boolean;
  } | null;
  // 추가 정보
  paymentDay?: number;
  paymentMonth?: 'current' | 'next';
  paymentEndOfMonth?: boolean;
  businessSize?: 'under5' | 'over5';
  comprehensiveWageDetails?: {
    overtimePerHour?: number;
    nightAllowance?: number;
    holidayPerDay?: number;
    annualLeavePerDay?: number;
  };
  // 근로자 정보
  workerPhone?: string;
  workerResidentNumber?: string;
  workerAddress?: string;
  workerBankName?: string;
  workerBankAccount?: string;
}

export const generateContractPDF = async (data: ContractPDFData, filename: string = '근로계약서.pdf') => {
  const htmlContent = createContractHTML(data);
  
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  document.body.appendChild(container);

  const options = {
    margin: [10, 10, 10, 10],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2, 
      useCORS: true,
      letterRendering: true,
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait' 
    },
  };

  try {
    await html2pdf().set(options).from(container).save();
  } finally {
    document.body.removeChild(container);
  }
};

const createContractHTML = (data: ContractPDFData): string => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  // 서명이 완료되지 않았으면 워터마크 표시
  const needsSignature = !data.employerSignature || !data.workerSignature;
  const watermarkHTML = needsSignature ? `
    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 60px; font-weight: bold; color: rgba(255, 0, 0, 0.1); white-space: nowrap; pointer-events: none; z-index: 1000;">
      서명 필요
    </div>
  ` : '';

  // 근무일 표시
  const formatWorkDays = () => {
    if (data.workDaysPerWeek) {
      return `주 ${data.workDaysPerWeek}일`;
    }
    if (data.workDays && data.workDays.length > 0) {
      return data.workDays.join(', ');
    }
    return '별도 협의';
  };

  // 임금 지급일 표시
  const formatPaymentDay = () => {
    if (data.paymentMonth && (data.paymentEndOfMonth || data.paymentDay)) {
      const month = data.paymentMonth === 'current' ? '당월' : '익월';
      const day = data.paymentEndOfMonth ? '말일' : `${data.paymentDay}일`;
      return `매월 ${month} ${day}`;
    }
    return '매월 익월 10일';
  };

  // 근무시간 계산
  const calculateWorkHours = () => {
    if (!data.workStartTime || !data.workEndTime) return 0;
    const [startH, startM] = data.workStartTime.split(':').map(Number);
    const [endH, endM] = data.workEndTime.split(':').map(Number);
    let hours = (endH * 60 + endM - startH * 60 - startM) / 60;
    if (hours < 0) hours += 24; // 익일 근무
    if (data.breakTimeMinutes) hours -= data.breakTimeMinutes / 60;
    return Math.round(hours * 10) / 10;
  };

  const dailyWorkHours = calculateWorkHours();

  return `
    <div style="font-family: 'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif; padding: 30px 40px; max-width: 700px; margin: 0 auto; color: #1a1a1a; font-size: 13px; line-height: 1.8; position: relative; background: #fff;">
      ${watermarkHTML}
      
      <!-- 문서 제목 -->
      <h1 style="text-align: center; font-size: 26px; font-weight: bold; margin-bottom: 10px; letter-spacing: 8px;">
        표 준 근 로 계 약 서
      </h1>
      <p style="text-align: center; font-size: 12px; color: #666; margin-bottom: 30px;">
        (근로기준법 제17조에 의한 근로조건 명시)
      </p>

      <!-- 서문 -->
      <p style="margin-bottom: 25px; text-indent: 1em; font-size: 14px;">
        <strong style="font-size: 15px;">${data.businessName || data.employerName}</strong>(이하 "사업주"라 한다)과(와) 
        <strong style="font-size: 15px;">${data.workerName}</strong>(이하 "근로자"라 한다)은(는) 
        다음과 같이 근로계약을 체결하고 이를 성실히 이행할 것을 약정한다.
      </p>

      <!-- 제1조: 근로계약기간 -->
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 14px; font-weight: bold; color: #000; margin-bottom: 8px; padding: 8px 12px; background: #f5f5f5; border-left: 4px solid #333;">
          제1조 (근로계약기간)
        </h2>
        <div style="padding: 10px 15px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 120px; padding: 5px 0; color: #555;">근로개시일</td>
              <td style="padding: 5px 0; font-weight: 500;">${formatDate(data.startDate)}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #555;">근로종료일</td>
              <td style="padding: 5px 0; font-weight: 500;">
                ${data.noEndDate || !data.endDate ? '기간의 정함이 없음' : formatDate(data.endDate)}
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- 제2조: 근무장소 및 업무내용 -->
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 14px; font-weight: bold; color: #000; margin-bottom: 8px; padding: 8px 12px; background: #f5f5f5; border-left: 4px solid #333;">
          제2조 (근무장소 및 업무내용)
        </h2>
        <div style="padding: 10px 15px;">
          <table style="width: 100%; border-collapse: collapse;">
            ${data.businessName ? `
            <tr>
              <td style="width: 120px; padding: 5px 0; color: #555;">사업장명</td>
              <td style="padding: 5px 0; font-weight: 500;">${data.businessName}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="width: 120px; padding: 5px 0; color: #555;">근무장소</td>
              <td style="padding: 5px 0; font-weight: 500;">${data.workLocation}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #555; vertical-align: top;">업무내용</td>
              <td style="padding: 5px 0; font-weight: 500;">${data.jobDescription || '일반 업무'}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- 제3조: 근로시간 및 휴게 -->
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 14px; font-weight: bold; color: #000; margin-bottom: 8px; padding: 8px 12px; background: #f5f5f5; border-left: 4px solid #333;">
          제3조 (근로시간 및 휴게)
        </h2>
        <div style="padding: 10px 15px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 120px; padding: 5px 0; color: #555;">근무요일</td>
              <td style="padding: 5px 0; font-weight: 500;">${formatWorkDays()}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #555;">근로시간</td>
              <td style="padding: 5px 0; font-weight: 500;">
                ${data.workStartTime} ~ ${data.workEndTime} (1일 ${dailyWorkHours}시간)
              </td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #555;">휴게시간</td>
              <td style="padding: 5px 0; font-weight: 500;">
                ${data.breakTimeMinutes === 0 || !data.breakTimeMinutes ? '없음' : `${data.breakTimeMinutes}분 (근무시간 중 자유롭게 사용)`}
              </td>
            </tr>
          </table>
          <p style="font-size: 11px; color: #666; margin-top: 8px; padding: 8px; background: #fafafa; border-radius: 4px;">
            ※ 4시간 근로 시 30분, 8시간 근로 시 1시간 이상의 휴게시간을 근로시간 도중에 부여함 (근로기준법 제54조)
          </p>
        </div>
      </div>

      <!-- 제4조: 임금 -->
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 14px; font-weight: bold; color: #000; margin-bottom: 8px; padding: 8px 12px; background: #f5f5f5; border-left: 4px solid #333;">
          제4조 (임금)
        </h2>
        <div style="padding: 10px 15px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 120px; padding: 5px 0; color: #555;">임금형태</td>
              <td style="padding: 5px 0; font-weight: 500;">
                ${data.wageType === 'monthly' ? '월급제' : '시급제'}
              </td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #555;">
                ${data.wageType === 'monthly' ? '월 급여' : '시 급'}
              </td>
              <td style="padding: 5px 0; font-weight: 600; font-size: 15px; color: #000;">
                ${data.wageType === 'monthly' && data.monthlyWage 
                  ? `${data.monthlyWage.toLocaleString()}원` 
                  : `${data.hourlyWage.toLocaleString()}원`}
                ${data.includeWeeklyHolidayPay ? ' (주휴수당 포함)' : ''}
              </td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #555;">임금지급일</td>
              <td style="padding: 5px 0; font-weight: 500;">${formatPaymentDay()}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #555;">지급방법</td>
              <td style="padding: 5px 0; font-weight: 500;">근로자 명의 예금계좌로 입금</td>
            </tr>
          </table>
          
          ${data.wageBreakdown && !data.includeWeeklyHolidayPay ? `
          <div style="margin-top: 12px; padding: 12px; background: #f0f7ff; border-radius: 6px; border: 1px solid #d0e3ff;">
            <p style="font-size: 12px; font-weight: 600; color: #1a56db; margin-bottom: 8px;">
              📊 월 예상 급여 내역 (주 ${data.wageBreakdown.weeklyWorkHours}시간 기준)
            </p>
            <table style="width: 100%; font-size: 12px;">
              <tr>
                <td style="padding: 3px 0; color: #555;">기본급</td>
                <td style="padding: 3px 0; text-align: right;">${data.wageBreakdown.baseWage.toLocaleString()}원</td>
              </tr>
              <tr>
                <td style="padding: 3px 0; color: #555;">주휴수당</td>
                <td style="padding: 3px 0; text-align: right;">
                  ${data.wageBreakdown.isWeeklyHolidayEligible 
                    ? data.wageBreakdown.weeklyHolidayPay.toLocaleString() + '원' 
                    : '해당없음 (주 15시간 미만)'}
                </td>
              </tr>
              <tr style="border-top: 1px solid #ccc;">
                <td style="padding: 5px 0; font-weight: 600;">월 합계</td>
                <td style="padding: 5px 0; text-align: right; font-weight: 600; color: #1a56db;">
                  ${data.wageBreakdown.totalWage.toLocaleString()}원
                </td>
              </tr>
            </table>
          </div>
          ` : ''}
          
          ${data.comprehensiveWageDetails && data.businessSize === 'over5' ? `
          <div style="margin-top: 12px; padding: 12px; background: #fff7ed; border-radius: 6px; border: 1px solid #fed7aa;">
            <p style="font-size: 12px; font-weight: 600; color: #c2410c; margin-bottom: 8px;">
              💼 포괄임금 수당 세부내역 (5인 이상 사업장)
            </p>
            <table style="width: 100%; font-size: 12px;">
              ${data.comprehensiveWageDetails.overtimePerHour ? `
              <tr>
                <td style="padding: 3px 0; color: #555;">연장근로수당 (시간당)</td>
                <td style="padding: 3px 0; text-align: right;">${data.comprehensiveWageDetails.overtimePerHour.toLocaleString()}원</td>
              </tr>
              ` : ''}
              ${data.comprehensiveWageDetails.holidayPerDay ? `
              <tr>
                <td style="padding: 3px 0; color: #555;">휴일근로수당 (일당)</td>
                <td style="padding: 3px 0; text-align: right;">${data.comprehensiveWageDetails.holidayPerDay.toLocaleString()}원</td>
              </tr>
              ` : ''}
              ${data.comprehensiveWageDetails.annualLeavePerDay ? `
              <tr>
                <td style="padding: 3px 0; color: #555;">연차유급휴가수당 (일당)</td>
                <td style="padding: 3px 0; text-align: right;">${data.comprehensiveWageDetails.annualLeavePerDay.toLocaleString()}원</td>
              </tr>
              ` : ''}
            </table>
          </div>
          ` : ''}
        </div>
      </div>

      <!-- 제5조: 연차유급휴가 -->
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 14px; font-weight: bold; color: #000; margin-bottom: 8px; padding: 8px 12px; background: #f5f5f5; border-left: 4px solid #333;">
          제5조 (연차유급휴가)
        </h2>
        <div style="padding: 10px 15px; font-size: 13px; color: #333;">
          <p style="margin-bottom: 5px;">① 연차유급휴가는 근로기준법에서 정하는 바에 따라 부여한다.</p>
          <p>② 1년간 80퍼센트 이상 출근한 근로자에게 15일의 유급휴가를 부여한다.</p>
        </div>
      </div>

      <!-- 제6조: 사회보험 -->
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 14px; font-weight: bold; color: #000; margin-bottom: 8px; padding: 8px 12px; background: #f5f5f5; border-left: 4px solid #333;">
          제6조 (사회보험 적용)
        </h2>
        <div style="padding: 10px 15px; font-size: 13px; color: #333;">
          <p>사업주는 관련 법령에 따라 근로자를 다음의 사회보험에 가입하여야 한다.</p>
          <p style="margin-top: 5px; padding-left: 15px;">
            □ 고용보험 □ 산재보험 □ 국민연금 □ 건강보험
          </p>
        </div>
      </div>

      <!-- 제7조: 기타 -->
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 14px; font-weight: bold; color: #000; margin-bottom: 8px; padding: 8px 12px; background: #f5f5f5; border-left: 4px solid #333;">
          제7조 (기타)
        </h2>
        <div style="padding: 10px 15px; font-size: 13px; color: #333;">
          <p style="margin-bottom: 5px;">① 본 계약에 명시되지 않은 사항은 근로기준법에서 정하는 바에 따른다.</p>
          <p style="margin-bottom: 5px;">② 사업주와 근로자는 각자가 서명한 계약서를 1통씩 보관한다.</p>
          <p>③ 근로자는 업무상 알게 된 기밀사항을 외부에 누설하지 아니한다.</p>
        </div>
      </div>

      <!-- 계약 체결 문구 -->
      <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
        <p style="font-size: 14px; font-weight: 500; line-height: 1.8;">
          위와 같이 근로계약을 체결하고, 이 계약서 2통을 작성하여<br/>
          사업주와 근로자가 서명(또는 기명날인)한 후 각각 1통씩 보관한다.
        </p>
        <p style="margin-top: 20px; font-size: 15px; font-weight: 600;">
          ${data.signedAt ? formatDate(data.signedAt) : todayStr}
        </p>
      </div>

      <!-- 서명란 -->
      <div style="display: flex; justify-content: space-between; margin-top: 40px; page-break-inside: avoid;">
        <!-- 사업주 정보 및 서명 -->
        <div style="width: 48%; border: 1px solid #ddd; border-radius: 8px; padding: 15px;">
          <p style="font-weight: bold; font-size: 14px; text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #333;">
            사 업 주
          </p>
          <table style="width: 100%; font-size: 12px;">
            ${data.businessName ? `
            <tr>
              <td style="padding: 4px 0; color: #555; width: 70px;">사업장명</td>
              <td style="padding: 4px 0; font-weight: 500;">${data.businessName}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 4px 0; color: #555;">성 명</td>
              <td style="padding: 4px 0; font-weight: 500;">${data.employerName}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #555;">주 소</td>
              <td style="padding: 4px 0; font-weight: 500;">${data.workLocation}</td>
            </tr>
          </table>
          <div style="margin-top: 15px; text-align: center;">
            <p style="font-size: 11px; color: #666; margin-bottom: 8px;">서 명</p>
            ${data.employerSignature ? `
              <div style="border: 1px solid #ddd; border-radius: 6px; padding: 8px; background: #fff; display: inline-block;">
                <img src="${data.employerSignature}" alt="사업주 서명" style="max-width: 120px; max-height: 60px;"/>
              </div>
              <p style="font-size: 11px; color: #28a745; margin-top: 5px;">✓ 서명완료</p>
            ` : `
              <div style="border: 2px dashed #ccc; border-radius: 6px; padding: 25px; color: #999; font-size: 12px;">
                서명 대기
              </div>
            `}
          </div>
        </div>

        <!-- 근로자 정보 및 서명 -->
        <div style="width: 48%; border: 1px solid #ddd; border-radius: 8px; padding: 15px;">
          <p style="font-weight: bold; font-size: 14px; text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #333;">
            근 로 자
          </p>
          <table style="width: 100%; font-size: 12px;">
            <tr>
              <td style="padding: 4px 0; color: #555; width: 70px;">성 명</td>
              <td style="padding: 4px 0; font-weight: 500;">${data.workerName}</td>
            </tr>
            ${data.workerPhone ? `
            <tr>
              <td style="padding: 4px 0; color: #555;">연락처</td>
              <td style="padding: 4px 0; font-weight: 500;">${data.workerPhone}</td>
            </tr>
            ` : ''}
            ${data.workerAddress ? `
            <tr>
              <td style="padding: 4px 0; color: #555;">주 소</td>
              <td style="padding: 4px 0; font-weight: 500;">${data.workerAddress}</td>
            </tr>
            ` : ''}
          </table>
          <div style="margin-top: 15px; text-align: center;">
            <p style="font-size: 11px; color: #666; margin-bottom: 8px;">서 명</p>
            ${data.workerSignature ? `
              <div style="border: 1px solid #ddd; border-radius: 6px; padding: 8px; background: #fff; display: inline-block;">
                <img src="${data.workerSignature}" alt="근로자 서명" style="max-width: 120px; max-height: 60px;"/>
              </div>
              <p style="font-size: 11px; color: #28a745; margin-top: 5px;">✓ 서명완료</p>
            ` : `
              <div style="border: 2px dashed #ccc; border-radius: 6px; padding: 25px; color: #999; font-size: 12px;">
                서명 대기
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- 푸터 -->
      <div style="margin-top: 40px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #888;">
        <p>본 근로계약서는 근로기준법 제17조에 의거하여 작성되었으며, 전자문서로서 법적 효력을 가집니다.</p>
        <p style="margin-top: 3px;">문의: 고용노동부 고객상담센터 ☎ 1350</p>
      </div>
    </div>
  `;
};
