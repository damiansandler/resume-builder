# Instructions for Claude

This repo builds resumes from Markdown into ATS-friendly PDFs and tailors them to job postings.
Write to the user in the language they write to you. Resumes, analyses and code comments are in English
unless the user asks otherwise.

## How it is organized

- **`profile/`** is who the user is: `resume-base.md` (their master resume), `experience.md` (answers to
  questions), their LinkedIn profile PDF and current resume (any other file in `profile/`),
  `old-resumes/` and `cover-letters/`.
- **`applications/`** has one folder per job posting, named `YYYY-MM-DD-<company>-<role>` (lowercase,
  hyphens): `job.md` (link and full text of the posting), `match.md` (the analysis), `resume.md` (the
  tailored resume), `<Name> - Resume - YYYYMMDD.pdf`, and, when the user asks for one, `cover-letter.md`
  and `<Name> - Cover Letter - YYYYMMDD.pdf`. PDF names carry the date they were built; building again
  replaces the folder's older PDF of the same kind.

## Rules

- **Never invent** achievements, metrics, dates, companies, titles or skills. Everything you write about
  the user must come from `profile/` (base resume, experience notes, LinkedIn, old resumes, cover
  letters) or from what the user tells you in the chat. If something is missing, say so and ask.
- **Claims need a clear definition, period and attribution.** Distinguish leading from building
  something yourself, a prototype or testnet from production, evaluating a provider from integrating
  it, and a plan from a launch. When a metric's baseline, period or unit is unclear, use conservative
  wording or ask.
