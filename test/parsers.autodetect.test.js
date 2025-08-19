import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSmartMeterCSV, parseOctopusCSV, parseBritishGasCSV, parseEDFCSV, parseEONNextCSV, parseOVOCSV, parseShellCSV } from '../src/index.js';

const octopusCSV = `Interval Start,Interval End,kWh
2025-08-01T00:00:00Z,2025-08-01T00:30:00Z,0.25
2025-08-01T00:30:00Z,2025-08-01T01:00:00Z,0.30
`;

const bgCSV = `Start Time,End Time,Consumption (kWh)
2025-08-01 00:00,2025-08-01 00:30,0.12
2025-08-01 00:30,2025-08-01 01:00,0.10
`;

const edfCSV = `Start Date/Time,End Date/Time,Energy (kWh)
01/08/2025 00:00,01/08/2025 00:30,0.22
01/08/2025 00:30,01/08/2025 01:00,0.18
`;

const eonCSV = `Date & Time From,Date & Time To,kWh
2025-08-01 00:00,2025-08-01 00:30,0.11
2025-08-01 00:30,2025-08-01 01:00,0.09
`;

const ovoCSV = `From,To,Consumption (kWh)
2025-08-01T00:00Z,2025-08-01T00:30Z,0.21
2025-08-01T00:30Z,2025-08-01T01:00Z,0.19
`;

const shellCSV = `Start,End,kWh
2025-08-01T00:00Z,2025-08-01T00:30Z,0.31
2025-08-01T00:30Z,2025-08-01T01:00Z,0.28
`;

test('parseSmartMeterCSV: detects Octopus-like CSV', () => {
    const rows = parseSmartMeterCSV(octopusCSV);
    assert.equal(rows.length, 2);
    assert.equal(typeof rows[0].kWh, 'number');
});

test('parseSmartMeterCSV: detects British Gas CSV', () => {
    const rows = parseSmartMeterCSV(bgCSV);
    assert.equal(rows.length, 2);
});

test('parseSmartMeterCSV: detects EDF CSV', () => {
    const rows = parseSmartMeterCSV(edfCSV);
    assert.equal(rows.length, 2);
});

test('parseSmartMeterCSV: detects E.ON Next CSV', () => {
    const rows = parseSmartMeterCSV(eonCSV);
    assert.equal(rows.length, 2);
});

test('parseSmartMeterCSV: detects OVO/SSE CSV', () => {
    const rows = parseSmartMeterCSV(ovoCSV);
    assert.equal(rows.length, 2);
});

test('parseSmartMeterCSV: detects Shell CSV', () => {
    const rows = parseSmartMeterCSV(shellCSV);
    assert.equal(rows.length, 2);
});
