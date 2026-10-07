const AVATAR_BASE64 = "";
const AVATAR_KEY = 'hk_avatar_v1';
const DEFAULT_AVATAR_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='%23e0f2fe'/><stop offset='100%25' stop-color='%23bae6fd'/></linearGradient></defs><rect fill='url(%23g)' width='200' height='200'/><text x='50%25' y='56%25' font-family='Segoe UI' font-size='100' text-anchor='middle' dominant-baseline='middle'>🎀</text></svg>";

function normalizeAvatar(raw) {
  if (!raw) return null;
  raw = raw.trim();
  if (!raw) return null;
  if (/^data:image\//i.test(raw)) return raw;
  let mime = 'image/jpeg';
  if (raw.startsWith('iVBOR')) mime = 'image/png';
  else if (raw.startsWith('R0lGOD')) mime = 'image/gif';
  else if (raw.startsWith('UklGR')) mime = 'image/webp';
  else if (raw.startsWith('/9j/')) mime = 'image/jpeg';
  return `data:${mime};base64,${raw}`;
}
function applyAvatar(src) {
  const img = document.getElementById('loginAvatarImg');
  if (img && src) img.src = src;
}
window.addEventListener('load', () => {
  let saved = null;
  try { saved = localStorage.getItem(AVATAR_KEY); } catch(e){}
  if (saved) { applyAvatar(saved); return; }
  if (!AVATAR_BASE64 || AVATAR_BASE64.trim().length < 50) return;
  const src = normalizeAvatar(AVATAR_BASE64);
  if (src) {
    applyAvatar(src);
    try { localStorage.setItem(AVATAR_KEY, src); } catch(e){}
  }
});

/* ===== LONG-PRESS 1.5s ĐỂ MỞ POPUP ===== */
(function() {
  const trigger = document.getElementById('avatarTrigger');
  if (!trigger) return;
  const HOLD_MS = 1500;
  let holdTimer = null, holding = false, startX = 0, startY = 0, moved = false;
  const MOVE_TOL = 12;

  function start(x, y) {
    startX = x; startY = y; moved = false; holding = true;
    trigger.classList.add('holding');
    holdTimer = setTimeout(() => {
      if (!holding || moved) return;
      trigger.classList.remove('holding');
      holding = false;
      try { if (navigator.vibrate) navigator.vibrate(30); } catch(e){}
      openAvatarModal();
    }, HOLD_MS);
  }
  function cancel() {
    holding = false;
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    trigger.classList.remove('holding');
  }
  function move(x, y) {
    if (!holding) return;
    if (Math.abs(x - startX) > MOVE_TOL || Math.abs(y - startY) > MOVE_TOL) {
      moved = true;
      cancel();
    }
  }

  trigger.addEventListener('mousedown', e => { e.preventDefault(); start(e.clientX, e.clientY); });
  trigger.addEventListener('mousemove', e => move(e.clientX, e.clientY));
  trigger.addEventListener('mouseup', cancel);
  trigger.addEventListener('mouseleave', cancel);

  trigger.addEventListener('touchstart', e => {
    const t = e.touches[0];
    start(t.clientX, t.clientY);
  }, {passive: true});
  trigger.addEventListener('touchmove', e => {
    const t = e.touches[0];
    move(t.clientX, t.clientY);
  }, {passive: true});
  trigger.addEventListener('touchend', cancel);
  trigger.addEventListener('touchcancel', cancel);

  trigger.addEventListener('contextmenu', e => e.preventDefault());
})();

/* ===== POPUP AVATAR ===== */
function openAvatarModal() {
  const m = document.getElementById('avatar-modal');
  const inp = document.getElementById('avBase64Input');
  const st = document.getElementById('avStatus');
  const pv = document.getElementById('avPreview');
  let saved = null;
  try { saved = localStorage.getItem(AVATAR_KEY); } catch(e){}
  st.textContent = '';
  st.style.color = '#0ea5e9';
  if (saved) {
    pv.innerHTML = `<img src="${saved}" alt="preview">`;
    inp.value = '';
    inp.placeholder = '→ Đã có avatar. Dán base64 mới để thay thế...';
  } else {
    pv.innerHTML = '🎀';
    inp.value = '';
    inp.placeholder = 'Dán chuỗi Base64 ảnh vào đây...\nVí dụ: /9j/4AAQSkZJRg... hoặc data:image/jpeg;base64,/9j/...';
  }
  m.classList.add('show');
  setTimeout(() => inp.focus(), 100);
}
function closeAvatarModal() {
  document.getElementById('avatar-modal').classList.remove('show');
}
function saveAvatar() {
  const inp = document.getElementById('avBase64Input');
  const st = document.getElementById('avStatus');
  const pv = document.getElementById('avPreview');
  const val = inp.value.trim();
  if (!val) { st.style.color = '#ff4f96'; st.textContent = '⚠️ Vui lòng dán chuỗi Base64!'; return; }
  if (val.length < 50) { st.style.color = '#ef4444'; st.textContent = '⚠️ Chuỗi quá ngắn, không phải ảnh!'; return; }
  const src = normalizeAvatar(val);
  if (!src) { st.style.color = '#ef4444'; st.textContent = '❌ Không nhận diện được ảnh!'; return; }
  const testImg = new Image();
  testImg.onload = () => {
    try { localStorage.setItem(AVATAR_KEY, src); } catch(e){}
    applyAvatar(src);
    pv.innerHTML = `<img src="${src}" alt="preview">`;
    pv.classList.remove('ok');
    void pv.offsetWidth;
    pv.classList.add('ok');
    st.style.color = '#00b06b';
    st.textContent = '✅ Đã lưu avatar thành công!';
    setTimeout(() => { pv.classList.remove('ok'); closeAvatarModal(); }, 1200);
  };
  testImg.onerror = () => {
    st.style.color = '#ef4444';
    st.textContent = '❌ Base64 không hợp lệ — ảnh không load được!';
  };
  testImg.src = src;
}
function resetAvatar() {
  const inp = document.getElementById('avBase64Input');
  const st = document.getElementById('avStatus');
  const pv = document.getElementById('avPreview');
  try { localStorage.removeItem(AVATAR_KEY); } catch(e){}
  applyAvatar(DEFAULT_AVATAR_SVG);
  pv.innerHTML = '🎀';
  inp.value = '';
  inp.placeholder = 'Dán chuỗi Base64 ảnh vào đây...\nVí dụ: /9j/4AAQSkZJRg... hoặc data:image/jpeg;base64,/9j/...';
  st.style.color = '#0284c7';
  st.textContent = '↩️ Đã reset về avatar mặc định';
  setTimeout(() => { st.textContent = ''; }, 1500);
}

document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('avBase64Input');
  const pv = document.getElementById('avPreview');
  if (inp) {
    let timer = null;
    inp.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const val = inp.value.trim();
        if (val.length < 50) { pv.innerHTML = '🎀'; return; }
        const src = normalizeAvatar(val);
        const tmp = new Image();
        tmp.onload = () => { pv.innerHTML = `<img src="${src}" alt="preview">`; };
        tmp.src = src;
      }, 300);
    });
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const m = document.getElementById('avatar-modal');
      if (m && m.classList.contains('show')) closeAvatarModal();
    }
  });
});

