import { differenceInDays } from 'date-fns';

// 계약서 수정 가능 기간 (일수)
export const CONTRACT_EDIT_PERIOD_DAYS = 7;

/**
 * 계약서가 수정 가능한지 확인
 * 공유 후 1주일 이내에만 수정 가능
 */
export function isContractEditable(createdAt: string): boolean {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const daysSinceCreation = differenceInDays(now, createdDate);
  
  return daysSinceCreation <= CONTRACT_EDIT_PERIOD_DAYS;
}

/**
 * 수정 가능한 남은 일수 계산
 */
export function getRemainingEditDays(createdAt: string): number {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const daysSinceCreation = differenceInDays(now, createdDate);
  
  const remainingDays = CONTRACT_EDIT_PERIOD_DAYS - daysSinceCreation;
  return Math.max(0, remainingDays);
}

/**
 * 수정 가능 기한 날짜 계산
 */
export function getEditDeadlineDate(createdAt: string): Date {
  const createdDate = new Date(createdAt);
  const deadline = new Date(createdDate);
  deadline.setDate(deadline.getDate() + CONTRACT_EDIT_PERIOD_DAYS);
  return deadline;
}
