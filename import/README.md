# Import: start from the resume you already have

Drop your existing material in this folder, then ask Claude Code
*"Create my resume from the files in import/"*, or run `npm run import`.

| What | How to get it |
|---|---|
| Your current resume | PDF, Word (`.docx`), Markdown or plain text. |
| Your LinkedIn profile | On your LinkedIn profile, click **More → Save to PDF**. |
| Past cover letters (optional) | PDF, Word, Markdown or plain text. They are moved to `cover-letters/`. |

Everything in this folder stays on your computer: it is git-ignored, except this README.

---

## Instructions for Claude

This section is the single source of truth for importing. Claude follows it when asked in the chat,
and `npm run import` sends it to Claude from the terminal.

### Inputs

- Every file in `import/` except this README: resumes, LinkedIn profile exports, cover letters, or
  anything else the user dropped. Work out what each file is from its content, not its name.
- `docs/markdown.md`: the resume format to write.
- `examples/sample-resume.md`: a complete example of that format.
- `notes/experience.md`, if it exists: what is already known about the user.

### Rules

- **Never invent.** Every fact in the new resume must come from the files or from the user. Do not add
  metrics, results, skills or dates that are not there. Do not "improve" a bullet by adding numbers.
- **The resume is the base.** It usually has the achievements with numbers. The LinkedIn export fills
  what the resume lacks: missing roles, dates, education, certifications, languages, skills.
- **Conflicts are questions.** When sources disagree (dates, titles, company names), use the resume's
  version and ask about it. Never pick silently.
- **Nothing is lost.** Facts that do not fit in a one- or two-page resume (old roles in detail, extra
  achievements, tools, awards, volunteering, recommendations) go to `notes/experience.md`, so later
  tailored versions can use them.
- **Keep the user's words.** Fix grammar and format, but keep their phrasing, terms and numbers.
  Write in the language of the source resume unless the user asks otherwise.
- **Keep their contact details** exactly as written in the resume (or LinkedIn if the resume has none).

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
   (`## Company — Role`), each with `(YYYY-MM-DD, import: <source file>)`.
3. **Cover letters:** save each cover letter as Markdown in `cover-letters/`, named
   `YYYY-<company>-<role>.md` when those are known (otherwise after the source file), with the text
   unchanged.
4. **Questions:** 3 to 10 questions that would make the resume stronger, highest impact first:
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
<cover_letter name="YYYY-company-role.md">
The cover letter text. Repeat this block for each cover letter; omit it if there are none.
</cover_letter>
<questions>
A numbered list of questions.
</questions>
```
