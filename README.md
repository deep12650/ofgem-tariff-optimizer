# ofgem-tariff-optimizer

Zero-dependency JavaScript library to **optimise UK electricity tariffs** from half-hourly smart meter data.

- Compare **Flat**, **Economy 7** (night/day), and **Agile** (time-varying) tariffs
- Calculate total cost, standing charge, and daily breakdown
- **Recommend cheapest start window** for appliances (e.g. dishwasher, EV) given duration + kWh
- Works in Node 18+ (ESM). No external APIs required.

> ⚠️ Disclaimer: This is an open-source approximation of UK tariff maths for developers. Tariff times/rates vary by supplier and meter profile; validate before production use.

## Install

```bash
npm i ofgem-tariff-optimizer
```

## Usage (Library)

```js
import { parseOctopusCSV, computeCost, recommendSchedule } from "ofgem-tariff-optimizer";
import fs from "node:fs";

const csv = fs.readFileSync("examples/octopus_sample.csv","utf8");
const intervals = parseOctopusCSV(csv); // [{start,end,kWh}]

const flat = { kind: "flat", unitRateP: 30, standingPPerDay: 45 };
const e7   = { kind: "economy7", dayRateP: 38, nightRateP: 13, nightStart: "23:00", nightEnd: "07:00", standingPPerDay: 45, timeZone: "Europe/London" };

const flatCost = computeCost(intervals, flat);
const e7Cost   = computeCost(intervals, e7);

console.log({ flatCostP: flatCost.totalPence, e7CostP: e7Cost.totalPence });

// Cheapest 2-hour, 1.4 kWh dishwasher run today:
const suggestion = recommendSchedule(intervals, e7, { durationMinutes: 120, totalKWh: 1.4, windowStartISO: intervals[0].start, windowEndISO: intervals.at(-1).end });
console.log(suggestion);
```

## CLI

```bash
npx ofgem-compare examples/octopus_sample.csv
```

Outputs a comparison table for built-in example tariffs and a sample schedule suggestion.

## Data model

- **Interval**: `{ start: ISO, end: ISO, kWh: number }` (half-hourly recommended)
- **Tariffs**:
  - Flat: `{ kind:'flat', unitRateP, standingPPerDay }`
  - Economy 7: `{ kind:'economy7', dayRateP, nightRateP, nightStart:'HH:MM', nightEnd:'HH:MM', standingPPerDay, timeZone? }`
  - Agile: `{ kind:'agile', prices:[{ start: ISO, end: ISO, unitRateP }], standingPPerDay }`

All currency values are **pence** to avoid floating rounding; output includes pence and pounds.

## Extending

- Plug in supplier CSV parsers in `src/parsers/*`
- Add new tariff kinds (e.g., fixed blocks, tiered rates, demand charges)
- Improve optimiser to consider battery/solar exports

## License
MIT
