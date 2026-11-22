
/* ================= HERO: máy hiện sóng ================= */
{
  const c = $('heroScope'); let t0 = 0, running = false, last = 0;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const draw = () => {
    const p = new Plot(c); p.m = { l: 8, r: 8, t: 8, b: 8 };
    p.range(0, 1, -1.25, 1.25).frame({ noXL: true, noYL: true, xt: 0.1, yt: 0.5 });
    const f = 3, fs = 20, ph = t0;
    p.clip();
    p.fn(t => Math.sin(TAU * f * t + ph), COL.trace, 2.2, 400);
    const ns = [], vs = [];
    for (let n = 0; n <= fs; n++) { ns.push(n / fs); vs.push(Math.sin(TAU * f * n / fs + ph)); }
    // giữ bậc 0 (bậc thang) mờ
    const sx = [], sy = [];
    for (let i = 0; i < ns.length; i++) { sx.push(ns[i], ns[i] + 1 / fs); sy.push(vs[i], vs[i]); }
    p.line(sx, sy, alpha(COL.sample, .35), 1.2);
    p.stem(ns, vs, COL.sample, 3.5);
    p.unclip();
  };
  const loop = ts => {
    if (!running) return;
    if (last) t0 += (ts - last) / 1000 * 1.2;
    last = ts; draw(); requestAnimationFrame(loop);
  };
  demo(draw);
  if (!reduce) {
    new IntersectionObserver(es => {
      for (const e of es) { if (e.isIntersecting && !running) { running = true; last = 0; requestAnimationFrame(loop); } else if (!e.isIntersecting) running = false; }
    }).observe(c);
  }
}

/* ================= C1: tín hiệu cơ bản ================= */
demo(function c1a() {
  const type = $('s1type').value, n0 = val('s1n0'), a = val('s1a'), w = val('s1w') * PI;
  out('s1n0o', n0); out('s1ao', a.toFixed(2)); out('s1wo', val('s1w').toFixed(2) + 'π');
  const ns = range(-10, 20), re = [], im = [];
  for (const n of ns) {
    const m = n - n0; let r = 0, i = 0;
    switch (type) {
      case 'delta': r = m === 0 ? 1 : 0; break;
      case 'step': r = m >= 0 ? 1 : 0; break;
      case 'rect': r = (m >= 0 && m < 5) ? 1 : 0; break;
      case 'ramp': r = m >= 0 ? m : 0; break;
      case 'exp': r = m >= 0 ? Math.pow(a, m) : 0; break;
      case 'sin': r = Math.cos(w * m); break;
      case 'cexp': r = Math.cos(w * m); i = Math.sin(w * m); break;
      case 'damped': r = m >= 0 ? Math.pow(a, m) * Math.cos(w * m) : 0; break;
    }
    re.push(r); im.push(i);
  }
  const [lo, hi] = autoY(type === 'cexp' ? [re, im] : [re], 0.12, 1);
  const p = new Plot($('c1a')).range(-10.8, 20.8, lo, hi).frame({ xt: 2, xl: 'n' });
  if (type === 'sin' || type === 'cexp') p.fn(t => Math.cos(w * (t - n0)), alpha(COL.trace, .35), 1.2, 600, [3, 3]);
  p.stem(ns.map(n => type === 'cexp' ? n - .15 : n), re, COL.sample);
  if (type === 'cexp') p.stem(ns.map(n => n + .15), im, COL.a4);
  $('s1leg').innerHTML = type === 'cexp'
    ? '<span><i style="background:var(--sample)"></i>phần thực cos(ω₀n)</span><span><i style="background:var(--a4)"></i>phần ảo sin(ω₀n)</span><span><i style="background:var(--trace)"></i>đường bao liên tục (chỉ để tham chiếu)</span>'
    : '<span><i style="background:var(--sample)"></i>x[n]</span>' + (type === 'sin' ? '<span><i style="background:var(--trace)"></i>cos liên tục cùng tần số (tham chiếu)</span>' : '');
  let info = '';
  const r100 = Math.round(val('s1w') * 100);
  const g = gcd(r100, 200), per = r100 === 0 ? 1 : 200 / g;
  switch (type) {
    case 'delta': info = `δ[n − ${n0}]: chỉ bằng 1 tại n = ${n0}. Tính chất “sàng lọc”: Σ x[n]·δ[n − n₀] = x[n₀].`; break;
    case 'step': info = `u[n − ${n0}] bật lên 1 từ n = ${n0}. Hiệu u[n] − u[n−1] = δ[n].`; break;
    case 'rect': info = `Xung chữ nhật = u[n − ${n0}] − u[n − ${n0 + 5}]: năm mẫu bằng 1.`; break;
    case 'ramp': info = `n·u[n] tăng tuyến tính, không bị chặn: tổng tích luỹ của u[n−1].`; break;
    case 'exp': info = `aⁿu[n] với a = ${a.toFixed(2)}: ` + (Math.abs(a) < 1 ? `|a| < 1 nên suy giảm về 0. Năng lượng Σ|x|² = 1/(1 − a²) = ${(1 / (1 - a * a)).toFixed(3)}.` : (Math.abs(a) === 1 ? '|a| = 1: biên độ không đổi.' : '|a| > 1 nên tăng không giới hạn (không ổn định).')) + (a < 0 ? ' a < 0 nên dấu đổi xen kẽ mỗi mẫu.' : ''); break;
    case 'sin':
    case 'cexp': info = `ω₀ = ${val('s1w').toFixed(2)}π rad/mẫu. ω₀/2π = ${r100}/200 = ${r100 / g}/${200 / g}` + (r100 === 0 ? ' : tín hiệu hằng.' : ` → tuần hoàn với chu kỳ N = ${per} mẫu (sin rời rạc chỉ tuần hoàn khi ω₀/2π là số hữu tỉ).`) + (val('s1w') > 1 ? `\nω₀ > π: các mẫu trùng với tần số 2π − ω₀ = ${(2 - val('s1w')).toFixed(2)}π${type === 'cexp' ? ' nhưng quay ngược chiều (phần ảo đổi dấu)' : ''}. Tần số “nhanh nhất” của tín hiệu rời rạc là π (đổi dấu mỗi mẫu).` : ''); break;
    case 'damped': info = `aⁿcos(ω₀n): đường bao mũ a = ${a.toFixed(2)} nhân với dao động. Đây chính là đáp ứng xung của hệ có cặp cực phức tại a·e^(±jω₀) (chương 9).`; break;
  }
  $('s1info').textContent = info;
});
bind(['s1type', 's1n0', 's1a', 's1w'], demos[demos.length - 1]);

