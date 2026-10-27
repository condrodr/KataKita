import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { themes as localThemes } from './data/vocabulary';
import { levels, totalTarget } from './data/levels';
import { themeCatalog } from './data/catalog';
import { fetchVocabulary } from './services/supabase';
import './styles.css';

const STORAGE_KEY = 'katakita-progress-v1';
const USER_KEY = 'katakita-user-v1';
const EMPTY_PROGRESS = { learned: {}, scores: {} };
let themes = localThemes;

const normalizeThemes = rows => rows?.map(row => ({ ...row, title: row.title, subtitle: row.category || row.subtitle, level: row.level_id, words: (row.vocabulary || []).map(word => ({ ...word, en: word.english, idn: word.indonesian, definitionId: word.definition_id || `Arti bahasa Indonesia: ${word.indonesian}.`, image_url: word.image_url || `https://placehold.co/480x360/fff0e8/243247/png?text=${encodeURIComponent(word.english)}` })) })) || [];

const Icon = ({ name, size = 22 }) => {
  const paths = {
    home: <><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c.7-4 3.4-6 8-6s7.3 2 8 6"/></>,
    volume: <><path d="M5 10H2v4h3l5 4V6l-5 4Z"/><path d="M14 9c1.6 1.6 1.6 4.4 0 6M17 6c3.3 3.3 3.3 8.7 0 12"/></>,
    arrow: <><path d="m9 18 6-6-6-6"/></>,
    back: <><path d="m15 18-6-6 6-6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    flame: <path d="M12 22c4.4 0 8-3.1 8-7.5 0-3.2-1.9-6.2-5.7-9.2.2 2.8-1.2 4.3-2.2 5.1.1-3.7-2-6.4-4.8-8.4.2 4.2-3.3 6.9-3.3 11.8C4 18.4 7.6 22 12 22Z"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
};

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { learned: {}, scores: {} }; }
  catch { return { learned: {}, scores: {} }; }
}