- **Knowledge base (optional).** If `profile/knowledge-base.md` exists, it is the user's master record
  of their career, read in every analysis and cover letter. Anything it marks as unconfirmed ("to
  validate", "por validar", "confirm", "verify") is not a fact yet: never use it in a resume or letter
  without asking. What it marks as private (compensation, job-search status, recruiter contacts,
  internal company metrics) never goes into a resume, a cover letter or `examples/`. When the user
  confirms or corrects something, update it there and in `profile/experience.md`, and add a line to its
  change log.
- **Each fact lives in one place.** When the user tells you about experience that is not in their base
  resume, add it to `profile/experience.md` (see below), so they never have to answer the same question
  twice and every later application can use it. A fact that exists only in one tailored resume is lost
  for the next application.
- **Tailored resumes always start from the base.** Create them with `npm run new -- <company>` (it copies
  `profile/resume-base.md`), then edit that copy. Past tailored resumes in `applications/` are a bank of
  phrasings you may reuse, never a source of facts.
- **Never edit `profile/resume-base.md` to tailor it** to one posting. Change it only when the user asks,
  for example to bring in an improvement that is good for every application. Before a change, copy the
  current version to `profile/old-resumes/`, with its date in the file name.
- `profile/cover-letters/` holds the user's past letters: read them to learn their voice and the
  stories they tell. Write a new cover letter only when the user asks for one, following the
  `cover-letter` skill (`.claude/skills/cover-letter/SKILL.md`).
- When suggesting resume text, keep the user's voice and the resume's conventions (see `docs/markdown.md`).
- `profile/` (except its README), `applications/`, `reference/` and `.env` are personal and git-ignored.
  Never move their contents into tracked files, and never put the user's personal data in `examples/`,
  `docs/`, `README.md` or code.
- Never move, rename or delete the user's source files (LinkedIn, old resumes, cover letters).

## Creating the base resume

When the user asks to create their base resume from their files (or shares an existing resume or
LinkedIn PDF to start from), follow the instructions in `profile/README.md` exactly. It is the same file
`npm run import` uses. Read PDFs and Word files directly; never publish or upload them anywhere.
If the user shares a file in the chat instead, suggest saving it in `profile/` (an older resume in
`profile/old-resumes/`, a cover letter in `profile/cover-letters/`) so later analyses can use it.

If `profile/import-report.md` exists and the user asks to answer the import questions, ask them one by
one, save the answers to `profile/experience.md`, and update `profile/resume-base.md`.

## Applying to a job posting

When the user pastes a job posting (or a link to one):

1. **Save it.** If a folder in `applications/` already has the same link in its `job.md`, say so and use
   that folder. Otherwise create `applications/YYYY-MM-DD-<company>-<role>/job.md` (today's date) in
   the format of `examples/sample-job.md`: front matter `company`, `role`, `link`, `saved`, then the
   **full text** of the posting exactly as given. If a link cannot be opened (LinkedIn often requires
   sign-in), ask the user to paste the text.
2. **Read** `profile/resume-base.md`, `profile/experience.md`, every other file in `profile/` (LinkedIn,
   current resume, `old-resumes/`, `cover-letters/`), in any format.
3. **Analyze the base resume** following `match/criteria.md` exactly: areas, seniority weights, scoring,
   questions, output format and the "Missing in several offers" section. It is the same file
   `npm run match` uses. Save it as `match.md` in the application folder and show the user the
   summary: total score, top 3 strengths, top 3 gaps, and the **questions**.
4. **Ask the questions** and wait for the answers. The user may answer some and skip others.
5. Save every answer to `profile/experience.md`, then add an "Update after answers" section at the end
   of `match.md`: which requirements and keywords the answers cover, and the new estimated total.
6. **If the user wants to apply,** run `npm run new -- <company>` and edit the new `resume.md` with the
   suggested changes and the confirmed answers. Show the user what changed compared with the base.
7. Run `npm run generate -- <company>` (it also runs the ATS checks).
8. **Score the tailored version** following "Scoring a tailored version" in `match/criteria.md`, and add
   it to `match.md` (base score → tailored score, and any line not supported by the user's files).
9. If an answer or a change is good for every application, offer to add it to the base resume.
10. Write a cover letter only if the user asks for one (see the `cover-letter` skill).

If `match.md` came from `npm run match`, its questions are already in the file: ask them in the chat
when the user opens it, or read their answers from `profile/experience.md`.

## Experience notes (`profile/experience.md`)

A personal, git-ignored file with experience the base resume does not show yet: answers to questions,
extra details, tools, numbers. It grows over time and is read before every analysis.

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
| `profile/resume-base.md` | The user's master resume, the starting point of every application. |
| `profile/experience.md` | Experience not in the base resume yet: the user's answers to questions. |
| `profile/knowledge-base.md` | Optional: the user's master record of their career, with unconfirmed claims marked. |
| `profile/` (other files), `profile/old-resumes/` | LinkedIn profile PDF, current and older resumes. |
| `profile/cover-letters/` | Past cover letters (any format): the user's voice and stories. |
| `profile/README.md` | Instructions for creating the base resume (the import). |
| `.claude/skills/cover-letter/SKILL.md` | Instructions for writing a cover letter (the `cover-letter` skill). |
| `applications/<date>-<company>-<role>/` | One job posting: `job.md`, `match.md`, `resume.md`, the PDF, and `cover-letter.md` if asked. |
| `examples/` | Sample resume, job posting, cover letter and experience notes, with made-up data. |
| `match/criteria.md` | How a resume is scored against a posting. |
| `template/` | The designs (HTML + CSS): `resume.*` and `cover-letter.*`. |
| `src/`, `scripts/` | The code behind the commands. |
| `docs/` | Technical documentation: Markdown syntax, design, ATS checks. |

## Commands

| Command | What it does |
|---|---|
| `npm run setup` | First-time install and test. |
| `npm run import` | Base resume from the files in `profile/` (needs `ANTHROPIC_API_KEY` in `.env`). |
| `npm run job` | Saves a job posting: asks company, role and link, then the pasted text. |
| `npm run match [-- <name>]` | Base resume vs. posting; once `resume.md` exists, scores the tailored version (needs `ANTHROPIC_API_KEY`). |
| `npm run new -- <name>` | Copies the base resume into the application folder as `resume.md`. |
| `npm run preview [-- <name>]` | Live preview in the browser. |
| `npm run generate [-- <name>]` | Builds the PDF and runs the ATS checks. |
| `npm run check [-- <name>]` | ATS checks only, with the extracted text. |
| `npm run write-cover-letter [-- <name>]` | Drafts `cover-letter.md` with the `cover-letter` skill and builds its PDF (needs `ANTHROPIC_API_KEY`). |
| `npm run cover-letter [-- <name>]` | Builds `<Name> - Cover Letter - YYYYMMDD.pdf` from `cover-letter.md`. Not part of `generate`. |
| `npm run compare` | Optional: compares the PDF with `reference/original.pdf`. |

`<name>` is part of an application folder name, such as `cartify`. Without it, commands use the base
resume (`match`, `write-cover-letter` and `cover-letter` use the newest application).
After changing a resume, run `npm run generate`. After changing a cover letter, run `npm run cover-letter`.
