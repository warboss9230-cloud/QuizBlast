/* ════════════════════════════════════════════════════
   QuizBlast v3.1 — script.js
   No PvP Online · All other features intact
════════════════════════════════════════════════════ */
'use strict';

/* ── Constants ─────────────────────────────────── */
const AVATARS = [
  // 🟢 FREE (0-4)
  '🐉','🦁','🐯','🦊','🐺',
  // 🔒 LOCKED — Animals (5-19)
  '🦅','🦋','🐬','🦄','🐻',
  '🐼','🦜','🦈','🦖','🦩',
  '🐸','🐙','🦝','🐨','🦬',
  // 🔒 LOCKED — More Animals (20-34)
  '🦁','🐆','🦓','🦏','🦛',
  '🐘','🦒','🦘','🦔','🐺',
  '🦀','🦞','🦑','🐡','🦭',
  // 🔒 LOCKED — Fantasy & Heroes (35-49)
  '🤖','👽','🧙','🦸','🥷',
  '🧛','🎃','🤠','🧜','🧝',
  '🧞','🧟','👾','🤺','🦹',
  // 🔒 LOCKED — Space & Nature (50-64)
  '🚀','🌙','⭐','🪐','☄️',
  '🌊','🌋','🏔️','🌈','🌪️',
  '🔥','❄️','⚡','🌸','🍄',
  // 🔒 LOCKED — Food & Fun (65-79)
  '🍕','🎮','🎯','🏆','👑',
  '💎','🎭','🎪','🃏','🎲',
  '🎸','🎹','🎺','🥁','🎻',
  // 🔒 LOCKED — Symbols & Misc (80-99)
  '🌍','🌏','🌎','🗺️','🧭',
  '⚔️','🛡️','🏹','🪄','🔮',
  '💀','☠️','🦴','👁️','🕷️',
  '🐲','🦕','🦖','🐊','🦋',
];
const FREE_AVATAR_COUNT  = 5;
const AVATAR_UNLOCK_COST = 5000;
const COIN_CORRECT=10, COIN_WRONG=-5, XP_CORRECT=10, XP_LEVEL_UP=100;
const STREAK_BONUS_3=5, STREAK_BONUS_5=10, REWARD_EVERY=5;
const POWERUP_COSTS = { hint:20,'5050':30,skip:40,freeze:50 };

const SUBJECTS = [
  {id:'math',     label:'Math',      icon:'📐'},
  {id:'english',  label:'English',   icon:'📖'},
  {id:'hindi',    label:'Hindi',     icon:'🇮🇳'},
  {id:'science',  label:'Science',   icon:'🔬'},
  {id:'computer', label:'Computer',  icon:'💻'},
  {id:'evs',      label:'EVS',       icon:'🌿'},
  {id:'gk',       label:'GK',        icon:'🌍'},
  {id:'economics',label:'Economics', icon:'💰'},
  {id:'space',    label:'Space',     icon:'🚀'},
  {id:'animals',  label:'Animals',   icon:'🦒'},
];

