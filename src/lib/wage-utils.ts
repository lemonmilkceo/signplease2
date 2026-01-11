import { MINIMUM_WAGE_2026 } from './contract-types';

/**
 * 주휴수당 계산 유틸리티
 * 주휴수당은 주 15시간 이상 근무 시 발생
 */

export interface WeeklyHolidayPayResult {
  isEligible: boolean; // 주휴수당 발생 여부
  weeklyWorkHours: number; // 주당 근무시간
  dailyWorkHours: number; // 1일 소정근로시간
  weeklyHolidayHours: number; // 주휴수당 시간 (1일 소정근로시간)
  baseHourlyWage: number; // 기본 시급
  weeklyHolidayPayPerHour: number; // 시간당 주휴수당
  weeklyHolidayPayPerWeek: number; // 주당 주휴수당
  effectiveHourlyWage: number; // 실질 시급 (기본 + 주휴수당)
}

export interface WageBreakdown {
  baseWage: number; // 기본급
  weeklyHolidayPay: number; // 주휴수당
  totalWage: number; // 총 급여
  weeklyWorkHours: number; // 주당 근무시간
  isWeeklyHolidayEligible: boolean; // 주휴수당 발생 여부
}

/**
 * 근무시간 파싱 (HH:MM -> 시간)
 */
export function parseWorkTime(startTime: string, endTime: string, breakTimeMinutes: number = 0): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;
  
  // 종료시간이 시작시간보다 작으면 다음날로 처리
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }
  
  const totalMinutes = endMinutes - startMinutes - breakTimeMinutes;
  return Math.max(0, totalMinutes / 60);
}

/**
 * 주휴수당 계산
 * 공식: 1일 소정근로시간 × 시급
 * 1일 소정근로시간 = 주당 근로시간 / 주 근무일수
 */
export function calculateWeeklyHolidayPay(
  hourlyWage: number,
  workDaysPerWeek: number,
  dailyWorkHours: number
): WeeklyHolidayPayResult {
  const weeklyWorkHours = workDaysPerWeek * dailyWorkHours;
  
  // 주 15시간 이상 근무해야 주휴수당 발생
  const isEligible = weeklyWorkHours >= 15;
  
  if (!isEligible) {
    return {
      isEligible: false,
      weeklyWorkHours,
      dailyWorkHours,
      weeklyHolidayHours: 0,
      baseHourlyWage: hourlyWage,
      weeklyHolidayPayPerHour: 0,
      weeklyHolidayPayPerWeek: 0,
      effectiveHourlyWage: hourlyWage,
    };
  }
  
  // 주휴수당 시간 = 1일 소정근로시간 (최대 8시간)
  const weeklyHolidayHours = Math.min(dailyWorkHours, 8);
  
  // 주당 주휴수당
  const weeklyHolidayPayPerWeek = weeklyHolidayHours * hourlyWage;
  
  // 시간당 주휴수당 (주당 주휴수당 / 주당 근무시간)
  const weeklyHolidayPayPerHour = weeklyHolidayPayPerWeek / weeklyWorkHours;
  
  // 실질 시급
  const effectiveHourlyWage = hourlyWage + weeklyHolidayPayPerHour;
  
  return {
    isEligible: true,
    weeklyWorkHours,
    dailyWorkHours,
    weeklyHolidayHours,
    baseHourlyWage: hourlyWage,
    weeklyHolidayPayPerHour: Math.round(weeklyHolidayPayPerHour),
    weeklyHolidayPayPerWeek: Math.round(weeklyHolidayPayPerWeek),
    effectiveHourlyWage: Math.round(effectiveHourlyWage),
  };
}

/**
 * 월급 기준 임금 상세 계산
 * @param hourlyWage 시급
 * @param workDaysPerWeek 주당 근무일수
 * @param dailyWorkHours 1일 근무시간
 * @param weeksPerMonth 월 근무 주수 (기본 4.345주)
 */
export function calculateMonthlyWageBreakdown(
  hourlyWage: number,
  workDaysPerWeek: number,
  dailyWorkHours: number,
  weeksPerMonth: number = 4.345 // (365/12/7) ≈ 4.345
): WageBreakdown {
  const weeklyWorkHours = workDaysPerWeek * dailyWorkHours;
  const holidayPayResult = calculateWeeklyHolidayPay(hourlyWage, workDaysPerWeek, dailyWorkHours);
  
  // 월 기본급 = 시급 × 주당 근무시간 × 월 근무 주수
  const monthlyBaseWage = Math.round(hourlyWage * weeklyWorkHours * weeksPerMonth);
  
  // 월 주휴수당 = 주당 주휴수당 × 월 근무 주수
  const monthlyWeeklyHolidayPay = holidayPayResult.isEligible
    ? Math.round(holidayPayResult.weeklyHolidayPayPerWeek * weeksPerMonth)
    : 0;
  
  return {
    baseWage: monthlyBaseWage,
    weeklyHolidayPay: monthlyWeeklyHolidayPay,
    totalWage: monthlyBaseWage + monthlyWeeklyHolidayPay,
    weeklyWorkHours,
    isWeeklyHolidayEligible: holidayPayResult.isEligible,
  };
}

/**
 * 주급 기준 임금 상세 계산
 */
export function calculateWeeklyWageBreakdown(
  hourlyWage: number,
  workDaysPerWeek: number,
  dailyWorkHours: number
): WageBreakdown {
  const weeklyWorkHours = workDaysPerWeek * dailyWorkHours;
  const holidayPayResult = calculateWeeklyHolidayPay(hourlyWage, workDaysPerWeek, dailyWorkHours);
  
  // 주 기본급 = 시급 × 주당 근무시간
  const weeklyBaseWage = hourlyWage * weeklyWorkHours;
  
  return {
    baseWage: weeklyBaseWage,
    weeklyHolidayPay: holidayPayResult.isEligible ? holidayPayResult.weeklyHolidayPayPerWeek : 0,
    totalWage: weeklyBaseWage + (holidayPayResult.isEligible ? holidayPayResult.weeklyHolidayPayPerWeek : 0),
    weeklyWorkHours,
    isWeeklyHolidayEligible: holidayPayResult.isEligible,
  };
}
