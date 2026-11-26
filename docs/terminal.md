# Using the terminal

Everything can be done in the Claude Code chat. The terminal commands are for working without it, or
for building PDFs quickly.

## Applying to a job

```bash
npm run job                  # 1. save the posting: company, role, link, then paste the text
npm run match -- cartify     # 2. compare your base resume with it (needs an API key)
npm run new -- cartify       # 3. copy your base resume into the folder as resume.md
npm run preview -- cartify   # 4. edit resume.md and watch the PDF update
npm run generate -- cartify  # 5. build the PDF, ready to upload
npm run match -- cartify     # 6. optional: score the tailored version
```

`cartify` is any part of the application's folder name. From the terminal you tailor `resume.md`
yourself: the commands copy and check, they don't rewrite your resume.

## All commands

| Command | What it does |
| --- | --- |
| `npm run setup` | First-time install and test. |
| `npm run import` | Creates your base resume from the files in `profile/` (needs an API key). |
| `npm run job` | Saves a job posting in a new folder in `applications/`. Warns you if you already saved that link. |
| `npm run match -- <name>` | Compares your base resume with the posting and saves `match.md`. Once the folder has a `resume.md`, it scores that tailored version too (needs an API key). |
| `npm run new -- <name>` | Copies your base resume into the application folder as `resume.md`. |
| `npm run preview -- <name>` | Opens a live preview at http://localhost:4321 that updates every time you save. |
| `npm run generate -- <name>` | Builds the PDF in the application folder and checks that ATS systems can read it. |
| `npm run check -- <name>` | Runs only the ATS checks, and shows the text an ATS reads. |
| `npm run write-cover-letter -- <name>` | Drafts a cover letter for the posting and builds its PDF (needs an API key). |
| `npm run cover-letter -- <name>` | Builds the cover letter PDF from `cover-letter.md`, after you edit it. |
| `npm run compare` | Optional: compares the PDF with a reference PDF in `reference/original.pdf`. |

Without a name, `new`, `preview`, `generate` and `check` use your **base resume**
(`npm run generate` builds `profile/resume-base.pdf`). `match`, `write-cover-letter` and `cover-letter`
use the newest application.

PDF names carry the date they are built, for example `Alex Morgan - Resume - 20261125.pdf`. Building
again replaces the folder's older PDF of the same kind.

## API key

`npm run import`, `npm run match` and `npm run write-cover-letter` call Claude through the Anthropic
API, so they need an API key. Each run is billed to your Anthropic account (a few cents). In the
Claude Code chat you don't need one.

1. Create a key at [console.anthropic.com](https://console.anthropic.com/settings/keys).
2. Create a file named `.env` in the project folder with this line:

   ```
   ANTHROPIC_API_KEY=your-key-here
   ```

`.env` is git-ignored, so your key is never uploaded. If you use these commands, your files in
`profile/` are sent to the Anthropic API along with the posting.