/* ── Helpers ────────────────────────────────────── */
const $ = id => document.getElementById(id);
const shuffle = arr => { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const clamp = (v,mn,mx) => Math.min(Math.max(v,mn),mx);
const today = () => new Date().toISOString().slice(0,10);

/* ════════════════════════════════════════════════════
   QUESTION BANK
════════════════════════════════════════════════════ */
const BANK = (() => {
  const build = fn => { const o={}; for(let c=1;c<=12;c++) o[c]=fn(c); return o; };
  return build(cls => ({
    math:[
      {q:`${cls*3} + ${cls*2} = ?`,             opts:[`${cls*5}`,`${cls*5+1}`,`${cls*5-1}`,`${cls*5+3}`],   ans:0,hint:`Add ${cls*3} and ${cls*2}`},
      {q:`${cls*4} × 2 = ?`,                    opts:[`${cls*8}`,`${cls*8+2}`,`${cls*8-2}`,`${cls*8+4}`],   ans:0,hint:`${cls*4} multiplied by 2`},
      {q:`${cls*6} ÷ 2 = ?`,                    opts:[`${cls*3}`,`${cls*3+1}`,`${cls*3-1}`,`${cls*3+2}`],   ans:0,hint:`Divide ${cls*6} by 2`},
      {q:`Square of ${cls+2}?`,                  opts:[`${(cls+2)**2}`,`${(cls+2)**2+4}`,`${(cls+2)**2-2}`,`${(cls+1)**2}`],ans:0,hint:`${cls+2} × ${cls+2}`},
      {q:`50% of ${cls*20}?`,                    opts:[`${cls*10}`,`${cls*8}`,`${cls*12}`,`${cls*5}`],       ans:0,hint:`Half of ${cls*20}`},
      {q:'Sides in a pentagon?',                 opts:['5','4','6','7'],                                     ans:0,hint:'Penta = 5'},
      {q:`${cls+10} − ${cls} = ?`,               opts:['10','11','9','12'],                                  ans:0,hint:'cls values cancel'},
      {q:`Minutes in ${cls} hour(s)?`,           opts:[`${cls*60}`,`${cls*60+5}`,`${cls*60-10}`,`${cls*45}`],ans:0,hint:'1 hr = 60 min'},
      {q:`Perimeter of square with side ${cls}?`,opts:[`${cls*4}`,`${cls*3}`,`${cls*5}`,`${cls*2}`],         ans:0,hint:'4 × side'},
      {q:`${cls*7} + ${cls*3} = ?`,              opts:[`${cls*10}`,`${cls*10+1}`,`${cls*10-1}`,`${cls*9}`],  ans:0,hint:`${cls} × 10`},
    ],
    english:[
      {q:'Which word is a noun?',                opts:['Mountain','Run','Blue','Quickly'],               ans:0,hint:'Person, place or thing'},
      {q:'Plural of "child"?',                   opts:['Children','Childs','Childes','Childrens'],       ans:0,hint:'Irregular plural'},
      {q:'Opposite of "hot"?',                   opts:['Cold','Warm','Cool','Chilly'],                   ans:0,hint:'Direct antonym'},
      {q:'"She is singing" — tense?',            opts:['Present Continuous','Past Simple','Future','Present Perfect'],ans:0,hint:'is + verb+ing'},
      {q:'Correct spelling?',                    opts:['Beautiful','Beautifull','Bueatiful','Beautifule'],ans:0,hint:'beau-ti-ful'},
      {q:'Synonym of "happy"?',                  opts:['Joyful','Sad','Angry','Tired'],                  ans:0,hint:'Positive feeling'},
      {q:'Which is a vowel?',                    opts:['A','B','C','D'],                                  ans:0,hint:'AEIOU'},
      {q:'"She ___ to school every day."',       opts:['goes','go','went','gone'],                       ans:0,hint:'She/He → goes'},
      {q:'"Quickly" is a…',                      opts:['Adverb','Adjective','Noun','Verb'],               ans:0,hint:'-ly = adverb'},
      {q:'Article before "apple"?',              opts:['An','A','The','No article'],                     ans:0,hint:'Vowel sound → An'},
    ],
    hindi:[
      {q:'"सूर्य" का अर्थ?',          opts:['Sun','Moon','Star','Sky'],            ans:0,hint:'दिन में चमकता है'},
      {q:'"पानी" का पर्यायवाची?',     opts:['जल','अग्नि','वायु','पृथ्वी'],        ans:0,hint:'H₂O'},
      {q:'हिंदी स्वरों की संख्या?',   opts:['11','9','13','15'],                   ans:0,hint:'अ आ इ ई उ ऊ…'},
      {q:'"बच्चा" का बहुवचन?',        opts:['बच्चे','बच्चों','बच्चा','बालक'],     ans:0,hint:'Masculine plural'},
      {q:'"खुश" का विलोम?',           opts:['दुखी','क्रोधी','उदास','चिंतित'],    ans:0,hint:'Happy का उल्टा'},
      {q:'"गाय" का पुल्लिंग?',        opts:['बैल','साँड','भैंसा','घोड़ा'],        ans:0,hint:'Cow का masculine'},
      {q:'देवनागरी में व्यंजन?',       opts:['33','36','26','30'],                 ans:0,hint:'क से ह'},
      {q:'"भारत" में अक्षर?',          opts:['3','4','2','5'],                     ans:0,hint:'भा-र-त'},
      {q:'"आकाश" का अर्थ?',            opts:['Sky','Water','Earth','Fire'],        ans:0,hint:'ऊपर नीला'},
      {q:'राष्ट्रगान कितने सेकंड?',    opts:['52','60','45','55'],                 ans:0,hint:'Standard version'},
    ],
    science:[
      {q:'Gas plants absorb for photosynthesis?',opts:['Carbon Dioxide','Oxygen','Nitrogen','Hydrogen'],     ans:0,hint:'CO₂'},
      {q:'The Red Planet?',                      opts:['Mars','Venus','Jupiter','Saturn'],                   ans:0,hint:'Iron oxide surface'},
      {q:'Chemical symbol for water?',           opts:['H₂O','CO₂','O₂','NaCl'],                            ans:0,hint:'2H + O'},
      {q:'Organ that pumps blood?',              opts:['Heart','Lungs','Liver','Brain'],                     ans:0,hint:'Beats ~70/min'},
      {q:'Force keeping us on ground?',          opts:['Gravity','Friction','Magnetism','Tension'],          ans:0,hint:'Newton + apple'},
      {q:'Bones in adult human body?',           opts:['206','300','150','250'],                             ans:0,hint:'More as a baby'},
      {q:'Hardest natural substance?',           opts:['Diamond','Gold','Iron','Quartz'],                    ans:0,hint:'Carbon crystal'},
      {q:'A whale is a…',                        opts:['Mammal','Fish','Reptile','Amphibian'],               ans:0,hint:'Breathes air'},
      {q:'Speed of light?',                      opts:['3×10⁸ m/s','3×10⁶ m/s','3×10⁴ m/s','3×10¹⁰ m/s'], ans:0,hint:'~300,000 km/s'},
      {q:'Vitamin from sunlight?',               opts:['Vitamin D','Vitamin C','Vitamin A','Vitamin B'],     ans:0,hint:'Sunshine vitamin'},
    ],
    computer:[
      {q:'CPU stands for?',              opts:['Central Processing Unit','Computer Processing Unit','Core Program Unit','Central Program Utility'],ans:0,hint:'Brain of computer'},
      {q:'Which is an input device?',    opts:['Keyboard','Monitor','Printer','Speaker'],               ans:0,hint:'You type on it'},
      {q:'RAM stands for?',              opts:['Random Access Memory','Read Access Memory','Random Allocated Memory','Run Access Memory'],ans:0,hint:'Temporary fast memory'},
      {q:'HTML stands for?',             opts:['HyperText Markup Language','High Text Markup Language','HyperText Machine Language','HyperText Modeling Language'],ans:0,hint:'Web language'},
      {q:'Windows OS made by?',          opts:['Microsoft','Apple','Google','IBM'],                     ans:0,hint:'Bill Gates'},
      {q:'Symbol for email?',            opts:['@','#','$','&'],                                         ans:0,hint:'"at" sign'},
      {q:'NOT a programming language?',  opts:['Photoshop','Python','Java','C++'],                      ans:0,hint:'Image editing'},
      {q:'1 Kilobyte = ?',               opts:['1024 bytes','1000 bytes','512 bytes','2048 bytes'],     ans:0,hint:'2^10'},
      {q:'Shortcut to copy?',            opts:['Ctrl+C','Ctrl+V','Ctrl+X','Ctrl+Z'],                    ans:0,hint:'C for Copy'},
      {q:'Image file extension?',        opts:['.jpg','.mp3','.exe','.txt'],                            ans:0,hint:'JPEG format'},
    ],
    evs:[
      {q:'Plants need for photosynthesis?',  opts:['Sunlight, Water & CO₂','Only Water','Sunlight & O₂','CO₂ & N₂'],ans:0,hint:'Green leaf process'},
      {q:'Where do fish live?',              opts:['Water','Land','Air','Underground'],                  ans:0,hint:'Gills'},
      {q:'Primary energy source on Earth?', opts:['Sun','Wind','Water','Fire'],                         ans:0,hint:'Shines every day'},
      {q:'Most of atmosphere is?',          opts:['Nitrogen','Oxygen','Carbon Dioxide','Argon'],        ans:0,hint:'~78% of air'},
      {q:'Animals eating only plants?',     opts:['Herbivores','Carnivores','Omnivores','Scavengers'],  ans:0,hint:'Herbi = herb'},
      {q:'Earth layers count?',             opts:['4','3','5','2'],                                     ans:0,hint:'Crust to Inner Core'},
      {q:"Earth's surface is water?",       opts:['71%','50%','60%','80%'],                             ans:0,hint:'More than two-thirds'},
      {q:'Renewable energy source?',        opts:['Solar Energy','Coal','Petroleum','Natural Gas'],     ans:0,hint:'From the Sun'},
      {q:'Water turning into vapour?',      opts:['Evaporation','Condensation','Precipitation','Filtration'],ans:0,hint:'Water cycle step 1'},
      {q:'Ozone layer is in?',              opts:['Stratosphere','Troposphere','Mesosphere','Thermosphere'],ans:0,hint:'Strato = layered'},
    ],
    gk:[
      {q:'Capital of India?',               opts:['New Delhi','Mumbai','Kolkata','Chennai'],            ans:0,hint:'Political capital'},
      {q:'How many continents?',            opts:['7','5','6','8'],                                     ans:0,hint:'Asia, Africa, Europe…'},
      {q:'Largest ocean?',                  opts:['Pacific','Atlantic','Indian','Arctic'],              ans:0,hint:'>30% of Earth'},
      {q:'Who invented the telephone?',     opts:['Alexander Graham Bell','Thomas Edison','Nikola Tesla','Einstein'],ans:0,hint:'1876 patent'},
      {q:'National animal of India?',       opts:['Bengal Tiger','Lion','Elephant','Peacock'],          ans:0,hint:'Royal striped cat'},
      {q:'Days in a leap year?',            opts:['366','365','367','364'],                             ans:0,hint:'Feb extra day'},
      {q:'Smallest country?',               opts:['Vatican City','Monaco','Nauru','San Marino'],        ans:0,hint:'Inside Rome'},
      {q:'Who gifted Statue of Liberty?',   opts:['France','UK','Italy','Spain'],                       ans:0,hint:'Eiffel Tower country'},
      {q:'National bird of India?',         opts:['Peacock','Parrot','Eagle','Crane'],                  ans:0,hint:'Blue-green tail'},
      {q:'States in India?',                opts:['28','29','30','27'],                                 ans:0,hint:'Post 2019 J&K change'},
    ],
    economics:[
      {q:'GDP stands for?',                 opts:['Gross Domestic Product','General Domestic Product','Gross Daily Price','Government Domestic Plan'],ans:0,hint:'Total goods & services'},
      {q:'Inflation means?',               opts:['Rise in prices over time','Fall in prices','Rise in employment','Fall in GDP'],ans:0,hint:'Money buys less'},
      {q:'Who prints currency in India?',  opts:['Reserve Bank of India','State Bank','Finance Ministry','SEBI'],ans:0,hint:'RBI'},
      {q:'A budget is?',                   opts:['A financial plan','A bank type','A tax form','A trade policy'],ans:0,hint:'Income vs Expenditure'},
      {q:'Barter means?',                  opts:['Exchange goods without money','Buy with credit','Government tax','Stock trade'],ans:0,hint:'Ancient trade'},
      {q:'Supply & demand determines?',    opts:['Price','Quality','Weight','Colour'],                  ans:0,hint:'More demand → higher ?'},
      {q:'Farming sector?',                opts:['Primary','Secondary','Tertiary','Quaternary'],        ans:0,hint:'First/basic sector'},
      {q:'Currency of Japan?',             opts:['Yen','Won','Baht','Rupee'],                           ans:0,hint:'¥ symbol'},
      {q:'A tax is?',                      opts:['Mandatory payment to government','Bank loan','Company profit','Import duty only'],ans:0,hint:'Funds public services'},
      {q:'FDI stands for?',                opts:['Foreign Direct Investment','Federal Direct Income','Financial Domestic Index','Future Development Initiative'],ans:0,hint:'International capital'},
    ],
    space:[
      {q:'Planet closest to Sun?',          opts:['Mercury','Venus','Earth','Mars'],                    ans:0,hint:'Innermost planet'},
      {q:'Light Sun→Earth takes?',          opts:['~8 minutes','1 hour','1 second','24 hours'],         ans:0,hint:'~8.3 minutes'},
      {q:'A light year is?',                opts:['Distance light travels in a year','Time to circle Earth','Speed of light','Age of universe'],ans:0,hint:'~9.46 trillion km'},
      {q:'Largest planet?',                 opts:['Jupiter','Saturn','Uranus','Neptune'],               ans:0,hint:'Great Red Spot'},
      {q:'Name of our galaxy?',             opts:['Milky Way','Andromeda','Triangulum','Sombrero'],     ans:0,hint:'We live inside it'},
      {q:'Mars moons count?',               opts:['2','1','0','4'],                                     ans:0,hint:'Phobos and Deimos'},
      {q:'First human in space?',           opts:['Yuri Gagarin','Neil Armstrong','Buzz Aldrin','Alan Shepard'],ans:0,hint:'Soviet 1961'},
      {q:'What is a black hole?',           opts:['Region gravity pulls everything incl. light','Dark star','Empty void','Collapsed moon'],ans:0,hint:'Even light trapped'},
      {q:'Planet with most prominent rings?',opts:['Saturn','Jupiter','Earth','Venus'],                 ans:0,hint:'Beautiful rings'},
      {q:'Planets in solar system?',        opts:['8','9','7','10'],                                    ans:0,hint:'Pluto reclassified 2006'},
    ],
    animals:[
      {q:'Fastest land animal?',            opts:['Cheetah','Lion','Leopard','Horse'],                  ans:0,hint:'120 km/h'},
      {q:'Bird that mimics speech?',        opts:['Parrot','Eagle','Sparrow','Crow'],                   ans:0,hint:'Colourful tropical bird'},
      {q:'Largest land animal?',            opts:['African Elephant','Giraffe','Hippo','Rhino'],        ans:0,hint:'Long trunk'},
      {q:'"Ship of the Desert"?',           opts:['Camel','Elephant','Horse','Donkey'],                 ans:0,hint:'Has humps'},
      {q:'Insect legs count?',              opts:['6','8','4','10'],                                    ans:0,hint:'3 pairs'},
      {q:'Pandas mainly eat?',              opts:['Bamboo','Meat','Fish','Fruits'],                     ans:0,hint:'Black & white bear'},
      {q:'Tallest animal?',                 opts:['Giraffe','Elephant','Horse','Ostrich'],              ans:0,hint:'Long neck'},
      {q:'Group of lions?',                 opts:['Pride','Herd','Pack','Flock'],                       ans:0,hint:'Lions live in a ?'},
      {q:'Black & white stripes?',          opts:['Zebra','Tiger','Panda','Skunk'],                    ans:0,hint:'African horse-like'},
      {q:'National bird of India?',         opts:['Peacock','Parrot','Eagle','Crane'],                  ans:0,hint:'Blue-green tail feathers'},
    ],
  }));
})();

/* ════════════════════════════════════════════════════
   ACHIEVEMENT BADGES
════════════════════════════════════════════════════ */
const ALL_BADGES = [
  {id:'first_quiz',  icon:'🎯',name:'First Step',     desc:'Complete your first quiz',       check:s=>s.totalGames>=1},
  {id:'quiz5',       icon:'🎮',name:'Quiz Addict',    desc:'Play 5 quizzes',                 check:s=>s.totalGames>=5},
  {id:'quiz25',      icon:'🏅',name:'Dedicated',      desc:'Play 25 quizzes',                check:s=>s.totalGames>=25},
  {id:'quiz50',      icon:'🏆',name:'Champion',       desc:'Play 50 quizzes',                check:s=>s.totalGames>=50},
  {id:'perfect',     icon:'💯',name:'Perfect Score',  desc:'Score 10/10 in any quiz',        check:s=>s.bestAccuracy>=100},
  {id:'ace90',       icon:'⭐',name:'Ace',             desc:'Score 90%+ accuracy',            check:s=>s.bestAccuracy>=90},
  {id:'score500',    icon:'📊',name:'High Scorer',    desc:'Earn 500 total points',          check:s=>s.totalScore>=500},
  {id:'score5000',   icon:'🌟',name:'Score Master',   desc:'Earn 5000 total points',         check:s=>s.totalScore>=5000},
  {id:'coins1000',   icon:'🪙',name:'Rich',           desc:'Collect 1,000 coins',            check:s=>s.coins>=1000},
  {id:'coins10000',  icon:'💰',name:'Millionaire',    desc:'Collect 10,000 coins',           check:s=>s.coins>=10000},
  {id:'level5',      icon:'⚡',name:'Rising Star',    desc:'Reach Level 5',                  check:s=>s.level>=5},
  {id:'level10',     icon:'🔥',name:'Power Player',   desc:'Reach Level 10',                 check:s=>s.level>=10},
  {id:'level20',     icon:'🚀',name:'Rocket',         desc:'Reach Level 20',                 check:s=>s.level>=20},
  {id:'streak3',     icon:'🔥',name:'On Fire',        desc:'3 correct in a row',             check:s=>s.maxStreak>=3},
  {id:'streak5',     icon:'🌋',name:'Unstoppable',    desc:'5 correct in a row',             check:s=>s.maxStreak>=5},
  {id:'streak10',    icon:'⚡',name:'Electric',       desc:'10 correct in a row',            check:s=>s.maxStreak>=10},
  {id:'daystreak3',  icon:'📅',name:'3 Day Warrior',  desc:'Study 3 days in a row',          check:s=>s.dayStreak>=3},
  {id:'daystreak7',  icon:'🗓️',name:'Week Warrior',   desc:'Study 7 days in a row',          check:s=>s.dayStreak>=7},
  {id:'all_subjects',icon:'📚',name:'All-Rounder',    desc:'Play all 10 subjects',           check:s=>(s.subjectsPlayed||[]).length>=10},
  {id:'boss_win',    icon:'⚔️',name:'Boss Slayer',    desc:'Defeat your first boss',         check:s=>s.bossWins>=1},
  {id:'boss5',       icon:'🗡️',name:'Dragon Slayer',  desc:'Defeat 5 bosses',                check:s=>s.bossWins>=5},
  {id:'daily7',      icon:'☀️',name:'Daily Player',   desc:'Complete 7 daily challenges',    check:s=>s.dailyDone>=7},
  {id:'exam_pass',   icon:'📝',name:'Scholar',        desc:'Pass Exam Mode (70%+)',           check:s=>s.examPassed>=1},
  {id:'pvp_win',     icon:'🥊',name:'Street Fighter', desc:'Win a PvP battle',               check:s=>s.pvpWins>=1},
  {id:'pvp5',        icon:'👑',name:'PvP King',       desc:'Win 5 PvP battles',              check:s=>s.pvpWins>=5},
  {id:'level_clear', icon:'🏆',name:'Stage Master',   desc:'Clear all 10 Level Mode stages', check:s=>s.levelStagesCleared>=10},
  {id:'unlock1',     icon:'🎭',name:'Collector',      desc:'Unlock 1 avatar',                check:s=>(s.unlockedAvatars||[]).length>=1},
  {id:'unlock5',     icon:'🎨',name:'Art Lover',      desc:'Unlock 5 avatars',               check:s=>(s.unlockedAvatars||[]).length>=5},
  {id:'no_powerup',  icon:'🧘',name:'Purist',         desc:'Finish quiz without power-up',   check:s=>s.puristWins>=1},
  {id:'flawless',    icon:'✨',name:'Flawless',        desc:'Answer all questions correctly', check:s=>s.flawlessGames>=1},
];

/* ════════════════════════════════════════════════════
   SOUND
════════════════════════════════════════════════════ */
const Sound = (() => {
  let muted = localStorage.getItem('qb_muted') === '1';
  let _ctx = null;

  function ctx() {
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (_ctx.state === 'suspended') _ctx.resume();
    return _ctx;
  }

  /* ─── Low-level helpers ─────────────────────────────── */
  function note(c, freq, startT, dur, vol, wave='sine', slide=null) {
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = wave;
    o.frequency.setValueAtTime(freq, startT);
    if (slide) o.frequency.linearRampToValueAtTime(slide, startT + dur);
    g.gain.setValueAtTime(0.001, startT);
    g.gain.linearRampToValueAtTime(vol, startT + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, startT + dur);
    o.start(startT); o.stop(startT + dur + 0.04);
  }

  function chord(c, freqs, startT, dur, vol, wave='sine') {
    freqs.forEach(f => note(c, f, startT, dur, vol / freqs.length, wave));
  }

  /* ─── KBC CORRECT — "Lock Kiya!" ────────────────────── */
  function playCorrect() {
    const c = ctx(), now = c.currentTime;
    // Rising arpeggio
    [523,659,784,1046].forEach((f,i) => note(c,f,now+i*0.08,0.15,0.28,'sine'));
    // Triumphant chord
    chord(c,[261,392,523,659], now+0.36, 0.55, 0.55, 'triangle');
    // Sparkle
    [1568,1760,2093].forEach((f,i) => note(c,f,now+0.52+i*0.06,0.15,0.18,'sine'));
  }

  /* ─── KBC WRONG — "Galat Jawab!" ────────────────────── */
  function playWrong() {
    const c = ctx(), now = c.currentTime;
    // Descending sawtooth drop
    [300,250,200,160,130].forEach((f,i) => note(c,f,now+i*0.07,0.22,0.22,'sawtooth'));
    // Bass thud
    [90,75,60].forEach((f,i) => note(c,f,now+0.34+i*0.06,0.22,0.2,'square'));
    // Sliding sad note
    note(c, 120, now+0.58, 0.5, 0.18, 'sawtooth', 75);
  }

  /* ─── LEVEL UP — Grand fanfare ──────────────────────── */
  function playLevelUp() {
    const c = ctx(), now = c.currentTime;
    // Fast rising scale
    [392,494,587,698,784,988,1175].forEach((f,i) => note(c,f,now+i*0.07,0.14,0.22,'sine'));
    // Final triumphant chord + bass
    chord(c,[196,392,587,784], now+0.55, 0.8, 0.6, 'triangle');
    // Extra shine
    [1568,1760].forEach((f,i) => note(c,f,now+0.6+i*0.08,0.2,0.15,'sine'));
  }

  /* ─── COIN — Bright ping ────────────────────────────── */
  function playCoin() {
    const c = ctx(), now = c.currentTime;
    note(c, 1046, now,      0.08, 0.25, 'sine');
    note(c, 1318, now+0.07, 0.07, 0.2,  'sine');
    note(c, 1568, now+0.13, 0.1,  0.18, 'sine');
  }

  /* ─── POWERUP — Sci-fi charge ───────────────────────── */
  function playPowerup() {
    const c = ctx(), now = c.currentTime;
    // Rising wobble
    note(c, 220, now,    0.08, 0.15, 'triangle', 440);
    note(c, 440, now+0.09, 0.08, 0.18, 'triangle', 880);
    note(c, 880, now+0.18, 0.12, 0.2,  'sine');
    note(c, 1108,now+0.28, 0.1,  0.18, 'sine');
  }

  /* ─── REWARD — Magic sparkle ────────────────────────── */
  function playReward() {
    const c = ctx(), now = c.currentTime;
    [523,659,784,988,1175,1318,1568].forEach((f,i) =>
      note(c,f, now+i*0.07, 0.15, 0.22, 'sine')
    );
    chord(c,[523,659,784], now+0.55, 0.5, 0.45, 'sine');
  }

  /* ─── UNLOCK — Shimmer reveal ───────────────────────── */
  function playUnlock() {
    const c = ctx(), now = c.currentTime;
    // Shimmering rise
    [659,784,988,1175,1318,1568,1760,2093].forEach((f,i) =>
      note(c,f, now+i*0.055, 0.12, 0.18, 'sine')
    );
    chord(c,[659,988,1318], now+0.5, 0.45, 0.42, 'triangle');
  }

  /* ─── BOSS HIT — Heavy impact ───────────────────────── */
  function playBoss() {
    const c = ctx(), now = c.currentTime;
    // Punch impact
    note(c, 150, now,      0.05, 0.35, 'square', 60);
    note(c, 100, now+0.05, 0.15, 0.28, 'sawtooth');
    note(c, 60,  now+0.18, 0.25, 0.22, 'sawtooth', 40);
    // Rumble
    [80,70,60,50].forEach((f,i) => note(c,f, now+0.25+i*0.05, 0.1, 0.12, 'square'));
  }

  /* ─── VICTORY — Epic finale ─────────────────────────── */
  function playVictory() {
    const c = ctx(), now = c.currentTime;
    // Heroic scale
    [392,494,587,698,784,880,988,1175].forEach((f,i) =>
      note(c,f, now+i*0.075, 0.16, 0.22, 'sine')
    );
    // Grand chord
    chord(c,[196,294,392,587,784], now+0.65, 1.0, 0.65, 'triangle');
    // Sparkle burst
    [1568,1760,1976,2093].forEach((f,i) =>
      note(c,f, now+0.7+i*0.06, 0.18, 0.16, 'sine')
    );
    // Bass hit
    note(c, 98, now+0.65, 0.6, 0.28, 'square');
  }

  /* ─── Main dispatcher ───────────────────────────────── */
  function play(name) {
    if (muted) return;
    try {
      ({
        correct: playCorrect,
        wrong:   playWrong,
        levelup: playLevelUp,
        coin:    playCoin,
        powerup: playPowerup,
        reward:  playReward,
        unlock:  playUnlock,
        boss:    playBoss,
        victory: playVictory,
      }[name] || playCorrect)();
    } catch(e) {}
  }

  function setMuted(v) { muted=v; localStorage.setItem('qb_muted',v?'1':'0'); syncUI(); }
  function toggle()    { setMuted(!muted); }
  function syncUI() {
    const b=$('soundToggle'); if(b){ b.textContent=muted?'🔇':'🔊'; b.classList.toggle('muted',muted); }
    const c=$('settingSound'); if(c) c.checked=!muted;
  }
  function init() { syncUI(); }
  return { play, setMuted, toggle, init };
})();


/* ════════════════════════════════════════════════════
   SETTINGS
════════════════════════════════════════════════════ */
const Settings = (() => {
  const KEY='qb_settings';
  let cfg={theme:'dark',fontSize:'medium',sound:true,autoHint:false,animations:true,timerSeconds:10};
  function load(){
    try{const r=localStorage.getItem(KEY);if(r)cfg={...cfg,...JSON.parse(r)};}catch(e){}
    applyAll();
  }
  function applyAll(){
    document.documentElement.setAttribute('data-theme',cfg.theme);
    document.documentElement.setAttribute('data-font',cfg.fontSize);
    if(!cfg.animations)document.documentElement.setAttribute('data-no-anim','');
    else document.documentElement.removeAttribute('data-no-anim');
    Sound.setMuted(!cfg.sound);
  }
  function persist(){localStorage.setItem(KEY,JSON.stringify(cfg));}
  function save(){
    cfg.autoHint=$('settingAutoHint')?.checked??cfg.autoHint;
    cfg.animations=$('settingAnimations')?.checked??cfg.animations;
    persist();
  }
  function open(){
    const dm=$('settingDarkMode');  if(dm)dm.checked=cfg.theme==='dark';
    const ss=$('settingSound');     if(ss)ss.checked=cfg.sound;
    const ah=$('settingAutoHint');  if(ah)ah.checked=cfg.autoHint;
    const sa=$('settingAnimations');if(sa)sa.checked=cfg.animations;
    ['small','medium','large'].forEach(s=>{const b=$('fs-'+s);if(b)b.classList.toggle('active',cfg.fontSize===s);});
    [5,10,15,30].forEach(t=>{const b=$('ts-'+t);if(b)b.classList.toggle('active',cfg.timerSeconds===t);});
    const p=Player.get(),sg=$('settingsStatsGrid');
    if(sg)sg.innerHTML=`
      <div class="ssg-item"><div class="ssg-val">${p.coins}</div><div class="ssg-lbl">🪙 Coins</div></div>
      <div class="ssg-item"><div class="ssg-val">${p.xp}</div><div class="ssg-lbl">⚡ XP</div></div>
      <div class="ssg-item"><div class="ssg-val">${p.level}</div><div class="ssg-lbl">🏅 Level</div></div>
      <div class="ssg-item"><div class="ssg-val">${p.streak}</div><div class="ssg-lbl">🔥 Streak</div></div>
      <div class="ssg-item"><div class="ssg-val">${p.totalGames||0}</div><div class="ssg-lbl">🎮 Games</div></div>
      <div class="ssg-item"><div class="ssg-val">${(p.unlockedAvatars||[]).length}</div><div class="ssg-lbl">🎭 Avatars</div></div>`;
    Profile.initEdit();
    $('settingsOverlay').style.display='flex';
  }
  function close(){save();applyAll();$('settingsOverlay').style.display='none';}
  function applyTheme(v){cfg.theme=v?'dark':'light';document.documentElement.setAttribute('data-theme',cfg.theme);persist();}
  function applySound(v){cfg.sound=v;Sound.setMuted(!v);persist();}
  function applyAnimations(v){cfg.animations=v;if(!v)document.documentElement.setAttribute('data-no-anim','');else document.documentElement.removeAttribute('data-no-anim');persist();}
  function setFontSize(s){cfg.fontSize=s;document.documentElement.setAttribute('data-font',s);['small','medium','large'].forEach(x=>{const b=$('fs-'+x);if(b)b.classList.toggle('active',x===s);});persist();}
  function setTimer(s){cfg.timerSeconds=s;[5,10,15,30].forEach(t=>{const b=$('ts-'+t);if(b)b.classList.toggle('active',t===s);});persist();}
  function getTimerSeconds(){return cfg.timerSeconds||10;}
  function isAutoHint(){return!!cfg.autoHint;}
  function resetProgress(){
    if(!confirm('Reset ALL progress? This cannot be undone.'))return;
    // Clear both plain and encrypted keys
    ['qb_player','qb_lb','qb_settings'].forEach(k=>{
      localStorage.removeItem(k);
      localStorage.removeItem('_sec_'+k);
    });
    location.reload();
  }
  return{load,save,open,close,applyTheme,applySound,applyAnimations,setFontSize,setTimer,getTimerSeconds,isAutoHint,resetProgress};
})();

/* ════════════════════════════════════════════════════
   PLAYER
════════════════════════════════════════════════════ */
const Player = (() => {
  const KEY='qb_player';
  let data=null;
  const defaults=()=>({
    name:'Player',avatar:AVATARS[0],coins:100,xp:0,level:1,streak:0,
    totalGames:0,unlockedAvatars:[],totalScore:0,totalXP:0,
    bestAccuracy:0,maxStreak:0,dayStreak:0,lastStudyDate:'',studyDates:[],
    subjectsPlayed:[],classesPlayed:[],subjectStats:{},subjectAce:{},
    bossWins:0,dailyDone:0,dailyLastDate:'',examPassed:0,examTopScore:0,
    powerupsUsed:0,coinsSpent:0,puristWins:0,flawlessGames:0,
    pvpWins:0,pvpLosses:0,levelStagesCleared:0,
    unlockedBadges:[],weeklyScores:[0,0,0,0,0,0,0],
  });
  function load(){
    try{const r=localStorage.getItem(KEY);data=r?JSON.parse(r):defaults();}
    catch(e){data=defaults();}
    const def=defaults();
    Object.keys(def).forEach(k=>{if(data[k]===undefined)data[k]=def[k];});
    if(!Array.isArray(data.unlockedAvatars))data.unlockedAvatars=[];
    return data;
  }
  function save(){localStorage.setItem(KEY,JSON.stringify(data));}
  function get(){return data||load();}
  function update(patch){Object.assign(data,patch);save();}
  function isAvatarUnlocked(i){return i<FREE_AVATAR_COUNT||data.unlockedAvatars.includes(i);}
  function unlockAvatar(i){if(!data.unlockedAvatars.includes(i)){data.unlockedAvatars.push(i);data.coinsSpent+=AVATAR_UNLOCK_COST;}save();}
  function addCoins(amt){
    data.coins=Math.max(0,data.coins+amt);
    save();animateCoin(amt);updateHUD();
  }
  function addXP(amt){
    data.xp+=amt;data.totalXP=(data.totalXP||0)+amt;
    const needed=data.level*XP_LEVEL_UP;
    if(data.xp>=needed){data.xp-=needed;data.level+=1;save();LevelUp.show(data.level);}
    save();updateHUD();
  }
  function recordStudy(){
    const t=today();
    if(!data.studyDates.includes(t))data.studyDates.push(t);
    if(data.lastStudyDate){
      const diff=(new Date(t)-new Date(data.lastStudyDate))/86400000;
      if(diff===1)data.dayStreak++;
      else if(diff>1)data.dayStreak=1;
    }else{data.dayStreak=1;}
    data.lastStudyDate=t;
    save();
  }
  function addWeeklyScore(s){
    if(!Array.isArray(data.weeklyScores)||data.weeklyScores.length!==7)data.weeklyScores=[0,0,0,0,0,0,0];
    const dow=(new Date().getDay()+6)%7;
    data.weeklyScores[dow]=(data.weeklyScores[dow]||0)+s;
    save();
  }
  function updateHUD(){
    const p=data,xpPct=clamp((p.xp/(p.level*XP_LEVEL_UP))*100,0,100);
    if($('hudName'))   $('hudName').textContent=p.name;
    if($('hudAvatar')) $('hudAvatar').textContent=p.avatar;
    if($('hudCoins'))  $('hudCoins').textContent=p.coins;
    if($('hudLevel'))  $('hudLevel').textContent=p.level;
    if($('xpBar'))     $('xpBar').style.width=xpPct+'%';
    if($('quizAvatar'))     $('quizAvatar').textContent=p.avatar;
    if($('quizPlayerName')) $('quizPlayerName').textContent=p.name;
    if($('quizCoins'))      $('quizCoins').textContent=p.coins;
    if($('quizXP'))         $('quizXP').textContent=p.xp;
    if($('quizLevel'))      $('quizLevel').textContent=p.level;
    if($('bossCoins')) $('bossCoins').textContent=p.coins;
    if($('taCoins'))   $('taCoins').textContent=p.coins;
    if($('taAvatar'))  $('taAvatar').textContent=p.avatar;
    if($('lvAvatar'))  $('lvAvatar').textContent=p.avatar;
    if($('lvPlayerName')) $('lvPlayerName').textContent=p.name;
    if($('lvCoins'))   $('lvCoins').textContent=p.coins;
  }
  return{load,save,get,update,addCoins,addXP,isAvatarUnlocked,unlockAvatar,recordStudy,addWeeklyScore,updateHUD};
})();

function animateCoin(amt){
  const el=$('coinAnim');if(!el)return;
  el.textContent=(amt>0?'+':'')+amt+' 🪙';
  el.style.color=amt>0?'#ffd700':'#f87171';
  el.style.display='block';el.style.animation='none';void el.offsetWidth;
  el.style.animation='coinFloat 1.2s ease both';
  setTimeout(()=>{el.style.display='none';},1300);
}

/* ════════════════════════════════════════════════════
   BADGES
════════════════════════════════════════════════════ */
const Badges = (() => {
  function check(){
    const p=Player.get(),earned=[];
    ALL_BADGES.forEach(b=>{
      if(!p.unlockedBadges.includes(b.id)&&b.check(p)){
        p.unlockedBadges.push(b.id);earned.push(b);
      }
    });
    if(earned.length){Player.save();earned.forEach(b=>showPopup(b));}
    return earned;
  }
  function showPopup(b){
    $('badgePopupIcon').textContent=b.icon;
    $('badgePopupName').textContent=b.name;
    $('badgePopupDesc').textContent=b.desc;
    $('badgePopup').style.display='flex';
    Sound.play('reward');
  }
  function closePopup(){$('badgePopup').style.display='none';}
  return{check,showPopup,closePopup};
})();

/* ════════════════════════════════════════════════════
   AVATAR UNLOCK
════════════════════════════════════════════════════ */
const AvatarUnlock = (() => {
  let pidx=null,pgrid='avatarGrid';
  function promptFromGrid(i,emoji,gridId){
    pidx=i;pgrid=gridId||'avatarGrid';
    const p=Player.get();
    $('unlockAvatarBig').textContent=emoji;
    $('unlockBalance').textContent=p.coins;
    $('avatarUnlockOverlay').style.display='flex';
  }
  function confirm(){
    const p=Player.get();
    if(p.coins<AVATAR_UNLOCK_COST){alert(`Need 5,000 🪙, have ${p.coins}`);$('avatarUnlockOverlay').style.display='none';return;}
    Player.addCoins(-AVATAR_UNLOCK_COST);Player.unlockAvatar(pidx);
    Sound.play('unlock');$('avatarUnlockOverlay').style.display='none';
    Profile.selectByIndex(pidx,pgrid);Profile.rebuildGrid(pgrid);
    Badges.check();pidx=null;
  }
  function cancel(){pidx=null;$('avatarUnlockOverlay').style.display='none';}
  return{promptFromGrid,confirm,cancel};
})();

const LevelUp = {
  show(lv){
    Sound.play('levelup');
    $('levelUpNum').textContent=`Level ${lv}`;
    $('levelUpOverlay').style.display='flex';
    setTimeout(()=>{$('levelUpOverlay').style.display='none';},2400);
  }
};

/* ════════════════════════════════════════════════════
   APP / NAVIGATION
════════════════════════════════════════════════════ */
const App = (() => {
  function isReturning(){const p=Player.get();return p.name&&p.name!=='Player';}

  function startPlaying(){
    if(isReturning())goTo('screen-select');
    else{Profile.initNew();goTo('screen-profile');}
  }

  // Quick launch a game mode directly from splash
  function quickLaunch(mode){
    if(mode==='timeattack'){ goTo('screen-select'); setTimeout(()=>TimeAttack.start(),50); return; }
    if(mode==='boss')       { BattleHub.openBoss(); return; }
    if(mode==='pvp')        { BattleHub.openPvP();  return; }
    // Set mode then go to picker for class/subject selection
    goTo('screen-select');
    setTimeout(()=>{
      SelectScreen.setMode(mode);
      goTo('screen-picker');
    },50);
  }

  function goTo(id){
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    const s=$(id);if(!s)return;s.classList.add('active');
    // Show settings/sound FABs only on splash + home
    const homeScreens=['screen-splash','screen-select'];
    document.body.classList.toggle('home-visible', homeScreens.includes(id));
    if(id==='screen-select')      SelectScreen.refresh();
    if(id==='screen-picker')      SelectScreen.refreshPicker();
    if(id==='screen-leaderboard') Leaderboard.render();
    if(id==='screen-progress')    ProgressScreen.render();
    if(id==='screen-pvp-hub')     PvPOffline.refreshHub();
    if(id==='screen-splash')      Splash.refresh();
  }

  function init(){
    Settings.load();Sound.init();Player.load();
    SelectScreen.build();StarField.build();goTo('screen-splash');
  }
  return{goTo,startPlaying,quickLaunch,init};
})();

const StarField = {
  build(){
    const sf=$('starField');if(!sf)return;
    for(let i=0;i<80;i++){
      const s=document.createElement('div');s.className='star';
      const sz=Math.random()*2.5+.5;
      s.style.cssText=`width:${sz}px;height:${sz}px;left:${(Math.random()*100).toFixed(1)}%;top:${(Math.random()*100).toFixed(1)}%;--dur:${(Math.random()*3+2).toFixed(1)}s;--delay:${(Math.random()*4).toFixed(1)}s;opacity:${(Math.random()*.5+.15).toFixed(2)};`;
      sf.appendChild(s);
    }
  }
};

/* ════════════════════════════════════════════════════
   SPLASH MODULE — handles new vs returning player view
════════════════════════════════════════════════════ */
const Splash = {
  refresh(){
    const p = Player.get();
    const isRet = p.name && p.name !== 'Player';
    // Toggle views
    const nv=$('splashNew'), rv=$('splashReturn');
    if(nv) nv.style.display = isRet ? 'none' : 'flex';
    if(rv) rv.style.display = isRet ? 'flex' : 'none';
    if(!isRet) return;
    // Populate returning player data
    const xpPct = Math.min((p.xp/((p.level||1)*100))*100,100);
    if($('srAvatar'))  $('srAvatar').textContent  = p.avatar||'🐉';
    if($('srName'))    $('srName').textContent    = p.name;
    if($('srLevel'))   $('srLevel').textContent   = p.level||1;
    if($('srXpBar'))   $('srXpBar').style.width   = xpPct+'%';
    if($('srCoins'))   $('srCoins').textContent   = p.coins||0;
    if($('srGames'))   $('srGames').textContent   = p.totalGames||0;
    if($('srStreak'))  $('srStreak').textContent  = p.dayStreak||0;
    if($('srBadges'))  $('srBadges').textContent  = (p.unlockedBadges||[]).length;
  }
};

/* ════════════════════════════════════════════════════
   PROFILE
════════════════════════════════════════════════════ */
const Profile = (() => {
  let selIdx=0;
  function initNew(){selIdx=0;$('playerNameInput').value='';$('avatarPreview').textContent=AVATARS[0];rebuildGrid('avatarGrid');}
  function initEdit(){
    const p=Player.get();selIdx=Math.max(0,AVATARS.indexOf(p.avatar));
    const ni=$('settingsNameInput');if(ni)ni.value=p.name;
    const ap=$('settingsAvatarPreview');if(ap)ap.textContent=p.avatar;
    rebuildGrid('settingsAvatarGrid');
  }
  function rebuildGrid(gid){
    const g=$(gid);if(!g)return;g.innerHTML='';
    AVATARS.forEach((e,i)=>{
      const ul=Player.isAvatarUnlocked(i);
      const d=document.createElement('div');
      d.className='avatar-item'+(i===selIdx?' selected':'')+(ul?'':' locked');
      d.textContent=e;d.title=ul?e:'🔒 5,000 🪙';
      d.onclick=()=>{if(!ul){AvatarUnlock.promptFromGrid(i,e,gid);return;}selectByIndex(i,gid);};
      g.appendChild(d);
    });
  }
  function selectByIndex(i,gid){
    selIdx=i;const e=AVATARS[i];
    ['avatarGrid','settingsAvatarGrid'].forEach(id=>{const g=$(id);if(!g)return;g.querySelectorAll('.avatar-item').forEach((el,j)=>el.classList.toggle('selected',j===i));});
    const pid=gid==='settingsAvatarGrid'?'settingsAvatarPreview':'avatarPreview';
    const prev=$(pid);
    if(prev){prev.textContent=e;prev.style.animation='none';void prev.offsetWidth;prev.style.animation='popIn .4s cubic-bezier(.36,.07,.19,.97) both';}
    Player.updateHUD();
  }
  function save(){
    const name=$('playerNameInput').value.trim()||'Player';
    Player.update({name,avatar:AVATARS[selIdx]});Player.updateHUD();App.goTo('screen-select');
  }
  function saveFromSettings(){
    const ni=$('settingsNameInput'),name=(ni?ni.value.trim():'')||Player.get().name;
    Player.update({name,avatar:AVATARS[selIdx]});Player.updateHUD();Settings.open();
  }
  return{initNew,initEdit,rebuildGrid,selectByIndex,save,saveFromSettings};
})();

/* ════════════════════════════════════════════════════
   SELECT SCREEN
════════════════════════════════════════════════════ */
const SelectScreen = (() => {
  let cls=1,subject='math',mode='freeplay';
  function build(){
    const cg=$('classGrid');cg.innerHTML='';
    for(let c=1;c<=12;c++){
      const b=document.createElement('button');b.className='class-btn'+(c===1?' active':'');b.textContent=c;
      b.onclick=()=>{cls=c;cg.querySelectorAll('.class-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');};
      cg.appendChild(b);
    }
    const sg=$('subjectGrid');sg.innerHTML='';
    SUBJECTS.forEach(s=>{
      const b=document.createElement('button');b.className='subject-btn'+(s.id===subject?' active':'');
      b.innerHTML=`<span class="si">${s.icon}</span>${s.label}`;
      b.onclick=()=>{subject=s.id;sg.querySelectorAll('.subject-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');QuestionLoader.preload(cls,s.id);};
      sg.appendChild(b);
    });
    const mg=$('modeGrid');mg.innerHTML='';
    [{id:'freeplay',label:'Free Play',icon:'🎮',desc:'No time limit'},
     {id:'timer',   label:'Timer Mode',icon:'⏱️', desc:'10 sec / Q'},
     {id:'level',   label:'Level Mode',icon:'🏆',desc:'10 stages'}
    ].forEach(m=>{
      const b=document.createElement('button');b.className='mode-btn'+(m.id===mode?' active':'');
      b.innerHTML=`<span class="mi">${m.icon}</span><div class="mode-btn-info"><span>${m.label}</span><small>${m.desc}</small></div>`;
      b.onclick=()=>{mode=m.id;mg.querySelectorAll('.mode-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');};
      mg.appendChild(b);
    });
    updateDailyBanner();
  }
  function updateDailyBanner(){
    const p=Player.get(),banner=$('dailyBanner'),sub=$('dailySub');
    if(!banner)return;
    const done=p.dailyLastDate===today();
    banner.classList.toggle('done',done);
    if(sub)sub.textContent=done?'✅ Completed for today!':'Today\'s quiz – Tap to play!';
  }
  function refresh(){Player.updateHUD();updateDailyBanner();}
  function refreshPicker(){
    // Update mode badge on picker screen
    const badge=$('pickerModeBadge');
    if(badge){
      const modeLabels={freeplay:'🎮 Free Play',timer:'⏱️ Timer Mode',level:'🏆 Level Mode'};
      badge.textContent=modeLabels[mode]||'🎮 Free Play';
    }
  }
  function get(){return{cls,subject,mode};}
  function setMode(m){
    mode=m;
    document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('active'));
    const idx={freeplay:0,timer:1,level:2}[m]??0;
    const btns=document.querySelectorAll('.mode-btn');
    if(btns[idx])btns[idx].classList.add('active');
  }
  return{build,refresh,refreshPicker,get,setMode};
})();

