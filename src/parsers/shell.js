// Shell Energy style: "Start","End","kWh"
import { splitCSV, buildIndex, headerMatches } from "./helpers.js";

/**
 * @param {string} csv
 * @param {{detectOnly?:boolean}} opts
 */
export function parseShellCSV(csv, opts={}) {
  const lines = csv.split(/\r?\n/).filter(l => l.trim().length);
  if (!lines.length) return [];

  const header = splitCSV(lines[0]);
  const headerLower = header.map(h => h.toLowerCase());
  const matched = headerMatches(headerLower, {
    start: [/^start$|from/i],
    end: [/^end$|to/i],
    kwh: [/^kwh$|energy/i],
  });
  if (opts.detectOnly) return matched ? { __DETECTED__: true } : null;

  const rows = lines.slice(1);
  const idx = buildIndex(headerLower, {
    start: [/^start$|from/i],
    end: [/^end$|to/i],
    kwh: [/^kwh$|energy/i],
  });

  return rows.map(line => splitCSV(line)).map(parts => {
    const start = parts[idx.start];
    const end = parts[idx.end];
    const kWh = Number(parts[idx.kwh]);
    if (!start || !end || !Number.isFinite(kWh)) return null;
    return { start: new Date(start).toISOString(), end: new Date(end).toISOString(), kWh };
  }).filter(Boolean);
}