demo(function c1b() {
  const k = val('s1k'), M = val('s1M'), sg = $('s1flip').checked ? -1 : 1;
  out('s1kO', k); out('s1MO', M);
  const X = { '-1': 0.5, 0: 1, 1: 2, 2: 3, 3: 1.5, 4: -1 };
  const xv = n => X[n] || 0;
  const ns = range(-10, 10);
  const p1 = new Plot($('c1b')).range(-10.8, 10.8, -1.6, 3.6).frame({ xt: 2, xl: 'n' });
  p1.stem(ns, ns.map(xv), COL.trace);
  const ys = ns.map(n => xv(sg * M * n - k));
  const p2 = new Plot($('c1c')).range(-10.8, 10.8, -1.6, 3.6).frame({ xt: 2, xl: 'n' });
  p2.stem(ns, ns.map(xv), alpha(COL.trace, .22), 2);
  p2.stem(ns, ys, COL.sample);
  const expr = `x[${sg < 0 ? '−' : ''}${M > 1 ? M : ''}n ${k >= 0 ? '−' : '+'} ${Math.abs(k)}]`;
  let s = `y[n] = ${expr}\n`;
  s += `Bước 1 (dịch): v[n] = x[n ${k >= 0 ? '−' : '+'} ${Math.abs(k)}] → ${k > 0 ? `trễ (sang phải) ${k} mẫu` : k < 0 ? `sớm (sang trái) ${-k} mẫu` : 'không dịch'}.\n`;
  s += `Bước 2 (${sg < 0 ? 'lật' : ''}${sg < 0 && M > 1 ? ' + ' : ''}${M > 1 ? 'co' : ''}${sg > 0 && M === 1 ? 'giữ nguyên' : ''}): y[n] = v[${sg < 0 ? '−' : ''}${M > 1 ? M : ''}n]`;
  s += sg < 0 ? ' → gương qua n = 0' : '';
  s += M > 1 ? `, chỉ giữ mẫu có chỉ số chia hết cho ${M} rồi dồn lại (mất thông tin!)` : '';
  s += `.\nCách khác: y[n] = x[${sg < 0 ? '−' : ''}${M > 1 ? M : ''}(n ${(sg * k) >= 0 ? '−' : '+'} ${fmt(Math.abs(k / M), 2).replace(/\.?0+$/, '')})] → ${sg < 0 ? 'lật/co trước, rồi dịch theo chiều ngược' : 'co trước rồi dịch k/M'}. Kết quả như nhau.\n`;
  const pairs = ns.filter(n => ys[ns.indexOf(n)] !== 0).map(n => `y[${n}] = x[${sg * M * n - k}] = ${xv(sg * M * n - k)}`);
  s += 'Kiểm tra: ' + (pairs.join(';  ') || 'mọi mẫu bằng 0 trong khung');
  $('s1tx').textContent = s;
});
bind(['s1k', 's1M', 's1flip'], demos[demos.length - 1]);

