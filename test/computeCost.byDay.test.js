import test from 'node:test';
import assert from 'node:assert/strict';
import { computeCost } from '../src/index.js';

function twoDayIntervals() {
    const out = [];
    let t = Date.parse('2025-08-01T22:00:00.000Z'); // crosses midnight
    for (let i = 0; i < 8; i++) {                    // 4 hrs (8 slots) → spans two dates
        const s = new Date(t);
        const e = new Date(t + 30 * 60000);
        out.push({ start: s.toISOString(), end: e.toISOString(), kWh: 0.1234 });
        t += 30 * 60000;
    }
    return out;
}

test('computeCost: byDay aggregation produces rounded kWh and pence per day', () => {
    const intervals = twoDayIntervals();
    const flat = { kind: 'flat', unitRateP: 30, standingPPerDay: 45 };

    const res = computeCost(intervals, flat);
    const days = Object.keys(res.byDay).sort();
    assert.ok(days.length >= 2, 'should aggregate across at least two calendar days');

    for (const d of days) {
        assert.ok(typeof res.byDay[d].kWh === 'number');
        assert.ok(Number.isInteger(res.byDay[d].energyPence));
    }
});
