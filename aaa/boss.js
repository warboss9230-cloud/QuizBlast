'use strict';

const BossMode = (() => {

  // 120 Bosses — 12 classes × 10 subjects
  const BOSS_DATA = {
    math: [
      {cls:1, name:'Counting Goblin',      emoji:'👺',title:'The Tiny Counter',        color:'#a78bfa',subject:'math'},
      {cls:2, name:'Addition Imp',         emoji:'🧟',title:'Master of Addition',       color:'#8b5cf6',subject:'math'},
      {cls:3, name:'Subtraction Sprite',   emoji:'😈',title:'Subtraction Slayer',       color:'#7c3aed',subject:'math'},
      {cls:4, name:'Times Table Troll',    emoji:'👹',title:'Multiplication Menace',    color:'#6d28d9',subject:'math'},
      {cls:5, name:'Fraction Fiend',       emoji:'🦹',title:'Fraction Fracture',        color:'#5b21b6',subject:'math'},
      {cls:6, name:'Decimal Demon',        emoji:'🔢',title:'Decimal Destroyer',        color:'#4c1d95',subject:'math'},
      {cls:7, name:'Algebraic Ogre',       emoji:'🧮',title:'Algebra Assassin',         color:'#7c3aed',subject:'math'},
      {cls:8, name:'Geometry Giant',       emoji:'📐',title:'Shape Shifter',            color:'#6c63ff',subject:'math'},
      {cls:9, name:'Quadratic Kraken',     emoji:'🌀',title:'Quadratic Crusher',        color:'#5a52e8',subject:'math'},
      {cls:10,name:'Calculus Colossus',    emoji:'♾️',title:'Limit Breaker',            color:'#4a42d6',subject:'math'},
      {cls:11,name:'Matrix Minotaur',      emoji:'🔷',title:'Row Reducer',              color:'#3a32c4',subject:'math'},
      {cls:12,name:'Infinity Dragon',      emoji:'🐲',title:'The Infinite One',         color:'#2a22b2',subject:'math'},
    ],
    science: [
      {cls:1, name:'Plant Phantom',        emoji:'🌱',title:'Leaf Lurker',              color:'#34d399',subject:'science'},
      {cls:2, name:'Animal Apparition',    emoji:'🦠',title:'Microbe Master',           color:'#10b981',subject:'science'},
      {cls:3, name:'Matter Menace',        emoji:'⚗️',title:'Solid State Slayer',       color:'#059669',subject:'science'},
      {cls:4, name:'Energy Entity',        emoji:'⚡',title:'Energy Eater',             color:'#047857',subject:'science'},
      {cls:5, name:'Cell Specter',         emoji:'🔬',title:'Cell Crusher',             color:'#065f46',subject:'science'},
      {cls:6, name:'Chemical Chimera',     emoji:'🧪',title:'Compound Creator',         color:'#064e3b',subject:'science'},
      {cls:7, name:'Physics Phantom',      emoji:'🌡️',title:'Force Field Fiend',        color:'#22d3ee',subject:'science'},
      {cls:8, name:'Reaction Revenant',    emoji:'💥',title:'Reaction Ruiner',          color:'#06b6d4',subject:'science'},
      {cls:9, name:'Genetic Ghoul',        emoji:'🧬',title:'DNA Destroyer',            color:'#0891b2',subject:'science'},
      {cls:10,name:'Atomic Archdemon',     emoji:'⚛️',title:'Proton Punisher',          color:'#0e7490',subject:'science'},
      {cls:11,name:'Quantum Quetzal',      emoji:'🌌',title:'Wave Wraith',              color:'#155e75',subject:'science'},
      {cls:12,name:'Nuclear Nemesis',      emoji:'☢️',title:'Fission Fury',             color:'#164e63',subject:'science'},
    ],
    gk: [
      {cls:1, name:'Fact Fairy',           emoji:'📚',title:'Tiny Fact Keeper',         color:'#fbbf24',subject:'gk'},
      {cls:2, name:'Knowledge Kobold',     emoji:'🗺️',title:'Map Marauder',             color:'#f59e0b',subject:'gk'},
      {cls:3, name:'History Hobgoblin',    emoji:'🏛️',title:'Past Predator',            color:'#d97706',subject:'gk'},
      {cls:4, name:'Geography Gargoyle',   emoji:'🌍',title:'Globe Gobbler',            color:'#b45309',subject:'gk'},
      {cls:5, name:'Current Cyclops',      emoji:'📰',title:'Breaking News Beast',      color:'#92400e',subject:'gk'},
      {cls:6, name:'News Necromancer',     emoji:'📡',title:'Signal Seeker',            color:'#78350f',subject:'gk'},
      {cls:7, name:'World Wyvern',         emoji:'🌐',title:'World Devourer',           color:'#fde68a',subject:'gk'},
      {cls:8, name:'Trivia Titan',         emoji:'🧠',title:'Brain Basher',             color:'#fcd34d',subject:'gk'},
      {cls:9, name:'Award Archfiend',      emoji:'🏆',title:'Trophy Thief',             color:'#fbbf24',subject:'gk'},
      {cls:10,name:'Record Reaper',        emoji:'📊',title:'Data Demon',               color:'#f59e0b',subject:'gk'},
      {cls:11,name:'Summit Specter',       emoji:'🏔️',title:'Summit Slayer',            color:'#d97706',subject:'gk'},
      {cls:12,name:'Cosmos Commander',     emoji:'🚀',title:'Star Commander',           color:'#b45309',subject:'gk'},
    ],
    english: [
      {cls:1, name:'Letter Lurker',        emoji:'🔤',title:'ABC Ambusher',             color:'#4ade80',subject:'english'},
      {cls:2, name:'Phonics Phantom',      emoji:'📢',title:'Sound Slayer',             color:'#22c55e',subject:'english'},
      {cls:3, name:'Spelling Specter',     emoji:'✍️',title:'Spell Breaker',            color:'#16a34a',subject:'english'},
      {cls:4, name:'Grammar Goblin',       emoji:'📝',title:'Rule Ruiner',              color:'#15803d',subject:'english'},
      {cls:5, name:'Tense Troll',          emoji:'⏰',title:'Time Turner',              color:'#166534',subject:'english'},
      {cls:6, name:'Vocabulary Vampire',   emoji:'📖',title:'Word Thief',               color:'#14532d',subject:'english'},
      {cls:7, name:'Synonym Sorcerer',     emoji:'🪄',title:'Meaning Mangler',          color:'#86efac',subject:'english'},
      {cls:8, name:'Essay Executioner',    emoji:'✒️',title:'Paragraph Predator',       color:'#4ade80',subject:'english'},
      {cls:9, name:'Idiom Imp',            emoji:'💬',title:'Phrase Phantom',           color:'#22c55e',subject:'english'},
      {cls:10,name:'Poetry Poltergeist',   emoji:'🎭',title:'Rhyme Reaper',             color:'#16a34a',subject:'english'},
      {cls:11,name:'Literature Lich',      emoji:'📜',title:'Story Strangler',          color:'#15803d',subject:'english'},
      {cls:12,name:'Debate Dragon',        emoji:'🗣️',title:'Argument Annihilator',     color:'#166534',subject:'english'},
    ],
    hindi: [
      {cls:1, name:'Swar Shaitan',         emoji:'🔊',title:'Vowel Villain',            color:'#fb923c',subject:'hindi'},
      {cls:2, name:'Vyanjan Vamp',         emoji:'📣',title:'Consonant Crusher',        color:'#f97316',subject:'hindi'},
      {cls:3, name:'Matra Monster',        emoji:'✏️',title:'Matra Mangler',            color:'#ea580c',subject:'hindi'},
      {cls:4, name:'Sandhi Shaitaan',      emoji:'🔗',title:'Join Jumbler',             color:'#dc2626',subject:'hindi'},
      {cls:5, name:'Karak Kaal',           emoji:'🏷️',title:'Case Crusher',            color:'#b91c1c',subject:'hindi'},
      {cls:6, name:'Samas Serpent',        emoji:'🔀',title:'Compound Creep',           color:'#991b1b',subject:'hindi'},
      {cls:7, name:'Ras Rakshas',          emoji:'💔',title:'Emotion Eater',            color:'#fdba74',subject:'hindi'},
      {cls:8, name:'Alankar Asur',         emoji:'🎨',title:'Figure Fiend',             color:'#fb923c',subject:'hindi'},
      {cls:9, name:'Kavya Kichak',         emoji:'📜',title:'Poetry Punisher',          color:'#f97316',subject:'hindi'},
      {cls:10,name:'Kahani Kaal',          emoji:'📖',title:'Story Stalker',            color:'#ea580c',subject:'hindi'},
      {cls:11,name:'Nibandh Narak',        emoji:'✍️',title:'Essay Assailant',          color:'#dc2626',subject:'hindi'},
      {cls:12,name:'Vyakaran Vyaadh',      emoji:'📚',title:'Grammar Gorgon',           color:'#b91c1c',subject:'hindi'},
    ],
    computer: [
      {cls:1, name:'Bug Baby',             emoji:'🐛',title:'Tiny Bug Maker',           color:'#34d399',subject:'computer'},
      {cls:2, name:'Virus Vine',           emoji:'🦠',title:'Infection Initiator',      color:'#10b981',subject:'computer'},
      {cls:3, name:'Loop Lurker',          emoji:'🔄',title:'Infinite Loop Lord',       color:'#059669',subject:'computer'},
      {cls:4, name:'Array Apparition',     emoji:'📊',title:'Data Destroyer',           color:'#047857',subject:'computer'},
      {cls:5, name:'Function Fiend',       emoji:'⚙️',title:'Function Fracture',        color:'#065f46',subject:'computer'},
      {cls:6, name:'Database Demon',       emoji:'🗄️',title:'Query Quasher',            color:'#064e3b',subject:'computer'},
      {cls:7, name:'Network Nightmare',    emoji:'🌐',title:'Packet Predator',          color:'#a7f3d0',subject:'computer'},
      {cls:8, name:'OS Ogre',              emoji:'💻',title:'Process Punisher',         color:'#6ee7b7',subject:'computer'},
      {cls:9, name:'Algorithm Asura',      emoji:'🧮',title:'Big-O Obliterator',        color:'#34d399',subject:'computer'},
      {cls:10,name:'Security Specter',     emoji:'🔒',title:'Firewall Breaker',         color:'#10b981',subject:'computer'},
      {cls:11,name:'AI Archdemon',         emoji:'🤖',title:'Neural Net Nightmare',     color:'#059669',subject:'computer'},
      {cls:12,name:'Cloud Colossus',       emoji:'☁️',title:'Server Slayer',            color:'#047857',subject:'computer'},
    ],
    evs: [
      {cls:1, name:'Litter Leprechaun',    emoji:'🗑️',title:'Tiny Trash Tosser',        color:'#a3e635',subject:'evs'},
      {cls:2, name:'Pollution Pixie',      emoji:'🌫️',title:'Smoke Screen Summoner',    color:'#84cc16',subject:'evs'},
      {cls:3, name:'Waste Wraith',         emoji:'♻️',title:'Waste Warrior',            color:'#65a30d',subject:'evs'},
      {cls:4, name:'Deforestation Demon',  emoji:'🪓',title:'Tree Terminator',          color:'#4d7c0f',subject:'evs'},
      {cls:5, name:'Acid Rain Asura',      emoji:'🌧️',title:'Acid Agent',               color:'#3f6212',subject:'evs'},
      {cls:6, name:'Ozone Ogre',           emoji:'☣️',title:'Ozone Obliterator',        color:'#365314',subject:'evs'},
      {cls:7, name:'Flood Fiend',          emoji:'🌊',title:'River Ravager',            color:'#d9f99d',subject:'evs'},
      {cls:8, name:'Drought Dragon',       emoji:'🏜️',title:'Desert Demon',             color:'#bef264',subject:'evs'},
      {cls:9, name:'Climate Chimera',      emoji:'🌡️',title:'Weather Wrecker',          color:'#a3e635',subject:'evs'},
      {cls:10,name:'Extinction Entity',    emoji:'💀',title:'Species Slayer',           color:'#84cc16',subject:'evs'},
      {cls:11,name:'Erosion Executioner',  emoji:'🌋',title:'Soil Destroyer',           color:'#65a30d',subject:'evs'},
      {cls:12,name:'Biosphere Basilisk',   emoji:'🌍',title:'Planet Predator',          color:'#4d7c0f',subject:'evs'},
    ],
    economics: [
      {cls:1, name:'Barter Bandit',        emoji:'🔄',title:'Ancient Trader',           color:'#f472b6',subject:'economics'},
      {cls:2, name:'Price Pirate',         emoji:'💸',title:'Price Raiser',             color:'#ec4899',subject:'economics'},
      {cls:3, name:'Tax Thief',            emoji:'🧾',title:'Tax Collector',            color:'#db2777',subject:'economics'},
      {cls:4, name:'Inflation Imp',        emoji:'📈',title:'Money Melter',             color:'#be185d',subject:'economics'},
      {cls:5, name:'Budget Banshee',       emoji:'💰',title:'Budget Buster',            color:'#9d174d',subject:'economics'},
      {cls:6, name:'Debt Demon',           emoji:'📉',title:'Debt Dealer',              color:'#831843',subject:'economics'},
      {cls:7, name:'Market Marauder',      emoji:'🏪',title:'Supply Sapper',            color:'#fbcfe8',subject:'economics'},
      {cls:8, name:'GDP Ghost',            emoji:'📊',title:'Growth Gobbler',           color:'#f9a8d4',subject:'economics'},
      {cls:9, name:'Trade Troll',          emoji:'⚖️',title:'Export Eater',             color:'#f472b6',subject:'economics'},
      {cls:10,name:'Stock Specter',        emoji:'📉',title:'Bull Bear Brawler',        color:'#ec4899',subject:'economics'},
      {cls:11,name:'Currency Crusher',     emoji:'💵',title:'Currency Corruptor',       color:'#db2777',subject:'economics'},
      {cls:12,name:'Economic Executioner', emoji:'🏦',title:'Recession Reaper',         color:'#be185d',subject:'economics'},
    ],
    space: [
      {cls:1, name:'Meteor Minion',        emoji:'☄️',title:'Space Rock Roller',        color:'#818cf8',subject:'space'},
      {cls:2, name:'Comet Creep',          emoji:'🌠',title:'Comet Chaos Bringer',      color:'#6366f1',subject:'space'},
      {cls:3, name:'Asteroid Apparition',  emoji:'🪨',title:'Belt Bandit',              color:'#4f46e5',subject:'space'},
      {cls:4, name:'Moon Marauder',        emoji:'🌙',title:'Lunar Lurker',             color:'#4338ca',subject:'space'},
      {cls:5, name:'Sun Specter',          emoji:'🌟',title:'Solar Storm Summoner',     color:'#3730a3',subject:'space'},
      {cls:6, name:'Planet Poltergeist',   emoji:'🌍',title:'Orbital Obliterator',      color:'#312e81',subject:'space'},
      {cls:7, name:'Galaxy Goblin',        emoji:'🌌',title:'Spiral Arm Slayer',        color:'#c7d2fe',subject:'space'},
      {cls:8, name:'Black Hole Beast',     emoji:'🕳️',title:'Light Eater',              color:'#a5b4fc',subject:'space'},
      {cls:9, name:'Nebula Nightmare',     emoji:'🌫️',title:'Star Nursery Nightmare',   color:'#818cf8',subject:'space'},
      {cls:10,name:'Supernova Specter',    emoji:'💥',title:'Stellar Explosion Entity', color:'#6366f1',subject:'space'},
      {cls:11,name:'Dark Matter Demon',    emoji:'👁️',title:'Void Visitor',             color:'#4f46e5',subject:'space'},
      {cls:12,name:'Cosmic Colossus',      emoji:'🚀',title:'Universe Ender',           color:'#4338ca',subject:'space'},
    ],
    animals: [
      {cls:1, name:'Insect Inspector',     emoji:'🐛',title:'Six-Leg Stalker',          color:'#fbbf24',subject:'animals'},
      {cls:2, name:'Bird Bandit',          emoji:'🦅',title:'Sky Swooper',              color:'#f59e0b',subject:'animals'},
      {cls:3, name:'Reptile Rogue',        emoji:'🐍',title:'Scale Slitherer',          color:'#d97706',subject:'animals'},
      {cls:4, name:'Amphibian Apparition', emoji:'🐸',title:'Mud Lurker',               color:'#b45309',subject:'animals'},
      {cls:5, name:'Fish Phantom',         emoji:'🦈',title:'Deep Sea Destroyer',       color:'#92400e',subject:'animals'},
      {cls:6, name:'Mammal Menace',        emoji:'🦁',title:'Fur Ball Fury',            color:'#78350f',subject:'animals'},
      {cls:7, name:'Wild Wolf',            emoji:'🐺',title:'Pack Hunter',              color:'#fde68a',subject:'animals'},
      {cls:8, name:'Jungle Jaguar',        emoji:'🐆',title:'Spot Striker',             color:'#fcd34d',subject:'animals'},
      {cls:9, name:'Ocean Overlord',       emoji:'🦑',title:'Tentacle Terror',          color:'#fbbf24',subject:'animals'},
      {cls:10,name:'Desert Demon',         emoji:'🦂',title:'Venomous Vanquisher',      color:'#f59e0b',subject:'animals'},
      {cls:11,name:'Arctic Archdemon',     emoji:'🐻‍❄️',title:'Ice Age Invoker',         color:'#d97706',subject:'animals'},
      {cls:12,name:'Apex Predator',        emoji:'🦖',title:'Food Chain Finisher',      color:'#b45309',subject:'animals'},
    ],
  };

  // Pick boss based on current class + random subject
  let _lastSubj = '';
  function pickBoss(cls) {
    const subjects = Object.keys(BOSS_DATA);
    // Pick random subject different from last
    let subj;
    do { subj = subjects[Math.floor(Math.random() * subjects.length)]; }
    while (subj === _lastSubj && subjects.length > 1);
    _lastSubj = subj;
    const list = BOSS_DATA[subj];
    const idx  = Math.min((cls||1) - 1, list.length - 1);
    return list[idx];
  }

  let questions=[], qIdx=0, bossHP=10, playerHP=3, boss=null;
  const BOSS_MAX_HP = 10, PLAYER_MAX_HP = 3;

  function start() {
    const sel = SelectScreen.get();
    // cls may be 0/null if coming from splash — default to 6
    const cls = Number(sel.cls) || 6;
    boss = pickBoss(cls);

    // Show loading state
    const em = $('bossEmoji'); if(em) em.textContent = '⏳';
    const nm = $('bossName');  if(nm) nm.textContent = 'Loading…';
    App.goTo('screen-boss');

    // Load questions — try JSON first, then BANK fallback
    const subj = boss.subject;
    QuestionLoader.load(cls, subj).then(bank => {
      if(Array.isArray(bank) && bank.length > 0) {
        _initBoss(bank, cls);
      } else {
        _initBoss(_getBankFallback(cls, subj), cls);
      }
    }).catch(() => {
      _initBoss(_getBankFallback(cls, subj), cls);
    });
  }

  function _getBankFallback(cls, subj) {
    // Try exact class+subject
    let b = (BANK[cls]&&BANK[cls][subj]) || (BANK[String(cls)]&&BANK[String(cls)][subj]) || [];
    if(b.length) return b;
    // Try same subject with class 1-6
    for(let c=6;c>=1;c--) {
      b = (BANK[c]&&BANK[c][subj]) || [];
      if(b.length) return b;
    }
    // Try any subject with this class
    const allS=['math','science','gk','english','space','hindi','computer','evs','animals','economics'];
    for(const s of allS) {
      b = (BANK[cls]&&BANK[cls][s]) || (BANK[6]&&BANK[6][s]) || [];
      if(b.length) return b;
    }
    // Last resort — hardcoded fallback
    return [
      {q:'Capital of India?',opts:['New Delhi','Mumbai','Kolkata','Chennai'],ans:0,hint:'Political capital'},
      {q:'2 + 2 = ?',opts:['4','3','5','6'],ans:0,hint:'Simple addition'},
      {q:'Sun is a?',opts:['Star','Planet','Moon','Comet'],ans:0,hint:'Center of solar system'},
      {q:'Water formula?',opts:['H2O','CO2','O2','H2'],ans:0,hint:'Two hydrogen one oxygen'},
      {q:'How many planets?',opts:['8','9','7','10'],ans:0,hint:'Pluto removed 2006'},
    ];
  }

  function _initBoss(bank, cls) {
    // Final safety — if still empty use hardcoded
    if (!bank || !bank.length) bank = _getBankFallback(cls, boss?.subject||'gk');

    questions = shuffle(bank).map(r => {
      const c = r.opts[r.ans], sh = shuffle([...r.opts]);
      return {q:r.q, opts:sh, ans:sh.indexOf(c), hint:r.hint||''};
    });

    qIdx = 0; bossHP = BOSS_MAX_HP; playerHP = PLAYER_MAX_HP;

    // ── Apply boss color CSS var (all SVG parts use this) ──
    document.documentElement.style.setProperty('--boss-color', boss.color);

    // Update SVG gradient stops dynamically
    const svg = $('bossSvg');
    if(svg) {
      svg.querySelectorAll('stop').forEach(s => {
        const c = s.getAttribute('stop-color');
        if(c && c.includes('--boss-color')) s.style.stopColor = boss.color;
      });
      // Scale dots color
      svg.querySelectorAll('.boss-scale-dot').forEach(el => {
        el.style.fill = boss.color;
      });
    }

    // Arena bg tint
    const arena = document.querySelector('.boss-arena');
    if(arena) {
      arena.classList.remove('rage-mode');
      arena.style.background = `radial-gradient(ellipse at 50% -10%, ${boss.color}18 0%, #0d0f1a 60%)`;
    }

    // Aura border color
    ['bossAura','bossAura2'].forEach(id => {
      const el=$(id); if(el) el.style.borderColor = boss.color;
    });

    // Monster drop shadow
    const mon = $('bossMonster');
    if(mon) mon.style.filter = `drop-shadow(0 6px 20px ${boss.color}99)`;

    // Emoji badge
    const em = $('bossEmoji'); if(em) em.textContent = boss.emoji;

    // Class level badge
    document.querySelector('.boss-level-badge')?.remove();
    const lvBadge = document.createElement('div');
    lvBadge.className='boss-level-badge';
    lvBadge.textContent=`Class ${cls} Boss`;
    lvBadge.style.background=boss.color;
    $('bossMonsterWrap')?.appendChild(lvBadge);

    $('bossName').textContent = boss.name;
    const titleEl=$('bossTitleText'); if(titleEl) titleEl.textContent=boss.title;

    const subjEl=$('bossSubjectBadge');
    if(subjEl){
      const subj=SUBJECTS.find(s=>s.id===boss.subject);
      subjEl.textContent=subj?`${subj.icon} ${subj.label}`:boss.subject;
      subjEl.style.cssText=`background:${boss.color}22;color:${boss.color};border:1px solid ${boss.color}55;font-size:.7rem;font-weight:900;padding:3px 10px;border-radius:20px;`;
    }

    const hpBar=$('bossHpBar');
    if(hpBar) hpBar.style.background=`linear-gradient(90deg,${boss.color},${boss.color}88)`;

    // Start eye tracking
    _startEyeTracking();

    updateBossUI();
    Player.updateHUD();
    loadBossQ();
  }

  function updateBossUI() {
    $('bossHpBar').style.width  = (bossHP / BOSS_MAX_HP) * 100 + '%';
    $('bossHpText').textContent = bossHP + ' HP';
    $('phpBar').style.width     = (playerHP / PLAYER_MAX_HP) * 100 + '%';
    $('phpText').textContent    = playerHP + ' HP';
  }

  function loadBossQ() {
    if (qIdx >= questions.length) qIdx = 0;
    if (!questions.length) return;
    const q = questions[qIdx];
    const bc = $('bossQuestionCard');
    bc.classList.remove('flip'); void bc.offsetWidth; bc.classList.add('flip');
    $('bossQuestionText').textContent = q.q;
    $('bossStatus').textContent = '';
    const grid = $('bossOptionsGrid'); grid.innerHTML = '';
    const labels = ['A','B','C','D'], colors = ['var(--opt-a)','var(--opt-b)','var(--opt-c)','var(--opt-d)'];
    q.opts.forEach((opt, i) => {
      const b = document.createElement('button');
      b.className = 'option-btn';
      b.dataset.correct = i === q.ans ? '1' : '';
      b.style.setProperty('--opt-color', colors[i]);
      b.innerHTML = `<span class="opt-letter">${labels[i]}</span>${opt}`;
      b.onclick = () => handleBossAnswer(b, i === q.ans);
      grid.appendChild(b);
    });
  }

  function handleBossAnswer(btn, isCorrect) {
    document.querySelectorAll('#bossOptionsGrid .option-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.correct) b.classList.add('correct');
    });
    if (isCorrect) {
      btn.classList.add('correct'); Sound.play('correct');
      bossHP--; Player.addCoins(20);
      // Hit animation + screen shake
      const mon=$('bossMonster');
      if(mon){ mon.classList.add('hit'); setTimeout(()=>mon.classList.remove('hit'),420); }
      // Screen shake
      const arena=document.querySelector('.boss-arena');
      if(arena){ arena.classList.add('shake'); setTimeout(()=>arena.classList.remove('shake'),450); }
      // Particles + blood
      _spawnParticles(); _spawnBlood();
      // Rage mode when HP <= 3
      if(bossHP<=3 && arena) arena.classList.add('rage-mode');
      $('bossStatus').textContent='⚔️ Hit! Boss −1 HP';
    } else {
      btn.classList.add('wrong'); Sound.play('boss');
      playerHP--; Player.addCoins(-5);
      $('bossStatus').textContent = '💥 Wrong! −1 HP';

      // ── Monster Attack Animation ──
      const mon   = $('bossMonster');
      const arena = document.querySelector('.boss-arena');
      const wrap  = $('bossMonsterWrap');

      // 1. Monster lunges forward
      if (mon) {
        mon.classList.remove('attack');
        void mon.offsetWidth;
        mon.classList.add('attack');
        setTimeout(() => mon.classList.remove('attack'), 650);
      }

      // 2. Roar glow burst on monster wrap
      if (wrap) {
        wrap.classList.add('roar');
        setTimeout(() => wrap.classList.remove('roar'), 550);
      }

      // 3. Red screen flash + arena shake
      if (arena) {
        arena.classList.remove('player-hit');
        void arena.offsetWidth;
        arena.classList.add('player-hit');
        setTimeout(() => arena.classList.remove('player-hit'), 500);
      }

      // 4. Claw slash overlay
      let slash = document.getElementById('bossClawSlash');
      if (!slash) {
        slash = document.createElement('div');
        slash.id = 'bossClawSlash';
        slash.className = 'boss-claw-slash';
        document.body.appendChild(slash);
      }
      slash.classList.remove('slash');
      void slash.offsetWidth;
      slash.classList.add('slash');
      setTimeout(() => slash.classList.remove('slash'), 450);

      // 5. HP bar shake
      const hpBar = document.querySelector('.player-hp-bar');
      if (hpBar) {
        hpBar.classList.add('hit');
        setTimeout(() => hpBar.classList.remove('hit'), 450);
      }
    }
    updateBossUI(); Player.updateHUD();
    if (bossHP <= 0) { setTimeout(() => victory(), 600); return; }
    if (playerHP <= 0) { setTimeout(() => defeat(), 600); return; }
    qIdx++; setTimeout(() => loadBossQ(), 900);
  }

  // Eye tracking — eyes follow cursor/touch
  let _eyeIv = null;
  function _startEyeTracking() {
    if(_eyeIv) clearInterval(_eyeIv);
    const wrap = $('bossMonsterWrap');
    if(!wrap) return;
    function trackPointer(cx,cy) {
      const rect = wrap.getBoundingClientRect();
      const bcx  = rect.left + rect.width/2;
      const bcy  = rect.top  + rect.height/2;
      const dx   = cx - bcx, dy = cy - bcy;
      const dist = Math.sqrt(dx*dx+dy*dy)||1;
      // Max 5px pupil shift in SVG coords
      const maxShift=4, nx=(dx/dist)*maxShift, ny=(dy/dist)*maxShift;
      const pL=$('pupilL'), pR=$('pupilR');
      const iL=$('irisL'), iR=$('irisR');
      if(pL){ pL.setAttribute('cx', 78+nx); pL.setAttribute('cy', 104+ny); }
      if(pR){ pR.setAttribute('cx', 122+nx); pR.setAttribute('cy', 104+ny); }
      if(iL){ iL.setAttribute('cx', 78+nx*.5); iL.setAttribute('cy', 104+ny*.5); }
      if(iR){ iR.setAttribute('cx', 122+nx*.5); iR.setAttribute('cy', 104+ny*.5); }
    }
    function onMove(e){ const t=e.touches?e.touches[0]:e; trackPointer(t.clientX,t.clientY); }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, {passive:true});
    // Store to remove later
    wrap._trackFn = onMove;
  }
  function _stopEyeTracking() {
    const wrap=$('bossMonsterWrap');
    if(wrap && wrap._trackFn){
      document.removeEventListener('mousemove', wrap._trackFn);
      document.removeEventListener('touchmove', wrap._trackFn);
      wrap._trackFn = null;
    }
  }

  // Blood splatter
  function _spawnBlood() {
    const container=$('bossParticles'); if(!container) return;
    for(let i=0;i<6;i++){
      const b=document.createElement('div');
      b.className='boss-blood';
      const bx=(Math.random()-0.5)*120, by=(Math.random()*.5+.3)*80;
      const br=Math.random()*360;
      const sz=6+Math.random()*10;
      b.style.cssText=`--bx:${bx}px;--by:${by}px;--br:${br}deg;width:${sz}px;height:${sz*0.7}px;background:${boss.color};animation-delay:${i*0.05}s`;
      container.appendChild(b);
    }
    setTimeout(()=>{ const c=$('bossParticles'); if(c) c.innerHTML=''; },900);
  }

  function _spawnParticles() {
    const container = $('bossParticles');
    if(!container) return;
    container.innerHTML = '';
    for(let i=0;i<8;i++){
      const p = document.createElement('div');
      p.className = 'boss-particle';
      const angle = (i/8)*360;
      const dist  = 50 + Math.random()*40;
      const px    = Math.cos(angle*Math.PI/180)*dist;
      const py    = Math.sin(angle*Math.PI/180)*dist;
      p.style.cssText = `--px:${px}px;--py:${py}px;background:${boss.color};animation-delay:${i*0.04}s`;
      container.appendChild(p);
    }
    setTimeout(()=>{ if(container) container.innerHTML=''; }, 700);
  }

  function victory() {
    Sound.play('victory'); Player.addCoins(300); Player.addXP(50);
    const pd = Player.get(); pd.bossWins = (pd.bossWins||0) + 1; Player.save();
    Badges.check();
    const mon = $('bossMonster'); if(mon){ mon.classList.add('dead'); }
    $('brEmoji').textContent  = '🏆';
    $('brTitle').textContent  = 'Boss Defeated!';
    $('brSub').textContent    = `${boss.name} is defeated!`;
    $('brReward').textContent = '+300 🪙 · +50 XP';
    setTimeout(() => { $('bossResultOverlay').style.display = 'flex'; }, 700);
  }

  function defeat() {
    Sound.play('wrong');
    $('brEmoji').textContent  = '💀';
    $('brTitle').textContent  = 'Defeated!';
    $('brSub').textContent    = `${boss.name} wins this time…`;
    $('brReward').textContent = 'Try again!';
    $('bossResultOverlay').style.display = 'flex';
  }

  function closeResult() { _stopEyeTracking(); document.querySelector('.boss-arena')?.classList.remove('rage-mode','shake'); $('bossResultOverlay').style.display='none'; App.goTo('screen-select'); }
  function quit()        { _stopEyeTracking(); document.querySelector('.boss-arena')?.classList.remove('rage-mode','shake'); App.goTo('screen-select'); }
  return { start, closeResult, quit };
})();
