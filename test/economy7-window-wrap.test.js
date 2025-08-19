import test from 'node:test';
import assert from 'node:assert/strict';
import { unitRateForInterval } from '../src/index.js';

// Build two intervals: one at 22:30–23:00 local and one at 06:30–07:00 local to test wrap-around
function mkIntervalISO(isoStart) {
    const s = new Date(isoStart);
    const e = new Date(s.getTime() + 30 * 60000);
    return { start: s.toISOString(), end: e.toISOString(), kWh: 0.3 };
}

test('Economy7: night window that wraps midnight (23:00 → 07:00) applies correct rates', () => {
    const t = { kind: 'economy7', dayRateP: 40, nightRateP: 12, nightStart: '23:00', nightEnd: '07:00', standingPPerDay: 45, timeZone: 'Europe/London' };

    // Choose summer date (BST) to exercise timezone handling, but logic should be robust year-round
    const nearStart = mkIntervalISO('2025-08-01T21:30:00.000Z'); // ~22:30 BST (local)
    const nightStart = mkIntervalISO('2025-08-01T22:30:00.000Z'); // ~23:30 BST (local)
    const earlyMorning = mkIntervalISO('2025-08-01T05:30:00.000Z'); // ~06:30 BST (local)
    const dayTime = mkIntervalISO('2025-08-01T08:00:00.000Z'); // ~09:00 BST (local)

    assert.equal(unitRateForInterval(t, nearStart), 40, '22:30 local should be day rate');
    assert.equal(unitRateForInterval(t, nightStart), 12, 'after 23:00 local should be night rate');
    assert.equal(unitRateForInterval(t, earlyMorning), 12, 'before 07:00 local should be night rate');
    assert.equal(unitRateForInterval(t, dayTime), 40, 'after 07:00 local should be day rate');
});
