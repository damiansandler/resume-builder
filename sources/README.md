# Sources: the resumes and profile you already have

Put here the material your resume comes from, and leave it here:

| What | Formats | How to get it |
|---|---|---|
| Your LinkedIn profile | PDF | On your LinkedIn profile, click **More → Save to PDF**. |
| Your current and older resumes | PDF, Word (`.docx`, `.doc`), Markdown, text | Any version you have, as many as you like. |

Cover letters go in their own folder, `cover-letters/`, not here.

Everything in this folder stays on your computer: it is git-ignored, except this README.

**What these files are used for:**

- **Your first resume.** Ask Claude Code *"Create my resume from my sources"*, or run `npm run import`.
- **Every job-offer analysis.** Your LinkedIn profile or an older resume often has experience your
  current resume leaves out: an old role, a tool, a project. The analysis finds it and suggests it,
  and always asks you before adding anything.

`.doc` files (old Word format) are converted automatically on macOS. On Windows or Linux, open them in
Word and save them as `.docx`.

---

## Instructions for Claude: creating a resume from sources

This section is the single source of truth for importing. Claude follows it when asked in the chat,
and `npm run import` sends it to Claude from the terminal.

### Inputs

- Every file in `sources/` except this README: resumes and LinkedIn profile exports. Work out what each
  file is from its content, not its name. If one is a cover letter, do not use it as a resume: say so
  and suggest moving it to `cover-letters/`.
- Every file in `cover-letters/` (if any): reference for the person's voice and stories.
- `docs/markdown.md`: the resume format to write.
- `examples/sample-resume.md`: a complete example of that format.
- `notes/experience.md`, if it exists: what is already known about the person.

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
  `notes/experience.md`, so later tailored versions can use them.
- **Keep the user's words.** Fix grammar and format, but keep their phrasing, terms and numbers.
  Write in the language of the most recent resume unless the user asks otherwise.
- **Keep their contact details** exactly as written in the most recent resume (or LinkedIn if no resume
  has them).
- **Do not move, rename or delete** files in `sources/` or `cover-letters/`.

### What to write

1. **The resume:** a new file in `resumes/`, named `YYYY-MM-DD-<label>.md` (today's date; the label is
   `imported` unless the user gives one). Follow `docs/markdown.md` exactly:
   - `# NAME`, then the contact line (and a headline line if the source has one).
   - Sections in this order when there is content for them: `SUMMARY`, `EXPERIENCE`,
     `EARLIER EXPERIENCE` (for roles that are older or less relevant, one bullet each),
     `EDUCATION`, `PROFESSIONAL CERTIFICATIONS`, `SELECTED PROJECTS`, `SKILLS & LANGUAGES`.
   - Each job as `### YYYY–YYYY | COMPANY — SHORT DESCRIPTION | Location`, the title as
     `***Title***`, an optional one-line scope paragraph, then bullets.
   - Bullets start with a past-tense verb and keep the source's numbers.
   - Aim for two pages at most. Move detail to the notes instead of cutting facts.
   - Leave `footer:` empty in the front matter.
2. **Experience notes:** add to `notes/experience.md` (create it from `examples/sample-experience.md`
   if it does not exist) every useful fact that did not go into the resume, grouped by job
   (`## Company — Role`), each with `(YYYY-MM-DD, source: <file name>)`. Skip facts already there.
3. **Questions:** 3 to 10 questions that would make the resume stronger, highest impact first:
   conflicts between sources, bullets without a result ("What changed after you launched X? Any
   number?"), gaps in dates, missing locations or titles. Each must be specific and easy to answer.

Then show the user a short summary: which file was used for what, what went into the resume, what went
into the notes, and the questions. In the chat, ask the questions and wait for answers; save each answer
to `notes/experience.md` and, if it changes the resume, update the imported version. Finally run
`npm run generate` and `npm run check`.

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
Markdown to append to notes/experience.md: "## Company — Role" headings with bullets. Empty if none.
</notes>
<questions>
A numbered list of questions.
</questions>
```
