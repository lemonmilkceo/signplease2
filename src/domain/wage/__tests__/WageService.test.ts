import { describe, it, expect } from "vitest";
import { WageService } from "../WageService";

describe("WageService", () => {
    const wageService = new WageService();

    describe("parseWorkTime", () => {
        it("should calculate correct hours for standard shift", () => {
            const hours = wageService.parseWorkTime("09:00", "18:00", 60);
            expect(hours).toBe(8);
        });

        it("should handle overnight shifts", () => {
            const hours = wageService.parseWorkTime("22:00", "06:00", 60);
            expect(hours).toBe(7);
        });

        it("should return 0 if end time is before start time and not adjusting for overnight", () => {
            // Our implementation should handle this
            const hours = wageService.parseWorkTime("10:00", "10:00", 0);
            expect(hours).toBe(0);
        });
    });

    describe("calculateWeeklyHolidayPay", () => {
        const hourlyWage = 10000;

        it("should not be eligible if weekly hours < 15", () => {
            const result = wageService.calculateWeeklyHolidayPay(hourlyWage, 2, 7); // 14 hours
            expect(result.isEligible).toBe(false);
            expect(result.weeklyHolidayPayPerWeek).toBe(0);
        });

        it("should be eligible if weekly hours >= 15", () => {
            const result = wageService.calculateWeeklyHolidayPay(hourlyWage, 3, 5); // 15 hours
            expect(result.isEligible).toBe(true);
        });

        it("should calculate correct pay for 40-hour week", () => {
            const result = wageService.calculateWeeklyHolidayPay(hourlyWage, 5, 8); // 40 hours
            expect(result.weeklyHolidayPayPerWeek).toBe(80000); // 8 hours * 10000
        });

        it("should cap holiday hours at 8 even if working more than 8 hours a day", () => {
            const result = wageService.calculateWeeklyHolidayPay(hourlyWage, 2, 10); // 20 hours total, 10 hours/day
            // Standard rule: Weekly Holiday Pay = (Weekly Hours / 40) * 8 * Wage
            // For 20 hours: (20/40) * 8 * 10000 = 40000
            expect(result.weeklyHolidayPayPerWeek).toBe(40000);
        });
    });

    describe("calculateMonthlyWage", () => {
        const hourlyWage = 10000;
        const workDaysPerWeek = 5;
        const dailyWorkHours = 8; // 40 hours week

        it("should calculate total monthly wage including holiday pay", () => {
            const result = wageService.calculateMonthlyWageBreakdown(hourlyWage, workDaysPerWeek, dailyWorkHours);
            // Base: 10000 * 40 * 4.345 = 1,738,000
            // Holiday: 10000 * 8 * 4.345 = 347,600
            // Total: 2,085,600
            expect(result.totalWage).toBe(2085600);
        });
    });
});
