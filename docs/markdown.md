# Writing a resume in Markdown

Each resume is a Markdown file: your base resume is `profile/resume-base.md`, and each application has
its own `resume.md` in `applications/<folder>/`. It uses plain Markdown plus a few conventions.
`examples/sample-resume.md` is a complete example.

## The whole document

```markdown
---
footer: April 23, 2026
---

# ALEX MORGAN

**Senior Product Manager**

Lisbon, Portugal | +351 900 000 000 | alex.morgan@example.com | [linkedin.com/in/example](https://www.linkedin.com/in/example)

## SUMMARY

One or more paragraphs…

## EXPERIENCE

### 2022–PRESENT | SHIPFAST — LOGISTICS SAAS | Lisbon, Portugal

***Senior Product Manager***

- Bullet point…
- Another bullet point…

## SKILLS & LANGUAGES

- Bullets directly under a section, without an entry…
```

## Elements

| Markdown | Renders as |
| --- | --- |
| `---` front matter `---` | Settings, one `key: value` per line (see below). |
| `# Name` | Name at the top, bold and centered. It is also the PDF title. |
| Paragraphs between `#` and the first `##` | Centered header lines, such as the headline or contact details. |
| `## TITLE` | Section heading with the full-width rule under it. Write it in the case you want printed. |
| `### date \| organization \| location` | Dated entry: date in the left column, organization in bold, location aligned to the right margin. The location is optional, and the separator is a pipe with a space on each side. |
| Paragraph inside an entry | Subtitle line, indented under the organization. Use `***…***` for the bold-italic job title, or plain text as in Education. |
| `- item` | Bullet. Indent the next line to continue a long bullet. |
| Paragraph directly in a section | Full-width paragraph, as in Summary. |

Inline formatting: `**bold**`, `*italic*` (or `_italic_`), `***bold italic***`, `[text](https://url)` for links.
Put a backslash before a literal `*`, `_`, `[`, etc. (for example `\*`).
`<!-- comments -->` are ignored.

An email in the contact line is plain text. To make it clickable, write
`[alex.morgan@example.com](mailto:alex.morgan@example.com)`.

## Front matter

| Key | Meaning |
| --- | --- |
| `footer` | Text printed at the bottom-right of every page, for example a date. Leave it empty for no footer. If it is a date like `April 23, 2026`, `npm run new` sets it to today in the copy. |
| `title` | PDF document title. Defaults to the `#` name. |
| `author` | PDF author metadata. Defaults to the `#` name. |
| `lang` | Document language. Defaults to `en`. |

## Custom classes

A `##` or `###` line can end with `{.class-name}`. This adds CSS classes to that section or entry, so you
can style it in `template/resume.css`.

| Built-in class | Effect |
| --- | --- |
| `{.page-break}` | Starts that section (`## EDUCATION {.page-break}`) or entry at the top of a new page. |

## Section-specific styling

Each section gets a class made from its title, for example `section-experience`, `section-education` or
`section-additional-data`. All bullets look the same in every section: left-aligned, with the text 13.5pt
from the bullet (`--bullet-indent`). The only section-specific rule is that Additional Data bullets are
indented to the second column. If you rename that section, update its selector in `template/resume.css`.

## Using a file outside the project

Any command accepts a full path, for example a file in an Obsidian vault:

```bash
npm run generate -- ~/Vault/resume.md
```

The PDF is written next to it. For `generate`, a second argument sets the output PDF path.
