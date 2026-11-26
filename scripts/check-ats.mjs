#!/usr/bin/env node
// ATS checks on a generated PDF (npm run generate already runs them).
// Usage: npm run check [-- <application name>]   (no name: your base resume)
import { existsSync } from 'node:fs';
import { checkPdf } from '../src/ats.js';
import { fail, rel, resolveResume } from '../src/paths.js';

const { md, pdf } = resolveResume(process.argv[2]);
if (!existsSync(pdf)) fail(`${rel(pdf)} does not exist yet. Build it first: npm run generate${process.argv[2] ? ` -- ${process.argv[2]}` : ''}`);
console.log(`Checking ${rel(pdf)}\n`);
process.exit((await checkPdf({ md, pdf, verbose: true })) ? 0 : 1);