/* ================= C2: lấy mẫu ================= */
const aliasOf = (f, fs) => Math.abs(f - fs * Math.round(f / fs));
demo(function c2() {
  const f = val('s2f'), fs = val('s2fs'); out('s2fo', f.toFixed(1)); out('s2fso', fs.toFixed(1));
  const fa = aliasOf(f, fs), T = 1;
  const p = new Plot($('c2a')).range(0, T, -1.3, 1.3).frame({ xt: 0.1, xl: 't (s)' });
  p.clip();
  p.fn(t => Math.cos(TAU * f * t), alpha(COL.trace, .9), 1.5, 1600);
  if (Math.abs(fa - f) > 1e-6) p.fn(t => Math.cos(TAU * fa * t), COL.a4, 2.4, 800, [6, 4]);
  const ns = [], vs = [];
  for (let n = 0; n / fs <= T + 1e-9; n++) { ns.push(n / fs); vs.push(Math.cos(TAU * f * n / fs)); }
  p.stem(ns, vs, COL.sample, 4);
  p.unclip();
  // biểu đồ gấp tần số
  const fmax = 42, q = new Plot($('c2b')); q.m.b = 26;
  q.range(0, fmax, 0, Math.max(fs / 2, 1) * 1.25).frame({ xl: 'f (Hz)', yl: 'f_alias', yt: niceStep(fs / 2 * 1.25, 3) });
  const xs = [], ys = [];
  for (let i = 0; i <= 840; i++) { const v = fmax * i / 840; xs.push(v); ys.push(aliasOf(v, fs)); }
  q.line(xs, ys, COL.muted, 1.4);
  for (let k = 1; k * fs / 2 <= fmax; k++) q.vline(k * fs / 2, alpha(k % 2 ? COL.warn : COL.muted, .6), [3, 4]);
  q.text('fs/2', fs / 2 + 0.4, Math.max(fs / 2, 1) * 1.15, COL.warn, 'left');
  q.seg(f, 0, f, fa, COL.trace, 1.2, [2, 3]); q.seg(0, fa, f, fa, COL.a4, 1.2, [2, 3]);
  q.dot(f, fa, f > fs / 2 ? COL.a4 : COL.a3, 5);
  const ok = f < fs / 2;
  $('s2info').innerHTML = `Tần số Nyquist fs/2 = <b>${(fs / 2).toFixed(2)} Hz</b>. ω = 2πf/fs = <b>${(2 * f / fs).toFixed(3)}π</b> rad/mẫu. ` +
    (ok ? `<span class="pill good">Đúng điều kiện</span> f &lt; fs/2: mẫu dựng lại đúng sin ${f.toFixed(1)} Hz.`
      : `<span class="pill bad">Chồng phổ</span> f ≥ fs/2: các mẫu giống hệt một sin <b>${fa.toFixed(2)} Hz</b> (= |${f.toFixed(1)} − ${Math.round(f / fs)}·${fs}|). Bộ khôi phục sẽ cho ra sin ${fa.toFixed(2)} Hz, sai tần số.`) +
    ` Cần fs &gt; ${(2 * f).toFixed(1)} Hz để lấy mẫu đúng tín hiệu này.`;
});
bind(['s2f', 's2fs'], demos[demos.length - 1]);
$('s2play').onclick = () => {
  const f = val('s2f') * 100, fa = aliasOf(val('s2f'), val('s2fs')) * 100, sr = 44100, L = Math.round(sr * 0.7);
  const a = new Float32Array(L), b = new Float32Array(L);
  for (let i = 0; i < L; i++) { a[i] = Math.sin(TAU * f * i / sr); b[i] = fa > 1 ? Math.sin(TAU * fa * i / sr) : 0; }
  playSamples(a, sr, 0); playSamples(b, sr, 0.85);
};

/* ================= C3: lượng tử ================= */
function quantMidRise(x, N, dither, r) {
  const D = 2 / Math.pow(2, N);
  let v = x + (dither ? (r() - r()) * D : 0);
  let q = D * (Math.floor(v / D) + 0.5);
  return clamp(q, -1 + D / 2, 1 - D / 2);
}
demo(function c3() {
  const N = val('s3b'), A = val('s3a'), dith = $('s3dith').checked; out('s3bo', N); out('s3ao', A.toFixed(2));
  const fs = 80, f = 2, r = rng(7);
  const ts = [], xq = [], er = [];
  for (let n = 0; n < fs; n++) { const t = n / fs, x = A * Math.sin(TAU * f * t + 0.3); const q = quantMidRise(x, N, dith, r); ts.push(t); xq.push(q); er.push(q - x); }
  const D = 2 / Math.pow(2, N);
  const p = new Plot($('c3a')).range(0, 1, -1.15, 1.15).frame({ xt: 0.1, xl: 't' });
  if (N <= 6) for (let l = 0; l < Math.pow(2, N); l++) p.hline(-1 + D / 2 + l * D, alpha(COL.muted, .35), [2, 4], 1);
  p.fn(t => A * Math.sin(TAU * f * t + 0.3), COL.trace, 1.8);
  const sx = [], sy = []; for (let i = 0; i < ts.length; i++) { sx.push(ts[i], ts[i] + 1 / fs); sy.push(xq[i], xq[i]); }
  p.line(sx, sy, COL.sample, 1.8);
  const q = new Plot($('c3b')); const em = Math.max(D / 2 * 1.4, 1e-6);
  q.range(0, 1, -em, em).frame({ xt: 0.1, yt: niceStep(2 * em, 3), yf: v => (v / D).toFixed(2) + 'Δ', yl: 'e[n] (đơn vị Δ)' });
  q.hline(D / 2, COL.warn); q.hline(-D / 2, COL.warn);
  q.stem(ts, er, COL.a4, 2);
  // đo SQNR với nhiều mẫu
  let ps = 0, pe = 0; const r2 = rng(11);
  for (let n = 0; n < 20000; n++) { const x = A * Math.sin(TAU * 0.01234567 * n); const qq = quantMidRise(x, N, dith, r2); ps += x * x; pe += (qq - x) * (qq - x); }
  const meas = 10 * Math.log10(ps / pe), theo = 6.02 * N + 1.76 + 20 * Math.log10(A);
  $('s3info').textContent =
    `Số mức: 2^${N} = ${Math.pow(2, N)}        Bước Δ = 2/2^${N} = ${D.toPrecision(4)}        |e| ≤ Δ/2 = ${(D / 2).toPrecision(4)}\n` +
    `SQNR lý thuyết  = 6.02·${N} + 1.76 + 20log10(${A.toFixed(2)}) = ${theo.toFixed(2)} dB\n` +
    `SQNR đo được    = ${meas.toFixed(2)} dB` + (N <= 2 ? '   (N rất nhỏ: giả thiết nhiễu đều không còn đúng)' : '') + (dith ? '\nDither làm nhiễu lớn hơn chút nhưng phá vỡ tương quan giữa sai số và tín hiệu (hết méo hài).' : '');
});
bind(['s3b', 's3a', 's3dith'], demos[demos.length - 1]);