/* ════════════════════════════════════════════════════
   POWER-UPS
════════════════════════════════════════════════════ */
const PowerUp = (() => {
  let used={},noneUsed=true;
  function reset(){used={};noneUsed=true;refreshButtons();}
  function refreshButtons(){
    const p=Player.get();
    [['hint','pu-hint'],['5050','pu-5050'],['skip','pu-skip'],['freeze','pu-freeze']].forEach(([id,bid])=>{
      const b=$(bid);if(!b)return;
      b.disabled=!!(used[id]||p.coins<POWERUP_COSTS[id]);
      b.classList.toggle('used',!!used[id]);
    });
  }
  function use(type){
    const p=Player.get(),cost=POWERUP_COSTS[type];
    if(used[type]||p.coins<cost)return;
    used[type]=true;noneUsed=false;
    Player.addCoins(-cost);Sound.play('powerup');
    const pd=Player.get();pd.powerupsUsed=(pd.powerupsUsed||0)+1;Player.save();
    refreshButtons();
    const q=Game.currentQuestion();if(!q)return;
    if(type==='hint'){const h=$('qHint');h.textContent=`💡 ${q.hint||'Think!'}`;h.style.display='block';}
    if(type==='5050'){let rm=0;document.querySelectorAll('.option-btn').forEach(b=>{if(rm>=2||b.disabled)return;if(!b.dataset.correct){b.classList.add('eliminated');b.disabled=true;rm++;}});}
    if(type==='skip')  Game.next(true);
    if(type==='freeze')Game.freezeTimer(5);
  }
  function wasNoneUsed(){return noneUsed;}
  return{reset,refreshButtons,use,wasNoneUsed};
})();

