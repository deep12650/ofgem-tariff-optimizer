import test from 'node:test';
import assert from 'node:assert/strict';
import { unitRateForInterval } from '../src/index.js';

function iv(iso) {
    const s = new Date(iso);
    const e = new Date(s.getTime() + 30 * 60000);
    return { start: s.toISOString(), end: e.toISOString(), kWh: 0.1 };
}

test('Economy7: full-day window when start===end applies night rate for all times', () => {
    const t = {
        kind: 'economy7',
        dayRateP: 40,
        nightRateP: 12,
        nightStart: '00:00',   // start===end ⇒ full-day
        nightEnd: '00:00',
        standingPPerDay: 45,
        timeZone: 'Europe/London'
    };

    const slots = [
        iv('2025-08-01T00:00:00.000Z'),
        iv('2025-08-01T06:00:00.000Z'),
        iv('2025-08-01T12:00:00.000Z'),
        iv('2025-08-01T18:00:00.000Z'),
        iv('2025-08-01T23:30:00.000Z'),
    ];

    for (const s of slots) {
        assert.equal(unitRateForInterval(t, s), 12, 'expected full-day night rate');
    }
});