/* ===== KEY VERIFY ===== */
(function() {
  var a = [108,101,104,111], b = [103,110,97], c = [110,105,109], d = [122,100,104];
  window.___verify = function(input) {
    var arr = a.slice().concat(b.slice().reverse()).concat(c.slice().reverse()).concat(d.slice().reverse());
    var k = "";
    for (var i = 0; i < arr.length; i++) k += String.fromCharCode(arr[i]);
    if (input.length !== k.length) return false;
    var ok = 0;
    for (var j = 0; j < input.length; j++) if (input.charCodeAt(j) === k.charCodeAt(j)) ok++;
    return ok === input.length;
  };
})();

var loginAttempts = 0, loginLocked = false;
function doLogin() {
  if (loginLocked) return;
  var keyEl = document.getElementById('keyInput');
  var key = keyEl.value.trim();
  var btn = document.getElementById('btnLogin');
  var sp = document.getElementById('loginSpinner');
  var bt = document.getElementById('btnText');
  var err = document.getElementById('loginError');
  err.textContent = '';
  if (!key) {
    err.textContent = '⚠️ Vui lòng nhập Key!';
    keyEl.classList.add('shake');
    setTimeout(() => keyEl.classList.remove('shake'), 500);
    keyEl.focus(); return;
  }
  sp.style.display = 'inline-block';
  bt.innerHTML = 'ĐANG KIỂM TRA...';
  btn.disabled = true;
  setTimeout(function() {
    if (window.___verify(key)) {
      bt.innerHTML = '<i class="fa-solid fa-check"></i> THÀNH CÔNG';
      err.style.color = '#10b981';
      err.textContent = '✅ Đang vào Tool...';
      keyEl.value = ''; key = null;
      try { sessionStorage.setItem('hk_auth_v1', 'ok'); } catch(e){}
      setTimeout(openTool, 800);
    } else {
      loginAttempts++;
      sp.style.display = 'none';
      bt.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> ĐĂNG NHẬP';
      btn.disabled = false;
      err.style.color = '#ef4444';
      err.textContent = '❌ Key sai! (' + loginAttempts + ')';
      keyEl.classList.add('shake');
      setTimeout(() => keyEl.classList.remove('shake'), 500);
      keyEl.select();
      if (loginAttempts >= 5) {
        loginLocked = true;
        btn.disabled = true;
        var sec = 30;
        var iv = setInterval(function() {
          sec--;
          err.textContent = '🚫 Thử lại sau ' + sec + 's';
          if (sec <= 0) {
            clearInterval(iv);
            loginLocked = false; loginAttempts = 0;
            btn.disabled = false; err.textContent = '';
            bt.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> ĐĂNG NHẬP';
          }
        }, 1000);
      }
    }
  }, 600);
}

function openTool() {
  document.getElementById('login-screen').classList.add('hide');
  document.getElementById('tool-screen').style.display = 'block';
  document.getElementById('gameFrame').src = 'https://lc79b.bet/';
  setTimeout(() => { if (typeof startApp === 'function') startApp(); }, 200);
}
document.getElementById('keyInput').addEventListener('keypress', e => { if (e.key === 'Enter') doLogin(); });
window.addEventListener('DOMContentLoaded', () => {
  try {
    if (sessionStorage.getItem('hk_auth_v1') === 'ok') {
      document.getElementById('login-screen').classList.add('hide');
      document.getElementById('tool-screen').style.display = 'block';
      document.getElementById('gameFrame').src = 'https://lc79b.bet/';
      setTimeout(() => { if (typeof startApp === 'function') startApp(); }, 200);
    }
  } catch(e){}
});