/* ════════════════════════════════════════════════════
   TIMER
════════════════════════════════════════════════════ */
const Timer = (() => {
  let iv=null,rem=10,frozen=false;
  function start(secs,onExpire){
    rem=secs;frozen=false;clearInterval(iv);updateUI(rem,secs);
    iv=setInterval(()=>{if(frozen)return;rem--;updateUI(rem,secs);if(rem<=0){clearInterval(iv);onExpire();}},1000);
  }
  function stop(){clearInterval(iv);}
  function freeze(s){frozen=true;setTimeout(()=>{frozen=false;},s*1000);}
  function updateUI(r,total){
    const pct=(r/total)*100;
    const bar=$('timerBar'),txt=$('timerText');
    if(bar){bar.style.width=pct+'%';bar.style.backgroundPosition=(100-pct)+'% 0';}
    if(txt)txt.textContent=r;
  }
  return{start,stop,freeze};
})();

/* ════════════════════════════════════════════════════
   REWARDS
════════════════════════════════════════════════════ */
const Rewards = {
  _fn:null,
  check(c){if(c>0&&c%REWARD_EVERY===0)this.show();},
  show(){
    Sound.play('reward');
    const pool=[
      {text:'+50 Coins! 🪙',fn:()=>Player.addCoins(50)},
      {text:'+30 XP! ⚡',   fn:()=>Player.addXP(30)},
      {text:'+80 Coins! 🪙',fn:()=>Player.addCoins(80)},
      {text:'+50 XP! ⚡',   fn:()=>Player.addXP(50)},
      {text:'Lucky +100 🪙!',fn:()=>Player.addCoins(100)},
    ];
    const pick=pool[Math.floor(Math.random()*pool.length)];
    $('rewardContent').textContent=pick.text;
    $('rewardOverlay').style.display='flex';
    this._fn=pick.fn;
  },
  close(){if(this._fn){this._fn();this._fn=null;}$('rewardOverlay').style.display='none';}
};

/* ════════════════════════════════════════════════════
   LEADERBOARD
════════════════════════════════════════════════════ */
const Leaderboard = {
  KEY:'qb_lb',
  add(name,avatar,score,coins){
    let lb=this.getAll(),i=lb.findIndex(e=>e.name===name);
    if(i>=0){if(score>lb[i].score)lb[i]={name,avatar,score,coins};}
    else lb.push({name,avatar,score,coins});
    lb=lb.sort((a,b)=>b.score-a.score).slice(0,20);
    localStorage.setItem(this.KEY,JSON.stringify(lb));
  },
  getAll(){try{return JSON.parse(localStorage.getItem(this.KEY))||[];}catch{return[];}},
  render(){
    const c=$('lbContainer'),entries=this.getAll();
    if(!entries.length){c.innerHTML='<div class="lb-empty">No scores yet.<br>Play your first quiz! 🚀</div>';return;}
    c.innerHTML=entries.map((e,i)=>{
      const cls=i===0?'gold':i===1?'silver':i===2?'bronze':'';
      const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1);
      return `<div class="lb-item"><div class="lb-rank ${cls}">${medal}</div><div class="lb-av">${e.avatar}</div><div class="lb-info"><div class="lb-name">${e.name}</div><div class="lb-sub">🪙 ${e.coins}</div></div><div class="lb-score">${e.score}pts</div></div>`;
    }).join('');
  }
};