function App() {
  const [, setContentVersion] = useState(0);
  const [page, setPage] = useState('home');
  const [progress, setProgress] = useState(loadProgress);
  const [activeTheme, setActiveTheme] = useState(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [quiz, setQuiz] = useState(null);
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } });
  useEffect(() => { fetchVocabulary().then(rows => { const remote = normalizeThemes(rows); if (remote.length) { themes = remote; setContentVersion(v => v + 1); } }).catch(() => {}); }, []);
  const [authOpen, setAuthOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [practiceTheme, setPracticeTheme] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(levels[0]);

  useEffect(() => { if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }, [progress, user]);
  useEffect(() => user ? localStorage.setItem(USER_KEY, JSON.stringify(user)) : localStorage.removeItem(USER_KEY), [user]);

  const effectiveProgress = user ? progress : EMPTY_PROGRESS;
  const stats = useMemo(() => {
    const learned = Object.values(effectiveProgress.learned).reduce((sum, words) => sum + words.length, 0);
    const completed = themes.filter(t => effectiveProgress.learned[t.id]?.length === t.words.length).length;
    return { learned, completed, total: themes.reduce((s, t) => s + t.words.length, 0) };
  }, [effectiveProgress]);

  function openTheme(theme) {
    setActiveTheme(theme); setWordIndex(0); setPage('learn'); window.scrollTo(0, 0);
  }

  function openLevel(level) {
    setSelectedLevel(level); setPage('level'); window.scrollTo(0, 0);
  }

  function openPractice(theme) {
    setPracticeTheme(theme);
  }

  function markLearned(theme, word) {
    if (!user) return;
    setProgress(prev => {
      const current = prev.learned[theme.id] || [];
      if (current.includes(word.id)) return prev;
      return { ...prev, learned: { ...prev.learned, [theme.id]: [...current, word.id] } };
    });
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
  }

  function startQuiz(theme, type = 'choice') {
    const questions = theme.words.map((word, index) => {
      const others = theme.words.filter(w => w.id !== word.id).slice(0, 3);
      const options = [word, ...others].sort(() => Math.random() - .5);
      return { word, options, type };
    });
    setQuiz({ theme, questions, index: 0, correct: 0, answer: '', checked: false });
    setPage('quiz'); window.scrollTo(0, 0);
  }

  function finishQuiz(correct) {
    const score = Math.round((correct / quiz.questions.length) * 100);
    setProgress(prev => ({ ...prev, scores: { ...prev.scores, [quiz.theme.id]: Math.max(score, prev.scores[quiz.theme.id] || 0) } }));
    setQuiz(q => ({ ...q, finished: true, finalScore: score, correct }));
  }

  function answerQuiz(value) {
    if (quiz.checked) return;
    const question = quiz.questions[quiz.index];
    const expected = question.type === 'sentence' ? question.word.example.toLowerCase() : question.word.en.toLowerCase();
    const isCorrect = value.trim().toLowerCase() === expected;
    setQuiz(q => ({ ...q, answer: value, checked: true, wasCorrect: isCorrect }));
  }

  function nextQuestion() {
    const nextCorrect = quiz.correct + (quiz.wasCorrect ? 1 : 0);
    if (quiz.index === quiz.questions.length - 1) return finishQuiz(nextCorrect);
    setQuiz(q => ({ ...q, index: q.index + 1, correct: nextCorrect, answer: '', checked: false, wasCorrect: false }));
  }

  const navigate = target => {
    if (target === 'progress' && !user) { setAuthOpen(true); return; }
    setPage(target); setActiveTheme(null); window.scrollTo(0, 0);
  };

  return <div className="app-shell">
    <aside className="sidebar">
      <Brand />
      <Nav page={page} onNavigate={navigate} user={user} />
      <div className="side-note"><span>💡</span><p><strong>Belajar sedikit,<br/>setiap hari.</strong></p></div>
    </aside>
    <main className="main">
      {page === 'home' && <Home stats={stats} progress={effectiveProgress} onOpenLevel={openLevel} onNavigate={navigate} user={user} onAuth={()=>setAuthOpen(true)} />}
      {page === 'levels' && <Levels onOpen={openLevel} user={user} />}
      {page === 'level' && <LevelThemes level={selectedLevel} progress={effectiveProgress} onOpen={openTheme} onPractice={openPractice} user={user} onBack={()=>navigate('levels')} />}
      {page === 'practice' && <PracticeHub progress={effectiveProgress} onPractice={openPractice} user={user} onOpenLevel={openLevel} />}
      {page === 'progress' && user && <Progress stats={stats} progress={effectiveProgress} onOpen={openTheme} user={user} />}
      {page === 'profile' && <Profile user={user} onAuth={()=>setAuthOpen(true)} onLogout={()=>{setUser(null);navigate('home')}} />}
      {page === 'learn' && activeTheme && <Learn theme={activeTheme} index={wordIndex} progress={effectiveProgress} onBack={() => {setPage('level');setActiveTheme(null)}} onSpeak={speak} onSelect={setWordIndex} onNext={() => {
        markLearned(activeTheme, activeTheme.words[wordIndex]);
        if (wordIndex < activeTheme.words.length - 1) setWordIndex(i => i + 1); else setFinishOpen(true);
      }} />}
      {page === 'quiz' && quiz && <Quiz quiz={quiz} onAnswer={answerQuiz} onNext={nextQuestion} onSpeak={speak} onDone={() => navigate('home')} />}
    </main>
    <nav className="bottom-nav"><Nav page={page} onNavigate={navigate} user={user} /></nav>
    {authOpen && <AuthModal onClose={()=>setAuthOpen(false)} onSuccess={newUser=>{setUser(newUser);setAuthOpen(false)}} />}
    {finishOpen && <FinishModal user={user} theme={activeTheme} onClose={()=>setFinishOpen(false)} onAuth={()=>{setFinishOpen(false);setAuthOpen(true)}} onQuiz={type=>{setFinishOpen(false);startQuiz(activeTheme,type)}} />}
    {practiceTheme && <PracticeModal theme={practiceTheme} onClose={()=>setPracticeTheme(null)} onStart={type=>{const selected=practiceTheme;setPracticeTheme(null);startQuiz(selected,type)}} />}
  </div>;
}

function Brand() { return <div className="brand"><div className="brand-mark">K</div><div><strong>KataKita</strong><small>English is fun!</small></div></div>; }

