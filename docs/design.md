# Design and ATS

The design lives in `template/resume.css`. The main settings are CSS variables at the top
(`--font-size`, `--page-margin`, `--section-gap`, `--heading-gap`, `--entry-gap`, `--block-gap`,
`--date-col`, …). `npm run preview` reloads on every save.

## How the design was built

The template replicates a classic Google Docs resume, measured from the original DOCX and PDF:

* **Page:** A4 (596 × 842 pt as exported by Google Docs). Margins are 0.4in.
* **Footer:** printed in the page margin with CSS `@page { @bottom-right }`, so it repeats on every page.
* **Font:** Calibri 10pt. The template uses **Carlito**, an open-source font with the same metrics as
  Calibri, bundled through `@fontsource/carlito`. Every glyph width matches, so lines break exactly as
  they would in Calibri.
* **Line spacing:** single (1.2207).
* **Spacing between blocks:** roomier than the original, following common US MBA resume templates:
  * `--section-gap` (11pt): space above each section heading, about one blank line.
  * `--heading-gap` (4pt): space between a heading's rule and the section content.
  * `--entry-gap` (6pt): space between jobs or degrees, about half a line.
  * `--block-gap` (3pt): inside a job, space between the role, the intro paragraph and the bullet list.

  Bullets inside an entry have no extra space between them.
* **Columns:** dates are in a 72pt column, matching a 1in tab stop. Locations are aligned to the right margin.
* **Rules:** a 1pt black rule under each section heading, extending slightly into the right margin.
* **Bullets:** `●` in Arial with hanging indents, left-aligned.
* **Links:** colored `#1155cc` and underlined.
* **Page breaks:** come from the natural flow. Use `{.page-break}` to force one (see `markdown.md`).

## The cover letter

`template/cover-letter.css` styles cover letters as a plain letter, like one written in Google Docs:
US Letter page, 1in margins, Arial 11pt (Arimo or Liberation Sans where Arial is missing), 12pt before
each paragraph. Change `--font`, `--font-size`, `--paragraph-gap` or `--page-margin` at the top of the
file, or the `@page` size for A4. `npm run cover-letter` builds the PDF and checks that every line is
readable as text and that the letter fits on one page.

## Matching an existing resume: `npm run compare` (optional)

If you are recreating a resume you already have as a PDF, put it in `reference/original.pdf` and run
`npm run compare`. It compares your generated PDF with it line by line (text, line breaks, positions)
and pixel by pixel, and writes diff images to `build/compare/`. It uses your base resume, or the
application you name (`npm run compare -- cartify`). Without a reference PDF the command
just says there is nothing to compare.

## ATS-friendliness

Applicant tracking systems (ATS) read the text of your PDF. The template keeps it readable:

* Real, selectable text in embedded fonts. There are no images of text.
* The PDF is tagged (`tagged: true`) and uses semantic HTML: `h1`, `h2`, `h3`, `ul`/`li`, `section`, `article`.
* The content-stream order matches the reading order. The template avoids `position: absolute/relative`,
  because Chrome paints positioned elements last, which would scramble the extracted text.
* Hyperlinks are real link annotations.
* The PDF title comes from the name.

`npm run generate` verifies all of this on every PDF it builds (`npm run check` runs only the checks):
every line of the Markdown is extractable and in order, links work, fonts are embedded, the PDF is
tagged and has a title.

## How it works

```
resume.md ──parse──▶ src/parse.js ──render──▶ src/render.js ──print──▶ src/pdf.js ──▶ PDF next to it ──▶ src/ats.js
                                               (template/)              (Playwright + Chromium)        (ATS checks)
```

* `src/parse.js` turns the Markdown into a resume model (header, sections, entries, blocks).
* `src/render.js` turns the model into semantic HTML and fills `template/resume.html`.
* `src/pdf.js` prints the HTML to PDF with Playwright's Chromium.
* `src/ats.js` checks the PDF the way an ATS reads it.
* `src/paths.js` knows where everything lives (`profile/`, `applications/`) and finds an application
  from part of its folder name.
* `src/jobs.js` reads and writes `job.md` and finds a posting that was already saved.
* `src/keywords.js` finds keywords missing from the base resume across several analyses.
* `src/letter.js` turns a `cover-letter.md` into HTML with `template/cover-letter.html`.
