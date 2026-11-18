# Instructions for Claude

This repo builds resumes from Markdown into ATS-friendly PDFs and compares a resume against job offers.
Write to the user in the language they write to you. Resumes, analyses and code comments are in English
unless the user asks otherwise.

## Rules

- **Never invent** achievements, metrics, dates, companies, titles or skills. Everything you write about
  the user must come from `resumes/`, `sources/`, `cover-letters/`, `notes/experience.md`, or from what
  the user tells you in the chat. If something is missing, say so and ask.
- **Save what you learn.** When the user tells you about experience that is not in their resume, add it
  to `notes/experience.md` (see below), so they never have to answer the same question twice.
- **Never edit an existing resume version to tailor it.** Create a new one with
  `npm run new -- <label>` and edit that. Fixing a typo in a version the user is working on is fine.
- `cover-letters/` is **reference only**: read it to learn the user's voice and the stories they tell
  (anecdotes, achievements that are not in the resume). Do not write new cover letters unless asked.
- When suggesting resume text, keep the user's voice and the resume's conventions (see the Markdown
  structure in `docs/markdown.md`).
- `resumes/`, `sources/` (except its README), `cover-letters/`, `notes/`, `matches/`, `output/` and `reference/`
  are personal and git-ignored.
  Never move their contents into tracked files, and never put the user's personal data in
  `examples/`, `docs/`, `README.md` or code.

## Creating a resume from sources

`sources/` holds the user's LinkedIn profile PDF and their current and older resumes (PDF, Word,
Markdown or text). The files stay there permanently: never move, rename or delete them.

When the user asks to create their resume from their sources (or shares an existing resume or LinkedIn
PDF to start from), follow the instructions in `sources/README.md` exactly. It is the same file
`npm run import` uses. Read PDFs and Word files directly; never publish or upload them anywhere.
If the user shares a file in the chat instead, suggest saving it in `sources/` (or `cover-letters/`
for a cover letter) so later analyses can use it.

If an import report from `npm run import` exists in `notes/` and the user asks to answer the import
questions, ask them one by one, save the answers to `notes/experience.md`, and update the imported
resume version.

## Comparing a resume with a job offer

When the user pastes a job offer (or a link to one) and asks how well a resume fits:

1. Use the newest file in `resumes/` unless the user names another version. If `resumes/` is empty, say
   so and use `examples/sample-resume.md`.
2. Read every file in `sources/`, `cover-letters/` and `notes/experience.md` (if they exist), in any
   format (PDF, Word, Markdown, text).
3. Follow `match/criteria.md` exactly: areas, seniority weights, scoring, questions and output format.
   It is the same file `npm run match` uses, so both give the same kind of analysis.
4. Save the result to `matches/YYYY-MM-DD-<company>-<role>.md` (lowercase, hyphens) and show the user
   the summary: total score, top 3 strengths, top 3 gaps, and the **questions**.
5. **Ask the questions** and wait for the answers. The user may answer some and skip others.
6. Save every answer to `notes/experience.md`, then add an "Update after answers" section at the end of
   the analysis: which requirements and keywords the answers cover, and the new estimated total.
7. If the user wants to apply, create the tailored version with `npm run new -- <company>` and edit it
   with the suggested changes and the confirmed answers. Show the user what changed.

If a link cannot be opened (LinkedIn often requires sign-in), ask the user to paste the offer text.

If the analysis came from `npm run match`, its questions are already in the file: ask them in the chat
when the user opens it, or read their answers from `notes/experience.md`.

## Experience notes (`notes/experience.md`)

A personal, git-ignored file with experience the resume does not show yet: answers to questions, extra
details, tools, numbers. It grows over time and is read before every analysis.

- Group entries by job (`## Company — Role`), plus `## General` for things like location, languages or
  preferences.
- Write each entry as a fact in the user's words, with the date and the question it answers, for example:
  `- Ran monthly cohort analysis of merchant retention in Amplitude. (2026-03-02, Cartify: cohort analysis)`
- If the user says they do **not** have some experience, record that too (`- No Mastercard experience.`),
  so the question is not asked again.
- Never put anything in the notes that the user did not say.
- If the file does not exist, create it from `examples/sample-experience.md`.

## Map

| Path | What it is |
|---|---|
| `resumes/` | The user's resumes, one dated Markdown file per version. The newest file is the default. |
| `sources/` | The user's LinkedIn profile PDF and current and older resumes. Its README has the import instructions. |
| `cover-letters/` | The user's past cover letters (any format), reference only. |
| `notes/experience.md` | Experience not in the resume yet: the user's answers to questions. |
| `matches/` | Saved resume-vs-offer analyses. |
| `output/` | Generated PDFs. |
| `examples/` | Sample resume, cover letter and experience notes, with made-up data. |
| `match/criteria.md` | How a resume is scored against an offer. |
| `template/` | The resume design (HTML + CSS). |
| `src/`, `scripts/` | The code behind the commands. |
| `docs/` | Technical documentation: Markdown syntax, design, ATS checks. |

## Commands

| Command | What it does |
|---|---|
| `npm run setup` | First-time install and test. |
| `npm run import [-- <label>]` | Resume from the files in `sources/` (needs `ANTHROPIC_API_KEY` in `.env`). |
| `npm run new -- <label>` | New resume version, copied from the newest one. |
| `npm run preview` | Live preview in the browser. |
| `npm run generate` | Builds the PDF into `output/`. |
| `npm run check` | ATS checks on the generated PDF. |
| `npm run match` | Resume-vs-offer analysis from the terminal (needs `ANTHROPIC_API_KEY` in `.env`). |
| `npm run compare` | Optional: compares the PDF with `reference/original.pdf`. |

Any command accepts a version name, or part of it, after `--`: `npm run generate -- 2020-04-23`.
After changing a resume, run `npm run generate` and `npm run check`.
