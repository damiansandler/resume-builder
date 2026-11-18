// Resume versions live in resumes/ as dated Markdown files, e.g.
// resumes/2020-04-23-head-of-product.md. Names sort by date, so the last one is the newest.
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './render.js';

export const RESUMES_DIR = path.join(ROOT, 'resumes');
export const OUTPUT_DIR = path.join(ROOT, 'output');
export const SAMPLE_RESUME = path.join(ROOT, 'examples', 'sample-resume.md');

export function listResumes() {
  if (!existsSync(RESUMES_DIR)) return [];
  return readdirSync(RESUMES_DIR)
    .filter((f) => f.endsWith('.md') && !f.startsWith('.'))
    .sort()
    .map((f) => path.join(RESUMES_DIR, f));
}

/** Newest version in resumes/ (by file name). Falls back to the sample resume while resumes/ is empty. */
export function latestResume() {
  const all = listResumes();
  if (all.length) return all[all.length - 1];
  console.log('ℹ resumes/ is empty, using examples/sample-resume.md. Create your own with: npm run new -- my-resume');
  return SAMPLE_RESUME;
}

/** output/<same name>.pdf for a given .md file. */
export function pdfFor(mdPath) {
  return path.join(OUTPUT_DIR, path.basename(mdPath, path.extname(mdPath)) + '.pdf');
}

/** Resolves a CLI argument: a path, or a file name (or part of one) inside resumes/. Exits if not found. */
export function resolveResume(arg) {
  if (!arg) return latestResume();
  if (existsSync(arg)) return path.resolve(arg);
  const matches = listResumes().filter((f) => path.basename(f).includes(arg));
  if (matches.length === 1) return matches[0];
  console.error(
    matches.length
      ? `✗ "${arg}" matches several versions, be more specific:\n  ${matches.map((m) => path.basename(m)).join('\n  ')}`
      : `✗ No resume found for "${arg}". Versions in resumes/:\n  ${listResumes().map((m) => path.basename(m)).join('\n  ')}`,
  );
  process.exit(1);
}
