// Octopus-style CSV (or similar) — tolerant to column names
import { splitCSV, buildIndex, headerMatches } from "./helpers.js";

/**
 * @param {string} csv
 * @param {{detectOnly?:boolean}} opts
 */
export function parseOctopusCSV(csv, opts={}) {
  const lines = csv.split(/\r?\n/).filter(l => l.trim().length);
  if (!lines.length) return [];

  const header = splitCSV(lines[0]);
  const headerLower = header.map(h => h.toLowerCase());

  const signature = {
    start: [/(^| )interval start\b|^start|from/i],
    end: [/(^| )interval end\b|^end|to/i],
    kwh: [/kwh|consumption|energy/i],
  };
  const matched = headerMatches(headerLower, {
    start: [/interval start|from|start/],
    kwh: [/kwh|consumption|energy/],
    end: [/interval end|to|end/],
  });

  if (opts.detectOnly) return matched ? { __DETECTED__: true } : null;
  const rows = header.some(h => /start|interval|from|kwh|consumption|energy|end|to/i.test(h)) ? lines.slice(1) : lines;

  const idx = buildIndex(headerLower, {
    start: [/interval start|from|start/],
    end: [/interval end|to|end/],
    kwh: [/kwh|consumption|energy/],
  });

  return rows.map(line => splitCSV(line)).map(parts => {
    const start = parts[idx.start >= 0 ? idx.start : 0];
    const end = parts[idx.end >= 0 ? idx.end : 1];
    const kWh = Number(parts[idx.kwh >= 0 ? idx.kwh : 2]);
    if (!start || !Number.isFinite(kWh)) return null;
    const startISO = new Date(start).toISOString();
    const endISO = end ? new Date(end).toISOString() : new Date(new Date(start).getTime() + 30*60000).toISOString();
    return { start: startISO, end: endISO, kWh };
  }).filter(Boolean);
}
