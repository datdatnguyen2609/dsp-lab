
/* ================= MATLAB: giao diện soạn thảo, chạy và vẽ ================= */
const ML_KW = new Set(['if', 'elseif', 'else', 'end', 'for', 'while', 'break', 'continue', 'return', 'function', 'switch', 'case', 'otherwise', 'classdef', 'properties', 'methods', 'events']);
const ML_FN = new Set(MLAB.BUILTINS);
const escH = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function mlHighlight(src, errLine) {
  const lines = src.split('\n');
  let block = false;
  return lines.map((ln, li) => {
    let h = '', i = 0, prevVal = false;
    if (block || /^\s*%\{\s*$/.test(ln)) { block = !/^\s*%\}\s*$/.test(ln); h = `<span class="c">${escH(ln)}</span>`; }
    else while (i < ln.length) {
      const ch = ln[i], rest = ln.slice(i);
      let m;
      if (ch === '%') { h += `<span class="c">${escH(rest)}</span>`; break; }
      if ((ch === "'" && !prevVal) || ch === '"') {
        let j = i + 1; while (j < ln.length && !(ln[j] === ch && ln[j + 1] !== ch)) { if (ln[j] === ch) j++; j++; }
        h += `<span class="s">${escH(ln.slice(i, j + 1))}</span>`; i = j + 1; prevVal = true; continue;
      }
      if ((m = rest.match(/^(\d+\.?\d*([eE][+-]?\d+)?|\.\d+([eE][+-]?\d+)?)[ij]?/)) && !(m[0].endsWith('.') && /^[*\/\\^']/.test(ln[i + m[0].length] || ''))) {
        h += `<span class="n">${m[0]}</span>`; i += m[0].length; prevVal = true; continue;
      }
      if ((m = rest.match(/^\d+/))) { h += `<span class="n">${m[0]}</span>`; i += m[0].length; prevVal = true; continue; }
      if ((m = rest.match(/^[A-Za-z_]\w*/))) {
        const w = m[0];
        h += ML_KW.has(w) ? `<span class="k">${w}</span>` : ML_FN.has(w) && !/^(i|j|pi)$/.test(w) ? `<span class="f">${w}</span>` : w;
        i += w.length; prevVal = true; continue;
      }
      h += escH(ch); prevVal = /[)\]}'.]/.test(ch) && ch !== '.' || (ch === "'" && prevVal); i++;
      if (ch === ' ') prevVal = false;
    }
    return `<span class="ln${errLine === li + 1 ? ' errl' : ''}">${h || ' '}</span>`;
  }).join('');
}

