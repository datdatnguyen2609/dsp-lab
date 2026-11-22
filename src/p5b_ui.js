
/* ================= LÕI GIAO DIỆN ================= */
const $ = id => document.getElementById(id);
const COL = {};
function readColors() {
  const s = getComputedStyle(document.documentElement);
  for (const k of ['paper', 'panel', 'panel-2', 'ink', 'muted', 'line', 'grid', 'trace', 'sample', 'a3', 'a4', 'warn', 'bad', 'good'])
    COL[k] = s.getPropertyValue('--' + k).trim();
}
readColors();
function alpha(col, a) {
  // nhận #rrggbb, trả rgba
  if (col && col[0] === '#' && col.length === 7) {
    const r = parseInt(col.slice(1, 3), 16), g = parseInt(col.slice(3, 5), 16), b = parseInt(col.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  }
  return col;
}
function niceStep(span, count) {
  const raw = span / Math.max(1, count), p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
}
class Plot {
  constructor(c) {
    const dpr = window.devicePixelRatio || 1, w = c.clientWidth || c.parentElement.clientWidth || 300, h = +c.dataset.h || 200;
    c.style.height = h + 'px';
    const W = Math.round(w * dpr), Hh = Math.round(h * dpr);
    if (c.width !== W) c.width = W;
    if (c.height !== Hh) c.height = Hh;
    const x = c.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.clearRect(0, 0, w, h);
    Object.assign(this, { c, x, w, h, m: { l: 42, r: 10, t: 10, b: 24 } });
    this.font = '11px "JetBrains Mono", ui-monospace, monospace';
  }
  range(x0, x1, y0, y1) { if (y1 - y0 < 1e-12) { y0 -= 1; y1 += 1; } Object.assign(this, { x0, x1, y0, y1 }); return this; }
  equal(cx, cy, r) { // khung tỉ lệ 1:1 (mặt phẳng phức)
    const W = this.w - this.m.l - this.m.r, H = this.h - this.m.t - this.m.b, s = Math.min(W, H) / (2 * r);
    return this.range(cx - W / (2 * s), cx + W / (2 * s), cy - H / (2 * s), cy + H / (2 * s));
  }
  X(v) { return this.m.l + (v - this.x0) / (this.x1 - this.x0) * (this.w - this.m.l - this.m.r); }
  Y(v) { return this.h - this.m.b - (v - this.y0) / (this.y1 - this.y0) * (this.h - this.m.t - this.m.b); }
  iX(px) { return this.x0 + (px - this.m.l) / (this.w - this.m.l - this.m.r) * (this.x1 - this.x0); }
  iY(py) { return this.y0 + (this.h - this.m.b - py) / (this.h - this.m.t - this.m.b) * (this.y1 - this.y0); }
  frame(o = {}) {
    const x = this.x, m = this.m;
    x.fillStyle = COL['panel-2']; x.fillRect(m.l, m.t, this.w - m.l - m.r, this.h - m.t - m.b);
    x.font = this.font; x.lineWidth = 1;
    const xs = o.xt || niceStep(this.x1 - this.x0, Math.max(2, Math.floor((this.w - m.l) / 70)));
    const ys = o.yt || niceStep(this.y1 - this.y0, Math.max(2, Math.floor((this.h - m.t - m.b) / 34)));
    const xf = o.xf || (v => +v.toFixed(6) + ''), yf = o.yf || (v => +v.toFixed(6) + '');
    x.strokeStyle = COL.grid; x.fillStyle = COL.muted;
    x.textAlign = 'center'; x.textBaseline = 'top';
    for (let v = Math.ceil(this.x0 / xs - 1e-9) * xs; v <= this.x1 + 1e-9; v += xs) {
      const px = Math.round(this.X(v)) + .5;
      x.beginPath(); x.moveTo(px, m.t); x.lineTo(px, this.h - m.b); x.stroke();
      if (!o.noXL) x.fillText(xf(v).replace('-', '−'), px, this.h - m.b + 5);
    }
    x.textAlign = 'right'; x.textBaseline = 'middle';
    for (let v = Math.ceil(this.y0 / ys - 1e-9) * ys; v <= this.y1 + 1e-9; v += ys) {
      const py = Math.round(this.Y(v)) + .5;
      x.beginPath(); x.moveTo(m.l, py); x.lineTo(this.w - m.r, py); x.stroke();
      if (!o.noYL) x.fillText(yf(v).replace('-', '−'), m.l - 5, py);
    }
    x.strokeStyle = COL.muted; x.lineWidth = 1;
    if (this.y0 < 0 && this.y1 > 0 && !o.noZero) { const py = Math.round(this.Y(0)) + .5; x.beginPath(); x.moveTo(m.l, py); x.lineTo(this.w - m.r, py); x.stroke(); }
    if (o.yAxis0 && this.x0 < 0 && this.x1 > 0) { const px = Math.round(this.X(0)) + .5; x.beginPath(); x.moveTo(px, m.t); x.lineTo(px, this.h - m.b); x.stroke(); }
    if (o.xl) { x.textAlign = 'right'; x.textBaseline = 'bottom'; x.fillStyle = COL.muted; x.fillText(o.xl, this.w - m.r - 3, this.h - m.b - 3); }
    if (o.yl) { x.textAlign = 'left'; x.textBaseline = 'top'; x.fillStyle = COL.muted; x.fillText(o.yl, m.l + 4, m.t + 3); }
    return this;
  }
  clip() { const m = this.m; this.x.save(); this.x.beginPath(); this.x.rect(m.l, m.t, this.w - m.l - m.r, this.h - m.t - m.b); this.x.clip(); return this; }
  unclip() { this.x.restore(); return this; }
  line(xs, ys, col, lw = 1.8, dash) {
    const x = this.x; x.strokeStyle = col; x.lineWidth = lw; x.setLineDash(dash || []); x.lineJoin = 'round';
    x.beginPath(); let pen = false;
    for (let i = 0; i < xs.length; i++) {
      const yv = ys[i]; if (!isFinite(yv)) { pen = false; continue; }
      const px = this.X(xs[i]), py = this.Y(clamp(yv, this.y0 - (this.y1 - this.y0) * 5, this.y1 + (this.y1 - this.y0) * 5));
      if (pen) x.lineTo(px, py); else { x.moveTo(px, py); pen = true; }
    }
    x.stroke(); x.setLineDash([]); return this;
  }
  fn(f, col, lw = 1.8, n = 500, dash) {
    const xs = [], ys = [];
    for (let i = 0; i <= n; i++) { const v = this.x0 + (this.x1 - this.x0) * i / n; xs.push(v); ys.push(f(v)); }
    return this.line(xs, ys, col, lw, dash);
  }
  stem(xs, ys, col, r = 3, lw = 1.6) {
    const x = this.x, y0 = this.Y(clamp(0, this.y0, this.y1));
    x.strokeStyle = col; x.fillStyle = col; x.lineWidth = lw;
    for (let i = 0; i < xs.length; i++) {
      if (!isFinite(ys[i])) continue;
      const px = this.X(xs[i]), py = this.Y(clamp(ys[i], this.y0, this.y1));
      x.beginPath(); x.moveTo(px, y0); x.lineTo(px, py); x.stroke();
      if (r > 0) { x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill(); }
    }
    return this;
  }
  dot(vx, vy, col, r = 3.5, hollow) {
    const x = this.x; x.beginPath(); x.arc(this.X(vx), this.Y(vy), r, 0, TAU);
    if (hollow) { x.strokeStyle = col; x.lineWidth = 2; x.stroke(); } else { x.fillStyle = col; x.fill(); }
    return this;
  }
  cross(vx, vy, col, s = 6, lw = 2.2) {
    const x = this.x, px = this.X(vx), py = this.Y(vy); x.strokeStyle = col; x.lineWidth = lw;
    x.beginPath(); x.moveTo(px - s, py - s); x.lineTo(px + s, py + s); x.moveTo(px + s, py - s); x.lineTo(px - s, py + s); x.stroke();
    return this;
  }
  plus(vx, vy, col, s = 6, lw = 2) {
    const x = this.x, px = this.X(vx), py = this.Y(vy); x.strokeStyle = col; x.lineWidth = lw;
    x.beginPath(); x.moveTo(px - s, py); x.lineTo(px + s, py); x.moveTo(px, py - s); x.lineTo(px, py + s); x.stroke();
    return this;
  }
  seg(a, b, c, d, col, lw = 1.5, dash) {
    const x = this.x; x.strokeStyle = col; x.lineWidth = lw; x.setLineDash(dash || []);
    x.beginPath(); x.moveTo(this.X(a), this.Y(b)); x.lineTo(this.X(c), this.Y(d)); x.stroke(); x.setLineDash([]); return this;
  }
  arrow(a, b, c, d, col, lw = 2) {
    this.seg(a, b, c, d, col, lw);
    const x = this.x, px = this.X(c), py = this.Y(d), ang = Math.atan2(py - this.Y(b), px - this.X(a)), L = 7;
    if (Math.hypot(px - this.X(a), py - this.Y(b)) < 4) return this;
    x.fillStyle = col; x.beginPath(); x.moveTo(px, py);
    x.lineTo(px - L * Math.cos(ang - .4), py - L * Math.sin(ang - .4)); x.lineTo(px - L * Math.cos(ang + .4), py - L * Math.sin(ang + .4)); x.closePath(); x.fill();
    return this;
  }
  vline(v, col, dash = [4, 4], lw = 1.2) { return this.seg(v, this.y0, v, this.y1, col, lw, dash); }
  hline(v, col, dash = [4, 4], lw = 1.2) { return this.seg(this.x0, v, this.x1, v, col, lw, dash); }
  circle(cx, cy, r, col, lw = 1.2, dash) {
    const x = this.x; x.strokeStyle = col; x.lineWidth = lw; x.setLineDash(dash || []);
    x.beginPath(); x.ellipse(this.X(cx), this.Y(cy), Math.abs(this.X(cx + r) - this.X(cx)), Math.abs(this.Y(cy + r) - this.Y(cy)), 0, 0, TAU); x.stroke(); x.setLineDash([]);
    return this;
  }
  text(t, vx, vy, col, align = 'left', base = 'middle', font) {
    const x = this.x; x.font = font || this.font; x.fillStyle = col || COL.ink; x.textAlign = align; x.textBaseline = base;
    x.fillText(t, this.X(vx), this.Y(vy)); return this;
  }
  tpx(t, px, py, col, align = 'left', base = 'middle', font) {
    const x = this.x; x.font = font || this.font; x.fillStyle = col || COL.ink; x.textAlign = align; x.textBaseline = base;
    x.fillText(t, px, py); return this;
  }
}
const autoY = (arrs, pad = 0.12, minSpan = 0.5) => {
  let lo = Infinity, hi = -Infinity;
  for (const a of arrs) for (const v of a) if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  if (!isFinite(lo)) { lo = -1; hi = 1; }
  lo = Math.min(lo, 0); hi = Math.max(hi, 0);
  if (hi - lo < minSpan) { hi += minSpan / 2; lo -= minSpan / 2; }
  const p = (hi - lo) * pad; return [lo - (lo < 0 ? p : 0), hi + p];
};
const piF = v => { const r = Math.round(v / PI * 100) / 100; return r === 0 ? '0' : (r === 1 ? 'π' : (r === -1 ? '−π' : r + 'π')); };

/* registry: mỗi demo đăng ký hàm vẽ lại; gọi lại khi đổi kích thước hoặc giao diện */
const demos = [];
function demo(fnc) { demos.push(fnc); try { fnc(); } catch (err) { console.error(err); } return fnc; }
function redrawAll() { readColors(); for (const d of demos) { try { d(); } catch (err) { console.error(err); } } }
let rzT = 0, lastW = window.innerWidth;
window.addEventListener('resize', () => { if (Math.abs(window.innerWidth - lastW) < 2) return; lastW = window.innerWidth; clearTimeout(rzT); rzT = setTimeout(redrawAll, 150); });
try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => setTimeout(redrawAll, 30)); } catch (e) { }
new MutationObserver(() => setTimeout(redrawAll, 30)).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