/* ════════════════════════════════════════════════════
   PROGRESS SCREEN
════════════════════════════════════════════════════ */
const ProgressScreen = {
  tab(id){
    document.querySelectorAll('.ptab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.prog-tab').forEach(t=>t.classList.remove('active'));
    const tb=$('pt-'+id), ct=$('prog-'+id);
    if(tb) tb.classList.add('active');
    if(ct) ct.classList.add('active');
  },
  render(){
    const p=Player.get();
    if($('ovAvatar'))  $('ovAvatar').textContent=p.avatar;
    if($('ovName'))    $('ovName').textContent=p.name;
    if($('ovLevel'))   $('ovLevel').textContent=p.level;
    if($('ovXP'))      $('ovXP').textContent=p.xp;
    if($('ovXPMax'))   $('ovXPMax').textContent=p.level*XP_LEVEL_UP;
    if($('ovXpBar'))   $('ovXpBar').style.width=clamp((p.xp/(p.level*XP_LEVEL_UP))*100,0,100)+'%';
    const og=$('overviewGrid');
    if(og)og.innerHTML=`
      <div class="ov-stat"><div class="ov-val">${p.totalGames||0}</div><div class="ov-lbl">🎮 Games</div></div>
      <div class="ov-stat"><div class="ov-val">${p.coins}</div><div class="ov-lbl">🪙 Coins</div></div>
      <div class="ov-stat"><div class="ov-val">${p.totalXP||0}</div><div class="ov-lbl">⚡ XP</div></div>
      <div class="ov-stat"><div class="ov-val">${p.bestAccuracy||0}%</div><div class="ov-lbl">🎯 Best</div></div>
      <div class="ov-stat"><div class="ov-val">${p.maxStreak||0}</div><div class="ov-lbl">🔥 Max Streak</div></div>
      <div class="ov-stat"><div class="ov-val">${p.dayStreak||0}</div><div class="ov-lbl">📅 Day Streak</div></div>`;
    this.renderWeeklyChart();this.renderBadges();this.renderReportCard();this.renderCalendar();
  },
  renderWeeklyChart(){
    const wc=$('weeklyChart');if(!wc)return;
    const p=Player.get();
    const scores=Array.isArray(p.weeklyScores)&&p.weeklyScores.length===7?p.weeklyScores:[0,0,0,0,0,0,0];
    const max=Math.max(...scores,1);
    const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const todayDow=(new Date().getDay()+6)%7;
    wc.innerHTML=days.map((d,i)=>{
      const h=Math.round((scores[i]/max)*80)+10;
      return `<div class="wc-bar-wrap"><div class="wc-bar${i===todayDow?' today':''}" style="height:${h}px"></div><div class="wc-day">${d}</div></div>`;
    }).join('');
  },
  renderBadges(){
    const bg=$('badgesGrid'),bl=$('badgeCountLabel');if(!bg)return;
    const p=Player.get(),unlocked=p.unlockedBadges||[];
    if(bl)bl.textContent=`${unlocked.length}/${ALL_BADGES.length}`;
    bg.innerHTML=ALL_BADGES.map(b=>{
      const u=unlocked.includes(b.id);
      return `<div class="badge-card ${u?'unlocked':'locked'}"><div class="badge-icon">${b.icon}</div><div class="badge-name">${b.name}</div><div class="badge-desc">${b.desc}</div></div>`;
    }).join('');
  },
  renderReportCard(){
    const rc=$('reportCard');if(!rc)return;
    const p=Player.get(),ss=p.subjectStats||{};
    rc.innerHTML=SUBJECTS.map(s=>{
      const st=ss[s.id]||{played:0,correct:0,total:0};
      const pct=st.total>0?Math.round((st.correct/st.total)*100):0;
      const col=pct>=80?'var(--green)':pct>=50?'var(--gold)':'var(--red)';
      return `<div class="rc-row"><div class="rc-top"><span class="rc-subj">${s.icon} ${s.label}</span><span class="rc-pct" style="color:${col}">${pct}%</span></div><div class="rc-bar-wrap"><div class="rc-bar" style="width:${pct}%;background:${col}"></div></div><div class="rc-meta">${st.played||0} quizzes · ${st.correct||0}/${st.total||0} correct</div></div>`;
    }).join('');
  },
  renderCalendar(){
    const sc=$('studyCalendar'),cs=$('calStreak');if(!sc)return;
    const p=Player.get();
    if(cs)cs.textContent=p.dayStreak||0;
    const dates=new Set(p.studyDates||[]);
    const now=new Date(),year=now.getFullYear();
    const months=[];
    for(let m=Math.max(0,now.getMonth()-2);m<=now.getMonth();m++){
      const mn=new Date(year,m,1);
      const firstDow=(mn.getDay()+6)%7;
      const days=new Date(year,m+1,0).getDate();
      const mname=mn.toLocaleString('default',{month:'long'});
      const dowH=['M','T','W','T','F','S','S'].map(d=>`<div class="cal-dow">${d}</div>`).join('');
      let cells=Array(firstDow).fill('<div class="cal-cell empty"></div>').join('');
      for(let d=1;d<=days;d++){
        const dt=`${year}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const isT=dt===today();
        cells+=`<div class="cal-cell${isT?' today':dates.has(dt)?' studied':''}">${d}</div>`;
      }
      months.push(`<div class="cal-month"><div class="cal-month-lbl">${mname} ${year}</div><div class="cal-grid">${dowH}${cells}</div></div>`);
    }
    sc.innerHTML=months.join('');
  }
};

/* ════════════════════════════════════════════════════
   CORE GAME
════════════════════════════════════════════════════ */
const Game = (() => {
  let questions=[],qIdx=0,answered=false;
  let coinsEarned=0,xpEarned=0,correctCount=0;
  let wrongItems=[],streak=0,mode='freeplay',cfg=null;
  let qStartTime=0;

  function prepQ(raw){const c=raw.opts[raw.ans],sh=shuffle(raw.opts);return{q:raw.q,opts:sh,ans:sh.indexOf(c),hint:raw.hint};}
  // Sync fallback (used when async not available)
  function loadQsSync(){
    const sel=SelectScreen.get();
    const bank=(BANK[sel.cls]&&BANK[sel.cls][sel.subject])||[];
    return shuffle(bank).slice(0,10).map(prepQ);
  }
  function loadQs(){ return loadQsSync(); }

  function _init(qs,ocfg){
    cfg=ocfg||SelectScreen.get();
    questions=qs;qIdx=0;answered=false;
    coinsEarned=0;xpEarned=0;correctCount=0;wrongItems=[];streak=0;
    mode=cfg.mode||'freeplay';
    const p=Player.get();
    Player.update({totalGames:(p.totalGames||0)+1});
    Player.recordStudy();
    const subLabel=SUBJECTS.find(s=>s.id===cfg.subject)?.label||cfg.subject;
    // Update quiz subject badge (correct ID from HTML)
    if($('quizSubjectBadge')) $('quizSubjectBadge').textContent=subLabel;
    $('timerWrap') && ($('timerWrap').style.display=mode==='timer'?'block':'none');
    $('qNumInCardTotal') && ($('qNumInCardTotal').textContent=questions.length);
    $('qTotal') && ($('qTotal').textContent=questions.length);
    const pd=Player.get();
    if(pd.subjectsPlayed&&!pd.subjectsPlayed.includes(cfg.subject)){pd.subjectsPlayed.push(cfg.subject);Player.save();}
    if(!pd.classesPlayed){pd.classesPlayed=[];}
    if(!pd.classesPlayed.includes(cfg.cls)){pd.classesPlayed.push(cfg.cls);Player.save();}
    PowerUp.reset();FairPlay.start();App.goTo('screen-quiz');loadQuestion();
  }

  function start(){
    const sel=SelectScreen.get();
    if(sel.mode==='level'){LevelMode.start();return;}
    // Show loading indicator briefly, then load questions
    const loadBtn=document.querySelector('#screen-picker .btn-primary');
    if(loadBtn){ loadBtn.textContent='Loading…'; loadBtn.disabled=true; }
    QuestionLoader.load(sel.cls, sel.subject).then(bank=>{
      if(loadBtn){ loadBtn.textContent='🚀 Launch Quiz!'; loadBtn.disabled=false; }
      const qs=shuffle(bank).slice(0,10).map(prepQ);
      if(!qs.length){ alert('No questions found!'); return; }
      _init(qs);
    }).catch(()=>{
      if(loadBtn){ loadBtn.textContent='🚀 Launch Quiz!'; loadBtn.disabled=false; }
      _init(loadQsSync());
    });
  }

  function startDaily(){
    const p=Player.get();
    if(p.dailyLastDate===today()){alert('✅ Daily challenge already done!\nCome back tomorrow.');return;}
    QuestionLoader.load(6,'gk').then(bank=>{
      const qs=shuffle(bank).slice(0,10).map(prepQ);
      _init(qs,{cls:6,subject:'gk',mode:'timer'});
    }).catch(()=>{
      let pool=[];
      Object.values(BANK[6]||BANK[1]).forEach(arr=>pool.push(...arr));
      const qs=shuffle(pool).slice(0,10).map(prepQ);
      _init(qs,{cls:6,subject:'gk',mode:'timer'});
    });
  }

  function loadQuestion(){
    if(qIdx>=questions.length){showResult();return;}
    const q=questions[qIdx];answered=false;qStartTime=Date.now();
    $('progressFill').style.width=((qIdx/questions.length)*100)+'%';
    $('qNum').textContent=qIdx+1;$('qNumInCard').textContent=qIdx+1;
    const card=$('questionCard');
    card.classList.remove('flip');void card.offsetWidth;card.classList.add('flip');
    $('questionText').textContent=q.q;$('qHint').style.display='none';
    const subBadge=$('quizSubjectBadge');
    if(subBadge)subBadge.textContent=SUBJECTS.find(s=>s.id===cfg.subject)?.label||cfg.subject;
    if(Settings.isAutoHint()){$('qHint').textContent=`💡 ${q.hint||'Think!'}`;$('qHint').style.display='block';}
    const grid=$('optionsGrid');grid.innerHTML='';
    const labels=['A','B','C','D'],colors=['var(--opt-a)','var(--opt-b)','var(--opt-c)','var(--opt-d)'];
    q.opts.forEach((opt,i)=>{
      const b=document.createElement('button');
      b.className='option-btn';b.dataset.correct=i===q.ans?'1':'';
      b.dataset.label=labels[i];b.style.setProperty('--opt-color',colors[i]);
      b.innerHTML=`<span class="opt-letter">${labels[i]}</span>${opt}`;
      b.onclick=()=>checkAnswer(b,i===q.ans,opt);
      grid.appendChild(b);
    });
    $('nextBtn').style.display='none';PowerUp.reset();FairPlay.newQuestion();updateStreakUI();Player.updateHUD();
    if(mode==='timer')Timer.start(Settings.getTimerSeconds(),()=>{if(!answered)onTimeout();});
  }

  function checkAnswer(btn,isCorrect,selectedText){
    if(answered)return;
    if(!FairPlay.validateAnswer())return; // fair play check
    answered=true;Timer.stop();
    const snapIdx=qIdx; // snapshot index before any async changes
    document.querySelectorAll('.option-btn').forEach(b=>{b.disabled=true;if(b.dataset.correct)b.classList.add('correct');});
    if(isCorrect){
      btn.classList.add('correct');Sound.play('correct');Sound.play('coin');
      const cc=AdminCfg.get('coinCorrect',COIN_CORRECT),xe=AdminCfg.get('xpCorrect',XP_CORRECT);
      Player.addCoins(cc);Player.addXP(xe);
      coinsEarned+=cc;xpEarned+=xe;correctCount++;
      streak++;
      if(streak>(Player.get().maxStreak||0)){const pd=Player.get();pd.maxStreak=streak;Player.save();}
      if(streak===3){Player.addXP(STREAK_BONUS_3);xpEarned+=STREAK_BONUS_3;}
      if(streak>=5) {Player.addXP(STREAK_BONUS_5);xpEarned+=STREAK_BONUS_5;}
      if(AdminCfg.get('rewardEnabled',true)) Rewards.check(correctCount);
    }else{
      btn.classList.add('wrong');Sound.play('wrong');
      const cw=AdminCfg.get('coinWrong',Math.abs(COIN_WRONG));
      Player.addCoins(-cw);coinsEarned-=cw;streak=0;
      wrongItems.push({q:questions[snapIdx].q,yours:selectedText,correct:questions[snapIdx].opts[questions[snapIdx].ans]});
    }
    updateStreakUI();Player.updateHUD();$('nextBtn').style.display='block';
  }

  function onTimeout(){
    answered=true;Sound.play('wrong');streak=0;updateStreakUI();
    document.querySelectorAll('.option-btn').forEach(b=>{b.disabled=true;if(b.dataset.correct)b.classList.add('correct');});
    wrongItems.push({q:questions[qIdx].q,yours:'⏰ Time up',correct:questions[qIdx].opts[questions[qIdx].ans]});
    $('nextBtn').style.display='block';
  }

  function next(fromSkip=false){
    Timer.stop();
    if(fromSkip&&!answered){answered=true;wrongItems.push({q:questions[qIdx].q,yours:'⏭️ Skipped',correct:questions[qIdx].opts[questions[qIdx].ans]});}
    qIdx++;if(qIdx>=questions.length){showResult();return;}loadQuestion();
  }

  function updateStreakUI(){$('streakCount').textContent=streak;$('streakBadge').classList.toggle('glow',streak>=5);}

  function showResult(){
    const total=questions.length,accuracy=total?Math.round((correctCount/total)*100):0,score=correctCount*10;
    let emoji='😐',title='Keep Going!';
    if(accuracy>=90){emoji='🏆';title='Legendary!';}
    else if(accuracy>=70){emoji='🌟';title='Awesome!';}
    else if(accuracy>=50){emoji='👍';title='Not Bad!';}
    else if(accuracy<30){emoji='💪';title='Keep Practicing!';}
    $('resultEmoji').textContent=emoji;$('resultTitle').textContent=title;
    $('resultSub').textContent=`${SUBJECTS.find(s=>s.id===cfg.subject)?.label} · Class ${cfg.cls}`;
    $('rsScore').textContent=`${correctCount}/${total}`;
    $('rsAccuracy').textContent=`${accuracy}%`;
    $('rsCoins').textContent=`${coinsEarned>=0?'+':''}${coinsEarned}`;
    $('rsXP').textContent=`+${xpEarned}`;
    const pd=Player.get();
    pd.totalScore=(pd.totalScore||0)+score;
    if(accuracy>=(pd.bestAccuracy||0))pd.bestAccuracy=accuracy;
    if(correctCount===total&&total>0)pd.flawlessGames=(pd.flawlessGames||0)+1;
    if(PowerUp.wasNoneUsed()&&correctCount>0)pd.puristWins=(pd.puristWins||0)+1;
    if(mode==='daily'){pd.dailyLastDate=today();pd.dailyDone=(pd.dailyDone||0)+1;}
    if(!pd.subjectStats)pd.subjectStats={};
    if(!pd.subjectStats[cfg.subject])pd.subjectStats[cfg.subject]={played:0,correct:0,total:0};
    pd.subjectStats[cfg.subject].played++;
    pd.subjectStats[cfg.subject].correct+=correctCount;
    pd.subjectStats[cfg.subject].total+=total;
    if(accuracy>=90){if(!pd.subjectAce)pd.subjectAce={};pd.subjectAce[cfg.subject]=(pd.subjectAce[cfg.subject]||0)+1;}
    Player.addWeeklyScore(score);Player.save();
    const newBadges=Badges.check();
    const nbw=$('newBadgesWrap'),nbr=$('newBadgesRow');
    if(newBadges.length&&nbw&&nbr){
      nbw.style.display='block';
      nbr.innerHTML=newBadges.map((b,i)=>`<div class="new-badge-chip" style="animation-delay:${i*.1}s">${b.icon} ${b.name}</div>`).join('');
    }else if(nbw)nbw.style.display='none';
    const p=Player.get();Leaderboard.add(p.name,p.avatar,score,p.coins);
    if(wrongItems.length){
      $('wrongReview').style.display='block';
      $('wrongList').innerHTML=wrongItems.map(w=>`<div class="wrong-item"><div class="wi-q">❓ ${w.q}</div><div class="wi-yours">✗ ${w.yours}</div><div class="wi-correct">✓ ${w.correct}</div></div>`).join('');
    }else $('wrongReview').style.display='none';
    App.goTo('screen-result');
  }

  function playAgain(){
    qIdx=0;answered=false;coinsEarned=0;xpEarned=0;correctCount=0;wrongItems=[];streak=0;
    questions=loadQs();
    $('timerWrap').style.display=mode==='timer'?'block':'none';
    $('qNumInCardTotal').textContent=questions.length;$('qTotal').textContent=questions.length;
    App.goTo('screen-quiz');PowerUp.reset();loadQuestion();
  }
  function quit(){Timer.stop();FairPlay.stop();App.goTo('screen-select');}
  function currentQuestion(){return questions[qIdx]||null;}
  function freezeTimer(s){Timer.freeze(s);}
  return{start,startDaily,next,quit,playAgain,currentQuestion,freezeTimer};
})();

/* ════════════════════════════════════════════════════
   BOSS BATTLE MODE
════════════════════════════════════════════════════ */
const BossMode = (() => {
  const BOSSES=[
    {name:'Math Monster',   emoji:'👹',subject:'math'},
    {name:'Science Sphinx', emoji:'🦁',subject:'science'},
    {name:'GK Ghost',       emoji:'👻',subject:'gk'},
    {name:'English Dragon', emoji:'🐲',subject:'english'},
    {name:'Space Titan',    emoji:'👾',subject:'space'},
    {name:'Hindi Demon',    emoji:'😈',subject:'hindi'},
    {name:'Eco Witch',      emoji:'🧙',subject:'economics'},
  ];
  let questions=[],qIdx=0,bossHP=10,playerHP=3,boss=null;

  function start(subjectOverride){
    const sel=SelectScreen.get();
    const subj=subjectOverride||sel.subject;
    boss=BOSSES.find(b=>b.subject===subj)||BOSSES[Math.floor(Math.random()*BOSSES.length)];
    const bank=(BANK[sel.cls]&&BANK[sel.cls][boss.subject])||[];
    questions=shuffle(bank).map(r=>{const c=r.opts[r.ans],sh=shuffle(r.opts);return{q:r.q,opts:sh,ans:sh.indexOf(c),hint:r.hint};});
    qIdx=0;bossHP=10;playerHP=3;
    $('bossEmoji').textContent=boss.emoji;$('bossEmoji').className='boss-emoji';
    $('bossName').textContent=boss.name;
    updateBossUI();Player.updateHUD();
    App.goTo('screen-boss');loadBossQ();
  }

  function updateBossUI(){
    $('bossHpBar').style.width=(bossHP/10)*100+'%';$('bossHpText').textContent=`${bossHP} HP`;
    $('phpBar').style.width=(playerHP/3)*100+'%';$('phpText').textContent=`${playerHP} HP`;
  }

  function loadBossQ(){
    if(qIdx>=questions.length)qIdx=0;
    const q=questions[qIdx];
    const bc=$('bossQuestionCard');
    bc.classList.remove('flip');void bc.offsetWidth;bc.classList.add('flip');
    $('bossQuestionText').textContent=q.q;$('bossStatus').textContent='';
    const grid=$('bossOptionsGrid');grid.innerHTML='';
    const labels=['A','B','C','D'],colors=['var(--opt-a)','var(--opt-b)','var(--opt-c)','var(--opt-d)'];
    q.opts.forEach((opt,i)=>{
      const b=document.createElement('button');b.className='option-btn';
      b.dataset.correct=i===q.ans?'1':'';b.dataset.label=labels[i];
      b.style.setProperty('--opt-color',colors[i]);
      b.innerHTML=`<span class="opt-letter">${labels[i]}</span>${opt}`;
      b.onclick=()=>handleBossAnswer(b,i===q.ans);
      grid.appendChild(b);
    });
  }

  function handleBossAnswer(btn,isCorrect){
    document.querySelectorAll('#bossOptionsGrid .option-btn').forEach(b=>{b.disabled=true;if(b.dataset.correct)b.classList.add('correct');});
    if(isCorrect){
      btn.classList.add('correct');Sound.play('correct');
      bossHP--;Player.addCoins(20);
      const em=$('bossEmoji');em.classList.add('hit');
      $('bossStatus').textContent='⚔️ Hit! Boss -1 HP';
      setTimeout(()=>em.classList.remove('hit'),400);
    }else{
      btn.classList.add('wrong');Sound.play('boss');
      playerHP--;Player.addCoins(-5);
      $('bossStatus').textContent='💥 Wrong! -1 HP';
    }
    updateBossUI();Player.updateHUD();
    if(bossHP<=0){setTimeout(()=>victory(),600);return;}
    if(playerHP<=0){setTimeout(()=>defeat(),600);return;}
    qIdx++;setTimeout(()=>loadBossQ(),900);
  }

  function victory(){
    Sound.play('victory');Player.addCoins(300);Player.addXP(50);
    const pd=Player.get();pd.bossWins=(pd.bossWins||0)+1;Player.save();
    Badges.check();
    const em=$('bossEmoji');em.classList.add('dead');
    $('brEmoji').textContent='🏆';$('brTitle').textContent='Boss Defeated!';
    $('brSub').textContent=`${boss.name} is defeated!`;$('brReward').textContent='+300 🪙 +50 XP';
    setTimeout(()=>{$('bossResultOverlay').style.display='flex';},700);
  }

  function defeat(){
    Sound.play('wrong');
    $('brEmoji').textContent='💀';$('brTitle').textContent='Defeated!';
    $('brSub').textContent='The boss was too strong.';$('brReward').textContent='Try again!';
    $('bossResultOverlay').style.display='flex';
  }

  function closeResult(){$('bossResultOverlay').style.display='none';App.goTo('screen-select');}
  function quit(){App.goTo('screen-select');}
  return{start,closeResult,quit};
})();

/* ════════════════════════════════════════════════════
   LEVEL MODE — 10 Stages, easy→hard
════════════════════════════════════════════════════ */
const LevelMode = (() => {
  const TOTAL_STAGES=10, QS_PER_STAGE=5, LIVES_MAX=3;
  let stage=1,lives=LIVES_MAX,qIdx=0,questions=[],cfg=null;
  let stageScore=0,answered=false;

  function buildStageQ(stg){
    const sel=SelectScreen.get();
    const bank=(BANK[sel.cls]&&BANK[sel.cls][sel.subject])||[];
    const offset=Math.floor(((stg-1)/TOTAL_STAGES)*Math.max(0,bank.length-QS_PER_STAGE));
    return shuffle(bank).slice(offset,offset+QS_PER_STAGE*2).slice(0,QS_PER_STAGE).map(r=>{
      const c=r.opts[r.ans],sh=shuffle(r.opts);return{q:r.q,opts:sh,ans:sh.indexOf(c),hint:r.hint};
    });
  }

  function start(){
    cfg=SelectScreen.get();stage=1;lives=LIVES_MAX;
    Player.recordStudy();
    const pd=Player.get();Player.update({totalGames:(pd.totalGames||0)+1});
    buildStage();App.goTo('screen-level');
  }

  function buildStage(){
    questions=buildStageQ(stage);qIdx=0;stageScore=0;answered=false;
    updateStageUI();loadQ();
  }

  function updateStageUI(){
    const p=Player.get();
    if($('lvStageBadge'))  $('lvStageBadge').textContent=`Stage ${stage}`;
    if($('lvStageLabel'))  $('lvStageLabel').textContent=`Stage ${stage} of ${TOTAL_STAGES}`;
    if($('lvLives'))       $('lvLives').textContent='❤️'.repeat(lives)+'🖤'.repeat(LIVES_MAX-lives);
    if($('lvCoins'))       $('lvCoins').textContent=p.coins;
    const subBadge=$('lvSubjectBadge');
    if(subBadge)subBadge.textContent=SUBJECTS.find(s=>s.id===cfg.subject)?.label||cfg.subject;
    const dots=$('lvDots');
    if(dots)dots.innerHTML=Array.from({length:TOTAL_STAGES},(_,i)=>{
      const s=i+1,cls=s<stage?'done':s===stage?'active':'locked';
      return `<div class="stage-dot ${cls}"></div>`;
    }).join('');
    const xpBar=$('lvXpBar');
    if(xpBar)xpBar.style.width=((stage-1)/TOTAL_STAGES*100)+'%';
    Player.updateHUD();
  }

  function loadQ(){
    if(qIdx>=questions.length){stageClear();return;}
    const q=questions[qIdx];answered=false;
    if($('lvQNum'))         $('lvQNum').textContent=`Q${qIdx+1}/${QS_PER_STAGE}`;
    if($('lvHint'))         $('lvHint').style.display='none';
    if($('lvStatus'))       $('lvStatus').textContent='';
    const card=$('lvQuestionCard');
    if(card){card.classList.remove('flip');void card.offsetWidth;card.classList.add('flip');}
    if($('lvQuestionText')) $('lvQuestionText').textContent=q.q;
    const grid=$('lvOptionsGrid');if(!grid)return;
    grid.innerHTML='';
    const labels=['A','B','C','D'],colors=['var(--opt-a)','var(--opt-b)','var(--opt-c)','var(--opt-d)'];
    q.opts.forEach((opt,i)=>{
      const b=document.createElement('button');b.className='option-btn';
      b.dataset.correct=i===q.ans?'1':'';b.dataset.label=labels[i];
      b.style.setProperty('--opt-color',colors[i]);
      b.innerHTML=`<span class="opt-letter">${labels[i]}</span>${opt}`;
      b.onclick=()=>handleAnswer(b,i===q.ans);
      grid.appendChild(b);
    });
  }

  function handleAnswer(btn,isCorrect){
    if(answered)return;answered=true;
    document.querySelectorAll('#lvOptionsGrid .option-btn').forEach(b=>{b.disabled=true;if(b.dataset.correct)b.classList.add('correct');});
    const status=$('lvStatus');
    if(isCorrect){
      btn.classList.add('correct');Sound.play('correct');
      Player.addCoins(10);Player.addXP(10);stageScore++;
      if(status)status.textContent='✅ Correct! +10🪙';
    }else{
      btn.classList.add('wrong');Sound.play('wrong');
      lives--;
      if($('lvLives'))$('lvLives').textContent='❤️'.repeat(Math.max(0,lives))+'🖤'.repeat(LIVES_MAX-Math.max(0,lives));
      if(status)status.textContent=`❌ Wrong! ${'❤️'.repeat(Math.max(0,lives))} lives left`;
      if(lives<=0){setTimeout(()=>gameOver(),900);return;}
    }
    qIdx++;setTimeout(()=>loadQ(),900);
  }

  function stageClear(){
    const stars=stageScore>=5?3:stageScore>=3?2:1;
    const coins=stage*30,xp=stage*15;
    Player.addCoins(coins);Player.addXP(xp);
    Sound.play('victory');
    // Track cleared stages
    const pd=Player.get();
    pd.levelStagesCleared=Math.max(pd.levelStagesCleared||0,stage);
    Player.save();Badges.check();
    const overlay=$('stageClearOverlay');if(!overlay)return;
    if($('scStars'))  $('scStars').textContent='⭐'.repeat(stars)+'☆'.repeat(3-stars);
    if($('scTitle'))  $('scTitle').textContent=`Stage ${stage} Clear!`;
    if($('scReward')) $('scReward').textContent=`+${coins} 🪙 · +${xp} XP`;
    const isLast=stage>=TOTAL_STAGES;
    if($('scNext'))   $('scNext').textContent=isLast?'🏆 All stages complete!': `Stage ${stage+1} unlocked!`;
    overlay.style.display='flex';
    // Update button text only (onclick handled by HTML)
    const nb=overlay.querySelector('.btn-primary');
    if(nb) nb.textContent=isLast?'🏠 Finish':'Continue →';
  }

  function nextStage(){
    $('stageClearOverlay').style.display='none';
    if(stage>=TOTAL_STAGES){quit();return;}
    stage++;if(stage%3===1&&lives<LIVES_MAX)lives++;
    buildStage();
  }

  function gameOver(){
    Sound.play('wrong');
    const overlay=$('stageClearOverlay');if(!overlay)return;
    if($('scStars'))  $('scStars').textContent='💔💔💔';
    if($('scTitle'))  $('scTitle').textContent='Game Over!';
    if($('scReward')) $('scReward').textContent=`Reached Stage ${stage}`;
    if($('scNext'))   $('scNext').textContent='Try again from Stage 1';
    overlay.style.display='flex';
    const nb=overlay.querySelector('.btn-primary');
    if(nb){nb.textContent='🔄 Try Again';nb.setAttribute('onclick','LevelMode.restart()');}
  }

  function quit(){$('stageClearOverlay').style.display='none';App.goTo('screen-select');}
  function restart(){ overlay_close(); start(); }
  function overlay_close(){ const ov=$('stageClearOverlay'); if(ov) ov.style.display='none'; }
  return{start,restart,nextStage,quit};
})();

/* ════════════════════════════════════════════════════
   BATTLE HUB
════════════════════════════════════════════════════ */
const BattleHub = {
  openBoss(){ const subj=SelectScreen.get().subject||'math'; BossMode.start(subj); },
  openPvP(){  App.goTo('screen-pvp-hub'); PvPOffline.refreshHub(); },
};

/* ════════════════════════════════════════════════════
   PvP OFFLINE — Pass & Play, same device
════════════════════════════════════════════════════ */
const PvPOffline = (() => {
  let p1={name:'Player 1',avatar:'🐉',score:0};
  let p2={name:'Player 2',avatar:'🦁',score:0};
  let rounds=5,questions=[],qIdx=0,currentPlayer=1,turnAnswered=false,turnTimer=null;

  function refreshHub(){
    const p=Player.get();
    if($('pvpP1Avatar'))$('pvpP1Avatar').textContent=p.avatar;
    if($('pvpP1Name'))  $('pvpP1Name').textContent=p.name;
    renderStats();
  }

  function renderStats(){
    const p=Player.get(),sg=$('pvpStats');if(!sg)return;
    const w=p.pvpWins||0,l=p.pvpLosses||0,t=w+l;
    sg.innerHTML=`
      <div class="psc-stat"><div class="psc-val">${w}</div><div class="psc-lbl">Wins</div></div>
      <div class="psc-stat"><div class="psc-val">${l}</div><div class="psc-lbl">Losses</div></div>
      <div class="psc-stat"><div class="psc-val">${t?Math.round(w/t*100):0}%</div><div class="psc-lbl">Win Rate</div></div>`;
  }

  function setup(){App.goTo('screen-pvp-setup');refreshHub();}

  function setRounds(r){
    rounds=r;[5,10,15].forEach(n=>{const b=$('pvp-r'+n);if(b)b.classList.toggle('active',n===r);});
  }

  function start(){
    const p=Player.get();
    p1={name:p.name,avatar:p.avatar,score:0};
    const p2name=($('pvpP2NameInput')?.value||'').trim()||'Player 2';
    p2={name:p2name,avatar:'🦁',score:0};
    qIdx=0;currentPlayer=1;turnAnswered=false;
    const sel=SelectScreen.get();
    const bank=(BANK[sel.cls]&&BANK[sel.cls][sel.subject])||[];
    questions=shuffle(bank).slice(0,rounds).map(r=>{const c=r.opts[r.ans],sh=shuffle(r.opts);return{q:r.q,opts:sh,ans:sh.indexOf(c),hint:r.hint};});
    App.goTo('screen-pvp-battle');
    updateHeader();loadQ();
  }

  function updateHeader(){
    $('pvpTurnAvatarLeft').textContent=p1.avatar;
    $('pvpTurnNameLeft').textContent=p1.name;
    $('pvpTurnScoreLeft').textContent=p1.score;
    $('pvpTurnAvatarRight').textContent=p2.avatar;
    $('pvpTurnNameRight').textContent=p2.name;
    $('pvpTurnScoreRight').textContent=p2.score;
    const isP1=currentPlayer===1;
    $('pvpWhoseTurn').textContent=`${isP1?p1.name:p2.name}'s Turn`;
    $('pvpRoundLabel').textContent=`Q ${qIdx+1} / ${rounds}`;
    const leftSide=$('pvpSideLeft'), rightSide=$('pvpSideRight');
    if(leftSide) leftSide.classList.toggle('active-turn',isP1);
    if(rightSide) rightSide.classList.toggle('active-turn',!isP1);
  }

  function loadQ(){
    if(qIdx>=questions.length){showResult();return;}
    turnAnswered=false;
    const q=questions[qIdx];
    const card=$('pvpQuestionCard');
    card.classList.remove('flip');void card.offsetWidth;card.classList.add('flip');
    $('pvpQuestionText').textContent=q.q;
    $('pvpTurnOverlay').style.display='none';
    const grid=$('pvpOptionsGrid');grid.innerHTML='';
    const labels=['A','B','C','D'],colors=['var(--opt-a)','var(--opt-b)','var(--opt-c)','var(--opt-d)'];
    q.opts.forEach((opt,i)=>{
      const b=document.createElement('button');b.className='option-btn';
      b.dataset.correct=i===q.ans?'1':'';b.dataset.label=labels[i];
      b.style.setProperty('--opt-color',colors[i]);
      b.innerHTML=`<span class="opt-letter">${labels[i]}</span>${opt}`;
      b.onclick=()=>handleAnswer(b,i===q.ans,opt);
      grid.appendChild(b);
    });
    // 15s timer
    let t=15;const bar=$('pvpTimerBar');if(bar)bar.style.width='100%';
    clearInterval(turnTimer);
    turnTimer=setInterval(()=>{
      t--;if(bar)bar.style.width=(t/15*100)+'%';
      if(t<=0){clearInterval(turnTimer);if(!turnAnswered)handleAnswer(null,false,'⏰');}
    },1000);
  }

  function handleAnswer(btn,isCorrect,selectedText){
    if(turnAnswered)return;turnAnswered=true;clearInterval(turnTimer);
    document.querySelectorAll('#pvpOptionsGrid .option-btn').forEach(b=>{b.disabled=true;if(b.dataset.correct)b.classList.add('correct');});
    if(btn)btn.classList.add(isCorrect?'correct':'wrong');
    if(isCorrect){Sound.play('correct');if(currentPlayer===1)p1.score++;else p2.score++;updateHeader();}
    else Sound.play('wrong');
    const curName=currentPlayer===1?p1.name:p2.name;
    const nextName=currentPlayer===1?p2.name:p1.name;
    const ov=$('pvpTurnOverlay');
    $('pvpToEmoji').textContent=isCorrect?'✅':'❌';
    $('pvpToMsg').textContent=isCorrect?`${curName} got it! +1 Point`:`${curName} missed it!`;
    if(currentPlayer===1){
      $('pvpToNext').textContent=`Pass to ${p2.name}`;
      currentPlayer=2;ov.style.display='flex';
    }else{
      $('pvpToNext').textContent=qIdx+1>=rounds?'Final results!':'Next round!';
      currentPlayer=1;qIdx++;ov.style.display='flex';
    }
    updateHeader();
    // Ready button uses onclick="PvPOffline.nextTurn()" from HTML
  }

  function nextTurn(){$('pvpTurnOverlay').style.display='none';loadQ();}

  function showResult(){
    const p=Player.get();
    const winner=p1.score>p2.score?p1:p2.score>p1.score?p2:null;
    const isDraw=!winner;
    if(!isDraw&&winner.name===p1.name){Player.addCoins(150);Player.addXP(50);const pd=Player.get();pd.pvpWins=(pd.pvpWins||0)+1;Player.save();}
    else if(!isDraw){const pd=Player.get();pd.pvpLosses=(pd.pvpLosses||0)+1;Player.save();}
    Badges.check();
    $('pvprEmoji').textContent=isDraw?'🤝':winner.name===p1.name?'🏆':'💀';
    $('pvprTitle').textContent=isDraw?'It\'s a Draw!':`${winner.name} Wins!`;
    $('pvprSub').textContent=isDraw?'Well played!':`Score: ${p1.score} - ${p2.score}`;
    $('pvprAvatar1').textContent=p1.avatar;$('pvprName1').textContent=p1.name;$('pvprScore1').textContent=p1.score;
    $('pvprAvatar2').textContent=p2.avatar;$('pvprName2').textContent=p2.name;$('pvprScore2').textContent=p2.score;
    $('pvprCard1').classList.toggle('winner',!isDraw&&winner.name===p1.name);
    $('pvprCard2').classList.toggle('winner',!isDraw&&winner.name===p2.name);
    const rb=document.querySelector('#screen-pvp-result .btn-primary');
    if(rb){rb.textContent='🔄 Rematch';rb.onclick=rematch;}
    App.goTo('screen-pvp-result');
  }

  function rematch(){
    p1.score=0;p2.score=0;qIdx=0;currentPlayer=1;turnAnswered=false;
    const sel=SelectScreen.get();
    const bank=(BANK[sel.cls]&&BANK[sel.cls][sel.subject])||[];
    questions=shuffle(bank).slice(0,rounds).map(r=>{const c=r.opts[r.ans],sh=shuffle(r.opts);return{q:r.q,opts:sh,ans:sh.indexOf(c),hint:r.hint};});
    App.goTo('screen-pvp-battle');updateHeader();loadQ();
  }

  return{setup,setRounds,start,nextTurn,refreshHub,rematch};
})();

/* ════════════════════════════════════════════════════
   TIME ATTACK
════════════════════════════════════════════════════ */
const TimeAttack = (() => {
  let pool=[],qIdx=0,score=0,combo=0,iv=null,timeLeft=60;
  function start(){
    clearInterval(iv); iv=null; // clear any previous timer
    const sel=SelectScreen.get();
    const bank=(BANK[sel.cls]&&BANK[sel.cls][sel.subject])||[];
    pool=shuffle(bank).map(r=>{const c=r.opts[r.ans],sh=shuffle(r.opts);return{q:r.q,opts:sh,ans:sh.indexOf(c),hint:r.hint};});
    qIdx=0;score=0;combo=0;timeLeft=60;
    $('taScore').textContent=0;$('taClock').textContent=60;
    $('taClockBar').style.width='100%';$('taCombo').style.display='none';
    Player.updateHUD();App.goTo('screen-timeattack');
    loadQ();iv=setInterval(tick,1000);
  }
  function tick(){
    timeLeft--;$('taClock').textContent=timeLeft;
    $('taClockBar').style.width=(timeLeft/60)*100+'%';
    $('taClock').classList.toggle('danger',timeLeft<=10);
    if(timeLeft<=0){clearInterval(iv);showResult();}
  }
  function loadQ(){
    if(qIdx>=pool.length)qIdx=0;
    const q=pool[qIdx];
    const card=$('taQuestionCard');
    card.classList.remove('flip');void card.offsetWidth;card.classList.add('flip');
    $('taQuestionText').textContent=q.q;
    const grid=$('taOptionsGrid');grid.innerHTML='';
    const labels=['A','B','C','D'],colors=['var(--opt-a)','var(--opt-b)','var(--opt-c)','var(--opt-d)'];
    q.opts.forEach((opt,i)=>{
      const b=document.createElement('button');b.className='option-btn';
      b.dataset.correct=i===q.ans?'1':'';b.dataset.label=labels[i];
      b.style.setProperty('--opt-color',colors[i]);
      b.innerHTML=`<span class="opt-letter">${labels[i]}</span>${opt}`;
      b.onclick=()=>handleTA(b,i===q.ans);
      grid.appendChild(b);
    });
  }
  function handleTA(btn,isCorrect){
    document.querySelectorAll('#taOptionsGrid .option-btn').forEach(b=>{b.disabled=true;if(b.dataset.correct)b.classList.add('correct');});
    if(isCorrect){
      btn.classList.add('correct');Sound.play('correct');
      combo++;score+=combo>=3?2:1;
      if(combo>=3){$('taComboNum').textContent=combo;$('taCombo').style.display='block';$('taCombo').style.animation='none';void $('taCombo').offsetWidth;$('taCombo').style.animation='comboAnim .3s ease both';}
      else $('taCombo').style.display='none';
      $('taScore').textContent=score;Player.addCoins(5);
    }else{btn.classList.add('wrong');Sound.play('wrong');combo=0;$('taCombo').style.display='none';}
    qIdx++;setTimeout(()=>loadQ(),600);
  }
  function showResult(){
    const p=Player.get(),best=Math.max(p.bestTimeAttack||0,score);
    Player.update({bestTimeAttack:best});Player.addCoins(score*5);Player.addXP(score*2);
    Badges.check();
    $('tarScore').textContent=score;$('tarBest').textContent=best;$('tarCoins').textContent=`+${score*5} 🪙`;
    $('taResultOverlay').style.display='flex';
  }
  function restart(){$('taResultOverlay').style.display='none';start();}
  function exit(){clearInterval(iv);$('taResultOverlay').style.display='none';App.goTo('screen-select');}
  function quit(){clearInterval(iv);App.goTo('screen-select');}
  return{start,quit,restart,exit};
})();

/* ════════════════════════════════════════════════════
   EXAM MODE
════════════════════════════════════════════════════ */
const ExamMode = (() => {
  let questions=[],answers=[],curIdx=0,iv=null,timeLeft=45*60;
  function start(){
    clearInterval(iv); iv=null; // clear any previous timer
    const sel=SelectScreen.get();
    let pool=[];
    SUBJECTS.forEach(s=>{
      const bank=(BANK[sel.cls]&&BANK[sel.cls][s.id])||[];
      pool.push(...shuffle(bank).slice(0,4).map(r=>{const c=r.opts[r.ans],sh=shuffle(r.opts);return{q:r.q,opts:sh,ans:sh.indexOf(c),hint:r.hint,subject:s.id};}));
    });
    questions=shuffle(pool).slice(0,40);
    answers=new Array(questions.length).fill(-1);
    curIdx=0;timeLeft=45*60;
    buildDots();renderQ();
    App.goTo('screen-exam');
    iv=setInterval(()=>{timeLeft--;updateTimer();if(timeLeft<=0){clearInterval(iv);submit();}},1000);
  }
  function updateTimer(){
    const m=Math.floor(timeLeft/60),s=timeLeft%60;
    const el=$('examTimerDisplay');
    if(el){el.textContent=`${m}:${String(s).padStart(2,'0')}`;el.style.color=timeLeft<300?'var(--red)':'var(--accent2)';}
  }
  function buildDots(){
    const dw=$('examDotWrap');if(!dw)return;
    dw.innerHTML=questions.map((_,i)=>`<div class="exam-dot${i===curIdx?' current':answers[i]>=0?' answered':''}" onclick="ExamMode.gotoQ(${i})">${i+1}</div>`).join('');
  }
  function renderQ(){
    const q=questions[curIdx];
    if($('examQNum'))$('examQNum').textContent=`Q${curIdx+1}`;
    const ec=$('examQuestionCard');
    ec.classList.remove('flip');void ec.offsetWidth;ec.classList.add('flip');
    if($('examQuestionText'))$('examQuestionText').textContent=q.q;
    if($('examQLabel'))$('examQLabel').textContent=`Q ${curIdx+1} / ${questions.length}`;
    if($('examProgressBar'))$('examProgressBar').style.width=((curIdx+1)/questions.length*100)+'%';
    const grid=$('examOptionsGrid');grid.innerHTML='';
    const labels=['A','B','C','D'],colors=['var(--opt-a)','var(--opt-b)','var(--opt-c)','var(--opt-d)'];
    q.opts.forEach((opt,i)=>{
      const b=document.createElement('button');b.className='option-btn'+(answers[curIdx]===i?' correct':'');
      b.dataset.label=labels[i];b.style.setProperty('--opt-color',colors[i]);
      b.innerHTML=`<span class="opt-letter">${labels[i]}</span>${opt}`;
      b.onclick=()=>{answers[curIdx]=i;renderQ();buildDots();};
      grid.appendChild(b);
    });
    const pb=$('examPrevBtn'),nb=$('examNextBtn');
    if(pb)pb.disabled=curIdx===0;if(nb)nb.disabled=curIdx===questions.length-1;
  }
  function gotoQ(i){curIdx=clamp(i,0,questions.length-1);renderQ();buildDots();}
  function prev(){if(curIdx>0){curIdx--;renderQ();buildDots();}}
  function nextQ(){if(curIdx<questions.length-1){curIdx++;renderQ();buildDots();}}
  function submit(){
    clearInterval(iv);
    const correct=questions.reduce((acc,q,i)=>acc+(answers[i]===q.ans?1:0),0);
    const total=questions.length,accuracy=Math.round((correct/total)*100),score=correct*10;
    Player.addCoins(score);Player.addXP(score);
    const pd=Player.get();
    if(accuracy>=70)pd.examPassed=(pd.examPassed||0)+1;
    if(accuracy>=90&&accuracy>(pd.examTopScore||0))pd.examTopScore=accuracy;
    pd.totalScore=(pd.totalScore||0)+score;pd.totalGames=(pd.totalGames||0)+1;
    Player.recordStudy();Player.save();Badges.check();
    Leaderboard.add(pd.name,pd.avatar,score,pd.coins);
    let emoji='😐',title='Keep Going!';
    if(accuracy>=90){emoji='🎓';title='Topper!';}
    else if(accuracy>=70){emoji='🏆';title='Passed!';}
    else if(accuracy>=50){emoji='📚';title='Almost!';}
    $('resultEmoji').textContent=emoji;$('resultTitle').textContent=title;
    $('resultSub').textContent=`Exam Mode · Class ${SelectScreen.get().cls}`;
    $('rsScore').textContent=`${correct}/${total}`;$('rsAccuracy').textContent=`${accuracy}%`;
    $('rsCoins').textContent=`+${score}`;$('rsXP').textContent=`+${score}`;
    $('wrongReview').style.display='none';
    const nbw=$('newBadgesWrap');if(nbw)nbw.style.display='none';
    App.goTo('screen-result');
  }
  function quit(){clearInterval(iv);App.goTo('screen-select');}
  return{start,gotoQ,prev,nextQ,submit,quit};
})();



/* ════════════════════════════════════════════════════
   FAIR PLAY SECURITY
   Prevents cheating during quiz:
   1. Tab switch → auto-submit / warning
   2. Copy-paste disabled on options
   3. Right-click blocked on quiz screen
   4. Screenshot detection (best effort)
   5. Speed cheat — answer too fast = flag
   6. Suspicious pattern detection
════════════════════════════════════════════════════ */
const FairPlay = (() => {
  let warnings = 0;
  const MAX_WARN = 3;
  let active = false;
  let lastAnswerTime = 0;
  const MIN_ANSWER_MS = 800; // must spend at least 0.8s on question

  // 1. Tab visibility — warn when player switches tab during quiz
  function onVisibilityChange() {
    if (!active) return;
    if (document.hidden) {
      warnings++;
      FairPlay.showWarning(
        warnings >= MAX_WARN
          ? '❌ Quiz terminated! Too many tab switches.'
          : `⚠️ Warning ${warnings}/${MAX_WARN}: Don't switch tabs during quiz!`
      );
      if (warnings >= MAX_WARN) {
        setTimeout(() => Game.quit(), 1800);
      }
    }
  }

  // 2. Speed cheat — answered before reading question
  function checkSpeed() {
    const elapsed = Date.now() - lastAnswerTime;
    if (lastAnswerTime > 0 && elapsed < MIN_ANSWER_MS) {
      showWarning('⚠️ Answer too fast! Please read the question.');
      return false; // block the answer
    }
    return true;
  }

  // 3. Show warning toast
  function showWarning(msg) {
    let el = document.getElementById('fairPlayWarn');
    if (!el) {
      el = document.createElement('div');
      el.id = 'fairPlayWarn';
      el.style.cssText =
        'position:fixed;top:70px;left:50%;transform:translateX(-50%);' +
        'z-index:9998;background:#ef4444;color:#fff;font-family:var(--fb);' +
        'font-size:.82rem;font-weight:800;padding:10px 18px;border-radius:10px;' +
        'box-shadow:0 4px 16px rgba(239,68,68,.4);text-align:center;' +
        'animation:fairWarnPop .25s ease;max-width:320px;width:90%;';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = 'block';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.display = 'none'; }, 3000);
  }

  // 4. Block right-click on quiz screens
  function blockContextMenu(e) {
    const quizScreens = ['screen-quiz','screen-level','screen-boss','screen-timeattack'];
    const active = document.querySelector('.screen.active');
    if (active && quizScreens.includes(active.id)) {
      e.preventDefault();
      return false;
    }
  }

  // 5. Block copy on options
  function blockCopy(e) {
    const active = document.querySelector('.screen.active');
    if (active && ['screen-quiz','screen-level','screen-boss'].includes(active.id)) {
      e.preventDefault();
    }
  }

  // Start monitoring (call when quiz begins)
  function start() {
    active = true;
    warnings = 0;
    lastAnswerTime = Date.now();
  }

  // Stop monitoring (call when quiz ends)
  function stop() {
    active = false;
    warnings = 0;
  }

  // Reset answer timer (call when new question loads)
  function newQuestion() {
    lastAnswerTime = Date.now();
  }

  // Validate answer attempt — warn only, don't block
  function validateAnswer() {
    if (!active) return true;
    const elapsed = Date.now() - lastAnswerTime;
    if (elapsed < MIN_ANSWER_MS) {
      showWarning('⚡ Read the question carefully!');
      // Warn but still allow — don't block legitimate fast readers
    }
    return true;
  }

  // Detect suspicious answer pattern (all correct in 0-1s = bot/cheat)
  let fastCorrects = 0;
  function logCorrect(elapsed) {
    if (elapsed < 1200) fastCorrects++;
    else fastCorrects = 0;
    if (fastCorrects >= 5) {
      showWarning('🚨 Suspicious activity detected!');
      fastCorrects = 0;
    }
  }

  // Init — attach global listeners
  function init() {
    document.addEventListener('visibilitychange', onVisibilityChange);
    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('copy', blockCopy);
    // Add CSS for animation
    if (!document.getElementById('fpStyle')) {
      const s = document.createElement('style');
      s.id = 'fpStyle';
      s.textContent = '@keyframes fairWarnPop{from{transform:translateX(-50%) scale(.8);opacity:0}to{transform:translateX(-50%) scale(1);opacity:1}}';
      document.head.appendChild(s);
    }
  }

  return { start, stop, newQuestion, validateAnswer, logCorrect, showWarning, init };
})();

