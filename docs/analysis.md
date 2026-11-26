# Resume vs. job posting: the analysis

The Claude Code chat and `npm run match` follow the same rules, in
[`match/criteria.md`](../match/criteria.md). Both save the analysis as `match.md` in the application
folder.

## What you get

- A **total score** from 0 to 100, with a verdict.
- A score for each **Product area**: strategy & vision, discovery & research, execution & delivery,
  data & metrics, leadership & stakeholders, technical depth, and domain & industry. The weights
  change with the role's seniority, from PM to VP/CPO.
- Each **requirement** of the posting, marked as covered, partial or missing, with the line of your
  resume that supports it.
- The **ATS keywords** from the posting that your resume is missing. Keywords that were also missing in
  your other recent applications are listed apart: they point at what your base resume lacks.
- Your top **strengths and gaps**, and the **changes to make** in a tailored version.
- **Questions for you** about experience your resume may not show yet (see below).
- Once you tailor your resume: **base score → tailored score**, plus a warning for any line of the
  tailored resume that your files don't support.

The analysis always scores your **base** resume first, because that is the honest picture of your
profile. It never invents experience: suggestions only reword, reorder or cut what is already in your
files.

The scoring is tuned for Product Management (PM to VP/CPO). To score other kinds of roles, edit the
areas and weights in `match/criteria.md`.

## Your files

Everything in `profile/` is read in every analysis: your LinkedIn profile, current and older resumes,
cover letters, experience notes and, if you have one, a knowledge base (`profile/knowledge-base.md`).
Your LinkedIn or an older resume often has experience your base resume leaves out, such as an older
role, a tool or a project. The analysis finds it and suggests bringing it back, and asks you before
adding anything. See [`profile/README.md`](../profile/README.md) for what goes where.

## Questions and experience notes

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
See [`examples/sample-experience.md`](../examples/sample-experience.md) for an example.
