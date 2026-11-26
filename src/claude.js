// Shared helpers for the commands that call Claude through the Anthropic API (match, import).
import Anthropic from '@anthropic-ai/sdk';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './render.js';

const MODEL = 'claude-opus-5-5';

/** Loads .env (KEY=value lines) and exits with instructions if no API key is set. */
export function requireApiKey(chatAlternative) {
  loadEnv(path.join(ROOT, '.env'));
  if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_PROFILE) return;
  console.error(`✗ No Anthropic API key found.

  This command calls Claude through the Anthropic API, which needs a key:
    1. Create one at https://console.anthropic.com/settings/keys (usage is billed per run).
    2. Create a file named .env in the project folder with this line:
         ANTHROPIC_API_KEY=your-key-here

  No key? Ask Claude Code instead, in the chat:
    "${chatAlternative}"`);
  process.exit(1);
}

/**
 * Sends one request to Claude and returns the text of the reply.
 * `content` is the user message: a string or an array of content blocks.
 * Exits with a readable message on any error.
 */
export async function askClaude({ system, content }) {
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
        messages: [{ role: 'user', content }],
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
    console.error('✗ Claude declined this request. Try again, or ask in the Claude Code chat.');
    process.exit(1);
  }
  const text = message.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
  if (!text) {
    console.error('✗ Claude returned an empty answer. Try again.');
    process.exit(1);
  }
  if (message.stop_reason === 'max_tokens') console.warn('⚠ The answer was cut off before the end.');
  return text;
}

/** Minimal .env loader: KEY=value lines; does not override variables already set. */
function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    process.env[m[1]] ??= m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