/* ================= C4: tích chập ================= */
const parseList = s => s.split(/[,;\s]+/).map(v => parseFloat(v.replace('−', '-'))).filter(v => isFinite(v)).slice(0, 10);
let c4timer = null;
const c4 = demo(function c4() {
  let x = parseList($('s4x').value), h = parseList($('s4h').value);
  if (!x.length) x = [1]; if (!h.length) h = [1];
  const y = conv(x, h), Lx = x.length, Lh = h.length;
  const sl = $('s4n'); sl.min = -2; sl.max = Lx + Lh; const n = val('s4n'); out('s4no', n);
  const kmin = -Lh - 1, kmax = Lx + Lh + 1, ks = range(kmin, kmax);
  const xk = ks.map(k => (k >= 0 && k < Lx) ? x[k] : 0);
  const hk = ks.map(k => (n - k >= 0 && n - k < Lh) ? h[n - k] : 0);
  const pr = ks.map((k, i) => xk[i] * hk[i]);
  const [lo, hi] = autoY([x, h], .15, 1);
  const p = new Plot($('c4a')).range(kmin - .8, kmax + .8, lo, hi).frame({ xt: 1, xl: 'k' });
  p.stem(ks.map(k => k - .12), xk, COL.trace, 3.5);
  p.stem(ks.map(k => k + .12), hk, COL.sample, 3.5);
  p.vline(n, alpha(COL.sample, .6));
  p.text(`h[${n} − k]`, n + .3, hi - (hi - lo) * .08, COL.sample);
  p.text('x[k]', kmin - .4, hi - (hi - lo) * .08, COL.trace);
  const [plo, phi] = autoY([pr, y.map(v => v / 2)], .15, 1);
  const q = new Plot($('c4b')).range(kmin - .8, kmax + .8, plo, phi).frame({ xt: 1, xl: 'k' });
  q.stem(ks, pr, COL.a4, 3.5);
  const nsY = range(kmin, kmax), yv = nsY.map(m => (m >= 0 && m < y.length) ? y[m] : 0);
  const [ylo, yhi] = autoY([y], .15, 1);
  const r = new Plot($('c4c')).range(kmin - .8, kmax + .8, ylo, yhi).frame({ xt: 1, xl: 'n' });
  r.stem(nsY, yv, alpha(COL.a3, .22), 2.5);
  r.stem(nsY.filter(m => m <= n), yv.filter((_, i) => nsY[i] <= n), COL.a3, 3.5);
  if (n >= kmin && n <= kmax) r.dot(n, (n >= 0 && n < y.length) ? y[n] : 0, COL.sample, 6, true);
  const terms = [];
  for (let k = 0; k < Lx; k++) if (n - k >= 0 && n - k < Lh) terms.push([k, x[k], h[n - k]]);
  const yn = (n >= 0 && n < y.length) ? y[n] : 0;
  let s = `y[${n}] = Σₖ x[k]·h[${n} − k]\n`;
  if (!terms.length) s += `     = 0   (h[${n} − k] không chồng lên x[k] nào)`;
  else {
    s += '     = ' + terms.map(([k]) => `x[${k}]·h[${n - k}]`).join(' + ') + '\n';
    s += '     = ' + terms.map(([, a, b]) => `${fmt(a, 2)}·${fmt(b, 2)}`).join(' + ') + '\n';
    s += '     = ' + terms.map(([, a, b]) => fmt(a * b, 2)).join(' + ') + ` = ${fmt(yn, 3)}`;
  }
  s += `\nĐộ dài: ${Lx} + ${Lh} − 1 = ${y.length} mẫu. y = [${y.map(v => fmt(v, 2)).join(', ')}]`;
  $('s4info').textContent = s;
});
bind(['s4x', 's4h', 's4n'], c4);
$('s4play').onclick = () => {
  if (c4timer) { clearInterval(c4timer); c4timer = null; $('s4play').textContent = '▶ Chạy'; return; }
  const sl = $('s4n'); sl.value = sl.min; c4();
  $('s4play').textContent = '■ Dừng';
  c4timer = setInterval(() => {
    if (+sl.value >= +sl.max) { clearInterval(c4timer); c4timer = null; $('s4play').textContent = '▶ Chạy'; return; }
    sl.value = +sl.value + 1; c4();
  }, 750);
};
{
  const presets = [['1, 2, 3, 1', '1, 1, 0.5'], ['1, 1, 1, 1, 1', '1, 1, 1, 1, 1'], ['0, 0, 1, 0, 0, -1', '1, 0.5, 0.25, 0.125'], ['1, -1, 1, -1, 1, -1', '0.5, 0.5'], ['2, 1', '1, 0, 0, 0, -1']];
  let pi = 0;
  $('s4preset').onclick = () => { pi = (pi + 1) % presets.length; $('s4x').value = presets[pi][0]; $('s4h').value = presets[pi][1]; $('s4n').value = 0; c4(); };
}

