# Cover letters

Not every application needs a cover letter, so letters are separate from the resume: `npm run generate`
never builds them.

## Writing one

**In the Claude Code chat:**

> Write the cover letter for cartify

Claude reads the posting, the analysis, your resume for it, your notes, your LinkedIn and your past
cover letters. It shows you a draft, with the facts it used and where each one comes from. You edit it
together. When you approve it, Claude saves `cover-letter.md` in the application folder and builds
`<Name> - Cover Letter - YYYYMMDD.pdf`.

**From the terminal:** `npm run write-cover-letter -- cartify` writes the draft and builds its PDF
(it needs an API key, see [`terminal.md`](terminal.md)). Edit `cover-letter.md`, then rebuild the PDF
with `npm run cover-letter -- cartify`.

## How the letter is written

- It follows your past letters in `profile/cover-letters/`: their structure, greeting, sign-off and
  tone.
- It is written in the posting's language and fits on one page (250–400 words).
- It never invents anything, including facts about the company.

The rules are in [`.claude/skills/cover-letter/SKILL.md`](../.claude/skills/cover-letter/SKILL.md). The
chat and the terminal both use them.

## The file and the PDF

The format of `cover-letter.md` is shown in
[`examples/sample-cover-letter.md`](../examples/sample-cover-letter.md). Blank lines separate
paragraphs, and a line break inside a paragraph is kept, which is how the sign-off stays on separate
lines.

The PDF is a plain letter: US Letter page, Arial 11pt, 1in margins. To change it, see "The cover
letter" in [`design.md`](design.md). `npm run cover-letter` also checks that every line is readable as
text and that the letter fits on one page.