/* liên kết thanh trượt với nhãn hiển thị */
function bind(ids, fnc) {
  for (const id of ids) { const el = $(id); if (!el) continue; el.addEventListener('input', fnc); el.addEventListener('change', fnc); }
}
const val = id => +$(id).value;
const out = (id, t) => { const o = $(id); if (o) o.textContent = t; };

/* âm thanh */
let actx = null;
function playSamples(arr, sr, gap) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    let peak = 1e-9; for (const v of arr) peak = Math.max(peak, Math.abs(v));
    const buf = actx.createBuffer(1, arr.length, sr), ch = buf.getChannelData(0), fade = Math.min(400, arr.length / 4);
    for (let i = 0; i < arr.length; i++) { let g = 0.45 / peak; if (i < fade) g *= i / fade; if (arr.length - i < fade) g *= (arr.length - i) / fade; ch[i] = arr[i] * g; }
    const src = actx.createBufferSource(); src.buffer = buf; src.connect(actx.destination); src.start(actx.currentTime + (gap || 0));
  } catch (err) { console.warn('Không phát được âm thanh', err); }
}

/* ================= STEPPER: dẫn giải từng bước ================= */
document.querySelectorAll('.stepper').forEach(st => {
  const ol = st.querySelector('ol'), lis = [...ol.children];
  const head = document.createElement('div'); head.className = 'sh';
  head.innerHTML = `<h4>${st.dataset.title || 'Dẫn giải'}</h4>`;
  const allBtn = document.createElement('button'); allBtn.className = 'btn ghost'; allBtn.type = 'button'; allBtn.textContent = 'Hiện tất cả';
  head.appendChild(allBtn); st.insertBefore(head, ol);
  const bar = document.createElement('div'); bar.className = 'stepbar';
  bar.innerHTML = '<span class="count"></span><button class="btn ghost" type="button">◀ Bước trước</button><button class="btn" type="button">Bước tiếp ▶</button>';
  st.appendChild(bar);
  ol.style.position = 'relative';
  const [cnt, prev, next] = bar.children;
  let i = 0;
  const show = (k, anim) => {
    const old = i; i = clamp(k, 0, lis.length - 1);
    lis.forEach((li, j) => {
      const vis = j <= i;
      li.classList.toggle('later', !vis);
      li.classList.toggle('cur', j === i);
      li.setAttribute('aria-hidden', vis ? 'false' : 'true');
      if (anim && vis && j > old) { li.classList.remove('enter'); void li.offsetWidth; li.classList.add('enter'); }
    });
    cnt.textContent = `Bước ${i + 1} / ${lis.length}`;
    prev.disabled = i === 0; next.disabled = i === lis.length - 1;
    allBtn.textContent = i === lis.length - 1 ? 'Thu gọn' : 'Hiện tất cả';
  };
  prev.onclick = () => show(i - 1, true);
  next.onclick = () => show(i + 1, true);
  allBtn.onclick = () => show(i === lis.length - 1 ? 0 : lis.length - 1, true);
  show(0);
});
{ // CSS cho các bước chưa mở: vẫn được dàn trang (để MathJax đo được) nhưng ẩn hoàn toàn
  const s = document.createElement('style');
  s.textContent = '.stepper li.later{position:absolute;left:0;right:0;top:0;visibility:hidden;pointer-events:none}';
  document.head.appendChild(s);
}