/* ================= C5: phương trình sai phân ================= */
demo(function c5() {
  const typ = $('s5in').value, al = val('s5a'), b0 = val('s5b0'), b1 = val('s5b1');
  out('s5ao', al.toFixed(2)); out('s5b0o', b0.toFixed(2)); out('s5b1o', b1.toFixed(2));
  const L = 40, r = rng(5), x = [];
  for (let n = 0; n < L; n++) {
    x.push(typ === 'imp' ? (n === 0 ? 1 : 0) : typ === 'step' ? 1 : typ === 'sq' ? ((Math.floor(n / 8) % 2) ? 0 : 1) : Math.sin(TAU * n / 20) + 0.4 * r.n());
  }
  const y = Array.from(filt([b0, b1], [1, -al], x));
  const ns = range(0, L - 1);
  const [lo, hi] = autoY([x, y], .1, 1);
  const p = new Plot($('c5a')).range(-.8, L - .2, lo, hi).frame({ xt: 5, xl: 'n' });
  p.stem(ns.map(n => n - .15), x, alpha(COL.trace, .75), 2.5);
  p.stem(ns.map(n => n + .15), y, COL.a3, 3);
  const st = Math.abs(al) < 1 ? '<span class="pill good">Ổn định: |α| &lt; 1</span>' : Math.abs(al) === 1 ? '<span class="pill warn">Biên ổn định: |α| = 1</span>' : '<span class="pill bad">Không ổn định: |α| &gt; 1</span>';
  $('s5stab').innerHTML = st + (al < 0 ? ' α &lt; 0: đáp ứng đổi dấu xen kẽ (đặc tính thông cao)' : '');
  let rows = '<thead><tr><th>n</th><th>x[n]</th><th>x[n−1]</th><th>y[n−1]</th><th>y[n] = b₀x[n] + b₁x[n−1] + α·y[n−1]</th></tr></thead><tbody>';
  for (let n = 0; n < 8; n++) {
    const x1 = n ? x[n - 1] : 0, y1 = n ? y[n - 1] : 0;
    rows += `<tr><td class="num">${n}</td><td class="num">${fmt(x[n], 3)}</td><td class="num">${fmt(x1, 3)}</td><td class="num">${fmt(y1, 3)}</td><td class="num">${fmt(b0, 2)}·${fmt(x[n], 3)} + ${fmt(b1, 2)}·${fmt(x1, 3)} + ${fmt(al, 2)}·${fmt(y1, 3)} = <b>${fmt(y[n], 4)}</b></td></tr>`;
  }
  $('s5tab').innerHTML = rows + '</tbody>';
});
bind(['s5in', 's5a', 's5b0', 's5b1'], demos[demos.length - 1]);

/* ================= C6: đáp ứng tần số ================= */
demo(function c6() {
  const M = val('s6M'), w0 = val('s6w') * PI; out('s6Mo', M); out('s6wo', val('s6w').toFixed(3) + 'π');
  const h = new Array(M).fill(1 / M), F = freqz(h, [1], 600);
  const pa = new Plot($('c6a')).range(0, PI, 0, 1.1).frame({ xt: PI / 4, xf: piF, xl: 'ω' });
  pa.line(F.w, F.mag, COL.a3, 2);
  for (let k = 1; 2 * k / M <= 1; k++) pa.dot(TAU * k / M, 0, COL.bad, 3);
  const [hr, hi] = H_at(h, [1], w0), mag = Math.hypot(hr, hi), ph = Math.atan2(hi, hr);
  pa.vline(w0, COL.sample); pa.dot(w0, mag, COL.sample, 5);
  const pb = new Plot($('c6b')).range(0, PI, -PI * 1.1, PI * 1.1).frame({ xt: PI / 4, xf: piF, yt: PI / 2, yf: v => piF(v), xl: 'ω' });
  pb.line(F.w, F.ph, COL.a4, 1.8);
  pb.fn(w => -w * (M - 1) / 2, alpha(COL.muted, .6), 1, 200, [3, 3]);
  pb.vline(w0, COL.sample); pb.dot(w0, ph, COL.sample, 5);
  const L = 48, x = range(0, L - 1).map(n => Math.cos(w0 * n)), y = filt(h, [1], x);
  const pc = new Plot($('c6c')).range(-.5, L - .5, -1.3, 1.3).frame({ xt: 4, xl: 'n' });
  pc.fn(t => Math.cos(w0 * t), alpha(COL.trace, .3), 1, 600);
  pc.stem(range(0, L - 1).map(n => n - .12), x, COL.trace, 2.5);
  pc.stem(range(0, L - 1).map(n => n + .12), Array.from(y), COL.a3, 3);
  pc.fn(t => mag * Math.cos(w0 * t + ph), alpha(COL.a3, .45), 1.2, 600, [4, 3]);
  pc.x.fillStyle = alpha(COL.muted, .12); pc.x.fillRect(pc.X(-.5), pc.m.t, pc.X(M - 1.5) - pc.X(-.5), pc.h - pc.m.t - pc.m.b);
  pc.text('quá độ', (M - 2) / 2, 1.15, COL.muted, 'center');
  const delay = w0 > 1e-6 ? -ph / w0 : (M - 1) / 2;
  $('s6info').textContent =
    `H(e^jω₀) = ${cfmt(hr, hi, 4)}  →  |H| = ${mag.toFixed(4)} (${dB(mag).toFixed(2)} dB),  ∠H = ${ph.toFixed(4)} rad\n` +
    `Đầu ra (sau quá độ ${M - 1} mẫu): y[n] = ${mag.toFixed(3)}·cos(${val('s6w').toFixed(3)}πn ${ph < 0 ? '−' : '+'} ${Math.abs(ph).toFixed(3)})\n` +
    `Độ trễ pha −∠H/ω₀ = ${delay.toFixed(2)} mẫu` + (Math.abs(delay - (M - 1) / 2) < 0.01 ? ` = (M−1)/2 đúng như lý thuyết pha tuyến tính.` : ` (khác (M−1)/2 = ${(M - 1) / 2} vì biên độ thực A(ω) đổi dấu → pha nhảy π).`) +
    `\nĐiểm không của |H| (chấm đỏ) tại ω = 2πk/${M}: sin có đúng k chu kỳ trong ${M} mẫu bị triệt tiêu hoàn toàn.`;
});
bind(['s6M', 's6w'], demos[demos.length - 1]);

