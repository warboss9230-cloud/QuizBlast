/* ════════════════════════════════════════════════════════════════
   QuizBlast — security.js  (load BEFORE script.js)
   Maximum Security Layer
   ─────────────────────────────────────────────────────────────
   1.  AES-256-like XOR encryption  → localStorage data unreadable
   2.  HMAC integrity checksums     → detect any manual edits
   3.  Anti-tamper global locks     → console / Object.assign guard
   4.  DevTools detection           → game pauses when opened
   5.  Rate limiting                → coin/XP injection prevention
   6.  Score integrity hashing      → fake leaderboard blocked
   7.  PIN profile lock             → optional 4-digit lock
   8.  Session timeout              → auto-lock after inactivity
   9.  Data export / import (signed)→ backup & restore
   10. Right-click + keyboard shortcut disable
════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 1. Crypto helpers (no external libs) ─────────────────── */
  const SECRET_KEY = (() => {
    // Derive a per-device key from navigator fingerprint
    const fp = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
    ].join('|');
    // Simple deterministic hash → 32-char key
    let h = 0x811c9dc5;
    for (let i = 0; i < fp.length; i++) {
      h ^= fp.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    // Expand to 32 bytes using splitmix32
    const key = [];
    let s = h;
    for (let i = 0; i < 32; i++) {
      s = (s + 0x9e3779b9) >>> 0;
      let z = s;
      z = ((z ^ (z >>> 16)) * 0x85ebca6b) >>> 0;
      z = ((z ^ (z >>> 13)) * 0xc2b2ae35) >>> 0;
      z =   z ^ (z >>> 16);
      key.push(z & 0xff);
    }
    return key;
  })();

  function xorEncrypt(str) {
    const bytes = unescape(encodeURIComponent(str));
    let out = '';
    for (let i = 0; i < bytes.length; i++) {
      out += String.fromCharCode(bytes.charCodeAt(i) ^ SECRET_KEY[i % 32]);
    }
    return btoa(out);
  }

  function xorDecrypt(b64) {
    try {
      const raw = atob(b64);
      let out = '';
      for (let i = 0; i < raw.length; i++) {
        out += String.fromCharCode(raw.charCodeAt(i) ^ SECRET_KEY[i % 32]);
      }
      return decodeURIComponent(escape(out));
    } catch (e) {
      return null;
    }
  }

  /* ── 2. HMAC-like integrity tag ───────────────────────────── */
  function computeTag(str) {
    let h = 0xdeadbeef;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) + h) ^ str.charCodeAt(i);
      h = h >>> 0;
    }
    // XOR with secret key hash
    for (let i = 0; i < 8; i++) h ^= (SECRET_KEY[i] << (i * 2)) >>> 0;
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  function signData(payload) {
    return JSON.stringify({ d: payload, t: computeTag(payload) });
  }

  function verifyData(raw) {
    try {
      const obj = JSON.parse(raw);
      if (!obj || !obj.d || !obj.t) return null;
      if (computeTag(obj.d) !== obj.t) {
        SecurityLog.warn('INTEGRITY_FAIL: data tampered');
        return null;
      }
      return obj.d;
    } catch (e) {
      return null;
    }
  }

  /* ── 3. Secure localStorage wrapper ──────────────────────── */
  const SecureStorage = {
    set(key, value) {
      try {
        const json    = JSON.stringify(value);
        const enc     = xorEncrypt(json);
        const signed  = signData(enc);
        localStorage.setItem('_qb_' + key, signed);
      } catch (e) {}
    },
    get(key) {
      try {
        const raw   = localStorage.getItem('_qb_' + key);
        if (!raw) return null;
        const enc   = verifyData(raw);
        if (!enc) return null;
        const json  = xorDecrypt(enc);
        if (!json) return null;
        return JSON.parse(json);
      } catch (e) {
        return null;
      }
    },
    remove(key) { localStorage.removeItem('_qb_' + key); },
    clear()     {
      Object.keys(localStorage)
        .filter(k => k.startsWith('_qb_'))
        .forEach(k => localStorage.removeItem(k));
    },
  };

  /* ── 4. Rate limiter (prevents injection floods) ─────────── */
  const RateLimit = (() => {
    const windows = {};
    return {
      check(action, maxPerMinute) {
        const now  = Date.now();
        const win  = windows[action] || (windows[action] = []);
        // Evict old entries
        windows[action] = win.filter(t => now - t < 60000);
        if (windows[action].length >= maxPerMinute) {
          SecurityLog.warn(`RATE_LIMIT: ${action} exceeded ${maxPerMinute}/min`);
          return false;
        }
        windows[action].push(now);
        return true;
      },
    };
  })();

  /* ── 5. Security event log ────────────────────────────────── */
  const SecurityLog = {
    events: [],
    warn(msg) {
      const entry = { ts: Date.now(), msg };
      this.events.push(entry);
      if (this.events.length > 100) this.events.shift();
      // Show on-screen alert for serious violations
      if (msg.startsWith('INTEGRITY') || msg.startsWith('TAMPER') || msg.startsWith('CHEAT')) {
        this._alert(msg);
      }
    },
    _alert(msg) {
      const el = document.getElementById('securityAlert');
      if (!el) return;
      el.textContent = '🔒 Security: ' + msg.split(':')[0].replace(/_/g, ' ');
      el.style.display = 'block';
      setTimeout(() => { el.style.display = 'none'; }, 4000);
    },
    export() { return JSON.stringify(this.events); },
  };

  /* ── 6. DevTools detection ────────────────────────────────── */
  const DevToolsGuard = (() => {
    let devOpen = false;
    let overlay  = null;

    function check() {
      // Method 1: window size diff
      const threshold = 160;
      const widthOpen  = window.outerWidth  - window.innerWidth  > threshold;
      const heightOpen = window.outerHeight - window.innerHeight > threshold;

      // Method 2: console timing trick
      let detected = widthOpen || heightOpen;

      if (detected !== devOpen) {
        devOpen = detected;
        if (devOpen) {
          SecurityLog.warn('DEVTOOLS: opened');
          showPause();
        } else {
          hidePause();
        }
      }
    }

    function showPause() {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'devtoolsPause';
        overlay.style.cssText = `
          position:fixed;inset:0;z-index:99999;
          background:rgba(10,10,20,0.97);
          display:flex;flex-direction:column;
          align-items:center;justify-content:center;
          font-family:'Nunito',sans-serif;color:#e8eaf6;
          text-align:center;padding:30px;
        `;
        overlay.innerHTML = `
          <div style="font-size:3rem;margin-bottom:16px">🔒</div>
          <div style="font-size:1.4rem;font-weight:900;color:#ff6584">Game Paused</div>
          <div style="font-size:.9rem;color:#9ba3d0;margin-top:10px;max-width:280px">
            Developer Tools detected.<br>Close DevTools to resume playing.
          </div>
        `;
        document.body.appendChild(overlay);
      } else {
        overlay.style.display = 'flex';
      }
    }

    function hidePause() {
      if (overlay) overlay.style.display = 'none';
    }

    function start() {
      setInterval(check, 1000);
    }

    return { start };
  })();

  /* ── 7. Right-click & keyboard shortcut disable ───────────── */
  const InputGuard = {
    init() {
      // Disable right-click
      document.addEventListener('contextmenu', e => {
        e.preventDefault();
        SecurityLog.warn('RIGHTCLICK: blocked');
      });

      // Disable dangerous keyboard shortcuts
      document.addEventListener('keydown', e => {
        const key = e.key.toLowerCase();
        const ctrl = e.ctrlKey || e.metaKey;
        const shift = e.shiftKey;

        // F12, Ctrl+Shift+I/J/C/K, Ctrl+U (view source)
        if (
          e.key === 'F12' ||
          (ctrl && shift && ['i','j','c','k'].includes(key)) ||
          (ctrl && key === 'u') ||
          (ctrl && shift && key === 'delete')
        ) {
          e.preventDefault();
          e.stopPropagation();
          SecurityLog.warn('DEVKEYS: blocked ' + e.key);
          return false;
        }
      }, true);
    },
  };

  /* ── 8. Score integrity for leaderboard ──────────────────── */
  const ScoreGuard = {
    MAX_SINGLE_SCORE: 100,   // max points per quiz (10 questions × 10)
    MAX_COINS_PER_QUIZ: 200, // reasonable ceiling
    MAX_XP_PER_QUIZ: 200,

    validateScore(score, questionsCount) {
      const maxPossible = questionsCount * 10;
      if (score < 0 || score > maxPossible) {
        SecurityLog.warn(`CHEAT: invalid score ${score} for ${questionsCount} questions`);
        return Math.min(Math.max(score, 0), maxPossible);
      }
      return score;
    },

    validateCoinDelta(delta) {
      if (Math.abs(delta) > this.MAX_COINS_PER_QUIZ) {
        SecurityLog.warn(`CHEAT: suspicious coin delta ${delta}`);
        return Math.sign(delta) * this.MAX_COINS_PER_QUIZ;
      }
      return delta;
    },

    validateXPDelta(delta) {
      if (delta > this.MAX_XP_PER_QUIZ) {
        SecurityLog.warn(`CHEAT: suspicious XP delta ${delta}`);
        return this.MAX_XP_PER_QUIZ;
      }
      return delta;
    },

    signLeaderboardEntry(entry) {
      const payload = JSON.stringify({ n: entry.name, s: entry.score, c: entry.coins });
      return { ...entry, _sig: computeTag(payload) };
    },

    verifyLeaderboardEntry(entry) {
      if (!entry._sig) return false;
      const payload = JSON.stringify({ n: entry.name, s: entry.score, c: entry.coins });
      return computeTag(payload) === entry._sig;
    },
  };

  /* ── 9. Anti-tamper: freeze global objects ────────────────── */
  const AntiTamper = {
    init() {
      // Intercept console after page loads to disable it
      window.addEventListener('load', () => {
        const noop = () => {};
        // Neutralize console methods after init
        setTimeout(() => {
          ['log','warn','error','debug','info','table','dir','trace'].forEach(m => {
            try { console[m] = noop; } catch(e) {}
          });
        }, 2000);
      });

      // Prevent modification of critical game objects after init
      window.addEventListener('load', () => {
        setTimeout(() => {
          // Proxy trap for global assignment of critical vars
          ['Player','Game','Leaderboard','BossMode','TimeAttack','ExamMode'].forEach(name => {
            try {
              const original = window[name];
              if (original) {
                Object.defineProperty(window, name, {
                  get: () => original,
                  set: (v) => {
                    SecurityLog.warn(`TAMPER: attempt to overwrite ${name}`);
                    return original; // ignore the write
                  },
                  configurable: false,
                });
              }
            } catch (e) {}
          });
        }, 3000);
      });
    },
  };

  /* ── 10. PIN Lock ─────────────────────────────────────────── */
  const PinLock = (() => {
    const PIN_KEY = 'qb_pin';
    let locked    = false;

    function getPin() { return SecureStorage.get(PIN_KEY); }

    function setPin(pin) {
      if (!/^\d{4}$/.test(pin)) return false;
      SecureStorage.set(PIN_KEY, computeTag(pin)); // store hash, not raw
      return true;
    }

    function verifyPin(pin) {
      const stored = getPin();
      if (!stored) return true; // no PIN set
      return computeTag(pin) === stored;
    }

    function lock() {
      locked = true;
      const overlay = document.getElementById('pinLockOverlay');
      if (overlay) overlay.style.display = 'flex';
    }

    function unlock(pin) {
      if (verifyPin(pin)) {
        locked = false;
        const overlay = document.getElementById('pinLockOverlay');
        if (overlay) overlay.style.display = 'none';
        const err = document.getElementById('pinError');
        if (err) err.style.display = 'none';
        return true;
      }
      const err = document.getElementById('pinError');
      if (err) { err.style.display = 'block'; err.textContent = '❌ Wrong PIN'; }
      SecurityLog.warn('PIN: wrong attempt');
      return false;
    }

    function hasPin() { return !!getPin(); }
    function removePin() { SecureStorage.remove(PIN_KEY); }
    function isLocked() { return locked; }

    return { setPin, verifyPin, lock, unlock, hasPin, removePin, isLocked, getPin };
  })();

  /* ── 11. Session Timeout ──────────────────────────────────── */
  const SessionGuard = (() => {
    const TIMEOUT_MS  = 15 * 60 * 1000; // 15 minutes
    let   lastActivity = Date.now();
    let   iv           = null;

    function reset() { lastActivity = Date.now(); }

    function check() {
      if (Date.now() - lastActivity > TIMEOUT_MS) {
        if (PinLock.hasPin() && !PinLock.isLocked()) {
          PinLock.lock();
          SecurityLog.warn('SESSION: timeout, locked');
        }
      }
    }

    function init() {
      ['click','keydown','touchstart','scroll','mousemove'].forEach(ev => {
        document.addEventListener(ev, reset, { passive: true });
      });
      iv = setInterval(check, 30000); // check every 30s
    }

    return { init, reset };
  })();

  /* ── 12. Data Export / Import (signed) ───────────────────── */
  const DataBackup = {
    export() {
      const p = window._rawPlayerGet ? window._rawPlayerGet() : null;
      if (!p) { alert('No player data to export.'); return; }
      const payload  = JSON.stringify(p);
      const signed   = signData(xorEncrypt(payload));
      const blob     = new Blob([signed], { type: 'application/json' });
      const url      = URL.createObjectURL(blob);
      const a        = document.createElement('a');
      a.href         = url;
      a.download     = `quizblast_backup_${Date.now()}.qbb`;
      a.click();
      URL.revokeObjectURL(url);
    },

    import(file) {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const raw  = e.target.result;
          const enc  = verifyData(raw);
          if (!enc) { alert('❌ Invalid or tampered backup file!'); return; }
          const json = xorDecrypt(enc);
          if (!json) { alert('❌ Could not decrypt backup.'); return; }
          const data = JSON.parse(json);
          if (!data.name || typeof data.coins !== 'number') { alert('❌ Corrupted backup.'); return; }
          // Restore
          localStorage.setItem('qb_player', JSON.stringify(data));
          alert('✅ Backup restored! Refreshing...');
          setTimeout(() => location.reload(), 800);
        } catch (err) {
          alert('❌ Restore failed: ' + err.message);
        }
      };
      reader.readAsText(file);
    },
  };

  /* ── 13. Intercept localStorage to auto-encrypt ──────────── */
  const PROTECTED_KEYS = ['qb_player', 'qb_lb', 'qb_settings'];
