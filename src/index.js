// ofgem-tariff-optimizer — core API (ESM, zero deps)

/**
 * @typedef {{start:string,end:string,kWh:number}} Interval
 * @typedef {{kind:'flat', unitRateP:number, standingPPerDay:number}} FlatTariff
 * @typedef {{kind:'economy7', dayRateP:number, nightRateP:number, nightStart:string, nightEnd:string, standingPPerDay:number, timeZone?:string}} Economy7Tariff
 * @typedef {{kind:'agile', prices: Array<{start:string,end:string,unitRateP:number}>, standingPPerDay:number}} AgileTariff
 * @typedef {FlatTariff|Economy7Tariff|AgileTariff} Tariff
 */

export { parseSmartMeterCSV, parseOctopusCSV, parseBritishGasCSV, parseEDFCSV, parseEONNextCSV, parseOVOCSV, parseShellCSV } from "./parsers/index.js";

const DEFAULT_TZ = 'Europe/London';

/** Convert HH:MM to minutes since midnight */
function hhmmToMin(hhmm) {
  const [h,m] = hhmm.split(':').map(Number);
  return h*60 + (m || 0);
}

/** Minutes since midnight in given timezone for a Date */
function localMinutes(date, timeZone=DEFAULT_TZ) {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone, hour12:false, hour:'2-digit', minute:'2-digit' });
  const [{ value: hh }, , { value: mm }] = f.formatToParts(new Date(date));
  return Number(hh)*60 + Number(mm);
}

/** Check if a local time instant is within [start,end) where range can wrap over midnight */
function isInLocalRange(date, startHHMM, endHHMM, timeZone=DEFAULT_TZ) {
  const t = localMinutes(date, timeZone);
  const s = hhmmToMin(startHHMM);
  const e = hhmmToMin(endHHMM);
  if (s === e) return true; // full-day
  if (s < e) return t >= s && t < e;
  // wraps over midnight
  return t >= s || t < e;
}

/** Per-interval unit price in p/kWh for a given tariff */
export function unitRateForInterval(tariff, interval) {
  if (tariff.kind === 'flat') return tariff.unitRateP;
  if (tariff.kind === 'economy7') {
    const tz = tariff.timeZone || DEFAULT_TZ;
    return isInLocalRange(interval.start, tariff.nightStart, tariff.nightEnd, tz)
      ? tariff.nightRateP
      : tariff.dayRateP;
  }
  if (tariff.kind === 'agile') {
    // find matching price block (exact start-end match preferred, else any overlapping block)
    const start = new Date(interval.start).getTime();
    const end   = new Date(interval.end).getTime();
    const p = tariff.prices.find(p => {
      const ps = new Date(p.start).getTime();
      const pe = new Date(p.end).getTime();
      return ps === start && pe === end;
    }) || tariff.prices.find(p => {
      const ps = new Date(p.start).getTime();
      const pe = new Date(p.end).getTime();
      return ps <= start && pe >= end;
    });
    if (!p) throw new Error('No agile price found for interval '+interval.start);
    return p.unitRateP;
  }
  throw new Error('Unknown tariff kind');
}

/** Compute daily standing charge pence across the span of intervals */
function standingChargePence(standingPPerDay, intervals) {
  const days = new Set(intervals.map(iv => new Date(iv.start).toISOString().slice(0,10)));
  return standingPPerDay * days.size;
}

/** Compute total cost for intervals under a tariff */
export function computeCost(intervals, tariff) {
  let energyCostP = 0;
  let energyKWh = 0;
  const byDay = new Map(); // yyyy-mm-dd -> {kWh, energyP}
  for (const iv of intervals) {
    const rate = unitRateForInterval(tariff, iv); // p/kWh
    const costP = iv.kWh * rate;
    energyCostP += costP;
    energyKWh += iv.kWh;
    const day = new Date(iv.start).toISOString().slice(0,10);
    const d = byDay.get(day) || { kWh:0, energyP:0 };
    d.kWh += iv.kWh;
    d.energyP += costP;
    byDay.set(day, d);
  }
  const standingP = 'standingPPerDay' in tariff ? standingChargePence(tariff.standingPPerDay, intervals) : 0;
  const totalPence = Math.round(energyCostP + standingP);
  return {
    energyKWh: Number(energyKWh.toFixed(3)),
    energyCostPence: Math.round(energyCostP),
    standingChargePence: Math.round(standingP),
    totalPence,
    totalGBP: (totalPence/100).toFixed(2),
    byDay: Object.fromEntries([...byDay.entries()].map(([k,v]) => [k, { kWh: Number(v.kWh.toFixed(3)), energyPence: Math.round(v.energyP) }]))
  };
}

/**
 * Recommend cheapest contiguous window for a task.
 * @param {Interval[]} intervals
 * @param {Tariff} tariff
 * @param {{durationMinutes:number,totalKWh:number, windowStartISO?:string, windowEndISO?:string}} task
 * @returns {{start:string,end:string,costPence:number, perSlot:[{start:string,end:string,unitRateP:number, kWh:number, costP:number}]}} plan
 */
export function recommendSchedule(intervals, tariff, task) {
  const slotMins = Math.round((new Date(intervals[0].end) - new Date(intervals[0].start))/60000);
  if (!slotMins) throw new Error('Cannot infer slot length');
  const slotsNeeded = Math.ceil(task.durationMinutes / slotMins);
  const windowStart = task.windowStartISO ? new Date(task.windowStartISO) : new Date(intervals[0].start);
  const windowEnd   = task.windowEndISO ? new Date(task.windowEndISO)   : new Date(intervals.at(-1).end);
  const usable = intervals.filter(iv => new Date(iv.start) >= windowStart && new Date(iv.end) <= windowEnd);

  if (usable.length < slotsNeeded) throw new Error('Window too small for task');

  const kWhPerSlot = task.totalKWh / slotsNeeded;
  // Build array of unit rates per slot
  const slotRates = usable.map(iv => ({
    start: iv.start,
    end: iv.end,
    unitRateP: unitRateForInterval(tariff, iv)
  }));

  // Sliding window to find min cost contiguous run
  let best = { i:0, cost: Infinity };
  let currentCost = 0;

  for (let i=0; i<slotRates.length; i++) {
    // add this slot
    currentCost += slotRates[i].unitRateP * kWhPerSlot;
    // once window reached size, record and slide
    if (i >= slotsNeeded-1) {
      const startIdx = i - (slotsNeeded-1);
      if (currentCost < best.cost) best = { i: startIdx, cost: currentCost };
      // slide: remove startIdx
      currentCost -= slotRates[startIdx].unitRateP * kWhPerSlot;
    }
  }

  const startIdx = best.i;
  const chosen = slotRates.slice(startIdx, startIdx + slotsNeeded);
  const perSlot = chosen.map(s => ({ ...s, kWh: kWhPerSlot, costP: s.unitRateP * kWhPerSlot }));
  const costPence = Math.round(perSlot.reduce((a,b)=>a+b.costP,0));
  return {
    start: chosen[0].start,
    end: chosen.at(-1).end,
    costPence,
    perSlot
  };
}
