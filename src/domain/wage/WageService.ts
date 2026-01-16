export interface WeeklyHolidayPayResult {
    isEligible: boolean;
    weeklyWorkHours: number;
    dailyWorkHours: number;
    weeklyHolidayHours: number;
    baseHourlyWage: number;
    weeklyHolidayPayPerHour: number;
    weeklyHolidayPayPerWeek: number;
}

export interface WageBreakdown {
    baseWage: number;
    weeklyHolidayPay: number;
    totalWage: number;
    weeklyWorkHours: number;
    isWeeklyHolidayEligible: boolean;
}

/**
 * WageService implements business logic for salary calculations.
 * This class follows the Single Responsibility Principle as part of Clean Architecture.
 */
export class WageService {
    /**
     * Calculates actual working hours excluding break time.
     */
    parseWorkTime(startTime: string, endTime: string, breakTimeMinutes: number = 0): number {
        if (startTime === endTime) return 0;

        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        const startMinutes = startHour * 60 + startMin;
        let endMinutes = endHour * 60 + endMin;

        if (endMinutes <= startMinutes) {
            endMinutes += 24 * 60;
        }

        const totalMinutes = endMinutes - startMinutes - breakTimeMinutes;
        return Math.max(0, totalMinutes / 60);
    }

    /**
     * Calculates weekly holiday pay based on South Korean Labor Standards Act.
     * Standard: (Weekly Work Hours / 40) * 8 * Hourly Wage, if Weekly Work Hours >= 15.
     */
    calculateWeeklyHolidayPay(
        hourlyWage: number,
        workDaysPerWeek: number,
        dailyWorkHours: number
    ): WeeklyHolidayPayResult {
        const weeklyWorkHours = workDaysPerWeek * dailyWorkHours;
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
            };
        }

        // Proportional calculation for part-timers: (Weekly Hours / 40) * 8
        // capped at 8 hours per week
        const weeklyHolidayHours = Math.min((weeklyWorkHours / 40) * 8, 8);
        const weeklyHolidayPayPerWeek = Math.round(weeklyHolidayHours * hourlyWage);
        const weeklyHolidayPayPerHour = Math.round(weeklyHolidayPayPerWeek / weeklyWorkHours);

        return {
            isEligible: true,
            weeklyWorkHours,
            dailyWorkHours,
            weeklyHolidayHours,
            baseHourlyWage: hourlyWage,
            weeklyHolidayPayPerHour,
            weeklyHolidayPayPerWeek,
        };
    }

    /**
     * Calculates monthly wage breakdown.
     * weeksPerMonth defaults to 4.345 (average weeks in a month).
     */
    calculateMonthlyWageBreakdown(
        hourlyWage: number,
        workDaysPerWeek: number,
        dailyWorkHours: number,
        weeksPerMonth: number = 4.345
    ): WageBreakdown {
        const weeklyWorkHours = workDaysPerWeek * dailyWorkHours;
        const holidayResult = this.calculateWeeklyHolidayPay(hourlyWage, workDaysPerWeek, dailyWorkHours);

        const monthlyBaseWage = Math.round(hourlyWage * weeklyWorkHours * weeksPerMonth);
        const monthlyWeeklyHolidayPay = Math.round(holidayResult.weeklyHolidayPayPerWeek * weeksPerMonth);

        return {
            baseWage: monthlyBaseWage,
            weeklyHolidayPay: monthlyWeeklyHolidayPay,
            totalWage: monthlyBaseWage + monthlyWeeklyHolidayPay,
            weeklyWorkHours,
            isWeeklyHolidayEligible: holidayResult.isEligible,
        };
    }
}
