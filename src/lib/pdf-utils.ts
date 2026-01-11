import html2pdf from 'html2pdf.js';

export interface ContractPDFData {
  employerName: string;
  workerName: string;
  hourlyWage: number;
  monthlyWage?: number;
  wageType?: 'hourly' | 'monthly';
  startDate: string;
  endDate?: string;
  workStartTime: string;
  workEndTime: string;
  workDays: string[];
  workLocation: string;
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
    margin: [15, 15, 15, 15],
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
    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 80px; font-weight: bold; color: rgba(255, 0, 0, 0.15); white-space: nowrap; pointer-events: none; z-index: 1000;">
      싸인해주세요
    </div>
  ` : '';

  return `
    <div style="font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif; padding: 20px; max-width: 700px; margin: 0 auto; color: #1a1a1a; font-size: 14px; line-height: 1.6; position: relative;">
      ${watermarkHTML}
      <h1 style="text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px;">
        표준 근로계약서
      </h1>
      
      <p style="margin-bottom: 25px; text-align: center; font-size: 15px;">
        <strong>${data.employerName}</strong>(이하 "사업주")과(와) <strong>${data.workerName}</strong>(이하 "근로자")은(는) 
        다음과 같이 근로계약을 체결한다.
      </p>

      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #ddd;">
          제1조 (근로계약기간)
        </h2>
        <p style="padding-left: 15px;">
          ${formatDate(data.startDate)} 부터 ${data.endDate ? formatDate(data.endDate) + ' 까지' : '(기간의 정함이 없음)'}
        </p>
      </div>

      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #ddd;">
          제2조 (근무장소)
        </h2>
        <p style="padding-left: 15px;">${data.workLocation}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #ddd;">
          제3조 (업무내용)
        </h2>
        <p style="padding-left: 15px;">${data.jobDescription || '일반 업무'}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #ddd;">
          제4조 (근로시간)
        </h2>
        <p style="padding-left: 15px;">
          근무시간: ${data.workStartTime} ~ ${data.workEndTime}<br/>
          근무요일: ${data.workDays.join(', ')}${data.breakTimeMinutes ? `<br/>휴게시간: ${data.breakTimeMinutes}분` : ''}
        </p>
      </div>

      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #ddd;">
          제5조 (임금)
        </h2>
        <div style="padding-left: 15px;">
          <p>
            ${data.wageType === 'monthly' && data.monthlyWage 
              ? `월급: ${data.monthlyWage.toLocaleString()}원${data.includeWeeklyHolidayPay ? ' (주휴수당 포함)' : ''}`
              : `시급: ${data.hourlyWage.toLocaleString()}원${data.includeWeeklyHolidayPay ? ' (주휴수당 포함)' : ''}`
            }
          </p>
          ${data.wageBreakdown && !data.includeWeeklyHolidayPay ? `
            <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px; font-size: 13px;">
              <p style="margin-bottom: 5px;"><strong>월 예상 급여 내역</strong> (주 ${Math.round(data.wageBreakdown.weeklyWorkHours)}시간 기준)</p>
              <p>- 기본급: ${data.wageBreakdown.baseWage.toLocaleString()}원</p>
              <p>- 주휴수당: ${data.wageBreakdown.isWeeklyHolidayEligible 
                ? data.wageBreakdown.weeklyHolidayPay.toLocaleString() + '원' 
                : '해당없음 (주 15시간 미만)'}</p>
              <p style="margin-top: 5px; font-weight: bold;">- 월 합계: ${data.wageBreakdown.totalWage.toLocaleString()}원</p>
            </div>
          ` : ''}
          ${data.includeWeeklyHolidayPay ? `
            <div style="margin-top: 10px; padding: 10px; background: #e8f5e9; border-radius: 8px; font-size: 13px;">
              <p style="margin-bottom: 5px;"><strong>주휴수당 적용 기준</strong></p>
              <p>• 주 15시간 미만 근무 시: 동일 ${data.wageType === 'monthly' ? '월급' : '시급'} 적용 (주휴수당 미발생)</p>
              <p>• 주 15시간 이상 근무 시: 주휴수당이 포함된 ${data.wageType === 'monthly' ? '월급' : '시급'}으로 적용</p>
              <p style="font-size: 12px; color: #666; margin-top: 5px;">※ 주휴수당 발생 여부와 관계없이 명시된 ${data.wageType === 'monthly' ? '월급' : '시급'}을 일괄 지급</p>
            </div>
          ` : ''}
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #ddd;">
          제6조 (기타)
        </h2>
        <p style="padding-left: 15px; font-size: 13px; color: #555;">
          본 계약서에 명시되지 않은 사항은 근로기준법에 따른다.
        </p>
      </div>

      <div style="text-align: center; margin-bottom: 30px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
        <p style="font-size: 15px; font-weight: bold;">
          위와 같이 근로계약을 체결하고, 이 계약서 2통을 작성하여<br/>
          사업주와 근로자가 각각 1통씩 보관한다.
        </p>
        <p style="margin-top: 15px; font-size: 14px;">
          ${data.signedAt ? formatDate(data.signedAt) : todayStr}
        </p>
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 40px;">
        <div style="width: 45%; text-align: center;">
          <p style="font-weight: bold; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #ddd;">사업주</p>
          <p style="margin-bottom: 15px;">${data.employerName}</p>
          ${data.employerSignature ? `
            <div style="margin: 15px auto; border: 1px solid #ddd; border-radius: 8px; padding: 10px; background: #fff;">
              <img src="${data.employerSignature}" alt="사업주 서명" style="max-width: 150px; max-height: 80px;"/>
            </div>
            <p style="font-size: 12px; color: #28a745;">✓ 서명 완료</p>
          ` : `
            <div style="margin: 15px auto; border: 1px dashed #ccc; border-radius: 8px; padding: 30px; color: #999;">
              서명 대기중
            </div>
          `}
        </div>
        <div style="width: 45%; text-align: center;">
          <p style="font-weight: bold; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #ddd;">근로자</p>
          <p style="margin-bottom: 15px;">${data.workerName}</p>
          ${data.workerSignature ? `
            <div style="margin: 15px auto; border: 1px solid #ddd; border-radius: 8px; padding: 10px; background: #fff;">
              <img src="${data.workerSignature}" alt="근로자 서명" style="max-width: 150px; max-height: 80px;"/>
            </div>
            <p style="font-size: 12px; color: #28a745;">✓ 서명 완료</p>
          ` : `
            <div style="margin: 15px auto; border: 1px dashed #ccc; border-radius: 8px; padding: 30px; color: #999;">
              서명 대기중
            </div>
          `}
        </div>
      </div>

      <div style="margin-top: 40px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; font-size: 11px; color: #888;">
        본 계약서는 전자문서로 작성되었으며, 근로기준법에 따라 유효합니다.
      </div>
    </div>
  `;
};
