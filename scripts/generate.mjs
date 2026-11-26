#!/usr/bin/env node
// Builds the PDF of a resume and runs the ATS checks on it.
//
// Usage: npm run generate                    → profile/resume-base.md → profile/resume-base.pdf
//        npm run generate -- cartify         → applications/<…cartify…>/resume.md → "<Name> - Resume - YYYYMMDD.pdf" in that folder
//                                              (dated today; it replaces the folder's older resume PDF)
//        npm run generate -- <path.md> [output.pdf]
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { checkPdf } from '../src/ats.js';
import { generatePdf } from '../src/pdf.js';
import { rel, removeOlderPdfs, resolveResume } from '../src/paths.js';

const [arg, outArg] = process.argv.slice(2);
const { md, pdf: defaultPdf, dated } = resolveResume(arg);
const pdf = outArg ? path.resolve(outArg) : defaultPdf;
await mkdir(path.dirname(pdf), { recursive: true });
const started = Date.now();
await generatePdf({ input: md, output: pdf });
console.log(`✔ ${rel(pdf)} generated from ${rel(md)} in ${Date.now() - started} ms`);
if (dated && !outArg) {
  for (const old of removeOlderPdfs(pdf, md)) console.log(`  replaces ${old}`);
}
console.log('');
console.log('ATS checks:');
if (!(await checkPdf({ md, pdf }))) {
  console.log('\n✗ Some ATS checks failed (see above). The PDF was still written.');
  process.exit(1);
}
