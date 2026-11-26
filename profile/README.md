# Profile: who you are

This folder holds everything about you that every application starts from:

| What | Where | Formats |
|---|---|---|
| **Your base resume**, the master version every application copies | `resume-base.md` (created for you) | Markdown |
| **Experience notes**, your answers to questions | `experience.md` (created for you) | Markdown |
| **Your LinkedIn profile** (on LinkedIn: your profile → **More → Save to PDF**) and your **current resume** | here, in `profile/` | PDF, Word (`.docx`, `.doc`), Markdown, text |
| **Older resumes** | `old-resumes/` | PDF, Word, Markdown, text |
| **Past cover letters**, one file each | `cover-letters/` | PDF, Word, Markdown, text |

Everything in this folder stays on your computer: it is git-ignored, except this README.

**What these files are used for:**

- **Your base resume.** Ask Claude Code *"Create my base resume from my profile files"*, or run
  `npm run import`.
- **Every job-posting analysis.** Your LinkedIn profile or an older resume often has experience your
  base resume leaves out: an old role, a tool, a project. The analysis finds it and suggests it, and
  always asks you before adding anything.

`.doc` files (old Word format) are converted automatically on macOS. On Windows or Linux, open them in
Word and save them as `.docx`.

---

## Instructions for Claude: creating the base resume

This section is the single source of truth for importing. Claude follows it when asked in the chat,
and `npm run import` sends it to Claude from the terminal.

### Inputs

- Every file in `profile/` and `profile/old-resumes/` except this README, `resume-base.*`,
  `experience.md` and `import-report.md`: resumes and LinkedIn profile exports. Work out what each file
  is from its content, not its name. If one is a cover letter, do not use it as a resume: say so and
  suggest moving it to `profile/cover-letters/`.
- Every file in `profile/cover-letters/` (if any): reference for the person's voice and stories.
- `docs/markdown.md`: the resume format to write.
- `examples/sample-resume.md`: a complete example of that format.
- `profile/experience.md`, if it exists: what is already known about the person.

### Rules

- **Never invent.** Every fact in the new resume must come from the files or from the user. Do not add
  metrics, results, skills or dates that are not there. Do not "improve" a bullet by adding numbers.
- **The most recent resume is the base.** It usually has the achievements with numbers. Older resumes
  add detail on older roles. The LinkedIn export fills what the resumes lack: missing roles, dates,
  education, certifications, languages, skills.
- **Conflicts are questions.** When sources disagree (dates, titles, company names), use the most
  recent resume's version and ask about it. Never pick silently.
- **Nothing is lost.** Facts that do not fit in a one- or two-page resume (old roles in detail, extra
  achievements, tools, awards, volunteering, recommendations, stories from cover letters) go to
  `profile/experience.md`, so later tailored versions can use them.
- **Keep the user's words.** Fix grammar and format, but keep their phrasing, terms and numbers.
  Write in the language of the most recent resume unless the user asks otherwise.
- **Keep their contact details** exactly as written in the most recent resume (or LinkedIn if no resume
  has them).
- **Do not move, rename or delete** the files in `profile/`.

### What to write

1. **The resume:** `profile/resume-base.md`. If it already exists, first move it to
   `profile/old-resumes/`, with its date in the file name (ask the user). Follow `docs/markdown.md` exactly:
   - `# NAME`, then the contact line (and a headline line if the source has one).
   - Sections in this order when there is content for them: `SUMMARY`, `EXPERIENCE`,
     `EARLIER EXPERIENCE` (for roles that are older or less relevant, one bullet each),
     `EDUCATION`, `PROFESSIONAL CERTIFICATIONS`, `SELECTED PROJECTS`, `SKILLS & LANGUAGES`.
   - Each job as `### YYYY–YYYY | COMPANY — SHORT DESCRIPTION | Location`, the title as
     `***Title***`, an optional one-line scope paragraph, then bullets.
   - Bullets start with a past-tense verb and keep the source's numbers.
   - Aim for two pages at most. Move detail to the notes instead of cutting facts.
   - Leave `footer:` empty in the front matter.
2. **Experience notes:** add to `profile/experience.md` (create it from `examples/sample-experience.md`
   if it does not exist) every useful fact that did not go into the resume, grouped by job
   (`## Company — Role`), each with `(YYYY-MM-DD, source: <file name>)`. Skip facts already there.
3. **Questions:** 3 to 10 questions that would make the resume stronger, highest impact first:
   conflicts between sources, bullets without a result ("What changed after you launched X? Any
   number?"), gaps in dates, missing locations or titles. Each must be specific and easy to answer.

Then show the user a short summary: which file was used for what, what went into the resume, what went
into the notes, and the questions. In the chat, ask the questions and wait for answers; save each answer
to `profile/experience.md` and, if it changes the resume, update `profile/resume-base.md`. Finally run
`npm run generate` (it also runs the ATS checks).

### Reply format for `npm run import`

When run from the terminal, reply with exactly these tagged blocks and nothing else. The script writes
the files.

```
<summary>
Which file was used for what, in 3–6 short lines.
</summary>
<resume>
The full resume Markdown, starting with the front matter.
</resume>
<notes>
Markdown to append to profile/experience.md: "## Company — Role" headings with bullets. Empty if none.
</notes>
<questions>
A numbered list of questions.
</questions>
```
