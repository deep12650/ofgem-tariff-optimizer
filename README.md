# ofgem-tariff-optimizer

[![CI](https://github.com/<you>/ofgem-tariff-optimizer/actions/workflows/ci.yml/badge.svg)](https://github.com/<you>/ofgem-tariff-optimizer/actions/workflows/ci.yml)


Open-source JS library to **optimise UK electricity tariffs** from half-hourly smart meter data.

- Compare **Flat**, **Economy 7** (night/day), and **Agile** (time-varying) tariffs
- Calculate total cost, standing charge, and daily breakdown
- **Recommend cheapest start window** for appliances (e.g. dishwasher, EV) given duration + kWh
- Works in Node 18+ (ESM). No external APIs required.

## Install

```bash
npm i ofgem-tariff-optimizer
```

## Usage

```js
import { parseSmartMeterCSV, computeCost, recommendSchedule } from "ofgem-tariff-optimizer";
import fs from "node:fs";

const csv = fs.readFileSync("examples/octopus_sample.csv","utf8");
const intervals = parseSmartMeterCSV(csv);

const flat = { kind: "flat", unitRateP: 30, standingPPerDay: 45 };
const e7   = { kind: "economy7", dayRateP: 38, nightRateP: 13, nightStart: "23:00", nightEnd: "07:00", standingPPerDay: 45 };

console.log(computeCost(intervals, flat));
console.log(computeCost(intervals, e7));

const suggestion = recommendSchedule(intervals, e7, { durationMinutes: 120, totalKWh: 1.4 });
console.log(suggestion);
```

## CLI

```bash
npx ofgem-compare examples/octopus_sample.csv
```

## Parsers

- `parseSmartMeterCSV(csv)` auto-detects Octopus, British Gas, EDF, E.ON Next, OVO/SSE, Shell formats.
- Individual parsers are also exported if you want to force a format.

## License

Apache-2.0 © 2025