/* ════════════════════════════════════════════════════
   ADMIN ACCESS — Secret entry from game
   • Tap rocket logo 5 times → opens admin
   • OR tap 🔒 lock icon bottom-right
   • Uses pointerdown to avoid browser copy menu
════════════════════════════════════════════════════ */
const AdminAccess = (() => {
  let taps = 0, timer = null, blocked = false, blockTimer = null;
  const TAPS_NEEDED = 7;
  const MAX_TAPS    = 20;   // too many taps → block
  const BLOCK_MS    = 30000; // block for 30 seconds

  let lastTapTime = 0;

  function tap(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }

    // If blocked, silently ignore
    if (blocked) return;

    // Deduplicate pointerdown + touchstart firing together
    const now = Date.now();
    if (now - lastTapTime < 100) return;
    lastTapTime = now;

    taps++;

    // Too many taps without success → block silently
    if (taps > MAX_TAPS) {
      taps = 0;
      blocked = true;
      clearTimeout(blockTimer);
      blockTimer = setTimeout(() => { blocked = false; }, BLOCK_MS);
      return;
    }

    clearTimeout(timer);

    if (taps >= TAPS_NEEDED) {
      taps = 0;
      openAdmin();
      return;
    }

    // Reset after 2.5s inactivity — no visible feedback
    timer = setTimeout(() => { taps = 0; }, 2500);
  }

  function openAdmin() {
    const ov = document.createElement('div');
    ov.style.cssText =
      'position:fixed;inset:0;z-index:9999;background:#0d0f1a;' +
      'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;';
    ov.innerHTML =
      '<div style="font-size:2.8rem">🔐</div>' +
      '<div style="font-family:var(--fh,cursive);font-size:1.1rem;font-weight:800;color:#6c63ff">Opening Admin Panel…</div>';
    document.body.appendChild(ov);
    setTimeout(() => { window.location.href = 'admin.html'; }, 600);
  }

  function init() {
    const logo = document.getElementById('logoTap');
    const lock = document.getElementById('adminLockBtn');

    ['pointerdown','touchstart'].forEach(evt => {
      if (logo) logo.addEventListener(evt, tap, { passive: false });
      if (lock) lock.addEventListener(evt, tap, { passive: false });
    });

    [logo, lock].forEach(el => {
      if (!el) return;
      el.addEventListener('contextmenu', e => { e.preventDefault(); return false; });
      el.addEventListener('selectstart', e => { e.preventDefault(); return false; });
    });
  }

  return { tap, init };
})();


