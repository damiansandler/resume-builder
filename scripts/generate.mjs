#!/usr/bin/env node
// Usage: npm run generate                      → newest file in resumes/
//        npm run generate -- <name or path.md> [output.pdf]
// The PDF is written to output/<same name as the .md>.pdf
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { generatePdf } from '../src/pdf.js';
import { resolveResume, pdfFor } from '../src/versions.js';

const [arg, outArg] = process.argv.slice(2);
const input = resolveResume(arg);
const output = outArg ? path.resolve(outArg) : pdfFor(input);
await mkdir(path.dirname(output), { recursive: true });
const started = Date.now();
await generatePdf({ input, output });
console.log(`✔ ${path.relative(process.cwd(), output)} generated from ${path.relative(process.cwd(), input)} in ${Date.now() - started} ms`);
