export const levels = [
  {
    id: 'A1', name: 'Beginner', label: 'Dasar', color: '#1687d9', soft: '#eaf5ff',
    target: 600, focus: 'Benda konkret, orang, tempat, dan kebutuhan sehari-hari.',
    outcome: 'Memahami dan menggunakan kata serta kalimat yang sangat sederhana.',
    themeIds: ['greetings','numbers','colors','shapes','time','family','body','home','rooms','clothes','food','school','jobs','places','worship','flowers','common','fruit','transport','animals'],
    planned: ['Greetings & Personal Information','Numbers, Colors & Shapes','Time, Days, Months & Dates','Family, Friends & Relationships'],
  },
  {
    id: 'A2', name: 'Elementary', label: 'Dasar lanjut', color: '#3977be', soft: '#edf5ff',
    target: 900, focus: 'Rutinitas, perjalanan, pekerjaan, cuaca, dan interaksi sosial.',
    outcome: 'Menjelaskan kebiasaan dan menangani percakapan singkat sehari-hari.',
    themeIds: ['routines','shopping','directions','seasons','sports','travel','cooking','health','technology','people'],
    planned: ['Daily Routines','Shopping, Money & Payments','Travel, Hotels & Holidays','Restaurants, Cooking & Food'],
  },
  {
    id: 'B1', name: 'Intermediate', label: 'Mandiri', color: '#249663', soft: '#eaf8f1',
    target: 1500, focus: 'Pengalaman, pendidikan, pekerjaan, lingkungan, dan opini.',
    outcome: 'Menyampaikan pengalaman, alasan, dan gagasan dengan cukup mandiri.',
    themeIds: ['experiences','education','worklife','travelculture','lifestyle','environment','media','society','emotions','opinions'],
    planned: ['Personal Experiences & Life Events','Education & Learning','Work & Professional Life','Environment & Sustainability','Media & Social Networks'],
  },
  {
    id: 'B2', name: 'Upper Intermediate', label: 'Mandiri lanjut', color: '#1f9e8f', soft: '#e7f8f6',
    target: 2000, focus: 'Diskusi, argumen, isu sosial, dan bahasa profesional.',
    outcome: 'Memahami informasi kompleks dan menjelaskan pendapat secara sistematis.',
    themeIds: [],
    planned: ['Business & Entrepreneurship','Science, Research & Discoveries','Technology & Digital Society','Culture, Literature & Arts','Social Issues & Ethics'],
  },
  {
    id: 'C1', name: 'Advanced', label: 'Mahir', color: '#8059ad', soft: '#f2ecf8',
    target: 2500, focus: 'Bahasa akademik, profesional, kolokasi, dan konsep abstrak.',
    outcome: 'Menggunakan bahasa secara fleksibel untuk tujuan akademik dan profesional.',
    themeIds: [],
    planned: ['Advanced Academic Vocabulary','Formal & Professional Writing','Economics & Global Finance','Advanced Science & Technology','Collocations, Phrasal Verbs & Idioms'],
  },
  {
    id: 'C2', name: 'Proficiency', label: 'Sangat mahir', color: '#9969b8', soft: '#f5eff9',
    target: 2500, focus: 'Presisi makna, nuansa, retorika, dan ungkapan idiomatis.',
    outcome: 'Memahami dan menyampaikan gagasan secara presisi, alami, dan bernuansa.',
    themeIds: [],
    planned: ['Precision & Semantic Differences','Sophisticated Academic Language','Literary Analysis & Figurative Expressions','Rhetoric, Persuasion & Debate','Rare Meanings & Precision Writing'],
  },
];

export const totalTarget = levels.reduce((sum, level) => sum + level.target, 0);