/* ================= TIẾN ĐỘ, MỤC LỤC, GIAO DIỆN ================= */
const TOTAL = 16;
let done = {};
try { done = JSON.parse(localStorage.getItem('dsp-lab-done') || '{}') || {}; } catch (e) { done = {}; }
function saveDone() { try { localStorage.setItem('dsp-lab-done', JSON.stringify(done)); } catch (e) { } }
function updateProgress() {
  const n = Object.keys(done).filter(k => done[k]).length;
  $('progBar').style.width = (100 * n / TOTAL) + '%';
  $('progTxt').textContent = `${n}/${TOTAL} chương`;
  document.querySelectorAll('#toc a').forEach(a => { const id = a.getAttribute('href').slice(1); a.classList.toggle('done', !!done[id]); });
}
const tocLinks = [...document.querySelectorAll('#toc a')];
const io = new IntersectionObserver(ents => {
  for (const e of ents) if (e.isIntersecting) {
    const id = e.target.id;
    tocLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
  }
}, { rootMargin: '-30% 0px -60% 0px' });
document.querySelectorAll('section.ch').forEach(s => io.observe(s));
$('menuBtn').onclick = () => { const t = $('toc'); t.classList.toggle('open'); $('menuBtn').setAttribute('aria-expanded', t.classList.contains('open')); };
tocLinks.forEach(a => a.addEventListener('click', () => { $('toc').classList.remove('open'); $('menuBtn').setAttribute('aria-expanded', 'false'); }));
$('themeBtn').onclick = () => {
  const r = document.documentElement, cur = r.getAttribute('data-theme');
  const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = cur ? cur === 'dark' : sysDark;
  r.setAttribute('data-theme', isDark ? 'light' : 'dark');
};
