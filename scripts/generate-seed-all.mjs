import { writeFileSync } from 'node:fs';
import { themes } from '../src/data/vocabulary.js';
import { levels } from '../src/data/levels.js';

const q = value => `'${String(value ?? '').replaceAll("'", "''")}'`;
const json = value => q(JSON.stringify(value ?? []));
let sql = '-- KataKita vocabulary seed: A1-C2\n-- Jalankan setelah schema.sql. Semua materi diambil dari katalog frontend yang telah dikurasi.\n\n';
const levelSql = new Map(levels.map(level => [level.id, '-- KataKita seed ' + level.id + '\n\n']));
for (const [i, level] of levels.entries()) {
  const line = `insert into public.levels (id,name,label,target,focus,outcome,sort_order) values (${q(level.id)},${q(level.name)},${q(level.label)},${level.target},${q(level.focus)},${q(level.outcome)},${i}) on conflict (id) do update set name=excluded.name,label=excluded.label,target=excluded.target,focus=excluded.focus,outcome=excluded.outcome,sort_order=excluded.sort_order;\n`;
  sql += line;
  levelSql.set(level.id, levelSql.get(level.id) + line);
}
sql += '\n';
for (const level of levels) {
  for (const [order, id] of level.themeIds.entries()) {
    const theme = themes.find(item => item.id === id);
    if (!theme) continue;
    const themeLine = `insert into public.themes (id,level_id,title,category,description,emoji,color,accent,sort_order,published) values (${q(theme.id)},${q(level.id)},${q(theme.title)},${q(theme.subtitle)},${q(level.focus)},${q(theme.emoji)},${q(theme.color)},${q(theme.accent)},${order},true) on conflict (id) do update set level_id=excluded.level_id,title=excluded.title,category=excluded.category,description=excluded.description,emoji=excluded.emoji,color=excluded.color,accent=excluded.accent,sort_order=excluded.sort_order,published=true;\n`;
    sql += themeLine; levelSql.set(level.id, levelSql.get(level.id) + themeLine);
    for (const [wordOrder, word] of theme.words.entries()) {
      const wordLine = `insert into public.vocabulary (id,theme_id,english,indonesian,definition,definition_id,example,translation,breakdown,image_url,sort_order,published) values (${q(`${theme.id}-${word.id}`)},${q(theme.id)},${q(word.en)},${q(word.idn)},${q(word.definition)},${q(word.definitionId)},${q(word.example)},${q(word.translation)},${json(word.breakdown)},${q(word.image_url)},${wordOrder},true) on conflict (id) do update set theme_id=excluded.theme_id,english=excluded.english,indonesian=excluded.indonesian,definition=excluded.definition,definition_id=excluded.definition_id,example=excluded.example,translation=excluded.translation,breakdown=excluded.breakdown,image_url=excluded.image_url,sort_order=excluded.sort_order,published=true;\n`;
      sql += wordLine; levelSql.set(level.id, levelSql.get(level.id) + wordLine);
    }
    sql += '\n';
  }
}
writeFileSync('supabase/seed-all-levels.sql', sql);
for (const [id, content] of levelSql) writeFileSync(`supabase/seed-${id.toLowerCase()}.sql`, content);
console.log(`Generated ${themes.length} themes and ${themes.reduce((sum, theme) => sum + theme.words.length, 0)} vocabulary rows.`);
