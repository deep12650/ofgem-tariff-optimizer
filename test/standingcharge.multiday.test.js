import test from 'node:test';
import assert from 'node:assert/strict';
import { computeCost } from '../src/index.js';

// Build 2 days of half-hour slots (UTC) to ensure 2x standing charge
function mkIntervalsTwoDays() {
    const out = [];
    let t = Date.parse('2025-08-01T00:00:00.000Z');
    for (let i = 0; i < 48 * 2; i++) {
        const s = new Date(t);
        const e = new Date(t + 30 * 60000);
        out.push({ start: s.toISOString(), end: e.toISOString(), kWh: 0.25 });
        t += 30 * 60000;
    }
    return out;
}

test('standing charge applies per unique local day', () => {
    const intervals = mkIntervalsTwoDays();
    const flat = { kind: 'flat', unitRateP: 10, standingPPerDay: 45 };

    const res = computeCost(intervals, flat);
    // Energy: 96 * 0.25 * 10 = 240p
    assert.equal(res.energyCostPence, 240);
    // Standing: 2 * 45p = 90p
    assert.equal(res.standingChargePence, 90);
    assert.equal(res.totalPence, 330);
});
