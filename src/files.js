// Reads the user's material (profile/ files, cover letters) as content blocks for Claude.
// PDFs are sent as documents (Claude reads their layout), Word files are converted to text,
// Markdown and text files are sent as they are.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import mammoth from 'mammoth';

export const SUPPORTED = /\.(pdf|docx|doc|md|txt)$/i;

/**
 * Lists the files of a folder that can be read, skipping README.md and hidden files.
 * Returns { files, skipped } with full paths.
 */
export function listMaterial(dir) {
  if (!existsSync(dir)) return { files: [], skipped: [] };
  const all = readdirSync(dir)
    .filter((f) => !f.startsWith('.') && f !== 'README.md')
    .sort()
    .map((f) => path.join(dir, f));
  return { files: all.filter((f) => SUPPORTED.test(f)), skipped: all.filter((f) => !SUPPORTED.test(f)) };
}

/**
 * Turns files into Claude content blocks, each labeled with its folder and name
 * (its path relative to `root` when given).
 * Files that cannot be read are skipped with a warning.
 */
export async function materialBlocks(files, label, root) {
  const blocks = [];
  for (const file of files) {
    const name = `${label}/${root ? path.relative(root, file) : path.basename(file)}`;
    try {
      if (/\.pdf$/i.test(file)) {
        blocks.push({ type: 'text', text: `File: ${name}` });
        blocks.push({
          type: 'document',
          title: name,
          source: { type: 'base64', media_type: 'application/pdf', data: readFileSync(file).toString('base64') },
        });
      } else {
        blocks.push({ type: 'text', text: `<file name="${name}">\n${await readText(file)}\n</file>` });
      }
    } catch (error) {
      console.warn(`⚠ Skipped ${name}: ${error.message}`);
    }
  }
  return blocks;
}

async function readText(file) {
  if (/\.docx$/i.test(file)) return (await mammoth.extractRawText({ path: file })).value;
  if (/\.doc$/i.test(file)) {
    if (process.platform !== 'darwin') {
      throw new Error('old Word (.doc) files are converted only on macOS. Open it in Word and save it as .docx.');
    }
    return execFileSync('textutil', ['-convert', 'txt', '-stdout', file], { encoding: 'utf8' });
  }
  return readFileSync(file, 'utf8');
}
