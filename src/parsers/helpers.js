// Shared helpers for CSV parsing

/** Split CSV row naïvely by commas (supports simple CSVs used by suppliers).
 * For production, consider a full CSV parser if you hit edge cases.
 */
export function splitCSV(line) {
  // Basic split; assumes no embedded commas in quoted fields (rare in supplier exports)
  return line.split(',').map(s => s.trim());
}

/** Build a column index lookup given header cells and a map of desired field -> regex[] */
export function buildIndex(headerLower, patterns) {
  const find = (regexes) => headerLower.findIndex(h => regexes.some(rx => rx.test(h)));
  const out = {};
  for (const [key, regs] of Object.entries(patterns)) out[key] = find(regs);
  return out;
}

/** Detect if a header matches a supplier signature */
export function headerMatches(headerLower, signature) {
  // A signature matches if *all* listed fields are found (index >= 0)
  for (const regexes of Object.values(signature)) {
    const idx = headerLower.findIndex(h => regexes.some(rx => rx.test(h)));
    if (idx < 0) return false;
  }
  return true;
}