function Nav({ page, onNavigate, user }) {
  const items = [['home','home','Beranda'],['levels','grid','Tema'],['practice','check','Latihan'],['progress','chart','Progres'],['profile','user','Profil']];
  return <div className="nav-list">{items.map(([id, icon, label]) => <button key={id} className={(page === id || (id === 'levels' && ['level','learn'].includes(page))) ? 'active' : ''} onClick={() => onNavigate(id)}><span className="nav-icon"><Icon name={icon}/>{id==='progress'&&!user&&<i>🔒</i>}</span><span>{label}</span></button>)}</div>;
}

function Header({ eyebrow, title, copy, user }) { return <header className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div><div className="header-avatar">{user?.name?.[0]?.toUpperCase() || '?'}</div></header>; }

function Home({ stats, onOpenLevel, onNavigate, user, onAuth }) {
  return <div className="page fade-in">
    <Header eyebrow="KURIKULUM KOSAKATA A1–C2" title={user ? `Halo, ${user.name}! 👋` : 'Bahasa Inggris, selangkah demi selangkah'} copy="Pilih level, pelajari kosakata per tema, lalu uji kemampuanmu dengan latihan interaktif." user={user} />
    {!user && <section className="intro-strip"><div><span>🌱</span><p><b>Semua materi dan metode latihan gratis</b><small>Belajar dapat langsung dimulai. Daftar atau masuk hanya jika ingin menyimpan progres dan nilai.</small></p></div><button className="primary" onClick={onAuth}>Daftar untuk simpan progres</button></section>}
    <section className="hero-card cefr-hero">
      <div className="hero-copy"><span className="pill-light">MULAI DARI DASAR</span><h2>A1 · Beginner</h2><p>Kosakata konkret untuk kehidupan sehari-hari.</p><div className="hero-progress"><div><span>Target kurikulum</span><b>600 entri</b></div><div className="bar"><i style={{width:'12%'}}/></div></div><button className="primary white" onClick={() => onOpenLevel(levels[0])}>Jelajahi level A1 <Icon name="arrow" size={18}/></button></div>
      <div className="hero-art level-hero-art"><span>A1</span><i className="dot one"/><i className="dot two"/><i className="spark">✦</i></div>
    </section>
    {user&&<section className="stats-row"><Stat icon="🔥" value="3 hari" label="Runtun belajar" tone="orange"/><Stat icon="✓" value={`${stats.learned} kata`} label="Sudah dipelajari" tone="green"/><Stat icon="★" value="120 XP" label="Total poin" tone="purple"/></section>}
    <section className="cefr-note"><span>📚</span><div><b>Disusun dengan referensi Cambridge English Vocabulary Profile</b><p>EVP membantu memeriksa makna kata dan frasa yang lazim diketahui pada setiap level CEFR A1–C2. Struktur dan target di aplikasi ini adalah rancangan kurikulum KataKita, bukan silabus resmi Cambridge.</p></div></section>
    <section className="section-head"><div><span className="eyebrow">JALUR BELAJAR</span><h2>Pilih level bahasa Inggrismu</h2></div><button className="text-button" onClick={() => onNavigate('levels')}>Lihat kurikulum <Icon name="arrow" size={17}/></button></section>
    <div className="level-grid">{levels.map(level=><LevelCard key={level.id} level={level} onOpen={onOpenLevel}/>)}</div>
  </div>;
}

function Stat({icon,value,label,tone}) { return <div className="stat"><span className={`stat-icon ${tone}`}>{icon}</span><div><b>{value}</b><small>{label}</small></div></div>; }

function ThemeCard({ theme, progress, onOpen, onPractice, user }) {
  const learned = progress.learned[theme.id]?.length || 0;
  const pct = Math.round((learned / theme.words.length) * 100);
  const levelId = levels.find(level => level.themeIds.includes(theme.id))?.id || theme.level;
  return <article className="theme-card">
    <div className="theme-visual" style={{background: theme.color}}><span>{theme.emoji}</span><em style={{color: theme.accent}}>{levelId}</em></div>
    <div className="theme-info"><div><h3>{theme.title}</h3><p>{theme.subtitle} · {theme.words.length} kata</p></div></div>
    <div className="theme-actions"><button onClick={()=>onOpen(theme)}>Belajar</button><button className="practice-button" onClick={()=>onPractice(theme)}>Latihan</button></div>
    <div className="mini-progress"><i style={{width: `${pct}%`, background: theme.accent}}/></div>
  </article>;
}