/* ════════════════════════════════════════════════════
   QUESTION LOADER
   Primary  : questions/classX/subject.json
   Fallback : BANK object (built-in)
════════════════════════════════════════════════════ */
const QuestionLoader = (() => {
  const cache = {};

  // Check if running on file:// (local) — fetch won't work
  const isLocal = location.protocol === 'file:';

  async function load(cls, subj) {
    const key = `${cls}_${subj}`;
    if (cache[key]) return cache[key];

    // On file:// skip fetch, use BANK directly
    if (isLocal) {
      const fallback = getBankFallback(cls, subj);
      cache[key] = fallback;
      return fallback;
    }

    try {
      const res = await fetch(`questions/class${cls}/${subj}.json`);
      if (!res.ok) throw new Error('not found');
      const data = await res.json();
      if (Array.isArray(data) && data.length) {
        // Merge with any admin custom questions
        const custom = getCustomQuestions(cls, subj);
        const merged = [...data, ...custom.filter(cq => !data.find(q => q.q === cq.q))];
        cache[key] = merged;
        return merged;
      }
      throw new Error('empty');
    } catch (e) {
      const fallback = getBankFallback(cls, subj);
      cache[key] = fallback;
      return fallback;
    }
  }

  function getBankFallback(cls, subj) {
    const bank = (BANK[cls] && BANK[cls][subj]) ||
                 (BANK[String(cls)] && BANK[String(cls)][subj]) || [];
    const custom = getCustomQuestions(cls, subj);
    return [...bank, ...custom.filter(cq => !bank.find(q => q.q === cq.q))];
  }

  function getCustomQuestions(cls, subj) {
    try {
      const all = JSON.parse(localStorage.getItem('qb_custom_questions') || '{}');
      return all[`${cls}_${subj}`] || [];
    } catch { return []; }
  }

  function preload(cls, subj) {
    if (!isLocal) load(cls, subj).catch(() => {});
  }

  function clearCache(cls, subj) {
    if (cls && subj) delete cache[`${cls}_${subj}`];
    else Object.keys(cache).forEach(k => delete cache[k]);
  }

  return { load, preload, clearCache };
})();

