import test from 'node:test';
import assert from 'node:assert/strict';
import { computeCost } from '../src/index.js';

function mkIntervals({ startISO, slots = 48, kWh = 0.5, minutes = 30 }) {
    const start = new Date(startISO);
    const arr = [];
    for (let i = 0; i < slots; i++) {
        const s = new Date(start.getTime() + i * minutes * 60000);
        const e = new Date(s.getTime() + minutes * 60000);
        arr.push({ start: s.toISOString(), end: e.toISOString(), kWh });
    }
    return arr;
}

test('computeCost: flat tariff sums energy + standing', () => {
    const intervals = mkIntervals({ startISO: '2025-08-01T00:00:00.000Z', slots: 48, kWh: 0.5 });
    const flat = { kind: 'flat', unitRateP: 30, standingPPerDay: 45 }; // 30p/kWh, 45p/day
    const res = computeCost(intervals, flat);

    // Energy = 48 * 0.5 kWh * 30p = 720p
    assert.equal(res.energyCostPence, 720);
    // One day of standing = 45p
    assert.equal(res.standingChargePence, 45);
    assert.equal(res.totalPence, 765);
    assert.equal(res.totalGBP, (765 / 100).toFixed(2));
});