function LevelCard({level,onOpen}) { return <button className="level-card" onClick={()=>onOpen(level)} style={{'--level':level.color,'--soft':level.soft}}><span className="level-code">{level.id}</span><div><b>{level.name}</b><small>{level.label} · target {level.target.toLocaleString('id-ID')} entri</small></div><Icon name="arrow"/></button>; }

function Levels({onOpen,user}) { const available=new Map(themes.map(t=>[t.title.toLowerCase(),t])); return <div className="page fade-in"><Header eyebrow="KATALOG MATERI" title="Pilih Tema" copy="Semua materi disusun sebagai tema. Label A1–C2 hanya membantu menunjukkan tingkat rujukan." user={user}/><section className="curriculum-summary"><div><b>60 tema pembelajaran</b><p>Jelajahi tema secara langsung tanpa harus memilih level terlebih dahulu. Target di setiap kartu adalah rancangan jumlah kosakata.</p></div></section><div className="catalog-grid">{themeCatalog.map(item=>{const theme=available.get(item.title.toLowerCase()); return <article className={`catalog-card ${theme?'ready':''}`} key={item.id}><span className="level-code">{item.level}</span><div><h3>{item.title}</h3><small>Target {item.target} entri · {theme?`${theme.words.length} kata tersedia`:'Materi berikutnya'}</small></div>{theme?<button onClick={()=>onOpen(theme)}>Buka tema <Icon name="arrow" size={17}/></button>:<span className="planned-label">Segera hadir</span>}</article>})}</div></div>; }

function LevelThemes({level,progress,onOpen,onPractice,user,onBack}) { const available=level.themeIds.map(id=>themes.find(t=>t.id===id)).filter(Boolean); return <div className="page fade-in"><button className="back-link" onClick={onBack}><Icon name="back" size={18}/> Semua level</button><section className="level-banner" style={{'--level':level.color,'--soft':level.soft}}><span className="level-code big">{level.id}</span><div><span className="eyebrow">{level.name.toUpperCase()}</span><h1>{level.label}</h1><p>{level.focus}</p><small>Target kurikulum: {level.target.toLocaleString('id-ID')} entri · {level.outcome}</small></div></section><section className="section-head"><div><span className="eyebrow">TEMA LEVEL {level.id}</span><h2>Pilih tema untuk dipelajari</h2></div></section>{available.length>0&&<div className="theme-grid all">{available.map(t=><ThemeCard key={t.id} theme={t} progress={progress} onOpen={onOpen} onPractice={onPractice} user={user}/>)}</div>}<div className="planned-section"><h3>{available.length?'Tema berikutnya':'Materi sedang disiapkan'}</h3><div className="planned-grid">{level.planned.map(name=><div key={name}><span>📖</span><p><b>{name}</b><small>Segera hadir · tetap gratis</small></p></div>)}</div></div></div>; }

function PracticeHub({progress,onPractice,user}) { return <div className="page fade-in"><Header eyebrow="RUANG LATIHAN" title="Latihan per Level dan Tema" copy="Pilih tema mana pun yang sudah tersedia. Semua jenis latihan gratis." user={user}/><div className="practice-intro"><span>🎯</span><div><b>Empat cara berlatih</b><p>Pilihan Ganda, Susun Huruf, Listening, dan Susun Kalimat. Nilai terbaik disimpan ke Progres.</p></div></div>{levels.filter(l=>l.themeIds.length).map(level=><section className="practice-level" key={level.id}><h2><span style={{background:level.color}}>{level.id}</span>{level.name}</h2><div className="practice-theme-grid">{level.themeIds.map(id=>themes.find(t=>t.id===id)).filter(Boolean).map(t=><button key={t.id} onClick={()=>onPractice(t)}><span className="list-emoji" style={{background:t.color}}>{t.emoji}</span><div><b>{t.title}</b><small>{t.words.length} soal · Nilai terbaik {progress.scores[t.id]||0}</small></div><Icon name="arrow"/></button>)}</div></section>)}</div>; }

