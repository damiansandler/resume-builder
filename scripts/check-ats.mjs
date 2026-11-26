#!/usr/bin/env node
// ATS checks on a generated PDF (npm run generate already runs them).
// Usage: npm run check [-- <application name>]   (no name: your base resume)
import { existsSync } from 'node:fs';
import { checkPdf } from '../src/ats.js';
import path from 'node:path';
import { fail, latestPdf, rel, resolveResume } from '../src/paths.js';

const resolved = resolveResume(process.argv[2]);
const { md } = resolved;
// Application PDFs carry the date they were built: check the newest one.
const pdf = resolved.dated ? latestPdf(path.dirname(resolved.pdf), md) : resolved.pdf;
if (!existsSync(pdf)) fail(`${rel(pdf)} does not exist yet. Build it first: npm run generate${process.argv[2] ? ` -- ${process.argv[2]}` : ''}`);
console.log(`Checking ${rel(pdf)}\n`);
process.exit((await checkPdf({ md, pdf, verbose: true })) ? 0 : 1);
