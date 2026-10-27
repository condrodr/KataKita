import { themes } from '../src/data/vocabulary.js';

const TOKEN_RE = /[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*|[^\s]/g;
const GENERIC = [/^A word used to talk about/i, /^Arti kata:/i, /^I use (?:a|an) .+ every day\.$/i, / is a polite expression\.$/i];
const normalize = value => String(value ?? '').trim().toLocaleLowerCase().replace(/[.!?,;:]+$/g, '').replace(/\s+/g, ' ');
const issues = [];
const seenIds = new Set();

for (const theme of themes) {
  const seenEnglish = new Set();
  for (const word of theme.words) {
    const key = `${theme.id}/${word.id}`;
    const required = ['en','idn','definition','definitionId','example','translation','breakdown'];
    for (const field of required) if (!word[field] || (Array.isArray(word[field]) && !word[field].length)) issues.push({ key, field, code: 'required', value: word[field] });
    if (seenIds.has(key)) issues.push({ key, field: 'id', code: 'duplicate-id' });
    seenIds.add(key);
    const enKey = normalize(word.en);
    if (seenEnglish.has(enKey)) issues.push({ key, field: 'en', code: 'duplicate-answer', value: word.en });
    seenEnglish.add(enKey);
    if (GENERIC.some(pattern => pattern.test(word.definition))) issues.push({ key, field: 'definition', code: 'generic-definition', value: word.definition });
    if (GENERIC.some(pattern => pattern.test(word.definitionId))) issues.push({ key, field: 'definitionId', code: 'generic-definition', value: word.definitionId });
    if (GENERIC.some(pattern => pattern.test(word.example))) issues.push({ key, field: 'example', code: 'generic-example', value: word.example });
    if (normalize(word.example) === normalize(word.translation)) issues.push({ key, field: 'translation', code: 'not-translated', value: word.translation });
    const sentenceTokens = (word.example.match(TOKEN_RE) || []).filter(token => !/^[.?!,;:]$/.test(token));
    const breakdownTokens = Array.isArray(word.breakdown) ? word.breakdown.flatMap(item => String(item?.[0] ?? '').match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || []) : [];
    if (sentenceTokens.map(normalize).join(' ') !== breakdownTokens.map(normalize).join(' ')) issues.push({ key, field: 'breakdown', code: 'token-mismatch', value: { sentenceTokens, breakdownTokens } });
    const safeSame = value => /^[A-Z][a-z]+$/.test(String(value)) || /^[0-9@.+-]+$/.test(String(value)) || normalize(word.en) === normalize(word.idn);
    if (word.breakdown?.some(item => !Array.isArray(item) || item.length < 2 || !String(item[1] ?? '').trim() || (normalize(item[0]) === normalize(item[1]) && !safeSame(item[0])))) issues.push({ key, field: 'breakdown', code: 'missing-indonesian-gloss' });
  }
}

const summary = issues.reduce((acc, issue) => { acc[issue.code] = (acc[issue.code] || 0) + 1; return acc; }, {});
console.log(JSON.stringify({ themes: themes.length, words: themes.reduce((sum, theme) => sum + theme.words.length, 0), issueCount: issues.length, summary, samples: issues.slice(0, 50) }, null, 2));
if (process.argv.includes('--strict') && issues.length) process.exitCode = 1;
