# 📄 Resume Builder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Write your resume in Markdown and get a clean, ATS-friendly PDF. For every job you apply to, Claude
compares your resume with the posting, asks about experience your resume doesn't show, tailors a
version and, if you want, writes the cover letter in your voice. Each application keeps the posting,
the analysis, the resume and the letter together in one folder.

Your resumes, postings, analyses and PDFs stay on your computer: they are never uploaded to GitHub.

> **Optimized for Product roles, open to anyone.** The scoring is tuned for Product Management
> (PM to VP/CPO). Everything else works for any profession.

## Get started in 3 steps

1. **Get your own copy.** On GitHub, click **Use this template** (or clone the repo), then download it.
2. **Install it.** Open a terminal in the project folder and run:

   ```bash
   npm run setup
   ```

3. **Add your files to `profile/`**: your LinkedIn profile PDF (on LinkedIn: **More → Save to PDF**)
   and your current resume, older resumes in `profile/old-resumes/`, past cover letters in
   `profile/cover-letters/`. Then open the project in [Claude Code](https://claude.com/claude-code)
   and write:

   > Create my base resume from my profile files

   Claude writes `profile/resume-base.md`, your master resume, and builds its PDF.

## Apply to a job

Paste the posting in the Claude Code chat:

> I want to apply to this job: *(link and text of the posting)*

Claude saves the posting, scores your base resume against it, asks you a few questions, and creates
your tailored resume and its PDF. Ask for a cover letter if the application needs one. Nothing is
invented: everything comes from your files or your answers, and your answers are saved for next time.

Prefer the terminal? See [`docs/terminal.md`](docs/terminal.md).

## Folder structure

```
resume-builder/
├── profile/                  ← who you are: base resume, notes, LinkedIn, old resumes, cover letters
├── applications/             ← one folder per job posting
│   └── 2026-11-25-cartify-senior-pm/
│       ├── job.md            ← the posting
│       ├── match.md          ← the analysis: score, gaps, questions
│       ├── resume.md         ← your resume for this posting
│       ├── Alex Morgan - Resume - 20261125.pdf
│       └── Alex Morgan - Cover Letter - 20261125.pdf   (optional)
├── examples/                 ← samples with made-up data
├── match/criteria.md         ← how a resume is scored
├── template/                 ← the design (HTML + CSS)
└── docs/                     ← the details
```

`profile/` and `applications/` are git-ignored, so they never leave your computer. GitHub is not a
backup for them: keep a copy somewhere else.

## Learn more

| Topic | Where |
|---|---|
| What the analysis gives you, and how questions and notes work | [`docs/analysis.md`](docs/analysis.md) |
| Cover letters | [`docs/cover-letters.md`](docs/cover-letters.md) |
| Terminal commands and the optional API key | [`docs/terminal.md`](docs/terminal.md) |
| What goes in `profile/` | [`profile/README.md`](profile/README.md) |
| Writing the resume in Markdown | [`docs/markdown.md`](docs/markdown.md) |
| Changing the design, and ATS details | [`docs/design.md`](docs/design.md) |

## Requirements

- [Node.js](https://nodejs.org) 18 or later.
- [Claude Code](https://claude.com/claude-code), recommended (included in Claude Pro and Max plans).

## License

[MIT](LICENSE): use, copy, modify and share it, keeping the copyright and license notice.
