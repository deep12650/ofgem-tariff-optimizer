import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendSchedule } from '../src/index.js';

// Build a simple day (48 half-hour slots) where night slots are cheaper
function mkIntervals() {
    const start = new Date('2025-08-01T00:00:00.000Z');
    const arr = [];
    for (let i = 0; i < 48; i++) {
        const s = new Date(start.getTime() + i * 30 * 60000);
        const e = new Date(s.getTime() + 30 * 60000);
        arr.push({ start: s.toISOString(), end: e.toISOString(), kWh: 0.3 });
    }
    return arr;
}

test('recommendSchedule: prefers Economy 7 night window', () => {
    const intervals = mkIntervals();
    const e7 = { kind: 'economy7', dayRateP: 38, nightRateP: 12, nightStart: '23:00', nightEnd: '07:00', standingPPerDay: 45, timeZone: 'Europe/London' };

    // 2h task (4 slots), total 1.6 kWh
    const plan = recommendSchedule(intervals, e7, {
        durationMinutes: 120,
        totalKWh: 1.6,
        windowStartISO: intervals[0].start,
        windowEndISO: intervals.at(-1).end
    });

    // Expect the start time to occur within the night window in local time (rough check: hour ~ 23:00–06:30 UTC± depending on DST)
    const startHourUTC = new Date(plan.start).getUTCHours();
    assert.ok(startHourUTC === 22 || startHourUTC === 23 || startHourUTC <= 6, 'expected low-rate overnight start');
    assert.ok(plan.costPence > 0);
});
