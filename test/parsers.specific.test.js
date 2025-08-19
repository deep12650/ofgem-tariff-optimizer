import test from 'node:test';
import assert from 'node:assert/strict';
import {
    parseOctopusCSV,
    parseBritishGasCSV,
    parseEDFCSV,
    parseEONNextCSV,
    parseOVOCSV,
    parseShellCSV
} from '../src/index.js';

test('parseOctopusCSV: tolerant header', () => {
    const csv = `Interval Start,Interval End,kWh
2025-08-01T00:00:00Z,2025-08-01T00:30:00Z,0.25`;
    const rows = parseOctopusCSV(csv);
    assert.equal(rows.length, 1);
    assert.equal(typeof rows[0].kWh, 'number');
});

test('parseBritishGasCSV', () => {
    const csv = `Start Time,End Time,Consumption (kWh)
2025-08-01 00:00,2025-08-01 00:30,0.12`;
    const rows = parseBritishGasCSV(csv);
    assert.equal(rows.length, 1);

    // Do not assert the date string literal (it varies by local TZ → ISO).
    // Instead assert: valid ISO, 30 min span, numeric kWh.
    const s = new Date(rows[0].start);
    const e = new Date(rows[0].end);
    assert.ok(!Number.isNaN(s.getTime()), 'start should be a valid date');
    assert.ok(!Number.isNaN(e.getTime()), 'end should be a valid date');
    assert.equal((e - s) / 60000, 30, 'should be a 30-minute interval');
    assert.equal(rows[0].kWh, 0.12);
});


test('parseEDFCSV', () => {
    const csv = `Start Date/Time,End Date/Time,Energy (kWh)
01/08/2025 00:00,01/08/2025 00:30,0.22`;
    const rows = parseEDFCSV(csv);
    assert.equal(rows.length, 1);
    assert.equal(typeof rows[0].kWh, 'number');
});

test('parseEONNextCSV', () => {
    const csv = `Date & Time From,Date & Time To,kWh
2025-08-01 00:00,2025-08-01 00:30,0.11`;
    const rows = parseEONNextCSV(csv);
    assert.equal(rows.length, 1);
});

test('parseOVOCSV', () => {
    const csv = `From,To,Consumption (kWh)
2025-08-01T00:00Z,2025-08-01T00:30Z,0.21`;
    const rows = parseOVOCSV(csv);
    assert.equal(rows.length, 1);
});

test('parseShellCSV', () => {
    const csv = `Start,End,kWh
2025-08-01T00:00Z,2025-08-01T00:30Z,0.31`;
    const rows = parseShellCSV(csv);
    assert.equal(rows.length, 1);
});