/* ================= C7: DFT từng bước ================= */
let c7timer = null;
function c7sig(type, N) {
  return range(0, N - 1).map(n => {
    switch (type) {
      case 'c2': return Math.cos(TAU * 2 * n / N);
      case 'mix': return 1 + Math.cos(TAU * 2 * n / N) + 0.5 * Math.sin(TAU * 5 * n / N);
      case 'rect': return n < 4 ? 1 : 0;
      case 'c25': return Math.cos(TAU * 2.5 * n / N);
      case 'imp': return n === 1 ? 1 : 0;
    }
    return 0;
  });
}
const c7 = demo(function c7() {
  const N = +$('s7N').value; const ks = $('s7k'), ms = $('s7m');
  ks.max = N - 1; if (+ks.value > N - 1) ks.value = N - 1;
  ms.max = N; if (+ms.value > N) ms.value = N;
  const k = +ks.value, m = +ms.value; out('s7ko', k); out('s7mo', m);
  const x = c7sig($('s7sig').value, N);
  const X = dft(x), mag = X.re.map((r, i) => Math.hypot(r, X.im[i]));
  // (a) tín hiệu và hàm cơ sở
  const [lo, hi] = autoY([x], .1, 2);
  const lim = Math.max(Math.abs(lo), Math.abs(hi), 1.2);
  const pa = new Plot($('c7a')).range(-.6, N - .4, -lim, lim).frame({ xt: N <= 16 ? 2 : 4, xl: 'n' });
  pa.fn(t => Math.cos(TAU * k * t / N), alpha(COL.a3, .8), 1.4, 600, [5, 3]);
  pa.fn(t => -Math.sin(TAU * k * t / N), alpha(COL.a4, .8), 1.4, 600, [2, 3]);
  pa.stem(range(0, N - 1), x, alpha(COL.trace, .35), 2.5);
  pa.stem(range(0, m - 1), x.slice(0, m), COL.trace, 3.5);
  // (b) đi bộ vectơ
  let cr = 0, ci = 0; const pts = [[0, 0]];
  for (let n = 0; n < m; n++) { const a = -TAU * k * n / N; cr += x[n] * Math.cos(a); ci += x[n] * Math.sin(a); pts.push([cr, ci]); }
  let R = 1; let tr = 0, ti = 0;
  for (let n = 0; n < N; n++) { const a = -TAU * k * n / N; tr += x[n] * Math.cos(a); ti += x[n] * Math.sin(a); R = Math.max(R, Math.hypot(tr, ti)); }
  R = Math.max(R, ...x.map(Math.abs)) * 1.15;
  const pb = new Plot($('c7b')); pb.m = { l: 36, r: 10, t: 10, b: 22 };
  pb.equal(0, 0, R).frame({ yAxis0: true, xl: 'Re', yl: 'Im' });
  const huesN = Math.max(1, m);
  for (let n = 0; n < m; n++) {
    const c = n === m - 1 ? COL.sample : alpha(COL.trace, 0.35 + 0.6 * (n + 1) / huesN);
    pb.arrow(pts[n][0], pts[n][1], pts[n + 1][0], pts[n + 1][1], c, 1.8);
  }
  pb.arrow(0, 0, cr, ci, COL.a3, 2.8);
  pb.dot(cr, ci, COL.a3, 4);
  // (c) phổ
  const pc = new Plot($('c7c')).range(-.6, N - .4, 0, Math.max(...mag) * 1.15 + 1e-9).frame({ xt: N <= 16 ? 1 : 2, xl: 'k' });
  pc.stem(range(0, N - 1), mag, alpha(COL.a3, .8), 3);
  pc.stem([k], [mag[k]], COL.sample, 5, 3);
  pc.vline(N / 2, alpha(COL.muted, .7));
  pc.text(' N/2', N / 2, Math.max(...mag) * 1.08, COL.muted);
  // bảng
  let s = ` n   x[n]     góc −2πkn/N     x[n]·e^(−j2πkn/N)        tổng dồn\n`;
  let ar = 0, ai = 0;
  for (let n = 0; n < N && n < 16; n++) {
    const a = -TAU * k * n / N, tr2 = x[n] * Math.cos(a), ti2 = x[n] * Math.sin(a);
    if (n < m) { ar += tr2; ai += ti2; }
    const angDeg = ((a * 180 / PI) % 360 + 360) % 360;
    s += `${String(n).padStart(2)}  ${fmt(x[n], 3).padStart(7)}   ${(angDeg.toFixed(1) + '°').padStart(8)}      ${cfmt(tr2, ti2, 3).padEnd(22)}  ${n < m ? cfmt(ar, ai, 3) : '·'}\n`;
  }
  if (N > 16) s += ` … (${N - 16} dòng nữa)\n`;
  s += `\nX[${k}] = ${cfmt(X.re[k], X.im[k], 4)}   |X[${k}]| = ${mag[k].toFixed(4)}   ∠X[${k}] = ${(Math.atan2(X.im[k], X.re[k])).toFixed(3)} rad`;
  s += `\nTần số bin: f = ${k}·fs/${N}` + (k > N / 2 ? `  (k > N/2 là tần số âm: tương ứng −${N - k}·fs/${N}; với x thực X[${k}] = X*[${N - k}])` : '');
  $('s7info').textContent = s;
});
bind(['s7sig', 's7N', 's7k', 's7m'], c7);
$('s7play').onclick = () => {
  if (c7timer) { clearInterval(c7timer); c7timer = null; $('s7play').textContent = '▶ Cộng dần'; return; }
  const ms = $('s7m'); ms.value = 0; c7(); $('s7play').textContent = '■ Dừng';
  c7timer = setInterval(() => {
    if (+ms.value >= +ms.max) { clearInterval(c7timer); c7timer = null; $('s7play').textContent = '▶ Cộng dần'; return; }
    ms.value = +ms.value + 1; c7();
  }, Math.max(120, 3200 / +$('s7N').value));
};