function Progress({stats,progress,onOpen,user}) { return <div className="page fade-in"><Header eyebrow="PERJALANANMU" title={`Progres ${user.name}`} copy="Setiap kata baru adalah satu langkah maju." user={user}/><section className="progress-banner"><div className="ring" style={{'--pct': `${Math.round(stats.learned/stats.total*100)}%`}}><span>{Math.round(stats.learned/stats.total*100)}%</span></div><div><h2>Hebat, teruskan!</h2><p>Kamu sudah mempelajari <b>{stats.learned} dari {stats.total} kata</b>.</p></div></section><div className="progress-list">{themes.map(t=>{const n=progress.learned[t.id]?.length||0;return <button key={t.id} onClick={()=>onOpen(t)}><span className="list-emoji" style={{background:t.color}}>{t.emoji}</span><div><b>{t.title}</b><small>{n}/{t.words.length} kata · Nilai terbaik {progress.scores[t.id]||0}</small><div className="bar dark"><i style={{width:`${n/t.words.length*100}%`,background:t.accent}}/></div></div><Icon name="arrow"/></button>})}</div></div>; }

function Profile({user,onAuth,onLogout}) { return <div className="page fade-in"><Header eyebrow="AKUN SAYA" title={user?'Profil Belajar':'Masuk ke KataKita'} copy={user?'Kelola identitas dan perjalanan belajarmu.':'Masuk untuk menyimpan progres dan nilai latihan.'} user={user}/><section className="profile-card"><div className="big-avatar">{user?.name?.[0]?.toUpperCase()||'?'}</div><h2>{user?.name||'Belum masuk'}</h2><p>{user?.email||'Mode pengunjung'}</p><div className="notice"><span>{user?'✅':'☁️'}</span><div><b>{user?'Progres belajar aktif':'Latihan mode pengunjung'}</b><p>{user?'Progres dan nilai latihan kini tersimpan di akunmu.':'Latihan tetap gratis tanpa login. Daftar hanya jika ingin menyimpan progres dan nilai.'}</p></div></div>{user?<button className="secondary full" onClick={onLogout}>Keluar dari akun</button>:<button className="primary full" onClick={onAuth}>Masuk atau daftar</button>}</section></div>; }

function Learn({theme,index,progress,onBack,onSpeak,onNext,onSelect}) {
  const word=theme.words[index]; const learned=progress.learned[theme.id]?.includes(word.id);
  const done=progress.learned[theme.id]||[];
  const [showDefinition,setShowDefinition]=useState(false);
  useEffect(()=>setShowDefinition(false),[word.id]);
  return <div className="lesson-layout fade-in"><div className="lesson-page"><div className="lesson-top"><button className="icon-button" onClick={onBack}><Icon name="back"/></button><div><small>{theme.title}</small><div className="step-bar"><i style={{width:`${((index+1)/theme.words.length)*100}%`,background:theme.accent}}/></div></div><span>{index+1}/{theme.words.length}</span></div><div className="flashcard"><span className="learned-badge">{learned ? '✓ SUDAH DIPELAJARI' : 'KATA BARU'}</span><div className="word-art" style={{background:theme.color}}>{word.image_url?<img src={word.image_url} alt={word.en} loading="lazy"/>:word.emoji}</div><button className="sound-button" onClick={()=>onSpeak(word.en)} style={{color:theme.accent}}><Icon name="volume"/> Dengarkan</button><h1>{word.en}</h1><h2>{word.idn}</h2><button className="definition-toggle" onClick={()=>setShowDefinition(v=>!v)}>{showDefinition?'Sembunyikan arti definisi':'Lihat definisi bahasa Indonesia'} <span>{showDefinition?'⌃':'⌄'}</span></button>{showDefinition&&<div className="definition-box"><b>Definition</b><p>{word.definition}</p><hr/><b>Arti Indonesia</b><p>{word.definitionId}</p></div>}<div className="example"><small>CONTOH KALIMAT</small><p>“{word.example}”</p><div className="word-breakdown">{word.breakdown.map(([en,idn],i)=><span key={i}><b>{en}</b><em>{idn}</em></span>)}</div><div className="full-meaning"><b>Arti keseluruhan</b><span>{word.translation}</span></div></div></div><button className="primary next" onClick={onNext}>{index === theme.words.length-1 ? 'Selesaikan materi' : 'Kata berikutnya'} <Icon name="arrow" size={19}/></button></div><aside className="word-index-panel"><span className="eyebrow">DAFTAR KATA</span><h3>Progres materi</h3><p>Pilih nomor untuk mengulang kata.</p><div className="word-number-grid">{theme.words.map((item,i)=><button key={item.id} className={`${i===index?'current':''} ${done.includes(item.id)?'done':''}`} onClick={()=>onSelect(i)} aria-label={`Kata ${i+1}: ${item.en}`}>{done.includes(item.id)?'✓':i+1}</button>)}</div><small>{done.length} dari {theme.words.length} sudah dipelajari</small></aside></div>;
}

