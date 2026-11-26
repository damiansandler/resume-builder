// Job postings: applications/<folder>/job.md holds the link and the full text of the posting.
//
//   ---
//   company: Cartify
//   role: Senior Product Manager
//   link: https://...
//   saved: 2026-11-26
//   ---
//
//   # Senior Product Manager · Cartify
//
//   <full text of the posting>
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { listApplications } from './paths.js';

/** Reads applications/<dir>/job.md → { meta, offer } or null if it does not exist. */
export function readJob(dir) {
  const file = path.join(dir, 'job.md');
  if (!existsSync(file)) return null;
  const text = readFileSync(file, 'utf8');
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const meta = {};
  for (const line of (fm?.[1] ?? '').split(/\r?\n/)) {
    const m = line.match(/^([\w-]+):\s*(.*?)\s*$/);
    if (m) meta[m[1]] = m[2];
  }
  const offer = (fm ? text.slice(fm[0].length) : text).replace(/^\s*#\s.*\n/, '').trim();
  return { meta, offer };
}

/** Writes the text of a job.md file. */
export function jobMarkdown({ company, role, link, saved, offer }) {
  const title = [role, company].filter(Boolean).join(' · ');
  return `---\ncompany: ${company}\nrole: ${role}\nlink: ${link}\nsaved: ${saved}\n---\n\n# ${title}\n\n${offer.trim()}\n`;
}

/**
 * A link reduced to what identifies the posting: no tracking parameters, fragment or trailing slash,
 * so the same posting shared from different places compares equal.
 */
export function normalizeLink(url) {
  try {
    const u = new URL(url.trim());
    u.hash = '';
    for (const key of [...u.searchParams.keys()]) {
      if (/^(utm_|ref|refid|trk|tracking|src|source|from|gh_src|lever-source|origin)/i.test(key)) u.searchParams.delete(key);
    }
    u.hostname = u.hostname.replace(/^www\./, '');
    return (u.hostname + u.pathname.replace(/\/+$/, '') + (u.search || '')).toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

/** The application folder that already has this link in its job.md, if any. */
export function findByLink(url) {
  if (!url) return null;
  const wanted = normalizeLink(url);
  return listApplications().find((dir) => {
    const link = readJob(dir)?.meta.link;
    return link && normalizeLink(link) === wanted;
  }) ?? null;
}