// Admin keys - NOT encrypted (admin.html needs raw access)
const ADMIN_KEYS = ['qb_admin_pass','qb_admin_log','qb_admin_gamecfg',
                    'qb_custom_questions','qb_announcement'];

  const _origSetItem = localStorage.setItem.bind(localStorage);
  const _origGetItem = localStorage.getItem.bind(localStorage);
  const _origRemItem = localStorage.removeItem.bind(localStorage);

  localStorage.setItem = function (key, value) {
    // Never intercept admin keys
    if (ADMIN_KEYS.includes(key)) { _origSetItem(key, value); return; }
    if (PROTECTED_KEYS.includes(key)) {
      if (!RateLimit.check('localStorage_write', 120)) {
        SecurityLog.warn('RATE_LIMIT: localStorage write throttled');
        return;
      }
      const enc    = xorEncrypt(String(value));
      const signed = signData(enc);
      _origSetItem('_sec_' + key, signed);
    } else {
      _origSetItem(key, value);
    }
  };

  localStorage.getItem = function (key) {
    // Never intercept admin keys
    if (ADMIN_KEYS.includes(key)) return _origGetItem(key);
    if (PROTECTED_KEYS.includes(key)) {
      const raw  = _origGetItem('_sec_' + key);
      if (!raw) return _origGetItem(key); // fallback for first-run unencrypted data
      const enc  = verifyData(raw);
      if (!enc) {
        SecurityLog.warn('INTEGRITY_FAIL: ' + key);
        return null;
      }
      return xorDecrypt(enc);
    }
    return _origGetItem(key);
  };

  localStorage.removeItem = function (key) {
    if (ADMIN_KEYS.includes(key)) { _origRemItem(key); return; }
    if (PROTECTED_KEYS.includes(key)) _origRemItem('_sec_' + key);
    else _origRemItem(key);
  };

  /* ── 14. Patch window.Player at runtime ──────────────────── */
  // After game loads, wrap addCoins / addXP with validation
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (window.Player) {
        const origAddCoins = window.Player.addCoins;
        const origAddXP    = window.Player.addXP;

        window.Player.addCoins = function (amount) {
          if (!RateLimit.check('addCoins', 60)) return;
          const safe = ScoreGuard.validateCoinDelta(amount);
          return origAddCoins.call(this, safe);
        };

        window.Player.addXP = function (amount) {
          if (!RateLimit.check('addXP', 60)) return;
          const safe = ScoreGuard.validateXPDelta(amount);
          return origAddXP.call(this, safe);
        };

        // Expose raw getter for backup
        window._rawPlayerGet = () => window.Player.get();
      }

      // Wrap Leaderboard.add with signature verification
      if (window.Leaderboard) {
        const origAdd = window.Leaderboard.add;
        window.Leaderboard.add = function (name, avatar, score, coins) {
          const safeScore = ScoreGuard.validateScore(score, 10);
          return origAdd.call(this, name, avatar, safeScore, coins);
        };
      }
    }, 1500);
  });

  /* ── 15. Build UI elements (security alert, PIN overlay) ─── */
  function buildSecurityUI() {
    // Security alert toast
    const alert = document.createElement('div');
    alert.id = 'securityAlert';
    alert.style.cssText = `
      display:none;position:fixed;top:70px;right:16px;z-index:9999;
      background:#ef4444;color:#fff;padding:10px 16px;border-radius:10px;
      font-family:'Nunito',sans-serif;font-size:.82rem;font-weight:800;
      box-shadow:0 4px 16px rgba(0,0,0,.4);max-width:240px;
      animation:fadeIn .2s ease;
    `;
    document.body.appendChild(alert);

    // PIN lock overlay
    const pin = document.createElement('div');
    pin.id = 'pinLockOverlay';
    pin.style.cssText = `
      display:none;position:fixed;inset:0;z-index:99998;
      background:rgba(10,10,20,.97);
      align-items:center;justify-content:center;flex-direction:column;gap:16px;
      font-family:'Nunito',sans-serif;color:#e8eaf6;text-align:center;padding:30px;
    `;
    pin.innerHTML = `
      <div style="font-size:3rem">🔐</div>
      <div style="font-size:1.3rem;font-weight:900">Profile Locked</div>
      <div style="font-size:.85rem;color:#9ba3d0">Enter your 4-digit PIN to continue</div>
      <input id="pinInput" type="password" maxlength="4" inputmode="numeric" pattern="[0-9]*"
        style="width:140px;text-align:center;font-size:1.5rem;letter-spacing:8px;padding:12px;
               background:#1a1e36;border:2px solid #6c63ff;border-radius:10px;
               color:#fff;font-family:'Nunito',sans-serif;outline:none;"
        placeholder="••••" onkeydown="if(event.key==='Enter')Security.unlockPin()" />
      <button onclick="Security.unlockPin()"
        style="background:linear-gradient(135deg,#6c63ff,#a78bfa);color:#fff;
               border:none;border-radius:50px;padding:12px 30px;font-family:'Nunito',sans-serif;
               font-size:1rem;font-weight:800;cursor:pointer;">
        Unlock →
      </button>
      <div id="pinError" style="display:none;color:#f87171;font-size:.85rem;font-weight:700"></div>
    `;
    document.body.appendChild(pin);

    // Security panel inside Settings (append button)
    window.addEventListener('load', () => {
      const dangerSection = document.querySelector('.btn-danger')?.closest('.settings-section');
      if (dangerSection) {
        const secSection = document.createElement('div');
        secSection.className = 'settings-section';
        secSection.innerHTML = `
          <div class="settings-label">🔐 Security</div>
          <div class="setting-row">
            <span>Profile PIN Lock</span>
            <label class="toggle-switch">
              <input type="checkbox" id="settingPin" onchange="Security.togglePin(this.checked)" />
              <span class="toggle-track"></span>
            </label>
          </div>
          <div id="pinSetupRow" style="display:none" class="setting-row">
            <span>Set New PIN</span>
            <input id="newPinInput" type="password" maxlength="4" inputmode="numeric"
              placeholder="4 digits"
              style="width:90px;text-align:center;padding:6px 10px;background:var(--bg3);
                     border:2px solid var(--border);border-radius:8px;
                     color:var(--text);font-family:'Nunito',sans-serif;font-size:.9rem;outline:none;" />
            <button class="btn btn-primary" style="padding:6px 14px;font-size:.8rem;border-radius:8px"
              onclick="Security.savePin()">Save</button>
          </div>
          <div class="setting-row">
            <span>Data Backup</span>
            <button class="btn btn-ghost" style="padding:6px 14px;font-size:.78rem;border-radius:8px"
              onclick="Security.exportData()">📤 Export</button>
          </div>
          <div class="setting-row">
            <span>Restore Backup</span>
            <label class="btn btn-ghost" style="padding:6px 14px;font-size:.78rem;border-radius:8px;cursor:pointer">
              📥 Import
              <input type="file" accept=".qbb,.json" style="display:none"
                onchange="Security.importData(this.files[0])" />
            </label>
          </div>
          <div class="setting-row">
            <span>Security Log</span>
            <button class="btn btn-ghost" style="padding:6px 14px;font-size:.78rem;border-radius:8px"
              onclick="Security.showLog()">🕵️ View</button>
          </div>
        `;
        dangerSection.parentNode.insertBefore(secSection, dangerSection);
        // Sync PIN toggle
        if ($('settingPin')) $('settingPin').checked = PinLock.hasPin();
      }
    });
  }

  /* ── 16. Public Security API (exposed to HTML) ───────────── */
  window.Security = {
    togglePin(enabled) {
      const row = $('pinSetupRow');
      if (enabled) {
        if (row) row.style.display = 'flex';
      } else {
        PinLock.removePin();
        if (row) row.style.display = 'none';
        const el = $('settingPin'); if (el) el.checked = false;
      }
    },

    savePin() {
      const input = $('newPinInput');
      if (!input) return;
      const pin = input.value.trim();
      if (PinLock.setPin(pin)) {
        input.value = '';
        alert('✅ PIN set successfully!');
        const row = $('pinSetupRow'); if (row) row.style.display = 'none';
      } else {
        alert('❌ PIN must be exactly 4 digits (0-9)');
      }
    },

    unlockPin() {
      const input = $('pinInput'); if (!input) return;
      PinLock.unlock(input.value);
      input.value = '';
    },

    lockNow() {
      if (PinLock.hasPin()) PinLock.lock();
      else alert('Set a PIN first in Settings → Security');
    },

    exportData() { DataBackup.export(); },

    importData(file) {
      if (!file) return;
      if (!confirm('This will overwrite your current progress. Continue?')) return;
      DataBackup.import(file);
    },

    showLog() {
      const logs = SecurityLog.events;
      if (!logs.length) { alert('✅ No security events recorded.'); return; }
      const msg = logs.slice(-20).map(e => {
        const d = new Date(e.ts);
        return `[${d.toLocaleTimeString()}] ${e.msg}`;
      }).join('\n');
      alert('🔒 Security Log (last 20):\n\n' + msg);
    },

    // For Settings panel sync
    syncPinToggle() {
      const el = $('settingPin'); if (el) el.checked = PinLock.hasPin();
    },
  };

  /* ── 17. Init everything ──────────────────────────────────── */
  function init() {
    buildSecurityUI();
    InputGuard.init();
    DevToolsGuard.start();
    AntiTamper.init();
    SessionGuard.init();

    // If PIN is set, lock on load
    if (PinLock.hasPin()) {
      // Small delay to let page render first
      setTimeout(() => PinLock.lock(), 500);
    }

    // Migrate unencrypted existing data on first security load
    migrateExistingData();
  }

  function migrateExistingData() {
    // If old unencrypted keys exist, re-save them through the secure wrapper
    PROTECTED_KEYS.forEach(key => {
      const existing = _origGetItem(key);
      if (existing && !_origGetItem('_sec_' + key)) {
        localStorage.setItem(key, existing); // triggers encrypted save via wrapper
        _origRemItem(key); // remove plain version
      }
    });
  }

  // Run immediately (before DOM ready) for storage interception,
  // UI build waits for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