/* ================= C8: FFT bướm ================= */
let s8stage = 0;
const bitrev3 = i => ((i & 1) << 2) | (i & 2) | ((i & 4) >> 2);
const c8 = demo(function c8() {
  let x = parseList($('s8x').value); while (x.length < 8) x.push(0); x = x.slice(0, 8);
  // tính giá trị tại mọi tầng
  const st = [];
  let re = range(0, 7).map(i => x[bitrev3(i)]), im = new Array(8).fill(0);
  st.push({ re: re.slice(), im: im.slice() });
  const ops = [];
  for (let s = 1; s <= 3; s++) {
    const len = 1 << s, half = len >> 1, nr = re.slice(), ni = im.slice(), o = [];
    for (let i = 0; i < 8; i += len) for (let k = 0; k < half; k++) {
      const a = i + k, b = a + half, tw = 8 / len * k, ang = -TAU * tw / 8, wr = Math.cos(ang), wi = Math.sin(ang);
      const tr = re[b] * wr - im[b] * wi, ti = re[b] * wi + im[b] * wr;
      nr[a] = re[a] + tr; ni[a] = im[a] + ti; nr[b] = re[a] - tr; ni[b] = im[a] - ti;
      o.push({ a, b, tw, tr, ti });
    }
    re = nr; im = ni; st.push({ re: re.slice(), im: im.slice() }); ops.push(o);
  }
  const S = s8stage;
  const c = $('c8a'), p = new Plot(c); const W = p.w, H = p.h, x0 = 70, x1 = W - 110, top = 30, rowH = (H - top - 20) / 7;
  const colX = s => x0 + (x1 - x0) * s / 3, rowY = r => top + r * rowH;
  const g = p.x; g.font = p.font;
  g.textAlign = 'center'; g.textBaseline = 'top'; g.fillStyle = COL.muted;
  ['Đầu vào (đảo bit)', 'Tầng 1: DFT 2 điểm', 'Tầng 2: DFT 4 điểm', 'Tầng 3: DFT 8 điểm'].forEach((t, s) => g.fillText(t, colX(s), 4));
  for (let s = 1; s <= 3; s++) for (const o of ops[s - 1]) {
    const act = s <= S, cur = s === S;
    const col = cur ? COL.sample : act ? alpha(COL.trace, .55) : alpha(COL.muted, .18);
    g.lineWidth = cur ? 2 : 1.2; g.strokeStyle = col;
    g.beginPath(); g.moveTo(colX(s - 1), rowY(o.a)); g.lineTo(colX(s), rowY(o.a)); g.moveTo(colX(s - 1), rowY(o.b)); g.lineTo(colX(s), rowY(o.a));
    g.moveTo(colX(s - 1), rowY(o.a)); g.lineTo(colX(s), rowY(o.b)); g.moveTo(colX(s - 1), rowY(o.b)); g.lineTo(colX(s), rowY(o.b)); g.stroke();
    if (cur) {
      g.fillStyle = COL.a4; g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillText('W' + o.tw, colX(s - 1) + 6, rowY(o.b) - 8);
      g.fillStyle = COL.bad; g.fillText('−1', colX(s) - 20, rowY(o.b) - 8);
    }
  }
  for (let s = 0; s <= 3; s++) for (let r = 0; r < 8; r++) {
    const vis = s <= S;
    g.fillStyle = vis ? (s === S ? COL.sample : COL.trace) : COL.grid;
    g.beginPath(); g.arc(colX(s), rowY(r), 4, 0, TAU); g.fill();
    if (vis) {
      g.fillStyle = COL.ink; g.textBaseline = 'bottom';
      g.textAlign = s === 3 ? 'left' : 'center';
      const t = cfmt(st[s].re[r], st[s].im[r], 2);
      g.fillText(t, s === 3 ? colX(s) + 8 : colX(s), rowY(r) - 5);
    }
  }
  g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillStyle = COL.muted;
  for (let r = 0; r < 8; r++) g.fillText(`x[${bitrev3(r)}]`, x0 - 12, rowY(r));
  if (S === 3) { g.textAlign = 'left'; g.fillStyle = COL.a3; for (let r = 0; r < 8; r++) g.fillText(`X[${r}]`, colX(3) + 8, rowY(r) + 9); }
  $('s8stage').textContent = S === 0 ? 'Tầng 0 / 3: sắp xếp lại đầu vào' : `Tầng ${S} / 3`;
  $('s8prev').disabled = S === 0; $('s8next').disabled = S === 3;
  let s = '';
  if (S === 0) s = 'Đảo bit chỉ số: 0(000)→0, 1(001)→4(100), 2(010)→2, 3(011)→6(110), 4→1, 5→5, 6→3, 7→7.\nNhờ vậy mọi phép bướm sau đó tính được tại chỗ, không cần bộ nhớ phụ.';
  else {
    const len = 1 << S;
    s = `Tầng ${S}: ghép các DFT ${len / 2} điểm thành DFT ${len} điểm. Hệ số xoay W${len}^k = W8^(${8 / len}k), W8^m = e^(−j2πm/8).\n`;
    for (const o of ops[S - 1]) {
      const A = st[S - 1], wr = Math.cos(-TAU * o.tw / 8), wi = Math.sin(-TAU * o.tw / 8);
      s += `• a=${o.a}, b=${o.b}: W8^${o.tw} = ${cfmt(wr, wi, 3)};  t = W·[${cfmt(A.re[o.b], A.im[o.b], 2)}] = ${cfmt(o.tr, o.ti, 3)};  ` +
        `out[${o.a}] = ${cfmt(A.re[o.a], A.im[o.a], 2)} + t = ${cfmt(st[S].re[o.a], st[S].im[o.a], 3)};  out[${o.b}] = ${cfmt(A.re[o.a], A.im[o.a], 2)} − t = ${cfmt(st[S].re[o.b], st[S].im[o.b], 3)}\n`;
    }
    if (S === 3) {
      const D = dft(x); let e = 0; for (let k = 0; k < 8; k++) e = Math.max(e, Math.hypot(D.re[k] - st[3].re[k], D.im[k] - st[3].im[k]));
      s += `\nKiểm tra với DFT trực tiếp (64 phép nhân phức): sai lệch lớn nhất = ${e.toExponential(2)}. FFT chỉ dùng 12 phép nhân (thực chất ít hơn vì W8^0 = 1, W8^2 = −j).`;
    }
  }
  $('s8info').textContent = s;
});
$('s8next').onclick = () => { s8stage = Math.min(3, s8stage + 1); c8(); };
$('s8prev').onclick = () => { s8stage = Math.max(0, s8stage - 1); c8(); };
bind(['s8x'], c8);

