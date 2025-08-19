// Auto-detecting smart meter CSV parser for UK suppliers
import { parseOctopusCSV } from "./octopus.js";
import { parseBritishGasCSV } from "./british_gas.js";
import { parseEDFCSV } from "./edf.js";
import { parseEONNextCSV } from "./eon_next.js";
import { parseOVOCSV } from "./ovo_sse.js";
import { parseShellCSV } from "./shell.js";

/** Try each supplier-specific parser; fall back to a generic heuristic parser. */
export function parseSmartMeterCSV(csv) {
  const detectors = [
    { name: 'octopus', fn: parseOctopusCSV },
    { name: 'britishgas', fn: parseBritishGasCSV },
    { name: 'edf', fn: parseEDFCSV },
    { name: 'eonnext', fn: parseEONNextCSV },
    { name: 'ovo/sse', fn: parseOVOCSV },
    { name: 'shell', fn: parseShellCSV },
  ];

  for (const d of detectors) {
    try {
      const rows = d.fn(csv, { detectOnly: true });
      if (rows && rows.__DETECTED__) {
        return d.fn(csv);
      }
    } catch (_) { /* ignore */ }
  }
  // Fallback: try Octopus-style as a generic heuristics (it already guesses columns)
  return parseOctopusCSV(csv);
}

export {
  parseOctopusCSV,
  parseBritishGasCSV,
  parseEDFCSV,
  parseEONNextCSV,
  parseOVOCSV,
  parseShellCSV,
};