/* ---------- vẽ một trục (axes) bằng lớp Plot có sẵn ---------- */
const DASH = { '-': [], '--': [7, 4], ':': [2, 3], '-.': [7, 3, 2, 3], none: null };
function drawMarker(p, x, y, mk, col, filled, r = 3.2) {
  const g = p.x, px = p.X(x), py = p.Y(y);
  g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 1.5;
  switch (mk) {
    case 'x': g.beginPath(); g.moveTo(px - r, py - r); g.lineTo(px + r, py + r); g.moveTo(px + r, py - r); g.lineTo(px - r, py + r); g.stroke(); break;
    case '+': g.beginPath(); g.moveTo(px - r, py); g.lineTo(px + r, py); g.moveTo(px, py - r); g.lineTo(px, py + r); g.stroke(); break;
    case '*': drawMarker(p, x, y, 'x', col, filled, r * .8); drawMarker(p, x, y, '+', col, filled, r); break;
    case '.': g.beginPath(); g.arc(px, py, 1.8, 0, TAU); g.fill(); break;
    case 's': g.beginPath(); g.rect(px - r, py - r, 2 * r, 2 * r); filled ? g.fill() : g.stroke(); break;
    case 'd': g.beginPath(); g.moveTo(px, py - r * 1.3); g.lineTo(px + r, py); g.lineTo(px, py + r * 1.3); g.lineTo(px - r, py); g.closePath(); filled ? g.fill() : g.stroke(); break;
    default: g.beginPath(); g.arc(px, py, r, 0, TAU); filled ? g.fill() : g.stroke();
  }
}
function mlDrawAxes(c, A) {
  const p = new Plot(c), S = A.series, g = p.x;
  p.m = { l: A.yl ? 58 : 46, r: 14, t: A.title ? 28 : 12, b: A.xl ? 42 : 26 };
  const ly = v => A.logy ? (v > 0 ? Math.log10(v) : NaN) : v;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, stemy = false, img = false;
  const ux = v => { if (isFinite(v)) { x0 = Math.min(x0, v); x1 = Math.max(x1, v); } }, uy = v => { if (isFinite(v)) { y0 = Math.min(y0, v); y1 = Math.max(y1, v); } };
  for (const s of S) {
    if (s.kind === 'line' || s.kind === 'stem' || s.kind === 'stairs' || s.kind === 'bar') { s.x.forEach((v, k) => { if (isFinite(s.y[k])) { ux(v); uy(ly(s.y[k])); } }); if (s.kind === 'stem' || s.kind === 'bar') stemy = true; }
    else if (s.kind === 'zp') { [...s.zeros, ...s.poles, [1, 1], [-1, -1]].forEach(z => { ux(z[0]); uy(z[1]); }); }
    else if (s.kind === 'image') { ux(s.x0); ux(s.x1); uy(s.y0); uy(s.y1); img = true; }
    else if (s.kind === 'xline') ux(s.v); else if (s.kind === 'yline') uy(ly(s.v));
  }
  if (!isFinite(x0)) { x0 = 0; x1 = 1; } if (!isFinite(y0)) { y0 = -1; y1 = 1; }
  if (x1 - x0 < 1e-12) { x0 -= 1; x1 += 1; }
  if (stemy) { y0 = Math.min(y0, 0); y1 = Math.max(y1, 0); }
  if (y1 - y0 < 1e-12) { y0 -= 1; y1 += 1; }
  if (!img && !A.tight) {
    const py = (y1 - y0) * 0.08; y0 -= py; y1 += py;
    if (stemy) { const px = Math.max((x1 - x0) * 0.03, 0.5); x0 -= px; x1 += px; }
  }
  if (A.xlim) { x0 = A.xlim[0]; x1 = A.xlim[1]; }
  if (A.ylim) { y0 = ly(A.ylim[0]); y1 = ly(A.ylim[1]); }
  if (A.equal) { const r = Math.max(x1 - x0, y1 - y0) / 2 * 1.08; p.equal((x0 + x1) / 2, (y0 + y1) / 2, r); } else p.range(x0, x1, y0, y1);
  const yf = A.logy ? (v => Number.isInteger(+v.toFixed(6)) ? '1e' + v.toFixed(0) : '') : undefined;
  p.frame({ yAxis0: A.equal, yf, yt: A.logy ? Math.max(1, Math.round(niceStep(y1 - y0, 4))) : undefined });
  p.clip();
  const lineSeries = [];
  for (const s of S) {
    const col = COL[s.color] || COL.trace;
    if (s.kind === 'image') {
      const W = s.transpose ? s.h : s.w, H = s.transpose ? s.w : s.h;
      const off = document.createElement('canvas'); off.width = W; off.height = H;
      const og = off.getContext('2d'), id = og.createImageData(W, H), span = (s.hi - s.lo) || 1;
      for (let r = 0; r < s.h; r++) for (let q = 0; q < s.w; q++) {
        const v = s.data[r * s.w + q], cc = cmap((v - s.lo) / span);
        let px, pyR; if (s.transpose) { px = r; pyR = q; } else { px = q; pyR = r; }
        const row = s.flipY ? pyR : (H - 1 - pyR), k = (row * W + px) * 4;
        id.data[k] = cc[0]; id.data[k + 1] = cc[1]; id.data[k + 2] = cc[2]; id.data[k + 3] = 255;
      }
      og.putImageData(id, 0, 0);
      g.imageSmoothingEnabled = W * H < 400000;
      const X0 = p.X(s.x0), X1 = p.X(s.x1), Y0 = p.Y(s.y0), Y1 = p.Y(s.y1);
      g.drawImage(off, Math.min(X0, X1), Math.min(Y0, Y1), Math.abs(X1 - X0), Math.abs(Y1 - Y0));
      continue;
    }
    if (s.kind === 'zp') {
      p.circle(0, 0, 1, COL.muted, 1.2, [4, 4]);
      p.seg(p.x0, 0, p.x1, 0, alpha(COL.muted, .5), 1); p.seg(0, p.y0, 0, p.y1, alpha(COL.muted, .5), 1);
      const cnt = list => { const m = new Map(); list.forEach(z => { const k = z[0].toFixed(3) + ',' + z[1].toFixed(3); m.set(k, (m.get(k) || 0) + 1); }); return m; };
      for (const z of s.zeros) p.dot(z[0], z[1], COL.trace, 5.5, true);
      for (const z of s.poles) p.cross(z[0], z[1], COL.sample, 5.5, 2);
      for (const [mapc, list] of [[cnt(s.zeros), s.zeros], [cnt(s.poles), s.poles]]) for (const [k, n] of mapc) if (n > 1) { const [a, b] = k.split(',').map(Number); p.text(String(n), a + 0.06, b + 0.1, COL.ink); }
      continue;
    }
    if (s.kind === 'text') { p.text(s.s, s.x, ly(s.y), COL.ink); continue; }
    if (s.kind === 'xline') { p.vline(s.v, COL.muted, DASH[s.dash] || [5, 4]); if (s.label) p.text(' ' + s.label, s.v, p.y1 - (p.y1 - p.y0) * .06, COL.muted); continue; }
    if (s.kind === 'yline') { p.hline(ly(s.v), COL.muted, DASH[s.dash] || [5, 4]); if (s.label) p.text(s.label + ' ', p.x1, ly(s.v) + (p.y1 - p.y0) * .05, COL.muted, 'right'); continue; }
    lineSeries.push({ s, col });
    const ys = s.y.map(ly);
    if (s.kind === 'line') {
      if (s.fill) { g.fillStyle = alpha(col, .18); g.beginPath(); g.moveTo(p.X(s.x[0]), p.Y(0)); s.x.forEach((v, k) => g.lineTo(p.X(v), p.Y(ys[k]))); g.lineTo(p.X(s.x[s.x.length - 1]), p.Y(0)); g.fill(); }
      if (s.dash !== 'none') p.line(s.x, ys, col, s.lw || 1.6, DASH[s.dash] || []);
      if (s.marker) s.x.forEach((v, k) => isFinite(ys[k]) && drawMarker(p, v, ys[k], s.marker, col, s.filled));
    } else if (s.kind === 'stairs') {
      const sx = [], sy = []; s.x.forEach((v, k) => { sx.push(v); sy.push(ys[k]); if (k + 1 < s.x.length) { sx.push(s.x[k + 1]); sy.push(ys[k]); } });
      p.line(sx, sy, col, s.lw || 1.6, DASH[s.dash] || []);
    } else if (s.kind === 'stem') {
      const base = p.Y(clamp(0, p.y0, p.y1));
      g.strokeStyle = col; g.lineWidth = s.lw || 1.4; g.setLineDash([]);
      s.x.forEach((v, k) => { if (!isFinite(ys[k])) return; g.beginPath(); g.moveTo(p.X(v), base); g.lineTo(p.X(v), p.Y(ys[k])); g.stroke(); });
      const small = s.x.length > 120;
      if (!small) s.x.forEach((v, k) => isFinite(ys[k]) && drawMarker(p, v, ys[k], s.marker || 'o', col, s.filled, s.x.length > 60 ? 2.2 : 3.2));
    } else if (s.kind === 'bar') {
      const dx = s.x.length > 1 ? Math.abs(p.X(s.x[1]) - p.X(s.x[0])) * 0.7 : 20, base = p.Y(clamp(0, p.y0, p.y1));
      g.fillStyle = alpha(col, .85);
      s.x.forEach((v, k) => { const top = p.Y(ys[k]); g.fillRect(p.X(v) - dx / 2, Math.min(base, top), dx, Math.abs(top - base)); });
    }
  }
  p.unclip();
  // nhãn
  const fb = '600 12.5px "Be Vietnam Pro", system-ui, sans-serif', fl = '12px "Be Vietnam Pro", system-ui, sans-serif';
  if (A.title) p.tpx(A.title, (p.m.l + p.w - p.m.r) / 2, 14, COL.ink, 'center', 'middle', fb);
  if (A.xl) p.tpx(A.xl, (p.m.l + p.w - p.m.r) / 2, p.h - 10, COL.muted, 'center', 'middle', fl);
  if (A.yl) { g.save(); g.translate(12, (p.m.t + p.h - p.m.b) / 2); g.rotate(-Math.PI / 2); g.font = fl; g.fillStyle = COL.muted; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(A.yl, 0, 0); g.restore(); }
  // chú giải
  if (A.legend && A.legend.length) {
    const items = A.legend.slice(0, lineSeries.length).map((t, k) => ({ t, ...lineSeries[k] }));
    g.font = fl; const wmax = Math.max(...items.map(it => g.measureText(it.t).width));
    const bw = wmax + 40, bh = items.length * 17 + 8, bx = p.w - p.m.r - bw - 6, by = p.m.t + 6;
    g.fillStyle = alpha(COL.panel, .92); g.strokeStyle = COL.line; g.lineWidth = 1; g.fillRect(bx, by, bw, bh); g.strokeRect(bx + .5, by + .5, bw, bh);
    items.forEach((it, k) => {
      const yy = by + 12 + k * 17; g.strokeStyle = it.col; g.lineWidth = 2; g.setLineDash(DASH[it.s.dash] || []);
      if (it.s.kind === 'stem' || it.s.dash === 'none') { g.beginPath(); g.arc(bx + 16, yy, 3.2, 0, TAU); g.stroke(); }
      else { g.beginPath(); g.moveTo(bx + 6, yy); g.lineTo(bx + 26, yy); g.stroke(); }
      g.setLineDash([]); g.fillStyle = COL.ink; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(it.t, bx + 32, yy);
    });
  }
}
const mlLive = [];
function lcm2(a, b) { return a * b / gcd(a, b); }
function mlRenderFigs(box, figs) {
  box.innerHTML = '';
  for (let i = mlLive.length - 1; i >= 0; i--) if (!mlLive[i].c.isConnected) mlLive.splice(i, 1);
  figs.forEach(f => {
    const wrap = document.createElement('div'); wrap.className = 'ml-fig';
    if (f.title) { const t = document.createElement('div'); t.className = 'ft'; t.textContent = f.title; wrap.appendChild(t); }
    const R = f.axes.reduce((a, x) => lcm2(a, x.m), 1), C = f.axes.reduce((a, x) => lcm2(a, x.n), 1);
    const grid = document.createElement('div'); grid.className = 'ml-grid';
    const colsUsed = Math.max(...f.axes.map(x => x.n));
    grid.style.gridTemplateColumns = `repeat(${C}, minmax(0, 1fr))`;
    grid.style.minWidth = colsUsed >= 3 ? '640px' : colsUsed === 2 ? '460px' : '0';
    const unit = R === 1 ? 270 : R === 2 ? 200 : R === 3 ? 165 : 150;
    f.axes.forEach(A => {
      const rr = A.ps.map(q => Math.floor((q - 1) / A.n)), cc = A.ps.map(q => (q - 1) % A.n);
      const r0 = Math.min(...rr), r1 = Math.max(...rr), c0 = Math.min(...cc), c1 = Math.max(...cc);
      const cv = document.createElement('canvas');
      cv.style.gridRow = `${r0 * R / A.m + 1} / ${(r1 + 1) * R / A.m + 1}`;
      cv.style.gridColumn = `${c0 * C / A.n + 1} / ${(c1 + 1) * C / A.n + 1}`;
      cv.dataset.h = Math.round(unit * (r1 - r0 + 1) * R / A.m + (r1 - r0) * 8);
      cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', A.title || 'Đồ thị MATLAB');
      grid.appendChild(cv); mlLive.push({ c: cv, A });
    });
    wrap.appendChild(grid); box.appendChild(wrap);
  });
  requestAnimationFrame(() => { for (const L of mlLive) if (box.contains(L.c)) { try { mlDrawAxes(L.c, L.A); } catch (e) { console.error(e); } } });
}
demos.push(() => { for (const L of mlLive) if (L.c.isConnected) { try { mlDrawAxes(L.c, L.A); } catch (e) { console.error(e); } } });

