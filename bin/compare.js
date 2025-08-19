#!/usr/bin/env node
import fs from 'node:fs';
import { parseSmartMeterCSV, computeCost, recommendSchedule } from '../src/index.js';

function fmtP(p){ return `£${(p/100).toFixed(2)}`; }

const file = process.argv[2];
if (!file) {
  console.error('Usage: ofgem-compare <csv-file>');
  process.exit(1);
}

const csv = fs.readFileSync(file,'utf8');
const intervals = parseSmartMeterCSV(csv);

const tariffs = {
  flat: { kind:'flat', unitRateP: 30, standingPPerDay: 45 },
  e7:   { kind:'economy7', dayRateP: 38, nightRateP: 13, nightStart:'23:00', nightEnd:'07:00', standingPPerDay: 45, timeZone:'Europe/London' },
  agile:{ kind:'agile', prices: intervals.map(iv => ({ start:iv.start, end:iv.end, unitRateP: 25 + (new Date(iv.start).getUTCHours()%4)*3 })), standingPPerDay: 45 }
};

const costs = Object.fromEntries(Object.entries(tariffs).map(([k,t]) => [k, computeCost(intervals, t)]));

console.log('Tariff cost comparison for', file);
for (const [k,c] of Object.entries(costs)) {
  console.log(`- ${k.padEnd(5)}: ${fmtP(c.totalPence)} (energy ${fmtP(c.energyCostPence)}, standing ${fmtP(c.standingChargePence)})`);
}

const suggestion = recommendSchedule(intervals, tariffs.e7, {
  durationMinutes: 120, totalKWh: 1.4,
  windowStartISO: intervals[0].start, windowEndISO: intervals.at(-1).end
});
console.log('\nCheapest 2h dishwasher (1.4kWh) on Economy7:');
console.log(`Start ${suggestion.start} End ${suggestion.end} Cost ${fmtP(suggestion.costPence)}`);
