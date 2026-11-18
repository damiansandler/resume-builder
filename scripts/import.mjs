#!/usr/bin/env node
// Creates a resume from the material you already have: the resumes and LinkedIn profile PDF in
// sources/, plus your cover letters in cover-letters/ as reference. Follows the instructions in
// sources/README.md (the same ones Claude follows in the chat).
//
// Usage:
//   npm run import                → resumes/<today>-imported.md
//   npm run import -- my-resume   → resumes/<today>-my-resume.md
//
// Writes the resume, adds the details that did not fit to notes/experience.md and builds the PDF.
// Your files in sources/ and cover-letters/ are only read, never changed.
// Needs ANTHROPIC_API_KEY in .env (see README).
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { askClaude, requireApiKey, slug, today } from '../src/claude.js';
import { listMaterial, materialBlocks } from '../src/files.js';
import { ROOT } from '../src/render.js';
import { RESUMES_DIR } from '../src/versions.js';

const NOTES = path.join(ROOT, 'notes', 'experience.md');
const rel = (p) => path.relative(process.cwd(), p);
const read = (...p) => readFileSync(path.join(ROOT, ...p), 'utf8');

const sources = listMaterial(path.join(ROOT, 'sources'));
const letters = listMaterial(path.join(ROOT, 'cover-letters'));
if (!sources.files.length) {
  console.error(`✗ No files in sources/.

  Put your current resume (PDF or Word) and your LinkedIn profile PDF there
  (on LinkedIn: your profile → More → Save to PDF), then run npm run import again.`);
  process.exit(1);
}
requireApiKey('Create my resume from my sources');

const label = slug(process.argv[2] ?? 'imported') || 'imported';
const date = today();
const target = path.join(RESUMES_DIR, `${date}-${label}.md`);
if (existsSync(target)) {
  console.error(`✗ ${rel(target)} already exists. Pick another name: npm run import -- another-name`);
  process.exit(1);
}

const names = (list) => list.map((f) => path.basename(f)).join(', ');
console.log(`Reading sources/: ${names(sources.files)}`);
if (letters.files.length) console.log(`Reading cover-letters/: ${names(letters.files)}`);
const skipped = [...sources.skipped, ...letters.skipped];
if (skipped.length) console.log(`(Skipped, unsupported format: ${names(skipped)}. Use PDF, Word, Markdown or text.)`);

const notes = existsSync(NOTES) ? readFileSync(NOTES, 'utf8').trim() : '';
const content = [
  ...(await materialBlocks(sources.files, 'sources')),
  ...(await materialBlocks(letters.files, 'cover-letters')),
  {
    type: 'text',
    text: [
      `Today's date: ${date}. Resume label: ${label}.`,
      notes ? `<experience_notes>\n${notes}\n</experience_notes>` : 'notes/experience.md does not exist yet.',
      'Create the resume from the files above following the instructions. Reply in the "Reply format for npm run import".',
    ].join('\n\n'),
  },
];

const system = `You turn a person's existing resumes, LinkedIn profile export and cover letters into a resume in this
project's Markdown format. Follow the instructions exactly.

<instructions>
${read('sources', 'README.md')}
</instructions>

<resume_format>
${read('docs', 'markdown.md')}
</resume_format>

<example_resume>
${read('examples', 'sample-resume.md')}
</example_resume>`;

console.log('\nCreating your resume. This usually takes one to three minutes.\n');
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

await mkdir(path.dirname(NOTES), { recursive: true });
if (!existsSync(NOTES)) {
  const header = read('examples', 'sample-experience.md').split(/\n## /)[0].replace(/<!--[\s\S]*?-->\s*/g, '').trim();
  await writeFile(NOTES, header + '\n');
}
const newNotes = block('notes');
if (newNotes) {
  await appendFile(NOTES, `\n${newNotes}\n`);
  written.push(`✔ Details that did not fit: added to ${rel(NOTES)}`);
}

const questions = block('questions');
const report = path.join(ROOT, 'notes', `${date}-${label}-import-report.md`);
await writeFile(
  report,
  `# Import report · ${date}\n\n**Resume:** ${path.basename(target)}\n\n## Summary\n\n${block('summary')}\n\n## Questions\n\n${questions || 'None.'}\n`,
);
written.push(`✔ Summary and questions: ${rel(report)}`);

console.log(block('summary'));
console.log(`\n${written.join('\n')}\n`);

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
