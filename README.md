# 📄 Resume Builder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Write your resume in Markdown and get a clean, ATS-friendly PDF. Keep one master resume, and for every
job you apply to, keep the posting, the analysis and the tailored resume together in one folder.

It does five things:

1. **Start from what you have.** Put your LinkedIn profile PDF, resumes and cover letters in one folder
   and get your base resume in this format without retyping it.
2. **Markdown → PDF.** Your content lives in plain `.md` files, separate from the design. One command
   builds the PDF and checks that ATS systems can read it.
3. **One folder per job posting.** The link and full text of the posting, the analysis, your tailored
   resume and its PDF, all in one place, so you have everything at hand before an interview.
4. **Resume vs. job posting.** Get a score from 0 to 100 across the areas that matter in Product,
   weighted by the role's seniority, plus the gaps, the changes to make and questions about experience
   your resume doesn't show yet. Then see how much the tailored version improved the score. You can do
   it in the [Claude Code](https://claude.com/claude-code) chat or from the terminal.
5. **Cover letters in your voice, when you need one.** Claude learns how you write from your past
   letters and writes a new one for a posting, using only facts from your files.

Your resumes, cover letters, postings, analyses and PDFs stay on your computer: they are never uploaded
to GitHub.

> **Optimized for Product roles, open to anyone.** The resume vs. job posting scoring is tuned for
> Product Management (PM to VP/CPO): its areas and seniority weights come from what Product roles ask
> for. Everything else, from the Markdown-to-PDF builder to applications and ATS checks, works for any
> profession. To score other kinds of roles, edit the areas and weights in
> [`match/criteria.md`](match/criteria.md).

## Get started in 3 steps

1. **Get your own copy.** On GitHub, click **Use this template** (or clone the repo), then download it
   to your computer.
2. **Install it.** Open a terminal in the project folder and run:

   ```bash
   npm run setup
   ```

   It installs everything, builds a sample resume and opens the PDF so you can see that it works.
3. **Add the files you already have** to `profile/` (see [Your profile](#your-profile)), then open the
   project in Claude Code and write:

   > Create my base resume from my profile files

   Claude writes `profile/resume-base.md`, builds its PDF, and asks you a few questions to make it
   stronger. Then run `npm run preview` to see it and edit it.

   No resume yet? Copy `examples/sample-resume.md` to `profile/resume-base.md` and replace its content.

## Folder structure

```
resume-builder/
├── profile/                       ← WHO YOU ARE                                   (not uploaded)
│   ├── resume-base.md             ← your base resume: every application starts from it
│   ├── resume-base.pdf            ← its PDF
│   ├── experience.md              ← experience not in your resume yet: your answers
│   ├── <LinkedIn PDF, current resume>
│   ├── old-resumes/               ← older resumes
│   └── cover-letters/             ← past cover letters
├── applications/                  ← ONE FOLDER PER JOB POSTING                     (not uploaded)
│   └── 2026-11-25-cartify-senior-pm/
│       ├── job.md                 ← link and full text of the posting
│       ├── match.md               ← how your resume fits it: score, gaps, questions
│       ├── resume.md              ← your resume for this posting
│       ├── Alex Morgan - Resume.pdf ← ready to upload
│       ├── cover-letter.md        ← optional: your cover letter for this posting
│       └── Alex Morgan - Cover Letter.pdf
├── examples/                      ← sample resume, posting, cover letter and notes, made-up data
├── match/criteria.md              ← how a resume is scored against a posting
├── template/                      ← the designs of the resume and the cover letter (HTML + CSS)
├── docs/                          ← Markdown syntax, design and ATS details
├── src/  scripts/                 ← the code behind the commands
├── CLAUDE.md                      ← rules for Claude (read automatically by Claude Code)
├── .claude/skills/cover-letter/   ← how Claude writes cover letters
└── .env                           ← your Anthropic API key, optional                (not uploaded)
```

The project folder also works as an [Obsidian](https://obsidian.md) vault, so you can edit and read
everything there.

## Your profile

Put your files in `profile/` once and leave them there: they are read again in every analysis, never
changed, and never uploaded.

| What | Where | Formats |
|---|---|---|
| Your **LinkedIn profile** and your **current resume** | `profile/` | PDF, Word (`.docx`, `.doc`), Markdown, text |
| Your **older resumes** | `profile/old-resumes/` | same |
| Your past **cover letters**, one file each | `profile/cover-letters/` | same |
| Optional: a **knowledge base**, your master notes on your career (stories, metrics, what is still unconfirmed) | `profile/knowledge-base.md` | Markdown |

- **LinkedIn profile:** open your profile on LinkedIn and click **More → Save to PDF**.
- **`.doc` files** (old Word format) are converted automatically on macOS. On Windows or Linux, open
  them in Word and save them as `.docx`.

From them you get your **base resume**, `profile/resume-base.md`: the master version you keep up to
date. Every tailored resume is a copy of it, so an improvement you make to the base reaches every
future application. When you change it a lot, keep the old one in `profile/old-resumes/`.

Your files are also read in **every analysis**: your LinkedIn or an older resume often has experience
your base resume leaves out, such as an older role, a tool or a project. The analysis finds it and
suggests bringing it back, and asks you before adding anything. Cover letters show Claude how you write
and the stories you tell, and they are the model when you ask for a new one (see
[Cover letters](#cover-letters)).

## Applying to a job

### In the Claude Code chat (easiest)

Paste the link and the text of the posting:

> I want to apply to this job: *(link and text of the posting)*

Claude saves the posting in a new folder in `applications/`, compares your base resume with it, asks you
the questions, and, if you decide to apply, creates your tailored resume, builds the PDF and scores
the tailored version. LinkedIn links usually need sign-in, so paste the text too.

### From the terminal

```bash
npm run job                  # 1. save the posting: company, role, link, then paste the text
npm run match -- cartify     # 2. compare your base resume with it (needs an API key, see below)
npm run new -- cartify       # 3. copy your base resume into the folder as resume.md
npm run preview -- cartify   # 4. edit resume.md and watch the PDF update
npm run generate -- cartify  # 5. build the PDF, ready to upload
npm run match -- cartify     # 6. optional: score the tailored version
```

`cartify` is any part of the folder name. From the terminal you tailor `resume.md` yourself: the
commands copy and check, they don't rewrite your resume.

### Commands

| Command | What it does |
| --- | --- |
| `npm run setup` | First-time install and test. |
| `npm run import` | Creates your base resume from the files in `profile/` (needs an API key). |
| `npm run job` | Saves a job posting in a new folder in `applications/`. Warns you if you already saved that link. |
| `npm run match -- <name>` | Compares your base resume with the posting and saves `match.md`. Once the folder has a `resume.md`, scores that tailored version too (needs an API key). Without a name: the newest application. |
| `npm run new -- <name>` | Copies your base resume into the application folder as `resume.md`. |
| `npm run preview -- <name>` | Live preview at http://localhost:4321 that updates every time you save. |
| `npm run generate -- <name>` | Builds the PDF in the application folder and checks that ATS systems can read it. |
| `npm run check -- <name>` | Runs only the ATS checks, and shows the text an ATS reads. |
| `npm run write-cover-letter -- <name>` | Drafts a cover letter for the posting and builds its PDF (needs an API key). |
| `npm run cover-letter -- <name>` | Builds the cover letter PDF from `cover-letter.md`, after you edit it. |
| `npm run compare` | Optional: compares the PDF with a reference PDF in `reference/original.pdf`. |

Without a name, `new`, `preview`, `generate` and `check` use your **base resume**
(`npm run generate` builds `profile/resume-base.pdf`), and `match`, `write-cover-letter` and
`cover-letter` use the newest application.

## The analysis

Both the chat and `npm run match` follow the same rules in [`match/criteria.md`](match/criteria.md) and
save the analysis as `match.md` in the application folder. You get:

- A **total score** from 0 to 100, with a verdict.
- A score for each **Product area**: strategy & vision, discovery & research, execution & delivery,
  data & metrics, leadership & stakeholders, technical depth, and domain & industry. The weights
  change with the role's seniority, from PM to VP/CPO.
- Each **requirement** of the posting, marked as covered, partial or missing, with the line of your
  resume that supports it.
- The **ATS keywords** from the posting that your resume is missing, and the ones that were also
  missing in your other recent applications: those point at what your base resume lacks.
- Your top **strengths and gaps**, and the **changes to make** in a tailored version.
- **Questions for you** about experience your resume may not show yet (see below).
- Once you tailor your resume: **base score → tailored score**, and a warning for any line of the
  tailored resume that your files don't support.

The analysis always scores your **base** resume first: it is the honest picture of your profile. It
never invents experience: suggestions only reword, reorder or cut what is already in your files.

### Questions and experience notes

Your resume rarely tells everything you've done. When a gap might be covered by experience you have
but didn't write down, the analysis asks you about it. For example: *"At ShipFast, did you run cohort
analysis of merchant retention?"*

- **In the chat,** Claude asks the questions, you answer, and it updates the score and uses your
  answers in the tailored version.
- **From the terminal,** the questions are printed and saved in `match.md`. Answer them in the chat,
  or write the answers in `profile/experience.md` and run `npm run match` again.

Every answer is saved in `profile/experience.md`, a personal file that grows over time and is read
before every analysis, so you never answer the same question twice. If you don't have some experience,
that is saved too. Nothing is added to your resume unless you said it.
See [`examples/sample-experience.md`](examples/sample-experience.md) for an example.

## Cover letters

Not every application needs one, so cover letters are separate from the resume: `npm run generate`
never builds them.

**In the Claude Code chat:**

> Write the cover letter for cartify

Claude reads the posting, the analysis, your resume for it, your notes, your LinkedIn and your past
cover letters, and shows you a draft with the facts it used and where each one comes from. You edit it
together; when you approve it, it saves `cover-letter.md` in the application folder and builds
`<Name> - Cover Letter.pdf`.

**From the terminal:** `npm run write-cover-letter -- cartify` writes the draft (needs an API key, see
below). Edit `cover-letter.md` and run `npm run cover-letter -- cartify` to rebuild the PDF.

The letter follows your past letters in `profile/cover-letters/`: their structure, greeting, sign-off
and tone. It is written in the posting's language, fits on one page, and never invents anything,
including facts about the company. The rules are in
[`.claude/skills/cover-letter/SKILL.md`](.claude/skills/cover-letter/SKILL.md), and the format of
`cover-letter.md` in [`examples/sample-cover-letter.md`](examples/sample-cover-letter.md). The PDF is a
plain letter: US Letter page, Arial 11pt, 1in margins.

## API key for the terminal commands

`npm run import`, `npm run match` and `npm run write-cover-letter` call Claude through the Anthropic
API, so they need an API key, and each run is billed to your Anthropic account (a few cents). In the
Claude Code chat you don't need one.

1. Create a key at [console.anthropic.com](https://console.anthropic.com/settings/keys).
2. Create a file named `.env` in the project folder with this line:

   ```
   ANTHROPIC_API_KEY=your-key-here
   ```

## Writing the resume

Resumes use plain Markdown with a few conventions, such as `### date | company | location` for a job.
See [`docs/markdown.md`](docs/markdown.md) for the full syntax and
[`examples/sample-resume.md`](examples/sample-resume.md) for a complete example.
To change the look (fonts, spacing, margins), see [`docs/design.md`](docs/design.md).

## Requirements

- [Node.js](https://nodejs.org) 18 or later.
- Optional, recommended: [Claude Code](https://claude.com/claude-code) to create your base resume and
  apply to jobs in the chat (included in Claude Pro and Max plans).
- Optional: an [Anthropic API key](https://console.anthropic.com/settings/keys) for `npm run import`,
  `npm run match` and `npm run write-cover-letter`, the terminal versions.
- Optional: [Obsidian](https://obsidian.md) to read and edit everything as notes.

## Keeping your files safe

`profile/`, `applications/` and `.env` are listed in `.gitignore`, so they are never uploaded, even if
you push your copy to GitHub. That also means GitHub is not a backup for them: keep a copy somewhere
else, such as a synced folder.

## License

Released under the [MIT License](LICENSE): you can use, copy, modify and share this project, including
for commercial use, as long as you keep the copyright and license notice. It comes as is, without
warranty.
