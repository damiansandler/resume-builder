#!/usr/bin/env node
// Compares a resume with a job offer using Claude and saves the analysis to matches/.
// The scoring rules live in match/criteria.md (the same file Claude follows in the chat).
//
// Usage:
//   npm run match                          → paste the offer, then press Ctrl+D
//   npm run match -- offer.txt             → read the offer from a file
//   npm run match -- offer.txt 2020-04-23  → compare with another resume version
// Also reads cover-letters/ and notes/experience.md when they exist.
//
// Needs ANTHROPIC_API_KEY, set in a .env file at the project root (see README).
import Anthropic from '@anthropic-ai/sdk';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from '../src/render.js';
import { resolveResume } from '../src/versions.js';

const MODEL = 'claude-opus-5-5';
const rel = (p) => path.relative(process.cwd(), p);

loadEnv(path.join(ROOT, '.env'));
if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_PROFILE) {
  console.error(`✗ No Anthropic API key found.

  npm run match calls Claude through the Anthropic API, which needs a key:
    1. Create one at https://console.anthropic.com/settings/keys (usage is billed per analysis).
    2. Create a file named .env in the project folder with this line:
         ANTHROPIC_API_KEY=your-key-here

  No key? Ask Claude Code instead, in the chat:
    "Compare my latest resume with this job: <paste the offer>"`);
  process.exit(1);
}

const [offerArg, resumeArg] = process.argv.slice(2);
const resumePath = resolveResume(resumeArg);
const offer = offerArg ? readFileSync(path.resolve(offerArg), 'utf8') : await readPastedOffer();
if (offer.trim().length < 200) {
  console.error('✗ The offer looks too short. Paste the full job description (or pass a text file).');
  process.exit(1);
}

const criteria = readFileSync(path.join(ROOT, 'match', 'criteria.md'), 'utf8');
const resume = readFileSync(resumePath, 'utf8');
const coverLetters = readCoverLetters(path.join(ROOT, 'cover-letters'));
const notesPath = path.join(ROOT, 'notes', 'experience.md');
const notes = existsSync(notesPath) ? readFileSync(notesPath, 'utf8').trim() : '';
const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

const system = `You compare a candidate's resume with a job offer and write an analysis in Markdown.
Follow the scoring criteria below exactly, including the output format. Reply with the analysis only,
starting with the "# <Role> · <Company>" heading.

${criteria}`;

const parts = [
  `Today's date: ${today}`,
  `<resume file="${path.basename(resumePath)}">\n${resume}\n</resume>`,
  coverLetters.length
    ? coverLetters.map((c) => `<cover_letter file="${c.name}">\n${c.text}\n</cover_letter>`).join('\n\n')
    : 'No cover letters provided.',
  notes ? `<experience_notes>\n${notes}\n</experience_notes>` : 'No experience notes provided.',
  `<job_offer>\n${offer.trim()}\n</job_offer>`,
];

const extras = [coverLetters.length && `${coverLetters.length} cover letters`, notes && 'experience notes'].filter(Boolean);
console.log(`Comparing ${rel(resumePath)} with the offer${extras.length ? ` (+ ${extras.join(', ')})` : ''}…`);
console.log('This usually takes one or two minutes.\n');

const client = new Anthropic();
let message;
try {
  message = await client.beta.messages
    .stream({
      model: MODEL,
      max_tokens: 64000,
      output_config: { effort: 'high' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default', // if the model declines, the API retries on a fallback model
      system,
      messages: [{ role: 'user', content: parts.join('\n\n') }],
    })
    .finalMessage();
} catch (error) {
  if (error instanceof Anthropic.AuthenticationError) {
    console.error('✗ The API key was rejected. Check ANTHROPIC_API_KEY in .env.');
  } else if (error instanceof Anthropic.RateLimitError) {
    console.error('✗ Rate limit reached. Wait a minute and try again.');
  } else if (error instanceof Anthropic.APIError) {
    console.error(`✗ Anthropic API error ${error.status ?? ''}: ${error.message}`);
  } else {
    console.error(`✗ Could not reach the Anthropic API: ${error.message}`);
  }
  process.exit(1);
}

if (message.stop_reason === 'refusal') {
  console.error('✗ Claude declined to analyze this offer. Try again, or ask in the Claude Code chat.');
  process.exit(1);
}
const analysis = message.content
  .filter((b) => b.type === 'text')
  .map((b) => b.text)
  .join('')
  .trim();
if (!analysis) {
  console.error('✗ Claude returned an empty answer. Try again.');
  process.exit(1);
}
if (message.stop_reason === 'max_tokens') console.warn('⚠ The analysis was cut off before the end.');

// File name from the "# Role · Company" heading.
const heading = analysis.match(/^#\s+(.+)$/m)?.[1] ?? 'job-offer';
const [role, company] = heading.split('·').map((s) => s.trim());
const slug = (s) =>
  (s ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const name = [today, slug(company), slug(role)].filter(Boolean).join('-').slice(0, 90);
const outDir = path.join(ROOT, 'matches');
await mkdir(outDir, { recursive: true });
let outPath = path.join(outDir, `${name}.md`);
for (let i = 2; existsSync(outPath); i++) outPath = path.join(outDir, `${name}-${i}.md`);
await writeFile(outPath, analysis + '\n');

const total = analysis.match(/^##\s+Total:.*$/m)?.[0].replace(/^##\s+/, '');
console.log(`✔ ${total ?? 'Analysis ready'}`);
console.log(`  Saved to ${rel(outPath)}`);
const questions = analysis.split(/^##\s+Questions for you\s*$/m)[1]?.split(/^##\s/m)[0].trim();
if (questions) {
  console.log('\nQuestions for you (answering them can raise the score):\n');
  console.log(questions.replace(/^/gm, '  '));
  console.log('\n  Answer them in the Claude Code chat, or write the answers in notes/experience.md and run npm run match again.');
}
if (company) console.log(`\n  To tailor your resume: npm run new -- ${slug(company)}`);

// --- helpers ---

/** Minimal .env loader: KEY=value lines; does not override variables already set. */
function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    const value = m[2].replace(/^(['"])(.*)\1$/, '$2');
    process.env[m[1]] ??= value;
  }
}

function readCoverLetters(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /\.(md|txt)$/i.test(f) && !f.startsWith('.'))
    .sort()
    .map((f) => ({ name: f, text: readFileSync(path.join(dir, f), 'utf8') }));
}

async function readPastedOffer() {
  if (process.stdin.isTTY) {
    console.log('Paste the job offer below, then press Enter and Ctrl+D:\n');
  }
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  console.log('');
  return Buffer.concat(chunks).toString('utf8');
}