demo(function c8b() {
  const pSel = val('s8p'); out('s8po', pSel);
  const ps = range(1, 20), d = ps.map(p => 2 * p * Math.LN2 / Math.LN10), f = ps.map(p => Math.log10(Math.pow(2, p) / 2 * p));
  const pl = new Plot($('c8b')).range(1, 20, 0, 13).frame({ xt: 1, yt: 2, yf: v => '10^' + v, xl: 'p (N = 2^p)' });
  pl.line(ps, d, COL.bad, 2); pl.line(ps, f, COL.a3, 2);
  pl.vline(pSel, COL.sample);
  pl.dot(pSel, 2 * pSel * Math.LN2 / Math.LN10, COL.bad, 5); pl.dot(pSel, Math.log10(Math.pow(2, pSel) / 2 * pSel), COL.a3, 5);
  pl.text('DFT: N²', 15, 2 * 15 * Math.LN2 / Math.LN10 + .8, COL.bad, 'right');
  pl.text('FFT: (N/2)·log₂N', 19.6, Math.log10(Math.pow(2, 19) / 2 * 19) - 1, COL.a3, 'right');
  const N = Math.pow(2, pSel), dd = N * N, ff = N / 2 * pSel;
  const tm = v => { const s = v / 1e9; return s < 1e-3 ? (s * 1e6).toFixed(2) + ' µs' : s < 1 ? (s * 1e3).toFixed(2) + ' ms' : s < 3600 ? s.toFixed(2) + ' s' : (s / 3600).toFixed(1) + ' giờ'; };
  $('s8cmp').textContent = `N = ${N.toLocaleString('vi-VN')}\nDFT trực tiếp: ${dd.toLocaleString('vi-VN')} phép nhân phức  (~${tm(dd)} ở 1 tỉ phép/giây)\nFFT radix-2:   ${ff.toLocaleString('vi-VN')} phép nhân phức  (~${tm(ff)})\nNhanh hơn ${(dd / ff).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} lần`;
});
bind(['s8p'], demos[demos.length - 1]);
