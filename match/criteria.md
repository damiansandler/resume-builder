# Resume vs. job offer: scoring criteria

This file is the single source of truth for comparing a resume with a job offer. Claude follows it
when you ask in the chat, and `npm run match` sends it to Claude from the terminal. Edit it to change
how resumes are scored: both ways pick up the change.

## Inputs

- **Resume:** one Markdown file from `resumes/`.
- **Job offer:** the full text of the posting.
- **Cover letters (optional):** past letters from `cover-letters/`, used only to find stories and the
  candidate's voice.
- **Sources (optional):** files from `sources/`: the candidate's LinkedIn profile export and older
  resumes. They often hold experience the current resume leaves out (older roles, tools, projects).
- **Experience notes (optional):** `notes/experience.md`, the candidate's answers to earlier questions
  about experience that is not in the resume.

Sources, cover letters and experience notes do not add points: only the resume counts for the score, because it
is what the recruiter reads. Use them to find experience that can be **added to the resume truthfully**
and to avoid asking the same question twice.

## Rules

- Score only on evidence written in the resume. Do not assume skills that are not there.
- Quote the resume line that supports each claim.
- Never suggest adding achievements, numbers or experience that are not in the resume, the sources,
  the cover letters or the experience notes. Suggestions may reword, reorder, emphasize or cut, never invent.
- When a gap might be covered by experience the resume does not show, **ask** instead of assuming
  (see Step 6).
- Be direct. A low score with clear reasons is more useful than a polite one.

## Step 1. Read the offer

Extract:

- **Company, role title and seniority level.** Map the level to one of the columns below using the
  title, years of experience asked, scope (feature, product, product line, whole company) and whether
  the role manages PMs. If the title and the scope disagree, trust the scope and say so.
- **Must-have requirements** (what the offer says is required) and **nice-to-haves**.
- **Knockouts:** hard conditions such as location, work authorization, language, minimum years,
  specific degree. These are listed apart from the score.
- **Keywords:** the 10–20 most important terms (skills, tools, domains, methods) as written in the offer.

## Step 2. Score the Product areas (0–10 each)

| Area | What counts as evidence |
|---|---|
| **Strategy & vision** | Defined vision, strategy or roadmap; chose markets or bets; tied product to business goals. |
| **Discovery & research** | User research, problem framing, validation, experiments before building. |
| **Execution & delivery** | Shipped products and features, launches, managed scope and trade-offs with engineering. |
| **Data & metrics** | Defined metrics, used data for decisions, results expressed in numbers. |
| **Leadership & stakeholders** | Led or hired people, influenced executives, aligned teams, managed partners or customers. |
| **Technical depth** | APIs, architecture, integrations, technical background, working closely with engineers. |
| **Domain & industry** | Experience in the offer's industry, customer type (B2B, B2C, SMB, enterprise) and problem space. |

Score each area against **what this role at this seniority needs**, not in absolute terms:

- **9–10:** strong, recent evidence at or above the level asked, with measurable results.
- **7–8:** clear evidence, slightly less scope, less recent, or fewer results.
- **4–6:** some evidence, but at a lower level or only indirect.
- **1–3:** barely mentioned.
- **0:** no evidence.

### Weights by seniority (each column adds up to 100)

| Area | APM / PM | Senior PM | Lead / Group PM | Head / Director | VP / CPO |
|---|---|---|---|---|---|
| Strategy & vision | 10 | 15 | 20 | 25 | 30 |
| Discovery & research | 20 | 15 | 15 | 10 | 5 |
| Execution & delivery | 25 | 20 | 15 | 10 | 5 |
| Data & metrics | 20 | 20 | 15 | 15 | 10 |
| Leadership & stakeholders | 5 | 10 | 20 | 25 | 30 |
| Technical depth | 10 | 10 | 5 | 5 | 5 |
| Domain & industry | 10 | 10 | 10 | 10 | 15 |