/* ===== TOOL ENGINE ===== */
function startApp() {
  if (window.appInitialized) return;
  window.appInitialized = true;

  const grp = s => {
    if (!s.length) return [];
    const out = [];
    let d = s[0], c = 1;
    for (let i = 1; i < s.length; i++) {
      if (s[i] === d) c++;
      else { out.push({k: d, n: c}); d = s[i]; c = 1; }
    }
    out.push({k: d, n: c});
    return out;
  };

  class Yq {
    constructor() {
      this.ch = []; this.td = []; this.xx = [];
      this.max = 500;
      this.ng = {1:6, 2:8, 3:10, 4:14, 5:18, 6:22};
    }
    dice(it) {
      const maps = [
        ['dice1','dice2','dice3'],['xucxac1','xucxac2','xucxac3'],['d1','d2','d3'],
        ['x1','x2','x3'],['dice_1','dice_2','dice_3'],['xuc_xac_1','xuc_xac_2','xuc_xac_3']
      ];
      for (const [a,b,c] of maps) {
        if (it[a] != null && it[b] != null && it[c] != null) {
          const arr = [+it[a], +it[b], +it[c]];
          if (arr.every(n => n >= 1 && n <= 6)) return arr;
        }
      }
      for (const f of ['dice','dices','xucxac','xuc_xac','xuc_xac_arr']) {
        if (Array.isArray(it[f]) && it[f].length >= 3) {
          const arr = it[f].slice(0,3).map(Number);
          if (arr.every(n => n >= 1 && n <= 6)) return arr;
        }
      }
      return null;
    }
    nap(items) {
      this.ch = []; this.td = []; this.xx = [];
      for (const it of items) {
        const r = it.resultTruyenThong || it.result || it.ketQua;
        if (r !== 'TAI' && r !== 'XIU') continue;
        this.ch.push(r);
        const d = this.dice(it);
        this.xx.push(d);
        this.td.push(d ? d[0]+d[1]+d[2] : null);
      }
      if (this.ch.length > this.max) {
        const c = -this.max;
        this.ch = this.ch.slice(c); this.td = this.td.slice(c); this.xx = this.xx.slice(c);
      }
    }
    ngM(k) { return this.ng[k] || 22; }
    fg(fp, hc = null) {
      const c = this.ch, k = fp.length;
      if (!k) return {t: 0, x: 0, s: 0, v: []};
      const tot = fp.reduce((a,b) => a+b, 0);
      let t = 0, x = 0;
      const v = [];
      for (let st = 0; st < c.length - tot; st++) {
        let p = st, ok = true, ht = null, hc2 = null;
        for (const dd of fp) {
          if (p + dd > c.length) { ok = false; break; }
          const seg = c.slice(p, p+dd);
          if (new Set(seg).size !== 1) { ok = false; break; }
          const h = seg[0];
          if (ht !== null && h === ht) { ok = false; break; }
          ht = h; hc2 = h; p += dd;
        }
        if (!ok) continue;
        if (hc !== null && hc2 !== hc) continue;
        if (st > 0 && c[st-1] === c[st]) continue;
        if (p >= c.length) continue;
        if (c[p] === 'TAI') t++; else x++;
        v.push(p);
      }
      return {t, x, s: t+x, v};
    }
    pattern() {
      const g = this.ch.slice(-24);
      if (g.length < 3) return null;
      const nh = grp(g);
      if (!nh.length) return null;
      const h = nh[nh.length-1].k;
      const dn = nh[nh.length-1].n;
      const kMax = Math.min(6, nh.length);
      for (let k = kMax; k >= 1; k--) {
        const fp = nh.slice(-k).map(n => n.n);
        const {s} = this.fg(fp, h);
        if (s >= this.ngM(k)) return {fp, h, k};
      }
      return {fp: [dn], h, k: 1};
    }
    hist(p) {
      if (!p) return {t: null, x: null, s: 0, v: []};
      const {t, x, s, v} = this.fg(p.fp, p.h);
      if (s < this.ngM(p.fp.length)) return {t: null, x: null, s, v};
      return {t: t/s*100, x: x/s*100, s, v};
    }
    fTong() {
      const a = this.td.filter(x => x != null);
      if (a.length < 8) return null;
      const g = a.slice(-20);
      const m = a.reduce((x,y) => x+y, 0) / a.length;
      const mg = g.reduce((x,y) => x+y, 0) / g.length;
      const hi = g.filter(s => s >= 11).length;
      return {m, mg, xu: mg - m, r: hi / g.length, n: a.length};
    }
    fM1() {
      const c = this.ch;
      if (c.length < 20) return null;
      let tt = 0, tx = 0, xt = 0, xx = 0;
      const w = c.slice(-80);
      for (let i = 1; i < w.length; i++) {
        const p = w[i-1], n = w[i];
        if (p === 'TAI' && n === 'TAI') tt++;
        else if (p === 'TAI' && n === 'XIU') tx++;
        else if (p === 'XIU' && n === 'TAI') xt++;
        else xx++;
      }
      const last = c[c.length-1];
      const pt = last === 'TAI' ? (tt+1)/(tt+tx+2) : (xt+1)/(xt+xx+2);
      return {pt, px: 1-pt, last};
    }
    fM2() {
      const c = this.ch;
      if (c.length < 30) return null;
      const a = c[c.length-2], b = c[c.length-1];
      let t = 0, x = 0;
      for (let i = 0; i < c.length - 2; i++) {
        if (c[i] === a && c[i+1] === b) {
          if (c[i+2] === 'TAI') t++; else x++;
        }
      }
      if (t + x < 3) return null;
      return {s: t+x, pt: (t+1)/(t+x+2)};
    }
    fM3() {
      const c = this.ch;
      if (c.length < 40) return null;
      const last = c.slice(-3).join('');
      let t = 0, x = 0, wt = 0, wx = 0;
      for (let i = 0; i < c.length - 3; i++) {
        if (c.slice(i, i+3).join('') === last) {
          const w = Math.pow(1.01, i);
          if (c[i+3] === 'TAI') { t++; wt += w; } else { x++; wx += w; }
        }
      }
      if (t + x < 3) return null;
      const wtot = wt + wx;
      return {s: t+x, pt: wtot > 0 ? wt/wtot : .5};
    }
    fBet() {
      const c = this.ch;
      if (c.length < 2) return 0;
      let b = 1;
      for (let i = c.length-1; i > 0; i--) {
        if (c[i] === c[i-1]) b++; else break;
      }
      return b;
    }
    fStreak() {
      const c = this.ch;
      if (c.length < 30) return null;
      const nh = grp(c);
      if (nh.length < 5) return null;
      const dn = nh[nh.length-1].n, h = nh[nh.length-1].k;
      let td = 0, tm = 0;
      for (let L = dn; L < 20; L++) {
        for (let i = 0; i < c.length - L; i++) {
          let ok = true;
          for (let j = 0; j < L; j++) if (c[i+j] !== c[i]) { ok = false; break; }
          if (!ok) continue;
          if (i > 0 && c[i-1] === c[i]) continue;
          if (i + L >= c.length) continue;
          tm++;
          if (c[i+L] === c[i]) td++;
        }
      }
      if (tm < 3) return null;
      const pt = td / tm;
      return {dn, h, pt, pv: 1-pt, tm, gy: pt > .5 ? h : (h === 'TAI' ? 'XIU' : 'TAI')};
    }
    fCycle() {
      const c = this.ch;
      if (c.length < 12) return null;
      for (let p = 2; p <= 8; p++) {
        if (c.length < p * 3) continue;
        let k = 0, tot = 0;
        const sv = Math.min(6, Math.floor(c.length / p));
        const st = c.length - sv * p;
        for (let v = 1; v < sv; v++) {
          for (let i = 0; i < p; i++) {
            const a = st + (v-1) * p + i, b = st + v * p + i;
            if (a < c.length && b < c.length) { tot++; if (c[a] === c[b]) k++; }
          }
        }
        if (!tot) continue;
        const r = k / tot;
        if (r >= .8) {
          const nx = c.length % p, vtu = st + nx;
          if (vtu < c.length) return {p, r, g: c[vtu]};
        }
      }
      return null;
    }
    fAlt() {
      const c = this.ch;
      if (c.length < 6) return null;
      let d = 0;
      for (let i = c.length-1; i > c.length-6 && i > 0; i--) {
        if (c[i] !== c[i-1]) d++; else break;
      }
      if (d >= 4) return {d, g: c[c.length-1] === 'TAI' ? 'XIU' : 'TAI'};
      return null;
    }
    fZig() {
      const c = this.ch;
      if (c.length < 10) return null;
      const nh = grp(c);
      if (nh.length < 4) return null;
      const d4 = nh.slice(-4).map(n => n.n);
      if (d4.every(d => d === 1)) return {loai: 'z1', r: .7};
      if (d4.every(d => d === 2)) return {loai: 'z2', r: .75};
      const [a,b,c2,d] = d4;
      if (a === c2 && b === d && a !== b) return {loai: 'cy', r: .7};
      return null;
    }
    fFib() {
      const c = this.ch;
      if (c.length < 20) return null;
      const f = [1,1,2,3,5,8,13];
      const nh = grp(c);
      if (nh.length < 5) return null;
      for (let l = 4; l <= 6; l++) {
        if (nh.length < l) continue;
        const ds = nh.slice(-l).map(n => n.n);
        let k = 0;
        for (let i = 0; i < l; i++) if (Math.abs(ds[i] - f[i]) <= 0) k++;
        if (k === l) return {r: .65 + l * .03, h: nh[nh.length-1].k};
      }
      return null;
    }
    fNG(n) {
      const c = this.ch;
      if (c.length < n + 5) return null;
      const cur = c.slice(-n).join(',');
      let t = 0, x = 0;
      for (let i = 0; i <= c.length - n - 1; i++) {
        if (c.slice(i, i+n).join(',') === cur && i + n < c.length) {
          if (c[i+n] === 'TAI') t++; else x++;
        }
      }
      if (t + x < 3) return null;
      return {n, t, x, s: t+x, r: t/(t+x)*100};
    }
    fKNN() {
      const c = this.ch, W = 5;
      if (c.length < W + 10) return null;
      const cur = c.slice(-W);
      const res = [];
      for (let i = 0; i < c.length - W; i++) {
        let k = 0;
        for (let j = 0; j < W; j++) if (c[i+j] === cur[j]) k++;
        if (k >= W - 1 && i + W < c.length) res.push({d: k, k: c[i+W]});
      }
      if (res.length < 3) return null;
      res.sort((a,b) => b.d - a.d);
      const top = res.slice(0, 10);
      let t = 0, x = 0;
      for (const r of top) if (r.k === 'TAI') t++; else x++;
      return {t, x, s: top.length, r: t/top.length*100};
    }
    fDice() {
      const a = this.xx.filter(x => x != null);
      if (a.length < 10) return null;
      const g = a.slice(-20);
      const dm = {1:0,2:0,3:0,4:0,5:0,6:0};
      for (const d of g) for (const v of d) dm[v]++;
      const s = Object.entries(dm).sort((a,b) => b[1] - a[1]);
      const mn = +s[0][0];
      const tg = g.map(d => d[0]+d[1]+d[2]);
      const mg = tg.reduce((x,y) => x+y, 0) / tg.length;
      return {mn, mg, ht: mg > 10.5};
    }
    fDT() {
      const c = this.ch;
      if (c.length < 30) return null;
      const k10 = c.slice(-10).filter(x => x === 'TAI').length;
      const k30 = c.slice(-30).filter(x => x === 'TAI').length;
      const k100 = c.slice(-100).filter(x => x === 'TAI').length;
      const r10 = k10/10, r30 = k30/30, r100 = k100/Math.min(100, c.length);
      return {r30: r30*100, dtT: r10 > .55 && r30 > .55 && r100 > .52, dtX: r10 < .45 && r30 < .45 && r100 < .48};
    }
    fEnt() {
      const c = this.ch;
      if (c.length < 20) return 1;
      const g = c.slice(-30);
      const p = g.filter(x => x === 'TAI').length / g.length;
      if (!p || p === 1) return 0;
      return -(p * Math.log2(p) + (1-p) * Math.log2(1-p));
    }
    fXung() {
      const c = this.ch;
      if (c.length < 12) return null;
      let t = 0, x = 0;
      const g = c.slice(-12);
      for (let i = 0; i < g.length; i++) {
        const w = Math.pow(1.15, i);
        if (g[i] === 'TAI') t += w; else x += w;
      }
      return {t: t/(t+x)*100, x: x/(t+x)*100};
    }
    fTrend() {
      const c = this.ch;
      if (c.length < 20) return null;
      const g = c.slice(-30).map(x => x === 'TAI' ? 1 : -1);
      const n = g.length;
      let sx = 0, sy = 0, sxy = 0, sx2 = 0;
      for (let i = 0; i < n; i++) { sx += i; sy += g[i]; sxy += i * g[i]; sx2 += i * i; }
      const sl = (n * sxy - sx * sy) / (n * sx2 - sx * sx);
      return {sl, m: Math.min(1, Math.abs(sl)/.15), h: sl > 0 ? 'TAI' : 'XIU'};
    }
    fRev() {
      const c = this.ch;
      if (c.length < 15) return null;
      const nh = grp(c);
      if (nh.length < 5) return null;
      const dn = nh[nh.length-1].n;
      let tt = 0, dc = 0;
      for (let i = 0; i < c.length - dn - 1; i++) {
        let ok = true;
        for (let j = 0; j < dn; j++) if (c[i+j] !== c[i+dn-1]) { ok = false; break; }
        if (!ok) continue;
        if (i + dn < c.length) {
          if (c[i+dn] === c[i+dn-1]) tt++; else dc++;
        }
      }
      if (tt + dc < 3) return null;
      return {pd: dc/(tt+dc), pt: tt/(tt+dc)};
    }
    fVol() {
      const c = this.ch;
      if (c.length < 15) return null;
      const g = c.slice(-25);
      let d = 0;
      for (let i = 1; i < g.length; i++) if (g[i] !== g[i-1]) d++;
      const r = d / (g.length - 1);
      return {r, cao: r > .65, thap: r < .35};
    }
    fSess() {
      const c = this.ch;
      if (c.length < 30) return null;
      const g = c.slice(-30);
      return {r3: g.slice(20, 30).filter(x => x === 'TAI').length/10};
    }
    fBay() {
      const c = this.ch;
      if (c.length < 15) return null;
      let a = 1, b = 1;
      for (const x of c.slice(-40)) { if (x === 'TAI') a++; else b++; }
      const pt = a/(a+b);
      const v = (a*b)/((a+b)*(a+b)*(a+b+1));
      return {pt, px: 1-pt, r: 1 - Math.sqrt(v)*4};
    }
    fMom() {
      const c = this.ch;
      if (c.length < 15) return null;
      let t = 0, x = 0;
      const g = c.slice(-15);
      for (let i = 0; i < g.length; i++) {
        const w = Math.exp(-(g.length-1-i)/5);
        if (g[i] === 'TAI') t += w; else x += w;
      }
      return {h: t > x ? 'TAI' : 'XIU', m: Math.abs(t-x)/(t+x)};
    }
    fRSI(p = 14) {
      const c = this.ch;
      if (c.length < p + 1) return null;
      let gn = 0, ls = 0;
      const g = c.slice(-p - 1);
      for (let i = 1; i < g.length; i++) {
        const cu = g[i] === 'TAI' ? 1 : 0, pr = g[i-1] === 'TAI' ? 1 : 0;
        const d = cu - pr;
        if (d > 0) gn += d; else ls -= d;
      }
      const ag = gn/p, al = ls/p;
      if (al === 0) return 100;
      return 100 - (100/(1 + ag/al));
    }
    fBB(p = 20, m = 2) {
      const a = this.td.filter(x => x != null);
      if (a.length < p) return null;
      const g = a.slice(-p);
      const mean = g.reduce((x,y) => x+y, 0)/p;
      const v = g.reduce((x,y) => x + (y-mean)*(y-mean), 0)/p;
      const sd = Math.sqrt(v);
      const last = g[g.length-1];
      let vt = 'g';
      if (last >= mean + m*sd) vt = 't';
      else if (last <= mean - m*sd) vt = 'd';
      return {mean, vt, sd};
    }
    fWS() {
      const c = this.ch;
      if (c.length < 10) return null;
      const nh = grp(c);
      if (nh.length < 3) return null;
      const last = nh[nh.length-1];
      let tt = 0, pv = 0, wt = 0, wp = 0;
      for (let i = 0; i < nh.length - 1; i++) {
        if (nh[i].n === last.n && nh[i].k === last.k) {
          const w = Math.pow(1.02, i);
          if (nh[i+1].k === last.k) { tt++; wt += w; } else { pv++; wp += w; }
        }
      }
      if (tt + pv < 2) return null;
      const wtt = wt + wp;
      return {s: tt+pv, pt: wtt > 0 ? wt/wtt : .5, h: last.k};
    }
    fZone() {
      const c = this.ch;
      if (c.length < 30) return null;
      const nh = grp(c);
      if (nh.length < 6) return null;
      const last = nh[nh.length-1];
      const z = last.n <= 2 ? 'short' : (last.n <= 4 ? 'mid' : 'long');
      let tt = 0, pv = 0;
      for (let i = 0; i < nh.length - 1; i++) {
        const nz = nh[i].n <= 2 ? 'short' : (nh[i].n <= 4 ? 'mid' : 'long');
        if (nz === z) { if (nh[i+1].k === last.k) tt++; else pv++; }
      }
      if (tt + pv < 3) return null;
      return {z, s: tt+pv, pt: tt/(tt+pv), h: last.k};
    }
    fShift() {
      const c = this.ch;
      if (c.length < 60) return null;
      const recent = c.slice(-20).filter(x => x === 'TAI').length / 20;
      const past = c.slice(-100, -20).filter(x => x === 'TAI').length / Math.min(80, c.length - 20);
      return {recent, past, shift: recent - past};
    }
    fMTF() {
      const c = this.ch;
      if (c.length < 50) return null;
      const frames = [5, 10, 20, 30, 50];
      let taiVote = 0;
      const votes = [];
      for (const f of frames) {
        const seg = c.slice(-f);
        const r = seg.filter(x => x === 'TAI').length / f;
        if (r > .5) taiVote++;
        votes.push(r);
      }
      return {taiVote, total: frames.length, votes, strong: taiVote >= 4 || taiVote <= 1};
    }
    scan() {
      const p = this.pattern();
      const h = this.hist(p);
      let rt = h.t;
      if (rt === null && this.ch.length >= 5) rt = this.ch.filter(x => x === 'TAI').length / this.ch.length * 100;
      if (rt === null) return {gy: null, rt: 50, rx: 50, tin: {}, n: 0};

      const tin = {
        fTong: this.fTong(),
        fM1: this.fM1(), fM2: this.fM2(), fM3: this.fM3(),
        fBet: this.fBet(), fStreak: this.fStreak(),
        fCycle: this.fCycle(), fAlt: this.fAlt(),
        fZig: this.fZig(), fFib: this.fFib(),
        fNG2: this.fNG(2), fNG3: this.fNG(3), fNG4: this.fNG(4), fNG5: this.fNG(5),
        fKNN: this.fKNN(), fDice: this.fDice(),
        fDT: this.fDT(), fEnt: this.fEnt(),
        fXung: this.fXung(), fTrend: this.fTrend(),
        fRev: this.fRev(), fVol: this.fVol(),
        fSess: this.fSess(), fBay: this.fBay(),
        fMom: this.fMom(), fRSI: this.fRSI(),
        fBB: this.fBB(), fWS: this.fWS(),
        fZone: this.fZone(), fShift: this.fShift(), fMTF: this.fMTF()
      };

      return {gy: rt >= 50 ? 'TAI' : 'XIU', rt, rx: 100 - rt, n: h.s || this.ch.length, tin};
    }
  }

  class Zw {
    constructor() {
      this.w = {
        fTong:.04, fM1:.05, fM2:.05, fM3:.05,
        fBet:.05, fStreak:.05, fCycle:.08, fAlt:.06,
        fZig:.04, fFib:.03, fNG:.07, fKNN:.06,
        fDice:.03, fDT:.04, fXung:.04, fTrend:.05,
        fRev:.04, fVol:.03, fSess:.03, fBay:.04,
        fMom:.04, fRSI:.05, fBB:.04, fWS:.05,
        fMau:.06, fLech:.05,
        fZone:.05, fShift:.04, fMTF:.06, fAnti:.05
      };
      this.hs = {};
      for (const k of Object.keys(this.w)) this.hs[k] = {d: 0, t: 0};
      this.prev = null;
      this.wrongStreak = 0;
    }
    track(kq) {
      if (!this.prev) return;
      for (const k of Object.keys(this.hs)) {
        const dk = this.prev.dt[k];
        if (dk == null) continue;
        this.hs[k].t++;
        const h = dk >= .5 ? this.prev.g : (this.prev.g === 'TAI' ? 'XIU' : 'TAI');
        if (h === kq) this.hs[k].d++;
      }
      if (this.prev.g === kq) this.wrongStreak = 0;
      else this.wrongStreak++;
      this.prev = null;
    }
    tw(k) {
      const h = this.hs[k];
      const base = this.w[k] || .03;
      if (!h || h.t < 5) return base;
      const r = h.d/h.t;
      return base * (.5 + 1/(1 + Math.exp(-(r - .5)*8))*1.2);
    }
    calc(c, gy, n, rt, th) {
      if (!c.length || !gy) return 0;
      const dt = {};

      dt.fMau = Math.min(1, Math.log10(n + 1) / Math.log10(41));
      const rg = gy === 'TAI' ? rt : (100 - rt);
      dt.fLech = Math.min(1, Math.max(0, (rg - 50) / 32));

      dt.fM1 = 0;
      if (th.fM1) { const p = gy === 'TAI' ? th.fM1.pt : th.fM1.px; dt.fM1 = Math.min(1, Math.max(0, (p - .5)*2)); }
      dt.fM2 = 0;
      if (th.fM2) { const p = gy === 'TAI' ? th.fM2.pt : 1-th.fM2.pt; dt.fM2 = Math.min(1, Math.max(0, (p - .5)*2)) * Math.min(1, th.fM2.s/10); }
      dt.fM3 = 0;
      if (th.fM3) { const p = gy === 'TAI' ? th.fM3.pt : 1-th.fM3.pt; dt.fM3 = Math.min(1, Math.max(0, (p - .5)*2)) * Math.min(1, th.fM3.s/8); }
      dt.fTong = 0;
      if (th.fTong) { const p = gy === 'TAI' ? th.fTong.r : 1-th.fTong.r; dt.fTong = Math.min(1, Math.max(0, (p - .5)*2)); }
      dt.fCycle = 0;
      if (th.fCycle) { dt.fCycle = th.fCycle.g === gy ? th.fCycle.r : 0; }
      dt.fAlt = 0;
      if (th.fAlt) { dt.fAlt = th.fAlt.g === gy ? Math.min(1, th.fAlt.d/6) : 0; }
      dt.fZig = 0;
      if (th.fZig) { const hd = c[c.length-1] === 'TAI' ? 'XIU' : 'TAI'; if (gy === hd) dt.fZig = th.fZig.r; }
      dt.fFib = 0;
      if (th.fFib) { const hd = th.fFib.h === 'TAI' ? 'XIU' : 'TAI'; if (gy === hd) dt.fFib = th.fFib.r; }
      dt.fStreak = 0;
      if (th.fStreak) { dt.fStreak = th.fStreak.gy === gy ? Math.abs(th.fStreak.pt - .5)*2 * Math.min(1, th.fStreak.tm/15) : 0; }
      dt.fBet = Math.min(1, (th.fBet || 0)/8);

      let dn = 0, cn = 0;
      for (const k of ['fNG2','fNG3','fNG4','fNG5']) {
        if (th[k]) {
          const p = gy === 'TAI' ? th[k].r : 100 - th[k].r;
          dn += Math.min(1, Math.max(0, (p - 50)/40)) * Math.min(1, th[k].s/12);
          cn++;
        }
      }
      dt.fNG = cn > 0 ? dn/cn : 0;

      dt.fKNN = 0;
      if (th.fKNN) { const p = gy === 'TAI' ? th.fKNN.r : 100-th.fKNN.r; dt.fKNN = Math.min(1, Math.max(0, (p-50)/45)) * Math.min(1, th.fKNN.s/8); }
      dt.fDice = 0;
      if (th.fDice) { const ok = (th.fDice.ht && gy === 'TAI') || (!th.fDice.ht && gy === 'XIU'); dt.fDice = ok ? Math.min(1, Math.abs(th.fDice.mg - 10.5)/4) : 0; }
      dt.fDT = 0;
      if (th.fDT) {
        if (gy === 'TAI' && th.fDT.dtT) dt.fDT = 1;
        else if (gy === 'XIU' && th.fDT.dtX) dt.fDT = 1;
        else { const p = th.fDT.r30/100; const pg = gy === 'TAI' ? p : 1-p; dt.fDT = Math.min(1, Math.max(0, (pg - .5)*2)) * .6; }
      }
      dt.fXung = 0;
      if (th.fXung) { const p = gy === 'TAI' ? th.fXung.t : th.fXung.x; dt.fXung = Math.min(1, Math.max(0, (p - 50)/40)); }
      dt.fTrend = 0;
      if (th.fTrend) dt.fTrend = th.fTrend.h === gy ? th.fTrend.m : 0;

      dt.fRev = 0;
      if (th.fRev) {
        const hc = c[c.length-1], hd = hc === 'TAI' ? 'XIU' : 'TAI';
        if (gy === hd) dt.fRev = th.fRev.pd;
        else if (gy === hc) dt.fRev = th.fRev.pt;
      }
      dt.fVol = 0;
      if (th.fVol) {
        const hc = c[c.length-1], hd = hc === 'TAI' ? 'XIU' : 'TAI';
        if (th.fVol.cao && gy === hd) dt.fVol = .7;
        else if (th.fVol.thap && gy === hc) dt.fVol = .7;
        else dt.fVol = .3;
      }
      dt.fSess = 0;
      if (th.fSess) { const p = gy === 'TAI' ? th.fSess.r3 : 1-th.fSess.r3; dt.fSess = Math.min(1, Math.max(0, (p - .5)*2)); }
      dt.fBay = 0;
      if (th.fBay) { const p = gy === 'TAI' ? th.fBay.pt : th.fBay.px; dt.fBay = Math.min(1, Math.max(0, (p - .5)*2)) * th.fBay.r; }
      dt.fMom = 0;
      if (th.fMom) dt.fMom = th.fMom.h === gy ? th.fMom.m : 0;

      dt.fRSI = 0;
      if (th.fRSI != null) {
        if (th.fRSI >= 70) dt.fRSI = gy === 'XIU' ? Math.min(1, (th.fRSI - 70)/25) : 0;
        else if (th.fRSI <= 30) dt.fRSI = gy === 'TAI' ? Math.min(1, (30 - th.fRSI)/25) : 0;
        else dt.fRSI = Math.min(1, Math.abs(th.fRSI - 50)/30) * (gy === (th.fRSI > 50 ? 'TAI' : 'XIU') ? .35 : 0);
      }
      dt.fBB = 0;
      if (th.fBB) {
        if (th.fBB.vt === 't') dt.fBB = gy === 'XIU' ? .85 : 0;
        else if (th.fBB.vt === 'd') dt.fBB = gy === 'TAI' ? .85 : 0;
        else { const p = th.fBB.mean/21; const pg = gy === 'TAI' ? p : 1-p; dt.fBB = Math.min(1, Math.max(0, (pg - .5)*2)) * .4; }
      }
      dt.fWS = 0;
      if (th.fWS) { const ok = th.fWS.h === gy; const p = ok ? th.fWS.pt : (1 - th.fWS.pt); dt.fWS = Math.min(1, Math.max(0, (p - .5)*2)) * Math.min(1, th.fWS.s/6); }

      dt.fZone = 0;
      if (th.fZone) {
        const ok = th.fZone.h === gy;
        const p = ok ? th.fZone.pt : (1 - th.fZone.pt);
        dt.fZone = Math.min(1, Math.max(0, (p - .5)*2)) * Math.min(1, th.fZone.s/8);
      }

      dt.fShift = 0;
      if (th.fShift) {
        const s = th.fShift.shift;
        if (Math.abs(s) > .15) {
          const hint = s > 0 ? 'TAI' : 'XIU';
          dt.fShift = gy === hint ? Math.min(1, Math.abs(s) * 3) : 0;
        } else {
          const pg = gy === 'TAI' ? th.fShift.recent : 1 - th.fShift.recent;
          dt.fShift = Math.min(1, Math.max(0, (pg - .5)*2)) * .4;
        }
      }

      dt.fMTF = 0;
      if (th.fMTF && th.fMTF.strong) {
        const hint = th.fMTF.taiVote >= 4 ? 'TAI' : 'XIU';
        dt.fMTF = gy === hint ? Math.min(1, Math.abs(th.fMTF.taiVote - 2.5)/2.5) : 0;
      }
      dt.fAnti = 0;

      let diem = 0, tw = 0;
      for (const k of Object.keys(dt)) {
        if (dt[k] == null) continue;
        const w = this.tw(k);
        diem += dt[k] * w;
        tw += w;
      }
      if (tw > 0) diem /= tw;

      let dy = 0, pd = 0;
      for (const k of Object.keys(dt)) {
        if (dt[k] == null) continue;
        if (dt[k] >= .7) dy++;
        else if (dt[k] <= .2 && k !== 'fBet' && k !== 'fAlt' && k !== 'fCycle') pd++;
      }
      diem = Math.min(1, Math.max(0, diem + Math.min(1, dy/8)*.18 - (pd >= 5 ? .1 : 0)));

      if (th.fEnt > .98) diem *= .85;
      else if (th.fEnt > .92) diem *= .93;

      if (th.fCycle && th.fCycle.r >= .9 && th.fCycle.g === gy) diem = Math.min(1, diem + .12);
      if (th.fAlt && th.fAlt.d >= 5 && th.fAlt.g === gy) diem = Math.min(1, diem + .08);
      if (th.fTrend && th.fTrend.m >= .8 && th.fTrend.h === gy) diem = Math.min(1, diem + .06);
      if (th.fRSI != null && (th.fRSI >= 75 || th.fRSI <= 25)) diem = Math.min(1, diem + .05);
      if (th.fBB && th.fBB.vt !== 'g') diem = Math.min(1, diem + .04);
      if (th.fMTF && th.fMTF.strong && th.fMTF.taiVote >= 4 && gy === 'TAI') diem = Math.min(1, diem + .05);
      if (th.fMTF && th.fMTF.strong && th.fMTF.taiVote <= 1 && gy === 'XIU') diem = Math.min(1, diem + .05);

      if (this.wrongStreak >= 3) diem = Math.min(1, diem * .9);

      this.prev = {g: gy, dt};
      return Math.round(diem * 100);
    }
  }

  class Bd {
    constructor(url, prefix) {
      this.url = url; this.p = prefix;
      this.eng = new Yq(); this.ai = new Zw();
      this.lastSid = null; this.im = false; this.lastGy = null;

      this.taiEl = document.getElementById('tai-' + prefix);
      this.xiuEl = document.getElementById('xiu-' + prefix);
      this.sidEl = document.getElementById('sid-' + prefix);
      this.stEl = document.getElementById('status-' + prefix);
      this.cfEl = document.getElementById('conf-' + prefix);
      this.cfLv = this.cfEl.querySelector('.conf-level');
      this.cfNm = this.cfEl.querySelector('.conf-num');
      this.cfBar = document.getElementById('conf-bar-' + prefix);
    }
    circles(h, nhay, rt, rx) {
      this.taiEl.classList.remove('active', 'resting');
      this.xiuEl.classList.remove('active', 'resting');
      if (rt != null && rx != null) {
        this.taiEl.textContent = Math.round(rt) + '%';
        this.xiuEl.textContent = Math.round(rx) + '%';
      } else {
        this.taiEl.textContent = '--%'; this.xiuEl.textContent = '--%';
      }
      if (!h) return;
      const el = h === 'TAI' ? this.taiEl : this.xiuEl;
      el.classList.add(nhay ? 'active' : 'resting');
    }
    conf(d, nhay) {
      if (!nhay || d < 50) {
        this.cfEl.classList.remove('show', 'mid', 'ok', 'high');
        this.cfBar.style.width = '0%';
        this.cfBar.classList.remove('high');
        return;
      }
      let lv = '', cls = '';
      if (d >= 80) { lv = 'CAO'; cls = 'high'; }
      else if (d >= 70) { lv = 'ỔN'; cls = 'ok'; }
      else { lv = 'TRUNG BÌNH'; cls = 'mid'; }
      this.cfLv.textContent = lv;
      this.cfNm.textContent = d + '%';
      this.cfEl.classList.add('show');
      this.cfEl.classList.remove('mid', 'ok', 'high');
      this.cfEl.classList.add(cls);
      this.cfBar.style.width = Math.min(100, d) + '%';
      this.cfBar.classList.toggle('high', d >= 80);
    }
    async tick() {
      try {
        const res = await fetch(this.url, {cache: 'no-store'});
        if (!res.ok) throw 0;
        const data = await res.json();
        const list = data.list || data.data || data.sessions || data.result;
        if (!Array.isArray(list) || !list.length) throw 0;
        const asc = [...list].sort((a,b) => (a.id||0) - (b.id||0));
        const nid = list[0].id ?? asc[asc.length-1].id;
        if (this.lastSid !== null && nid !== this.lastSid) {
          const last = asc[asc.length-1];
          const kq = last.resultTruyenThong || last.result || last.ketQua;
          if (this.lastGy && kq) this.ai.track(kq);
          this.im = true;
          this.circles(null, false, null, null);
          this.conf(0, false);
          this.sidEl.textContent = '#' + nid;
          this.stEl.textContent = 'Đang chờ...';
          this.stEl.classList.remove('analyzing');
          setTimeout(() => { this.im = false; this.analyze(asc, nid); }, 5000);
          this.lastSid = nid;
          return;
        }
        this.lastSid = nid;
        this.sidEl.textContent = '#' + (nid + 1);
        if (!this.im) this.analyze(asc, nid);
      } catch (e) {
        this.stEl.textContent = 'Đang kết nối...';
        this.stEl.classList.remove('analyzing');
      }
    }
    analyze(asc, nid) {
      this.eng.nap(asc);
      const qs = this.eng.scan();
      this.sidEl.textContent = '#' + (nid + 1);
      if (qs.gy) {
        const d = this.ai.calc(this.eng.ch, qs.gy, qs.n, qs.rt, qs.tin);
        this.circles(qs.gy, true, qs.rt, qs.rx);
        this.conf(d, true);
        this.stEl.textContent = 'Đang chờ...';
        this.stEl.classList.add('analyzing');
        this.lastGy = qs.gy;
      } else {
        this.circles(null, false, null, null);
        this.conf(0, false);
        this.stEl.textContent = 'Đang chờ...';
        this.stEl.classList.remove('analyzing');
        this.lastGy = null;
      }
    }
  }

  const bMD5 = new Bd('https://ancient-poetry-7f56.lot896613.workers.dev/?mode=md5', 'md5');
  const bHu = new Bd('https://wtx.tele68.com/v1/tx/sessions', 'hu');
  setInterval(() => { bMD5.tick(); bHu.tick(); }, 4000);
  bMD5.tick(); bHu.tick();
}

document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const card = document.getElementById(btn.dataset.target);
    card.classList.toggle('collapsed');
    btn.textContent = card.classList.contains('collapsed') ? '+' : '−';
  });
});

function ganKeoTha(el) {
  let drag = false, sx, sy, ix, iy;
  el.addEventListener('pointerdown', e => {
    if (e.target.closest('.toggle-btn')) return;
    drag = true;
    sx = e.clientX; sy = e.clientY;
    ix = el.offsetLeft; iy = el.offsetTop;
    try { el.setPointerCapture(e.pointerId); } catch(_){}
  });
  el.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    requestAnimationFrame(() => {
      el.style.left = (ix + dx) + 'px';
      el.style.top = (iy + dy) + 'px';
      el.style.right = 'auto';
    });
  });
  const stop = () => drag = false;
  el.addEventListener('pointerup', stop);
  el.addEventListener('pointercancel', stop);
}
document.querySelectorAll('.drag-group').forEach(ganKeoTha);
