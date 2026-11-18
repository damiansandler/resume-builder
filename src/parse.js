// Parses the resume Markdown dialect (documented in README.md) into a plain data model.
//
//   ---                      front matter (key: value)
//   # Name                   document title / name
//   paragraphs               header lines below the name (until the first ##)
//   ## SECTION               section heading
//   ### date | org | place   dated entry (place is optional)
//   paragraphs / - bullets   content of the current entry or section
//   {.class}                 optional trailing attribute on ## / ### lines (extra CSS classes)

export function parseResume(source) {
  const text = source.replace(/\r\n?/g, '\n').replace(/<!--[\s\S]*?-->/g, '');
  const lines = text.split('\n');
  const meta = {};
  let i = 0;

  if (lines[0]?.trim() === '---') {
    for (i = 1; i < lines.length && lines[i].trim() !== '---'; i++) {
      const m = lines[i].match(/^\s*([\w-]+)\s*:\s*(.*?)\s*$/);
      if (m) meta[m[1]] = m[2].replace(/^(["'])(.*)\1$/, '$2');
    }
    i++;
  }

  const resume = { meta, name: '', header: [], sections: [] };
  let section = null;
  let entry = null;
  let paragraph = null;
  let list = null;

  const container = () => (entry ? entry.blocks : section ? section.blocks : resume.header);
  const flush = () => {
    paragraph = null;
    list = null;
  };

  for (; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    let m;

    if (line === '') {
      flush();
    } else if ((m = line.match(/^#\s+(.*)$/))) {
      flush();
      resume.name = m[1];
    } else if ((m = line.match(/^##\s+(.*)$/))) {
      flush();
      entry = null;
      const { text: title, classes } = splitAttributes(m[1]);
      section = { title, slug: slugify(title), classes, blocks: [] };
      resume.sections.push(section);
    } else if ((m = line.match(/^###\s+(.*)$/))) {
      flush();
      if (!section) throw new Error(`Line ${i + 1}: "###" entry must be inside a "##" section`);
      const { text: heading, classes } = splitAttributes(m[1]);
      const [date = '', org = '', location = ''] = heading.split(/\s+\|\s+/).map((s) => s.trim());
      entry = { type: 'entry', date, org, location, classes, blocks: [] };
      section.blocks.push(entry);
    } else if ((m = raw.match(/^\s*[-*+]\s+(.*)$/))) {
      paragraph = null;
      if (!list) {
        list = { type: 'list', items: [] };
        container().push(list);
      }
      list.items.push(m[1].trim());
    } else if (list && /^\s+/.test(raw)) {
      // indented continuation of the previous bullet
      list.items[list.items.length - 1] += ' ' + line;
    } else {
      list = null;
      if (!paragraph) {
        paragraph = { type: 'paragraph', text: line };
        container().push(paragraph);
      } else {
        paragraph.text += ' ' + line;
      }
    }
  }
  return resume;
}

// "Title {.foo .bar}" → { text: 'Title', classes: ['foo', 'bar'] }
function splitAttributes(s) {
  const m = s.match(/^(.*?)\s*\{((?:\s*\.[\w-]+)+)\s*\}\s*$/);
  if (!m) return { text: s.trim(), classes: [] };
  return { text: m[1].trim(), classes: m[2].trim().split(/\s+/).map((c) => c.slice(1)) };
}

export function slugify(s) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