If the offer clearly stresses an area (for example a "Technical PM" role, or a role that is mostly
about a specific industry), you may move up to 10 points between areas. The column must still add up
to 100. Say what you changed and why.

**Product areas score (0–100)** = sum of (area score × weight) ÷ 10.

## Step 3. Score the offer's own requirements (0–100)

Mark each requirement as ✅ covered (1), 🟡 partial (0.5) or ❌ missing (0). Must-haves count double.

**Requirements score** = points earned ÷ points possible × 100.

## Step 4. Check the ATS keywords (0–100)

For each keyword, check whether the resume contains it **as written** or as an obvious variant
("PM" for "Product Manager"). ATS systems match words literally, so a synonym the recruiter would
understand still counts as missing here.

**Keywords score** = keywords present ÷ keywords checked × 100.

## Step 5. Total

**Total (0–100)** = 50% Product areas + 35% Requirements + 15% Keywords, rounded.

| Total | Verdict |
|---|---|
| 80–100 | Strong fit: apply. |
| 65–79 | Good fit: apply with a tailored version. |
| 50–64 | Partial fit: apply only if the gaps can be covered with real experience. |
| 0–49 | Weak fit. |

Knockouts are not part of the score. If one is not met, write it at the top, next to the verdict.

## Step 6. Questions for the candidate

Write 3 to 7 questions that could raise the score with **real** experience. Ask only about gaps and
partial requirements where the resume or the sources hint the candidate may have more to tell (a
related job, tool or project; experience that appears in LinkedIn or an older resume but not in the
current resume), plus any knockout that needs confirming (such as relocation). Skip gaps that are clearly
true gaps, and anything already answered in the experience notes.

Each question must:

- Name the requirement or keyword it is about, and the resume line that makes it worth asking.
- Be specific and easy to answer: "At ShipFast, did you run cohort analysis of merchant retention?
  Which tool did you use, and what changed as a result?", not "Tell me about your experience".
- Ask for a number or result when it would make a stronger bullet.

Order them by impact on the score, highest first.

## Output format

Write the analysis in Markdown, in English, with exactly this structure:

```markdown
# <Role> · <Company>

**Date:** YYYY-MM-DD · **Resume:** <file name> · **Seniority:** <column used>

## Total: NN/100 · <verdict>

| Part | Score | Weight |
|---|---|---|
| Product areas | NN | 50% |
| Offer requirements | NN | 35% |
| ATS keywords | NN | 15% |

**Knockouts:** none / <list with ✅ or ❌>

## Product areas

| Area | Weight | Score | Evidence in the resume |
|---|---|---|---|
| Strategy & vision | NN | N/10 | "short quote" |
| ... | | | |

(One line on any change to the weights, if made.)

## Offer requirements

| Requirement | Type | Status | Evidence or gap |
|---|---|---|---|
| ... | Must-have / Nice-to-have | ✅ / 🟡 / ❌ | ... |

## ATS keywords

**Present:** keyword · keyword · ...
**Missing:** keyword · keyword · ...

## Strengths to lead with

1. ... (the resume line, and why it matters for this role)
2. ...
3. ...

## Gaps

1. ... (what the offer asks, what the resume shows, and whether it can be covered with real
   experience or is a true gap)
2. ...
3. ...

## Suggested changes for a tailored version

- **Summary:** a rewritten summary for this role, using only facts from the resume.
- **Bullets:** which bullets to move up, reword (show before → after) or cut.
- **Keywords:** where the missing keywords fit truthfully, and which ones should not be added
  because the experience is not there.
- **From sources, cover letters and notes:** experience from LinkedIn or older resumes worth bringing
  back into this version, and stories worth using in the application or interview (only if provided).

## Questions for you

Answering these can raise the score with experience that is not in the resume yet.

1. **<Requirement or keyword>** (impact: high / medium / low): <question>
   *Why:* <the resume line that makes it worth asking>
2. ...

## Next step

1. Answer the questions above (in the Claude Code chat, or in `notes/experience.md`).
2. `npm run new -- <company>` to create the tailored version.
```
