// Where everything lives:
//
//   profile/                      who you are (personal, git-ignored except its README)
//     resume-base.md              your master resume, the starting point for every application
//     resume-base.pdf             its PDF (npm run generate)
//     experience.md               experience the resume does not show yet: your answers to questions
//     cover-letters/              past cover letters, reference only
//     old-resumes/                older resumes, including earlier versions of the base
//     <anything else>             source material, such as your LinkedIn profile PDF
//
//   applications/                 one folder per job posting (personal, git-ignored)
//     2026-11-25-company-role/
//       job.md                    link + full text of the posting
//       match.md                  base resume vs. posting (and the tailored version's score)
//       resume.md                 the tailored resume
//       <Name> - Resume - YYYYMMDD.pdf   its PDF, ready to upload (dated the day it is built)
import { existsSync, readdirSync, readFileSync, statSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './render.js';

export const PROFILE_DIR = path.join(ROOT, 'profile');
export const BASE_RESUME = path.join(PROFILE_DIR, 'resume-base.md');
export const BASE_PDF = path.join(PROFILE_DIR, 'resume-base.pdf');
export const EXPERIENCE = path.join(PROFILE_DIR, 'experience.md');
export const IMPORT_REPORT = path.join(PROFILE_DIR, 'import-report.md');
export const COVER_LETTERS_DIR = path.join(PROFILE_DIR, 'cover-letters');
export const OLD_RESUMES_DIR = path.join(PROFILE_DIR, 'old-resumes');
export const APPLICATIONS_DIR = path.join(ROOT, 'applications');
export const SAMPLE_RESUME = path.join(ROOT, 'examples', 'sample-resume.md');

/** Files in profile/ that the project writes itself: they are never read as source material. */
const PROFILE_OWN_FILES = new Set(['README.md', 'resume-base.md', 'resume-base.pdf', 'experience.md', 'import-report.md']);

const rel = (p) => path.relative(process.cwd(), p) || '.';
const visible = (f) => !f.startsWith('.');

/** Today's date as YYYY-MM-DD in local time. */
export const today = () => new Date().toLocaleDateString('en-CA');

/** Lowercase, hyphenated, accent-free slug. */
export const slug = (s) =>
  (s ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Exits with a friendly message (no stack trace). */
export function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

/** Source material in profile/: LinkedIn export and any other file you put there, plus old-resumes/. */
export function sourceFiles() {
  const fromRoot = existsSync(PROFILE_DIR)
    ? readdirSync(PROFILE_DIR)
        .filter((f) => visible(f) && !PROFILE_OWN_FILES.has(f))
        .map((f) => path.join(PROFILE_DIR, f))
        .filter((f) => statSync(f).isFile())
    : [];
  const old = existsSync(OLD_RESUMES_DIR)
    ? readdirSync(OLD_RESUMES_DIR)
        .filter(visible)
        .map((f) => path.join(OLD_RESUMES_DIR, f))
        .filter((f) => statSync(f).isFile())
    : [];
  return [...fromRoot.sort(), ...old.sort()];
}

/** Application folders, oldest first (names start with the date). */
export function listApplications() {
  if (!existsSync(APPLICATIONS_DIR)) return [];
  return readdirSync(APPLICATIONS_DIR)
    .filter((f) => visible(f) && statSync(path.join(APPLICATIONS_DIR, f)).isDirectory())
    .sort()
    .map((f) => path.join(APPLICATIONS_DIR, f));
}

/** Applications whose folder name contains `name` (case-insensitive). */
export function findApplications(name) {
  const needle = name.toLowerCase();
  return listApplications().filter((dir) => path.basename(dir).toLowerCase().includes(needle));
}

/**
 * Resolves a CLI argument to one application folder: a folder path, or part of a folder name.
 * Exits with the list of applications when there is no match or more than one.
 */
export function resolveApplication(name) {
  if (existsSync(name) && statSync(name).isDirectory()) return path.resolve(name);
  const matches = findApplications(name);
  if (matches.length === 1) return matches[0];
  const list = (dirs) => dirs.map((d) => `  ${path.basename(d)}`).join('\n');
  if (matches.length) fail(`"${name}" matches several applications, be more specific:\n${list(matches)}`);
  const all = listApplications();
  fail(
    `No application found for "${name}".` +
      (all.length ? ` Applications:\n${list(all)}` : ' applications/ is empty: save a job posting with npm run job'),
  );
}

/** The most recently created application folder, or exits if there is none. */
export function latestApplication() {
  const all = listApplications();
  if (!all.length) fail('applications/ is empty. Save a job posting first: npm run job');
  // Folder names start with the date; on the same day, the one created last wins.
  const created = (dir) => statSync(dir).birthtimeMs || statSync(dir).ctimeMs;
  return all.reduce((a, b) => {
    const [da, db] = [path.basename(a).slice(0, 10), path.basename(b).slice(0, 10)];
    return db > da || (db === da && created(b) >= created(a)) ? b : a;
  });
}

/** The person's name, from the `# NAME` line of a resume, in title case ("Alex Morgan"). */
export function personName(mdPath) {
  if (!existsSync(mdPath)) return '';
  const heading = readFileSync(mdPath, 'utf8').match(/^#\s+(.+?)\s*$/m)?.[1] ?? '';
  return heading
    .replace(/[*_`]/g, '')
    .toLowerCase()
    .replace(/(^|[\s'-])(\p{L})/gu, (_, sep, letter) => sep + letter.toUpperCase())
    .replace(/[\\/:*?"<>|]/g, '')
    .trim();
}

/** Today's date as YYYYMMDD, the date stamp in PDF names. */
export const stamp = () => today().replace(/-/g, '');

/**
 * Name for a PDF someone will see: "<Name> - Resume - YYYYMMDD.pdf" (or another `kind`), from a resume's
 * `# NAME` line and the date it is built.
 */
export function pdfNameFor(mdPath, kind = 'Resume', date = stamp()) {
  const name = personName(mdPath);
  return `${name ? `${name} - ` : ''}${kind} - ${date}.pdf`;
}

/** The PDFs of one kind in a folder ("<Name> - Resume - YYYYMMDD.pdf", or without a date), newest first. */
export function datedPdfs(dir, mdPath, kind = 'Resume') {
  if (!existsSync(dir)) return [];
  const name = personName(mdPath);
  const escape = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^${name ? `${escape(name)} - ` : ''}${escape(kind)}( - (\\d{8}))?\\.pdf$`);
  return readdirSync(dir)
    .map((f) => ({ f, m: f.match(pattern) }))
    .filter(({ m }) => m)
    .sort((a, b) => (b.m[2] ?? '').localeCompare(a.m[2] ?? ''))
    .map(({ f }) => path.join(dir, f));
}

/** The newest existing PDF of one kind in a folder, or the name it would have today. */
export function latestPdf(dir, mdPath, kind = 'Resume') {
  return datedPdfs(dir, mdPath, kind)[0] ?? path.join(dir, pdfNameFor(mdPath, kind));
}

/** Removes the older PDFs of the same kind next to `keep`, so each folder has one current PDF per kind. */
export function removeOlderPdfs(keep, mdPath, kind = 'Resume') {
  const removed = [];
  for (const file of datedPdfs(path.dirname(keep), mdPath, kind)) {
    if (file !== keep) {
      unlinkSync(file);
      removed.push(path.basename(file));
    }
  }
  return removed;
}

/**
 * Resolves a CLI argument to the resume to build: { md, pdf, label }.
 *   (nothing) or "base"  → profile/resume-base.md → profile/resume-base.pdf
 *                          (examples/sample-resume.md while there is no base yet)
 *   part of a folder name → applications/<folder>/resume.md → applications/<folder>/<Name> - Resume - YYYYMMDD.pdf
 *   a path to a .md file → that file → a PDF next to it
 */
export function resolveResume(arg) {
  if (!arg || arg === 'base') {
    if (existsSync(BASE_RESUME)) return { md: BASE_RESUME, pdf: BASE_PDF, label: 'base' };
    console.log('ℹ profile/resume-base.md does not exist yet, using examples/sample-resume.md.');
    return { md: SAMPLE_RESUME, pdf: path.join(ROOT, 'build', 'sample-resume.pdf'), label: 'sample' };
  }
  if (existsSync(arg) && statSync(arg).isFile()) {
    const md = path.resolve(arg);
    const dated = path.basename(md) === 'resume.md';
    const pdf = dated ? path.join(path.dirname(md), pdfNameFor(md)) : md.replace(/\.[^.]+$/, '') + '.pdf';
    return { md, pdf, label: path.basename(md), dated };
  }
  const dir = resolveApplication(arg);
  const md = path.join(dir, 'resume.md');
  if (!existsSync(md)) {
    fail(`${rel(dir)} has no resume yet. Create it from your base with: npm run new -- ${arg}`);
  }
  return { md, pdf: path.join(dir, pdfNameFor(md)), label: path.basename(dir), dated: true };
}

export { rel };
