---
name: cover-letter
description: Writes a cover letter for one job application in applications/, in the user's own voice and only with facts from their files. Use when the user asks for a cover letter (or "carta de presentación") for a job posting they saved or paste.
---

# Writing a cover letter

These instructions are the single source of truth for cover letters. Claude follows them in the chat,
and `npm run write-cover-letter` sends them to Claude from the terminal.

## Inputs

Read all of these before writing:

- **The posting:** `job.md` in the application folder (`applications/<date>-<company>-<role>/`). A letter
  needs the full text of the posting. If `job.md` has no text, ask the user to paste it and save it
  there first (see "Applying to a job posting" in `CLAUDE.md`).
- **The analysis,** `match.md` in the same folder, if it exists: its strengths, gaps and the user's answers
  say what to lead with.
- **The resume for this posting:** `resume.md` in the same folder, or `profile/resume-base.md` if there is
  none yet.
- **Everything the user has told before:** `profile/experience.md`, and `profile/knowledge-base.md` if
  it exists (the user's master record: its story bank is a good place to pick from).
- **The user's past cover letters,** `profile/cover-letters/` (any format): the model for voice,
  structure, length, greeting and sign-off.
- **Sources:** the LinkedIn profile and other files in `profile/` and `profile/old-resumes/`.

## Rules

- **Never invent.** Every achievement, number, title, date, tool and story must come from the files
  above or from the user in the chat. Keep numbers exactly as written. If the letter would need
  something that is not there, ask instead of writing it.
- **Say exactly what the user did.** Distinguish leading from building it yourself, a prototype or
  testnet from production, evaluating a provider from integrating it, and a plan from a launch. Use a
  metric only if its definition, period and attribution are clear; otherwise word it conservatively
  or ask. If `profile/knowledge-base.md` marks something as unconfirmed, ask before using it, and never
  use what it marks as private (compensation, job-search status, contacts, internal metrics).
- **Nothing made up about the company either.** What the user finds attractive about the company must
  come from the posting or from the user. Do not add facts about the company (funding, size, mission,
  products) that are not in the posting.
- **Write like the user.** Their past letters are the model: copy their structure, greeting, sign-off,
  sentence length and recurring phrases. Do not add phrases they never use. Avoid clichés such as
  "I am writing to express my interest", "passionate", "dynamic", "fast-paced environment",
  "I believe I would be a great fit".
- **Language:** the language of the posting, unless the user asks otherwise. Use the greeting and
  sign-off the user's past letters use in that language.
- **Length:** one page, 250–400 words, 4–6 paragraphs. Shorter is better than padded.
- **Specific to this posting.** Pick the 2–3 experiences that best match the posting's most important
  requirements, and say why each one matters for this role. A letter that would work for any company
  is not done.
- **No repeating the resume.** Tell the story behind a result (the problem, what the user did, what
  changed), with at most one or two numbers per paragraph.
- New facts the user gives while editing the letter go to `profile/experience.md` too, so the next
  letter and analysis can use them.

## Structure

Follow the user's past letters. If there are none, use this:

1. **Greeting:** "Dear <hiring manager's name>," if the posting names one, otherwise
   "Dear <Company> Team,".
2. **Opening (2–3 lines):** the role, and the one reason it fits the user's experience.
3. **Main experience (1–2 paragraphs):** the most relevant role, with a concrete result.
4. **Supporting experience (1 paragraph):** an earlier role or project that covers another key
   requirement.
5. **How the user works (1–2 lines),** only if the user's letters or notes describe it.
6. **Why this company (2–3 lines),** based on the posting.
7. **Sign-off** and the name, with the contact lines the user's past letters include.

## The file

Save the letter as `cover-letter.md` in the application folder. If one already exists, ask before
replacing it. Format:

```markdown
---
company: Cartify
role: Senior Product Manager, Payments
lang: en
---

Dear Cartify Team,

I'm excited about the Senior Product Manager, Payments opportunity because…

…

Best regards,
Alex Morgan
```

- Blank lines separate paragraphs. A line break inside a paragraph is kept, which is how the sign-off
  stays on separate lines.
- `**bold**` and `[text](https://url)` work as in the resume. Use bold only if the user's letters do.
- An optional first line such as `**Application – Senior Product Manager | Cartify**` prints as a title.

## Steps in the chat

1. Find the application folder (or create it from the posting the user pastes, as in `CLAUDE.md`).
2. Read the inputs.
3. Write the draft and show it in the chat, followed by the list of facts used and the file each one
   comes from. Point out anything you need the user to confirm.
4. Apply the user's changes. Save new facts to `profile/experience.md`.
5. When the user approves it, save `cover-letter.md` and run `npm run cover-letter -- <name>` to build
   `<Name> - Cover Letter.pdf` in the same folder.

## Reply format for `npm run write-cover-letter`

From the terminal, reply with exactly these tagged blocks and nothing else. The script writes the file.

```
<letter>
The full cover-letter.md, starting with the front matter.
</letter>
<facts>
A bulleted list: each fact the letter uses, and the file it comes from.
</facts>
<check>
Anything the user should confirm or complete before sending. "Nothing." if there is none.
</check>
```
