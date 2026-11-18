# 📄 Resume Builder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Write your resume in Markdown and get a clean, ATS-friendly PDF. Keep one version per job you apply
to, and score any version against a job offer to see what fits, what's missing and what to change.

It does four things:

1. **Start from what you have.** Put your resumes and LinkedIn profile PDF in one folder and your cover
   letters in another, and get your resume in this format without retyping it.
2. **Markdown → PDF.** Your content lives in plain `.md` files, separate from the design. One command
   builds the PDF.
3. **One version per application.** Each version is a dated file, so you can tailor your resume for a
   company without losing the previous ones.
4. **Resume vs. job offer.** Paste an offer and get a score from 0 to 100 across the areas that matter
   in Product, weighted by the role's seniority, plus the gaps and the changes to make. You can ask for
   it in the [Claude Code](https://claude.com/claude-code) chat or run it from the terminal.

Your resumes, cover letters, analyses and PDFs stay on your computer: they are never uploaded to GitHub.

> **Optimized for Product roles, open to anyone.** The resume vs. job offer scoring is tuned for
> Product Management (PM to VP/CPO): its areas and seniority weights come from what Product roles ask
> for. Everything else, from the Markdown-to-PDF builder to versions and ATS checks, works for any
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
3. **Add the files you already have** (see [Where to put your files](#where-to-put-your-files)):

   - **`sources/`:** your current resume, older resumes and your LinkedIn profile PDF.
   - **`cover-letters/`:** your past cover letters.

   Then open the project in Claude Code and write:

   > Create my resume from my sources

   Claude writes `resumes/<today>-imported.md`, builds the PDF in `output/`, and asks you a few
   questions to make it stronger. Then open `npm run preview` to see it and edit it.

   No resume yet? Start from the sample with `npm run new -- my-resume` and replace its content.

## Where to put your files

You only need two folders. Put your files there and leave them there: they are read again in every
analysis, never changed, and never uploaded.

| Folder | What goes in it | Formats |
|---|---|---|
| **`sources/`** | Your **LinkedIn profile** and your **resumes**: the current one and any older ones. | PDF, Word (`.docx`, `.doc`), Markdown, text |
| **`cover-letters/`** | Your past **cover letters**, one file each. | PDF, Word (`.docx`, `.doc`), Markdown, text |

- **LinkedIn profile:** open your profile on LinkedIn and click **More → Save to PDF**.
- **`.doc` files** (old Word format) are converted automatically on macOS. On Windows or Linux, open
  them in Word and save them as `.docx`.

What they are used for:

- **To create your resume** in this project's format (see below).
- **In every job-offer analysis:** your LinkedIn or an older resume often has experience your current
  resume leaves out, such as an older role, a tool or a project. The analysis finds it and suggests
  bringing it back, and asks you before adding anything.
- **Cover letters** show Claude how you write and the stories you tell. They are used as reference
  only: Claude does not write new cover letters unless you ask.

## Folder structure

```
resume-builder/
├── README.md                ← this file
├── CLAUDE.md                ← rules for Claude (read automatically by Claude Code)
├── sources/                 ← YOUR LinkedIn PDF and existing resumes, any format (not uploaded)
├── cover-letters/           ← YOUR past cover letters, any format               (not uploaded)
├── resumes/                 ← your resumes in this project, one .md per version (not uploaded)
├── notes/experience.md      ← experience not in your resume yet: your answers  (not uploaded)
├── matches/                 ← resume vs. job offer analyses                     (not uploaded)
├── output/                  ← generated PDFs                                    (not uploaded)
├── examples/                ← sample resume and cover letter, with made-up data
├── match/criteria.md        ← how a resume is scored against an offer
├── template/                ← the design (HTML + CSS)
├── docs/                    ← Markdown syntax, design and ATS details
├── src/  scripts/           ← the code behind the commands
└── .env                     ← your Anthropic API key, optional                  (not uploaded)
```

You only work in `sources/`, `cover-letters/`, `resumes/` and `notes/`, and read `output/` and `matches/`. The project
folder also works as an [Obsidian](https://obsidian.md) vault, so you can edit and read everything there.

## How to use it

### Commands

| Command | What it does |
| --- | --- |
| `npm run setup` | First-time install and test. |
| `npm run import` | Creates a resume from the files in `sources/` (needs an API key, see below). |
| `npm run new -- company-x` | Creates a new version, copying the newest one: `resumes/<today>-company-x.md`. |
| `npm run preview` | Opens a live preview at http://localhost:4321 that updates every time you save. |
| `npm run generate` | Builds the PDF into `output/`, named like the Markdown file. |
| `npm run check` | Checks that ATS systems can read the PDF (text, order, links, fonts). |
| `npm run match` | Compares your newest resume with a job offer you paste (needs an API key, see below). |
| `npm run compare` | Optional: compares the PDF with a reference PDF in `reference/original.pdf`. |

Every command uses the **newest** version unless you name another one, or just part of its name:

```bash
npm run generate -- 2026-04-23
```

### Create your resume from your sources

With your files in `sources/` and `cover-letters/`, ask Claude Code *"Create my resume from my
sources"*, or run `npm run import` (add a name with `npm run import -- my-resume`). You get:

- **A resume** in `resumes/`, using your most recent resume as the base, older resumes for detail on
  older roles, and LinkedIn to fill what is missing: roles, dates, education, certifications, skills.
- **Nothing lost:** details that do not fit in two pages go to `notes/experience.md`, ready for future
  tailored versions.
- **Questions** about conflicts between sources, bullets without results and gaps in dates. Answer them
  in the chat to make the resume stronger.

Nothing is invented: every line comes from your files or your answers. Your files are only read,
never changed. The rules are in [`sources/README.md`](sources/README.md).

### A typical application

1. Find an offer and compare it with your resume (see below).
2. Answer the questions the analysis asks you.
3. `npm run new -- company-x` to create a version for that company (or ask Claude to do it).
4. Edit it with the suggestions from the analysis, watching `npm run preview`.
5. `npm run generate`, and send the PDF from `output/`.

### Compare your resume with a job offer

**In the Claude Code chat (no setup needed).** Open the project folder in Claude Code and write:

> Compare my latest resume with this job: *(paste the offer)*

**From the terminal.** Run `npm run match`, paste the offer, then press Enter and Ctrl+D. Or save the
offer in a text file and run `npm run match -- offer.txt`. This calls Claude through the Anthropic API,
so it needs an API key, and each analysis is billed to your Anthropic account (a few cents):

1. Create a key at [console.anthropic.com](https://console.anthropic.com/settings/keys).
2. Create a file named `.env` in the project folder with this line:

   ```
   ANTHROPIC_API_KEY=your-key-here
   ```

Both ways follow the same rules in [`match/criteria.md`](match/criteria.md) and save the analysis to
`matches/`. You get:

- A **total score** from 0 to 100, with a verdict.
- A score for each **Product area**: strategy & vision, discovery & research, execution & delivery,
  data & metrics, leadership & stakeholders, technical depth, and domain & industry. The weights
  change with the role's seniority, from PM to VP/CPO.
- Each **requirement** of the offer, marked as covered, partial or missing, with the line of your
  resume that supports it.
- The **ATS keywords** from the offer that your resume is missing.
- Your top **strengths and gaps**, and the **changes to make** in a tailored version.
- **Questions for you** about experience your resume may not show yet (see below).

The analysis never invents experience: suggestions only reword, reorder or cut what is already in your
resume. To change how resumes are scored, edit `match/criteria.md`.

### Questions and experience notes

Your resume rarely tells everything you've done. When a gap might be covered by experience you have
but didn't write down, the analysis asks you about it. For example: *"At ShipFast, did you run cohort
analysis of merchant retention?"*

- **In the chat,** Claude asks the questions, you answer, and it updates the score and uses your
  answers in the tailored version.
- **From the terminal,** the questions are printed and saved in the analysis. Answer them in the chat,
  or write the answers in `notes/experience.md` and run `npm run match` again.

Every answer is saved in `notes/experience.md`, a personal file that grows over time and is read
before every analysis, so you never answer the same question twice. If you don't have some experience,
that is saved too. Nothing is added to your resume unless you said it.
See [`examples/sample-experience.md`](examples/sample-experience.md) for an example.

### Cover letters

Put your past cover letters in `cover-letters/`, one file each, in any format. Claude reads them as a
reference for your voice and for stories worth using in an application. They are not used for the score.

### Writing the resume

Resumes use plain Markdown with a few conventions, such as `### date | company | location` for a job.
See [`docs/markdown.md`](docs/markdown.md) for the full syntax and
[`examples/sample-resume.md`](examples/sample-resume.md) for a complete example.
To change the look (fonts, spacing, margins), see [`docs/design.md`](docs/design.md).

## Requirements

- [Node.js](https://nodejs.org) 18 or later.
- Optional, recommended: [Claude Code](https://claude.com/claude-code) to import your resume and compare
  it with offers in the chat (included in Claude Pro and Max plans).
- Optional: an [Anthropic API key](https://console.anthropic.com/settings/keys) for `npm run import` and
  `npm run match`, the terminal versions.
- Optional: [Obsidian](https://obsidian.md) to read and edit everything as notes.

## Keeping your files safe

`sources/`, `cover-letters/`, `resumes/`, `notes/`, `matches/`, `output/` and `.env` are listed in `.gitignore`, so they are
never uploaded, even if you push your copy to GitHub. That also means GitHub is not a backup for them:
keep a copy somewhere else, such as a synced folder.

## License

Released under the [MIT License](LICENSE): you can use, copy, modify and share this project, including
for commercial use, as long as you keep the copyright and license notice. It comes as is, without
warranty.
