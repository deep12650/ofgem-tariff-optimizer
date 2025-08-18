// Parse a typical Octopus (and similar) half-hourly CSV export.
// Accepts header lines and columns containing timestamp + kWh.
// Tries common column names; ignores blank/invalid rows.
// Output: Array<{ start: ISO, end: ISO, kWh: number }>

/**
 * @param {string} csv
 * @returns {{start:string,end:string,kWh:number}[]}
 */
export function parseOctopusCSV(csv) {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  // detect header
  const header = lines[0].split(',').map(s => s.trim().toLowerCase());
  const hasHeader = header.some(h => /start|interval|from|kwh|consumption/.test(h));
  const rows = hasHeader ? lines.slice(1) : lines;
  const cols = hasHeader ? header : header.map((_,i)=> String(i));

  // candidate column indexes
  const idx = {
    start: cols.findIndex(c => /(start|from|interval)/.test(c)),
    end:   cols.findIndex(c => /(end|to)/.test(c)),
    kwh:   cols.findIndex(c => /(kwh|consumption|energy)/.test(c))
  };

  return rows.map(line => line.split(',')).map(parts => {
    const start = parts[idx.start]?.trim() || parts[0]?.trim();
    const end   = idx.end>=0 ? parts[idx.end]?.trim() : null;
    const kWh   = Number(parts[idx.kwh>=0?idx.kwh:1]);
    if (!start || !Number.isFinite(kWh)) return null;
    const startISO = new Date(start).toISOString();
    let endISO = end ? new Date(end).toISOString() : new Date(new Date(start).getTime() + 30*60000).toISOString();
    return { start: startISO, end: endISO, kWh };
  }).filter(Boolean);
}
