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
import { parseSmartMeterCSV } from '../src/index.js';

const csvs = {
    octopus: `Interval Start,Interval End,kWh
2025-08-01T00:00:00Z,2025-08-01T00:30:00Z,0.10`,
    bg: `Start Time,End Time,Consumption (kWh)
2025-08-01 00:00,2025-08-01 00:30,0.10`,
    edf: `Start Date/Time,End Date/Time,Energy (kWh)
01/08/2025 00:00,01/08/2025 00:30,0.10`,
    eon: `Date & Time From,Date & Time To,kWh
2025-08-01 00:00,2025-08-01 00:30,0.10`,
    ovo: `From,To,Consumption (kWh)
2025-08-01T00:00Z,2025-08-01T00:30Z,0.10`,
    shell: `Start,End,kWh
2025-08-01T00:00Z,2025-08-01T00:30Z,0.10`,
};

test('detectOnly=true returns __DETECTED__ for matching headers', () => {
    const detectors = [
        parseOctopusCSV, parseBritishGasCSV, parseEDFCSV, parseEONNextCSV, parseOVOCSV, parseShellCSV
    ];
    const inputs = [csvs.octopus, csvs.bg, csvs.edf, csvs.eon, csvs.ovo, csvs.shell];
    inputs.forEach((csv, i) => {
        const res = detectors[i](csv, { detectOnly: true });
        assert.ok(res && res.__DETECTED__ === true);
    });
});

test('parseSmartMeterCSV falls back when detectOnly fails (nonsense header)', () => {
    const csv = `A,B,C
2025-08-01T00:00:00Z,2025-08-01T00:30:00Z,0.15`;
    const rows = parseSmartMeterCSV(csv);
    assert.equal(rows.length, 1);
});