function AuthModal({onClose,onSuccess}) {
  const [mode,setMode]=useState('login'); const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const submit=e=>{e.preventDefault();onSuccess({name:mode==='register'?(name.trim()||'Teman'):email.split('@')[0]||'Teman',email});};
  return <div className="modal-backdrop"><section className="modal-card fade-in"><button className="modal-close" onClick={onClose}>×</button><span className="modal-emoji">🌟</span><span className="eyebrow">{mode==='login'?'SELAMAT DATANG KEMBALI':'MULAI GRATIS'}</span><h2>{mode==='login'?'Masuk ke KataKita':'Buat akun belajar'}</h2><p>{mode==='login'?'Lanjutkan progres dan kerjakan latihanmu.':'Simpan progres dan buka latihan setelah setiap tema.'}</p><div className="auth-tabs"><button className={mode==='login'?'active':''} onClick={()=>setMode('login')}>Masuk</button><button className={mode==='register'?'active':''} onClick={()=>setMode('register')}>Daftar</button></div><form onSubmit={submit}>{mode==='register'&&<label>Nama<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Nama kamu"/></label>}<label>Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@email.com"/></label><label>Kata sandi<input required minLength="6" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimal 6 karakter"/></label>{mode==='register'&&<div className="email-note">✉️ Tautan verifikasi akan dikirim ke email ini. Akun aktif setelah tautan dibuka.</div>}<button className="primary full" type="submit">{mode==='login'?'Masuk':'Daftar gratis'}</button></form><small className="prototype-note">Demo lokal belum mengirim email. Verifikasi aktif saat Supabase Auth dihubungkan.</small></section></div>;
}

function TypeButtons({onStart}) { return <div className="quiz-type-grid"><button onClick={()=>onStart('choice')}><span>🖼️</span><b>Pilihan Ganda</b><small>Pilih jawaban yang tepat</small></button><button onClick={()=>onStart('letters')}><span>🔤</span><b>Susun Huruf</b><small>Drag huruf ke jawaban</small></button><button onClick={()=>onStart('listening')}><span>🔊</span><b>Listening</b><small>Dengarkan lalu pilih gambar</small></button><button onClick={()=>onStart('sentence')}><span>🧩</span><b>Susun Kalimat</b><small>Latihan lanjutan gratis</small></button></div>; }

function FinishModal({user,theme,onClose,onAuth,onQuiz}) { return <div className="modal-backdrop"><section className="modal-card finish-modal fade-in"><button className="modal-close" onClick={onClose}>×</button><span className="modal-emoji">🎉</span><span className="eyebrow">MATERI SELESAI</span><h2>Kamu sudah mempelajari 20 kata!</h2><p>{user?`Pilih jenis latihan untuk tema ${theme.title}.`:'Daftar atau masuk terlebih dahulu untuk membuka latihan soal dan menyimpan nilaimu.'}</p>{user?<><TypeButtons onStart={onQuiz}/><button className="secondary full" onClick={onClose}>Nanti saja</button></>:<><button className="primary full" onClick={onAuth}>Masuk / Daftar untuk latihan</button><button className="secondary full" onClick={onClose}>Kembali ke materi</button></>}</section></div>; }

function PracticeModal({theme,onClose,onStart}) { return <div className="modal-backdrop"><section className="modal-card finish-modal fade-in"><button className="modal-close" onClick={onClose}>×</button><span className="modal-emoji">{theme.emoji}</span><span className="eyebrow">LATIHAN · {theme.subtitle.toUpperCase()}</span><h2>{theme.title}</h2><p>Pilih jenis latihan yang ingin kamu kerjakan sekarang.</p><TypeButtons onStart={onStart}/><button className="secondary full" onClick={onClose}>Batal</button></section></div>; }

function Quiz({quiz,onAnswer,onNext,onSpeak,onDone}) {
  if(quiz.finished) return <div className="result-page fade-in"><div className="confetti">✦</div><span className="trophy">🏆</span><span className="eyebrow">TES SELESAI</span><h1>{quiz.finalScore >= 70 ? 'Kerja bagus!' : 'Ayo coba lagi!'}</h1><p>Kamu menjawab {quiz.correct} dari {quiz.questions.length} soal dengan benar.</p><div className="score-ring"><b>{quiz.finalScore}</b><small>NILAI</small></div><button className="primary next" onClick={onDone}>Kembali ke beranda <Icon name="arrow" size={19}/></button></div>;
  const q=quiz.questions[quiz.index];
  const typeLabel={choice:'PILIHAN GANDA',letters:'SUSUN HURUF',listening:'LISTENING',sentence:'SUSUN KALIMAT'}[q.type];
  return <div className="quiz-page fade-in"><div className="lesson-top"><button className="icon-button" onClick={onDone}><Icon name="back"/></button><div><small>Tes · {quiz.theme.title}</small><div className="step-bar"><i style={{width:`${((quiz.index+1)/quiz.questions.length)*100}%`}}/></div></div><span>{quiz.index+1}/{quiz.questions.length}</span></div><div className="quiz-card"><span className="eyebrow">{typeLabel}</span><h1>{q.type==='choice'?'Apa bahasa Inggrisnya?':q.type==='letters'?'Susun huruf yang benar':q.type==='listening'?'Dengarkan lalu pilih jawabannya':'Susun kalimat bahasa Inggrisnya'}</h1>{q.type==='listening'?<ListeningQuestion question={q} disabled={quiz.checked} onSpeak={onSpeak} onAnswer={onAnswer}/>:q.type==='sentence'?<SentenceQuestion word={q.word} disabled={quiz.checked} onAnswer={onAnswer}/>:<><div className="quiz-emoji">{q.word.emoji}</div><h2>{q.word.idn}</h2>{q.type==='choice'?<div className="options">{q.options.map(o=><button key={o.id} disabled={quiz.checked} className={quiz.checked?(o.id===q.word.id?'correct':quiz.answer===o.en?'wrong':''):''} onClick={()=>onAnswer(o.en)}>{o.en}</button>)}</div>:<LetterQuestion word={q.word.en} disabled={quiz.checked} answer={quiz.answer} onAnswer={onAnswer}/>}</>} {quiz.checked&&<div className={`feedback ${quiz.wasCorrect?'good':'bad'}`}><b>{quiz.wasCorrect?'Benar! 🎉':'Belum tepat'}</b><span>{quiz.wasCorrect?'Kamu hebat!':`Jawaban yang benar: ${q.type==='sentence'?q.word.example:q.word.en}`}</span><button onClick={()=>onSpeak(q.word.en)}><Icon name="volume" size={18}/></button></div>}</div>{quiz.checked&&<button className="primary next" onClick={onNext}>{quiz.index===quiz.questions.length-1?'Lihat nilai':'Soal berikutnya'} <Icon name="arrow" size={19}/></button>}</div>;
}

function ListeningQuestion({question,disabled,onSpeak,onAnswer}) { return <div className="listening-question"><button className="listen-big" onClick={()=>onSpeak(question.word.en)}><Icon name="volume" size={26}/> Putar suara bahasa Inggris</button><p>Manakah kata yang kamu dengar?</p><div className="listen-options">{question.options.map(o=><button key={o.id} disabled={disabled} onClick={()=>onAnswer(o.en)}><span>{o.emoji}</span><b>{o.en}</b></button>)}</div></div>; }

function SentenceQuestion({word,disabled,onAnswer}) { const make=()=>word.example.replace(/[.?!]/g,'').split(' ').map((text,i)=>({id:`${text}-${i}`,text})).sort(()=>Math.random()-.5); const [bank,setBank]=useState(make); const [answer,setAnswer]=useState([]); useEffect(()=>{setBank(make());setAnswer([])},[word.id]); const toAnswer=id=>{if(disabled)return;const x=bank.find(t=>t.id===id);if(x){setBank(v=>v.filter(t=>t.id!==id));setAnswer(v=>[...v,x])}};const toBank=id=>{if(disabled)return;const x=answer.find(t=>t.id===id);if(x){setAnswer(v=>v.filter(t=>t.id!==id));setBank(v=>[...v,x])}};const dragStart=(event,id,from)=>{event.dataTransfer.setData('text/plain',JSON.stringify({id,from}))};const dropWord=event=>{event.preventDefault();if(disabled)return;try{const {id,from}=JSON.parse(event.dataTransfer.getData('text/plain'));from==='bank'?toAnswer(id):toBank(id)}catch{}};return <div className="sentence-question"><div className="sentence-prompt">{word.translation}</div><p>Susun kata-kata ini menjadi kalimat bahasa Inggris. Seret kata atau ketuk untuk memindahkannya.</p><div className="answer-drop sentence-drop" onDragOver={e=>e.preventDefault()} onDrop={dropWord}>{answer.length?answer.map(t=><button draggable={!disabled} onDragStart={e=>dragStart(e,t.id,'answer')} key={t.id} onClick={()=>toBank(t.id)}>{t.text}</button>):<span>Taruh kata di sini</span>}</div><div className="letter-hint">{bank.map(t=><button draggable={!disabled} onDragStart={e=>dragStart(e,t.id,'bank')} key={t.id} onClick={()=>toAnswer(t.id)}>{t.text}</button>)}</div><button className="primary" disabled={answer.length!==word.example.replace(/[.?!]/g,'').split(' ').length||disabled} onClick={()=>onAnswer(`${answer.map(t=>t.text).join(' ')}.`)}>Periksa jawaban</button></div>; }

function LetterQuestion({word,disabled,onAnswer}) {
  const makeTiles=()=>word.toUpperCase().split('').map((letter,i)=>({id:`${letter}-${i}`,letter})).sort(()=>Math.random()-.5);
  const [bank,setBank]=useState(makeTiles); const [answer,setAnswer]=useState([]);
  useEffect(()=>{setBank(makeTiles());setAnswer([])},[word]);
  const moveToAnswer=id=>{if(disabled)return;const tile=bank.find(t=>t.id===id);if(tile){setBank(x=>x.filter(t=>t.id!==id));setAnswer(x=>[...x,tile])}};
  const moveToBank=id=>{if(disabled)return;const tile=answer.find(t=>t.id===id);if(tile){setAnswer(x=>x.filter(t=>t.id!==id));setBank(x=>[...x,tile])}};
  const drop=(e,target)=>{e.preventDefault();const id=e.dataTransfer.getData('text/plain');target==='answer'?moveToAnswer(id):moveToBank(id)};
  return <div className="letter-box"><p className="drag-help">Drag huruf ke kotak jawaban atau ketuk satu per satu.</p><div className="answer-drop" onDragOver={e=>e.preventDefault()} onDrop={e=>drop(e,'answer')}>{answer.length?answer.map(t=><button draggable={!disabled} onDragStart={e=>e.dataTransfer.setData('text/plain',t.id)} onClick={()=>moveToBank(t.id)} key={t.id}>{t.letter}</button>):<span>Taruh huruf di sini</span>}</div><div className="letter-hint" onDragOver={e=>e.preventDefault()} onDrop={e=>drop(e,'bank')}>{bank.map(t=><button draggable={!disabled} onDragStart={e=>e.dataTransfer.setData('text/plain',t.id)} onClick={()=>moveToAnswer(t.id)} key={t.id}>{t.letter}</button>)}</div><button className="primary" disabled={answer.length!==word.length||disabled} onClick={()=>onAnswer(answer.map(t=>t.letter).join(''))}>Periksa jawaban</button></div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);

