#!/usr/bin/env node
// Creates your first resume from the material in import/: your current resume, your LinkedIn
// profile export and past cover letters. Follows the instructions in import/README.md (the same
// ones Claude follows in the chat).
//
// Usage:
//   npm run import                → resumes/<today>-imported.md
//   npm run import -- my-resume   → resumes/<today>-my-resume.md
//
// Writes the resume, adds the details that did not fit to notes/experience.md, saves cover letters
// to cover-letters/ and builds the PDF. Needs ANTHROPIC_API_KEY in .env (see README).
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';
import { askClaude, requireApiKey, slug, today } from '../src/claude.js';
import { ROOT } from '../src/render.js';
import { RESUMES_DIR } from '../src/versions.js';

const IMPORT_DIR = path.join(ROOT, 'import');
const NOTES = path.join(ROOT, 'notes', 'experience.md');
const COVER_DIR = path.join(ROOT, 'cover-letters');
const rel = (p) => path.relative(process.cwd(), p);
const read = (...p) => readFileSync(path.join(ROOT, ...p), 'utf8');

const files = existsSync(IMPORT_DIR)
  ? readdirSync(IMPORT_DIR).filter((f) => !f.startsWith('.') && f !== 'README.md').sort()
  : [];
const supported = files.filter((f) => /\.(pdf|docx|md|txt)$/i.test(f));
const skipped = files.filter((f) => !supported.includes(f));
if (!supported.length) {
  console.error(`✗ No files to import in import/.

  Put your current resume (PDF or Word) and your LinkedIn profile PDF there
  (on LinkedIn: your profile → More → Save to PDF), then run npm run import again.`);
  process.exit(1);
}
requireApiKey('Create my resume from the files in import/');

const label = slug(process.argv[2] ?? 'imported') || 'imported';
const date = today();
const target = path.join(RESUMES_DIR, `${date}-${label}.md`);
if (existsSync(target)) {
  console.error(`✗ ${rel(target)} already exists. Pick another name: npm run import -- another-name`);
  process.exit(1);
}

// Each file becomes a content block: PDFs go as documents (Claude reads layout and columns),
// Word files are converted to text, Markdown and text files are sent as they are.
const content = [];
for (const f of supported) {
  const full = path.join(IMPORT_DIR, f);
  if (/\.pdf$/i.test(f)) {
    content.push({ type: 'text', text: `File: ${f}` });
    content.push({
      type: 'document',
      title: f,
      source: { type: 'base64', media_type: 'application/pdf', data: readFileSync(full).toString('base64') },
    });
  } else {
    const text = /\.docx$/i.test(f) ? (await mammoth.extractRawText({ path: full })).value : readFileSync(full, 'utf8');
    content.push({ type: 'text', text: `<file name="${f}">\n${text}\n</file>` });
  }
}
const notes = existsSync(NOTES) ? readFileSync(NOTES, 'utf8').trim() : '';
content.push({
  type: 'text',
  text: [
    `Today's date: ${date}. Resume label: ${label}.`,
    notes ? `<experience_notes>\n${notes}\n</experience_notes>` : 'notes/experience.md does not exist yet.',
    'Import the files above following the instructions. Reply in the "Reply format for npm run import".',
  ].join('\n\n'),
});

const system = `You turn a person's existing resume, LinkedIn profile export and cover letters into a resume in this
project's Markdown format. Follow the instructions exactly.

<instructions>
${read('import', 'README.md')}
</instructions>

<resume_format>
${read('docs', 'markdown.md')}
</resume_format>

<example_resume>
${read('examples', 'sample-resume.md')}
</example_resume>`;

console.log(`Importing ${supported.join(', ')}…`);
if (skipped.length) console.log(`(Skipped, unsupported format: ${skipped.join(', ')}. Use PDF, Word, Markdown or text.)`);
console.log('This usually takes one to three minutes.\n');

const reply = await askClaude({ system, content });
const block = (tag) => reply.match(new RegExp(`<${tag}>\\s*([\\s\\S]*?)\\s*</${tag}>`))?.[1]?.trim() ?? '';

let resume = block('resume').replace(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/, '$1');
if (!resume.includes('\n## ')) {
  console.error('✗ Claude did not return a resume in the expected format. Try again, or ask in the Claude Code chat.');
  process.exit(1);
}
if (!resume.startsWith('---')) resume = `---\nfooter:\n---\n\n${resume}`;
await mkdir(RESUMES_DIR, { recursive: true });
await writeFile(target, resume + '\n');

const written = [`✔ Resume: ${rel(target)}`];

const newNotes = block('notes');
if (newNotes) {
  await mkdir(path.dirname(NOTES), { recursive: true });
  if (!existsSync(NOTES)) {
    const header = read('examples', 'sample-experience.md').split(/\n## /)[0].replace(/<!--[\s\S]*?-->\s*/g, '').trim();
    await writeFile(NOTES, header + '\n');
  }
  await appendFile(NOTES, `\n${newNotes}\n`);
  written.push(`✔ Details that did not fit: added to ${rel(NOTES)}`);
}

const letters = [...reply.matchAll(/<cover_letter name="([^"]*)">\s*([\s\S]*?)\s*<\/cover_letter>/g)];
if (letters.length) await mkdir(COVER_DIR, { recursive: true });
for (const [, name, text] of letters) {
  const base = slug(name.replace(/\.md$/i, '')) || 'cover-letter';
  let out = path.join(COVER_DIR, `${base}.md`);
  for (let i = 2; existsSync(out); i++) out = path.join(COVER_DIR, `${base}-${i}.md`);
  await writeFile(out, text + '\n');
  written.push(`✔ Cover letter: ${rel(out)}`);
}

const questions = block('questions');
const report = path.join(IMPORT_DIR, `${date}-${label}-import-report.md`);
await writeFile(
  report,
  `# Import report · ${date}\n\n**Resume:** ${path.basename(target)}\n\n## Summary\n\n${block('summary')}\n\n## Questions\n\n${questions || 'None.'}\n`,
);

console.log(block('summary'));
console.log(`\n${written.join('\n')}`);
console.log(`✔ Report: ${rel(report)}\n`);

console.log('Building the PDF…');
spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'generate', '--', path.basename(target)], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (questions) {
  console.log('\nQuestions to make your resume stronger:\n');
  console.log(questions.replace(/^/gm, '  '));
  console.log('\n  Answer them in the Claude Code chat ("Answer the import questions"), or write the answers in notes/experience.md.');
}
console.log(`\nNext: check the resume with npm run preview -- ${label}`);
