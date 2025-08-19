import test from 'node:test';
import assert from 'node:assert/strict';
import { unitRateForInterval } from '../src/index.js';

function iv(startISO) {
    const s = new Date(startISO);
    const e = new Date(s.getTime() + 30 * 60000);
    return { start: s.toISOString(), end: e.toISOString(), kWh: 0.3 };
}

test('agile: prefers exact start/end match', () => {
    const i = iv('2025-08-01T00:00:00.000Z');
    const tariff = {
        kind: 'agile',
        prices: [
            { start: i.start, end: i.end, unitRateP: 11 }, // exact
            { start: '2025-08-01T00:00:00.000Z', end: '2025-08-01T01:00:00.000Z', unitRateP: 22 } // overlap
        ],
        standingPPerDay: 45
    };
    assert.equal(unitRateForInterval(tariff, i), 11);
});

test('agile: falls back to overlapping block if no exact match', () => {
    const i = iv('2025-08-01T02:00:00.000Z');
    const tariff = {
        kind: 'agile',
        prices: [
            { start: '2025-08-01T02:00:00.000Z', end: '2025-08-01T03:00:00.000Z', unitRateP: 29 } // overlap
        ],
        standingPPerDay: 45
    };
    assert.equal(unitRateForInterval(tariff, i), 29);
});

test('agile: throws if no price covers interval', () => {
    const i = iv('2025-08-01T04:00:00.000Z');
    const tariff = { kind: 'agile', prices: [], standingPPerDay: 45 };
    assert.throws(() => unitRateForInterval(tariff, i), /No agile price/);
});