/* ---------- dựng bảng điều khiển cho từng đoạn code ---------- */
const mlObs = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) { mlObs.unobserve(e.target); e.target._mlRun && e.target._mlRun(false); } }, { rootMargin: '300px 0px' });
document.querySelectorAll('.mlab[data-ml]').forEach(box => {
  const S = ML_SCRIPTS[box.dataset.ml]; if (!S) return;
  const uid = 'ml-' + box.dataset.ml;
  box.innerHTML = `<div class="lab-h"><b>${escH(S.title)}</b><span class="tag">MATLAB · chạy ngay trên trang</span></div>
  <div class="ml-body">
    <p class="ml-desc">${escH(S.desc)}</p>
    <div class="ml-ed"><div class="ml-wrap"><pre class="ml-hl" aria-hidden="true"></pre><textarea class="ml-ta" id="${uid}" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" aria-label="Mã MATLAB: ${escH(S.title)}"></textarea></div></div>
    <div class="ml-bar">
      <button class="btn" type="button" data-a="run">▶ Chạy</button>
      <button class="btn ghost" type="button" data-a="reset">↺ Khôi phục</button>
      <button class="btn ghost" type="button" data-a="copy">Sao chép code</button>
      <span class="st" aria-live="polite"><span class="kbd">Ctrl</span> + <span class="kbd">Enter</span> để chạy</span>
    </div>
    <pre class="ml-con" hidden></pre>
    <div class="ml-figs"></div>
  </div>`;
  const ta = box.querySelector('textarea'), hl = box.querySelector('.ml-hl'), con = box.querySelector('.ml-con'), figs = box.querySelector('.ml-figs'), st = box.querySelector('.st');
  let errLine = null;
  const paint = () => { hl.innerHTML = mlHighlight(ta.value, errLine); };
  ta.value = S.code; paint();
  ta.addEventListener('input', () => { errLine = null; paint(); });
  const run = (user) => {
    const t0 = performance.now();
    const r = MLAB.run(ta.value, { allowSound: user, onSound: (x, fs) => playSamples(x, fs), seed: 2024, files: mlFilesMap() });
    const ms = performance.now() - t0;
    let txt = escH(r.text.replace(/\s+$/, ''));
    if (r.error) txt += (txt ? '\n' : '') + `<span class="e">Lỗi${r.error.line ? ' ở dòng ' + r.error.line : ''}: ${escH(r.error.msg)}</span>`;
    con.innerHTML = txt; con.hidden = !txt;
    errLine = r.error ? r.error.line : null; paint();
    mlRenderFigs(figs, r.figs);
    st.className = 'st' + (r.error ? ' bad' : '');
    st.textContent = r.error ? 'Có lỗi, xem bên dưới' : `Chạy xong trong ${ms < 1 ? '<1' : Math.round(ms)} ms`;
  };
  box._mlRun = run;
  ta.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(true); return; }
    if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); const s = ta.selectionStart, en = ta.selectionEnd; ta.setRangeText('    ', s, en, 'end'); errLine = null; paint(); }
  });
  box.querySelector('[data-a=run]').onclick = () => run(true);
  box.querySelector('[data-a=reset]').onclick = () => { ta.value = S.code; errLine = null; paint(); run(false); };
  box.querySelector('[data-a=copy]').onclick = async () => {
    try { await navigator.clipboard.writeText(ta.value); st.className = 'st'; st.textContent = 'Đã sao chép. Dán vào MATLAB hoặc Octave để chạy.'; }
    catch (e) { ta.focus(); ta.select(); st.className = 'st'; st.textContent = 'Đã chọn toàn bộ code, nhấn Ctrl + C để sao chép.'; }
  };
  mlObs.observe(box);
});
