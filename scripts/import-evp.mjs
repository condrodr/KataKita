import fs from 'node:fs';

const input = process.argv[2];
if (!input) {
  console.error('Usage: node scripts/import-evp.mjs path/to/evp.csv > supabase/evp-import.sql');
  process.exit(1);
}

const quote = (value) => `'${String(value ?? '').replaceAll("'", "''")}'`;
const lines = fs.readFileSync(input, 'utf8').trim().split(/\r?\n/);
const parse = (line) => line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(v => v.replace(/^\"|\"$/g, '').replaceAll('""', '"').trim());
const header = parse(lines.shift()).map(v => v.toLowerCase());
const col = (row, name) => row[header.indexOf(name)] ?? '';

console.log('-- Review this output before running it in Supabase.');
console.log('begin;');
for (const line of lines) {
  if (!line.trim()) continue;
  const row = parse(line);
  const english = col(row, 'english') || col(row, 'word');
  const level = col(row, 'level').toUpperCase();
  const theme = col(row, 'theme') || 'general';
  if (!english || !level) continue;
  const id = `${level.toLowerCase()}-${english.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const themeId = theme.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  console.log(`-- ${level} / ${theme}`);
  console.log(`insert into public.vocabulary (id, theme_id, english, indonesian, definition, definition_id, example, translation, sort_order) values (${quote(id)}, ${quote(themeId)}, ${quote(english)}, ${quote(col(row, 'indonesian') || col(row, 'translation'))}, ${quote(col(row, 'definition'))}, ${quote(col(row, 'definition_id') || col(row, 'arti'))}, ${quote(col(row, 'example'))}, ${quote(col(row, 'example_translation') || col(row, 'translation'))}, 0) on conflict (id) do update set english=excluded.english, indonesian=excluded.indonesian, definition=excluded.definition, definition_id=excluded.definition_id, example=excluded.example, translation=excluded.translation;`);
}
console.log('commit;');
