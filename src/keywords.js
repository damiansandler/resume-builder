// Keywords missing from the base resume across several job offers.
// Each match.md lists the offer's missing ATS keywords on a "**Missing:** a · b · c" line.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { listApplications } from './paths.js';

const RECENT = 10; // how many other applications to look at, newest first

/** The keywords on the "**Missing:**" line of an analysis. */
export function missingKeywords(analysis) {
  const line = analysis.match(/^\*\*Missing:\*\*\s*(.*)$/m)?.[1] ?? '';
  return line
    .split(/\s*[·,;]\s*/)
    .map((k) => k.replace(/[.*`]+$/g, '').replace(/^\*+|\*+$/g, '').trim())
    .filter((k) => k && !/^(none|—|-)$/i.test(k));
}

const key = (k) => k.toLowerCase().replace(/\s+/g, ' ').replace(/(?<=[a-z]{3})s$/, '');

/**
 * Keywords missing in `analysis` (the new one) that were also missing in other recent offers and
 * still do not appear in the base resume. Returns [{ keyword, count, where: [folder, …] }], most
 * repeated first. `exclude` is the folder of the new analysis.
 */
export function missingAcrossOffers({ analysis, exclude, base }) {
  const others = listApplications()
    .filter((dir) => dir !== exclude && existsSync(path.join(dir, 'match.md')))
    .slice(-RECENT)
    .map((dir) => ({ dir, keys: new Set(missingKeywords(readFileSync(path.join(dir, 'match.md'), 'utf8')).map(key)) }));
  const baseText = base.toLowerCase();
  const result = [];
  for (const keyword of new Set(missingKeywords(analysis))) {
    if (baseText.includes(keyword.toLowerCase())) continue;
    const where = others.filter((o) => o.keys.has(key(keyword))).map((o) => path.basename(o.dir));
    if (where.length) result.push({ keyword, count: where.length + 1, where });
  }
  return result.sort((a, b) => b.count - a.count);
}