/* ── Admin Config Integration ──────────────────── */
const AdminCfg = (() => {
  const KEY = 'qb_admin_gamecfg';
  const QKEY = 'qb_custom_questions';
  const ANNKEY = 'qb_announcement';
  let cfg = {};
  function load(){
    try{ cfg = JSON.parse(localStorage.getItem(KEY)) || {}; }catch{ cfg={}; }
  }
  function get(key, fallback){ return cfg[key]!==undefined ? cfg[key] : fallback; }
  // Merge custom questions into BANK
  function mergeQuestions(){
    // QuestionLoader now handles custom question merging dynamically
    // Just clear the cache so next load picks up latest custom questions
    try{ if(typeof QuestionLoader!=='undefined') QuestionLoader.clearCache(); }catch(e){}
  }
  // Show announcement banner if set
  function showAnnouncement(){
    try{
      const ann = JSON.parse(localStorage.getItem(ANNKEY));
      if(!ann||!ann.msg) return;
      const colors={info:'#22d3ee',success:'#4ade80',warning:'#ffd700','new':'#a78bfa'};
      const el = document.createElement('div');
      el.style.cssText=`position:fixed;top:0;left:0;right:0;z-index:1000;
        padding:9px 16px;text-align:center;font-family:'Nunito',sans-serif;
        font-size:.82rem;font-weight:800;cursor:pointer;
        background:${colors[ann.type]||colors.info}22;
        border-bottom:2px solid ${colors[ann.type]||colors.info};
        color:${colors[ann.type]||colors.info};`;
      el.textContent = ann.msg;
      el.onclick = ()=>el.remove();
      document.body.prepend(el);
    }catch(e){}
  }
  return { load, get, mergeQuestions, showAnnouncement };
})();

/* ── Boot ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded',()=>{
  AdminCfg.load();
  AdminCfg.mergeQuestions();
  AdminCfg.showAnnouncement();
  App.init();
  AdminAccess.init();
  FairPlay.init();
});
