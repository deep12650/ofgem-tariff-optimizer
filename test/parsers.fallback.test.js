import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSmartMeterCSV } from '../src/index.js';

// Header that won't match supplier signatures but still parseable by the generic logic
const csv = `ColA,ColB,ColC
2025-08-01T00:00:00Z,2025-08-01T00:30:00Z,0.15`;

test('parseSmartMeterCSV: falls back to generic parser when no supplier matches', () => {
    const rows = parseSmartMeterCSV(csv);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].kWh, 0.15);
});
