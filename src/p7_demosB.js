
/* ================= C9: mặt phẳng z ================= */
const pz = { poles: [], zeros: [], sel: null };
const PZ_PRESETS = {
  res: { poles: [[0.9 * Math.cos(PI / 4), 0.9 * Math.sin(PI / 4)]], zeros: [[-1, 0], [1, 0]] },
  notch: { poles: [[0.92 * Math.cos(PI / 3), 0.92 * Math.sin(PI / 3)]], zeros: [[Math.cos(PI / 3), Math.sin(PI / 3)]] },
  lp: { poles: [[0.7, 0]], zeros: [[-1, 0]] },
  hp: { poles: [[-0.6, 0]], zeros: [[1, 0]] },
  unstable: { poles: [[1.08 * Math.cos(PI / 5), 1.08 * Math.sin(PI / 5)]], zeros: [] }
};
function pzLoad(name) { const p = PZ_PRESETS[name]; pz.poles = p.poles.map(v => v.slice()); pz.zeros = p.zeros.map(v => v.slice()); pz.sel = null; }
pzLoad('res');
const expand = list => { const r = []; for (const [x, y] of list) { if (Math.abs(y) < 1e-9) r.push([x, 0]); else { r.push([x, y], [x, -y]); } } return r; };
let c9plot = null;
const c9 = demo(function c9() {
  const w = val('s9w') * PI; out('s9wo', val('s9w').toFixed(3) + 'π');
  const P = expand(pz.poles), Z = expand(pz.zeros);
  let b = polyFromRoots(Z), a = polyFromRoots(P);
  const F0 = freqz(b, a, 512); const pk = Math.max(...F0.mag.filter(isFinite)) || 1;
  b = b.map(v => v / pk);
  const F = freqz(b, a, 512);
  const p = new Plot($('c9a')); p.m = { l: 34, r: 10, t: 10, b: 22 };
  p.equal(0, 0, 1.55).frame({ yAxis0: true, xt: 0.5, yt: 0.5 });
  p.circle(0, 0, 1, COL.muted, 1.5);
  const ez = [Math.cos(w), Math.sin(w)];
  for (const q of Z) p.seg(ez[0], ez[1], q[0], q[1], alpha(COL.a3, .55), 1.3);
  for (const q of P) p.seg(ez[0], ez[1], q[0], q[1], alpha(COL.sample, .55), 1.3);
  p.dot(ez[0], ez[1], COL.trace, 5); p.text(' e^jω', ez[0], ez[1] + .1, COL.trace);
  pz.zeros.forEach((q, i) => {
    const s = pz.sel && pz.sel.t === 'z' && pz.sel.i === i;
    p.dot(q[0], q[1], COL.a3, s ? 9 : 7, true); if (Math.abs(q[1]) > 1e-9) p.dot(q[0], -q[1], alpha(COL.a3, .5), 7, true);
  });
  pz.poles.forEach((q, i) => {
    const s = pz.sel && pz.sel.t === 'p' && pz.sel.i === i;
    p.cross(q[0], q[1], COL.sample, s ? 9 : 7, s ? 3 : 2.2); if (Math.abs(q[1]) > 1e-9) p.cross(q[0], -q[1], alpha(COL.sample, .5), 7);
  });
  c9plot = p;
  const pb = new Plot($('c9b')).range(0, PI, -50, 6).frame({ xt: PI / 4, xf: piF, yt: 10 });
  pb.line(F.w, F.mag.map(dB), COL.a3, 2);
  const [hr, hi] = H_at(b, a, w); pb.vline(w, COL.trace); pb.dot(w, clamp(dB(Math.hypot(hr, hi)), -50, 6), COL.trace, 4);
  const L = 40, imp = new Array(L).fill(0); imp[0] = 1;
  const h = Array.from(filt(b, a, imp));
  const [lo, hiY] = autoY([h], .12, .5);
  const pc = new Plot($('c9c')).range(-.6, L - .4, lo, hiY).frame({ xt: 5 });
  pc.stem(range(0, L - 1), h, COL.a4, 2.5);
  const maxP = P.length ? Math.max(...P.map(q => Math.hypot(q[0], q[1]))) : 0;
  const prodZ = Z.reduce((s, q) => s * Math.hypot(ez[0] - q[0], ez[1] - q[1]), 1), prodP = P.reduce((s, q) => s * Math.hypot(ez[0] - q[0], ez[1] - q[1]), 1);
  const poly = (c, v) => c.map((x, i) => (i === 0 ? fmt(x, 4) : (x < 0 ? ' − ' : ' + ') + Math.abs(x).toFixed(4) + `${v}^−${i}`)).join('');
  $('s9info').innerHTML =
    (maxP < 1 ? `<span class="pill good">Ổn định</span> mọi cực nằm trong vòng tròn đơn vị (max |p| = ${maxP.toFixed(3)})` :
      `<span class="pill bad">Không ổn định</span> có cực với |p| = ${maxP.toFixed(3)} ≥ 1: h[n] không tắt dần`) + '\n' +
    `B(z) = ${poly(b, 'z')}\nA(z) = ${poly(a, 'z')}\n` +
    `Tại ω = ${val('s9w').toFixed(3)}π: Π|e^jω − zero| = ${prodZ.toFixed(4)},  Π|e^jω − cực| = ${prodP.toFixed(4)}  →  |H| = ${fmt(b[0] || 0, 4)}·${prodZ.toFixed(3)}/${prodP.toFixed(3)} = ${Math.hypot(hr, hi).toFixed(4)} (${dB(Math.hypot(hr, hi)).toFixed(1)} dB)`;
});
bind(['s9w'], c9);
$('s9preset').onchange = () => { pzLoad($('s9preset').value); c9(); };
$('s9addP').onclick = () => { pz.poles.push([0.5 * Math.cos(2.2), 0.5 * Math.sin(2.2)]); pz.sel = { t: 'p', i: pz.poles.length - 1 }; c9(); };
$('s9addZ').onclick = () => { pz.zeros.push([0.8 * Math.cos(2.6), 0.8 * Math.sin(2.6)]); pz.sel = { t: 'z', i: pz.zeros.length - 1 }; c9(); };
$('s9del').onclick = () => { if (!pz.sel) return; (pz.sel.t === 'p' ? pz.poles : pz.zeros).splice(pz.sel.i, 1); pz.sel = null; c9(); };
{
  const c = $('c9a'); let drag = null;
  const pos = e => { const r = c.getBoundingClientRect(); return [c9plot.iX(e.clientX - r.left), c9plot.iY(e.clientY - r.top), e.clientX - r.left, e.clientY - r.top]; };
  c.addEventListener('pointerdown', e => {
    const [, , px, py] = pos(e); let best = null, bd = 18;
    const test = (list, t) => list.forEach((q, i) => {
      for (const s of [1, -1]) { const d = Math.hypot(c9plot.X(q[0]) - px, c9plot.Y(s * q[1]) - py); if (d < bd) { bd = d; best = { t, i, mir: s }; } }
    });
    test(pz.poles, 'p'); test(pz.zeros, 'z');
    pz.sel = best; drag = best; if (best) c.setPointerCapture(e.pointerId); c9();
  });
  c.addEventListener('pointermove', e => {
    if (!drag) return; let [x, y] = pos(e); y *= drag.mir;
    const R = Math.hypot(x, y); if (R > 1.5) { x *= 1.5 / R; y *= 1.5 / R; }
    if (Math.abs(y) < 0.04) y = 0;
    (drag.t === 'p' ? pz.poles : pz.zeros)[drag.i] = [x, Math.abs(y)];
    c9();
  });
  const up = () => { drag = null; };
  c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
}

/* ================= C10: FIR ================= */
const TW = { rect: 0.9, hann: 3.1, hamming: 3.3, blackman: 5.5, kaiser: 4.0 };
const WNAME = { rect: 'Chữ nhật', hann: 'Hann', hamming: 'Hamming', blackman: 'Blackman', kaiser: 'Kaiser β=6' };
demo(function c10() {
  const type = $('s10type').value, win = $('s10win').value, N = val('s10N'), wc = val('s10w') * PI, bw = val('s10bw') * PI;
  out('s10No', N); out('s10wo', val('s10w').toFixed(2) + 'π'); out('s10bwo', val('s10bw').toFixed(2) + 'π');
  $('s10bw').disabled = type !== 'bp';
  const { hd, w, h } = firDesign(N, type, wc, bw, win);
  const ns = range(0, N - 1), [lo, hi] = autoY([hd, h], .12, .3);
  const pa = new Plot($('c10a')).range(-1, N, lo, hi).frame({ xt: niceStep(N, 6), xl: 'n' });
  const hmax = Math.max(...h.map(Math.abs)) || 1;
  pa.line(ns, w.map(v => v * hmax), alpha(COL.a4, .8), 1.4, [5, 3]);
  pa.stem(ns, hd, alpha(COL.muted, .35), N > 60 ? 0 : 2, 1.2);
  pa.stem(ns, h, COL.sample, N > 60 ? 1.5 : 2.8);
  const F = freqz(h, [1], 800), md = F.mag.map(dB);
  const pb = new Plot($('c10b')).range(0, PI, -110, 10).frame({ xt: PI / 4, xf: piF, yt: 20, xl: 'ω' });
  const ideal = F.w.map(om => {
    if (type === 'lp') return om <= wc ? 0 : -200;
    if (type === 'hp') return om >= wc ? 0 : -200;
    return (om >= wc - bw / 2 && om <= wc + bw / 2) ? 0 : -200;
  });
  pb.line(F.w, ideal, alpha(COL.muted, .8), 1.2, [4, 4]);
  pb.hline(-3, alpha(COL.warn, .6), [2, 3]);
  pb.line(F.w, md, COL.a3, 1.8);
  // đo đạc
  const tw = TW[win] * TAU / N;
  const inStop = om => type === 'lp' ? om >= wc + tw : type === 'hp' ? om <= wc - tw : (om <= wc - bw / 2 - tw || om >= wc + bw / 2 + tw);
  const inPass = om => type === 'lp' ? om <= wc - tw : type === 'hp' ? om >= wc + tw : (om >= wc - bw / 2 + tw && om <= wc + bw / 2 - tw);
  let sMax = -999, pMin = 999, pMax = -999;
  F.w.forEach((om, i) => { if (inStop(om)) sMax = Math.max(sMax, md[i]); if (inPass(om)) { pMin = Math.min(pMin, md[i]); pMax = Math.max(pMax, md[i]); } });
  // áp dụng lên tín hiệu
  const L = 260, r = rng(9), x = range(0, L - 1).map(n => Math.sin(0.05 * PI * n) + 0.6 * Math.sin(0.6 * PI * n) + 0.25 * r.n());
  const y = filt(h, [1], x), D = (N - 1) / 2;
  const pc = new Plot($('c10c')).range(0, L - 1, -2.3, 2.3).frame({ xt: 20, xl: 'n' });
  pc.line(range(0, L - 1), x, alpha(COL.muted, .55), 1);
  pc.line(range(0, L - 1 - D), Array.from(y).slice(D), COL.a3, 2);
  $('s10info').textContent =
    `Cửa sổ ${WNAME[win]}, N = ${N} hệ số → độ trễ nhóm (N−1)/2 = ${D} mẫu. Chuyển tiếp ước tính ≈ ${TW[win]}·2π/N = ${(tw / PI).toFixed(3)}π.\n` +
    (sMax > -998 ? `Suy hao dải chặn đo được: ${(-sMax).toFixed(1)} dB` : 'Dải chặn quá hẹp để đo với N hiện tại') +
    (pMin < 998 ? `   ·   Gợn dải thông: ${(pMax - pMin).toFixed(3)} dB` : '') +
    `\nhệ số h[0..${Math.min(N, 8) - 1}] = [${h.slice(0, 8).map(v => v.toFixed(5)).join(', ')}${N > 8 ? ', …' : ''}]  (đối xứng: h[n] = h[${N - 1}−n])` +
    (win === 'rect' ? '\nChú ý gợn ~9% sát mép (Gibbs): tăng N chỉ làm gợn hẹp lại, không thấp đi.' : '');
});
bind(['s10type', 's10win', 's10N', 's10w', 's10bw'], demos[demos.length - 1]);

/* ================= C11: IIR Butterworth ================= */
const FS11 = 8000;
let c11sig = null;
function c11signal() {
  if (c11sig) return c11sig;
  const L = FS11 * 2, r = rng(21), x = new Float64Array(L);
  for (let n = 0; n < L; n++) x[n] = 0.5 * Math.sin(TAU * 300 * n / FS11) + 0.25 * Math.sin(TAU * 2500 * n / FS11) + 0.12 * r.n();
  return (c11sig = x);
}
let c11cur = null;
demo(function c11() {
  const N = val('s11N'), fc = val('s11f'); out('s11No', N); out('s11fo', fc);
  const wc = TAU * fc / FS11, B = butter(N, wc); c11cur = B;
  // (1) mặt phẳng s
  const Rs = B.Wc * 1.5;
  const pa = new Plot($('c11a')); pa.m = { l: 34, r: 8, t: 10, b: 22 };
  pa.equal(0, 0, Rs).frame({ yAxis0: true, xf: v => v.toFixed(1), yf: v => v.toFixed(1), xl: 'σ', yl: 'jΩ' });
  pa.x.fillStyle = alpha(COL.a3, .07); pa.x.fillRect(pa.m.l, pa.m.t, pa.X(0) - pa.m.l, pa.h - pa.m.t - pa.m.b);
  pa.circle(0, 0, B.Wc, alpha(COL.muted, .8), 1, [3, 3]);
  B.sPoles.forEach(q => pa.cross(q[0], q[1], COL.sample, 6));
  pa.text(`Ωc = tan(ωc/2) = ${B.Wc.toFixed(3)}`, pa.x0 + (pa.x1 - pa.x0) * .03, pa.y0 + (pa.y1 - pa.y0) * .06, COL.muted);
  // (2) mặt phẳng z
  const pb = new Plot($('c11b')); pb.m = { l: 34, r: 8, t: 10, b: 22 };
  pb.equal(0, 0, 1.25).frame({ yAxis0: true, xt: .5, yt: .5 });
  pb.circle(0, 0, 1, COL.muted, 1.5);
  B.zPoles.forEach(q => pb.cross(q[0], q[1], COL.sample, 6));
  pb.dot(-1, 0, COL.a3, 7, true); pb.text(`${N}×`, -1, .16, COL.a3, 'center');
  const wcz = [Math.cos(wc), Math.sin(wc)]; pb.seg(0, 0, wcz[0], wcz[1], alpha(COL.trace, .6), 1, [3, 3]); pb.text(' ωc', wcz[0], wcz[1], COL.trace);
  // (3) đáp ứng biên độ
  const F = freqz(B.b, B.a, 600), taps = 2 * N + 1, fir = firDesign(taps, 'lp', wc, 0, 'hamming').h, F2 = freqz(fir, [1], 600);
  const hz = F.w.map(o => o / TAU * FS11);
  const pc = new Plot($('c11c')).range(0, FS11 / 2, -80, 6).frame({ xt: 1000, yt: 20, xl: 'Hz' });
  pc.hline(-3, alpha(COL.warn, .6), [2, 3]); pc.vline(fc, alpha(COL.trace, .6));
  pc.line(hz, F2.mag.map(dB), COL.a4, 1.6);
  pc.line(hz, F.mag.map(dB), COL.a3, 2.2);
  const at = f => dB(Math.hypot(...H_at(B.b, B.a, TAU * f / FS11)));
  const cf = c => c.map(v => (v >= 0 ? ' ' : '') + v.toPrecision(5)).join(', ');
  $('s11info').textContent =
    `Bước 1  Prewarp: Ωc = tan(π·${fc}/${FS11}) = ${B.Wc.toFixed(5)}\n` +
    `Bước 2  Cực tương tự: ` + B.sPoles.slice(0, 4).map(q => cfmt(q[0], q[1], 3)).join(';  ') + (N > 4 ? ' …' : '') + '\n' +
    `Bước 3  z = (1+s)/(1−s): ` + B.zPoles.slice(0, 4).map(q => cfmt(q[0], q[1], 3)).join(';  ') + (N > 4 ? ' …' : '') + `   (|z|max = ${Math.max(...B.zPoles.map(q => Math.hypot(q[0], q[1]))).toFixed(4)})\n` +
    `Bước 4  Hệ số khuếch đại g = ${B.g.toExponential(4)}\n` +
    `b = [${cf(B.b)}]\na = [${cf(B.a)}]\n` +
    `|H| tại fc = ${at(fc).toFixed(2)} dB, tại 2500 Hz = ${at(2500).toFixed(1)} dB.  Cùng ${taps} phép nhân, FIR Hamming chỉ đạt ${dB(Math.hypot(...H_at(fir, [1], TAU * 2500 / FS11))).toFixed(1)} dB tại 2500 Hz.`;
});
bind(['s11N', 's11f'], demos[demos.length - 1]);
$('s11pa').onclick = () => playSamples(c11signal(), FS11);
$('s11pb').onclick = () => playSamples(filt(c11cur.b, c11cur.a, c11signal()), FS11);

/* ================= C12: rò rỉ phổ & STFT ================= */
demo(function c12a() {
  const f1 = val('s12f1'), df = val('s12df'), a2 = val('s12a2'), win = $('s12win').value, zp = val('s12zp');
  out('s12f1o', f1.toFixed(1)); out('s12dfo', df.toFixed(1)); out('s12a2o', a2 === 0 ? '0' : '−' + Math.abs(a2)); out('s12zpo', zp);
  const N = 64, nfft = 1 << Math.ceil(Math.log2(N * zp)), A2 = Math.pow(10, a2 / 20), f2 = f1 + df;
  const w = windowFn(win, N), sw = w.reduce((s, v) => s + v, 0);
  const x = range(0, N - 1).map(n => (Math.cos(TAU * f1 * n / N) + A2 * Math.cos(TAU * f2 * n / N + 0.7)) * w[n]);
  const m0 = magSpec(x, N), m1 = magSpec(x, nfft);
  const p = new Plot($('c12a')).range(0, 32, -100, 6).frame({ xt: 2, yt: 20, xl: 'bin (theo N = 64)', yl: 'dB' });
  p.clip();
  p.line(range(0, nfft / 2).map(k => k * N / nfft), Array.from(m1).map(v => dB(2 * v / sw)), COL.trace, 1.6);
  p.stem(range(0, 32), Array.from(m0).map(v => dB(2 * v / sw)), COL.sample, 3);
  p.vline(f1, alpha(COL.a4, .8)); p.vline(f2, alpha(COL.a4, .8));
  p.unclip();
});
bind(['s12f1', 's12df', 's12a2', 's12win', 's12zp'], demos[demos.length - 1]);

const FS12 = 8000;
function s12signal(type) {
  const L = Math.round(FS12 * 1.6), x = new Float64Array(L);
  if (type === 'chirp') { for (let n = 0; n < L; n++) { const t = n / FS12; x[n] = Math.sin(TAU * (100 * t + (3700 / (2 * 1.6)) * t * t)); } }
  else if (type === 'fm') { for (let n = 0, ph = 0; n < L; n++) { const t = n / FS12; ph += TAU * (1500 + 700 * Math.sin(TAU * 1.5 * t)) / FS12; x[n] = Math.sin(ph); } }
  else {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    for (let n = 0; n < L; n++) {
      const t = n / FS12, i = Math.floor(t / 0.3);
      if (i < 4) { const tt = t - i * 0.3, env = Math.exp(-tt * 5) * Math.min(1, tt * 200); const f = notes[i]; x[n] = env * (Math.sin(TAU * f * t) + 0.4 * Math.sin(TAU * 2 * f * t) + 0.2 * Math.sin(TAU * 3 * f * t)); }
    }
    for (const tc of [1.3, 1.45]) { const n0 = Math.round(tc * FS12); for (let k = 0; k < 30; k++) x[n0 + k] += (k % 2 ? -1 : 1) * Math.exp(-k / 6) * 1.2; }
  }
  return x;
}
function cmap(v) { // v 0..1 → màu (thang tím-xanh-vàng)
  const stops = [[13, 8, 48], [60, 30, 120], [33, 110, 160], [30, 170, 130], [160, 210, 60], [250, 235, 80]];
  const s = clamp(v, 0, 1) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(s)), f = s - i;
  return stops[i].map((c, j) => Math.round(c + (stops[i + 1][j] - c) * f));
}
demo(function c12b() {
  const type = $('s12sig').value, Nw = 1 << val('s12L'); out('s12Lo', Nw);
  const x = s12signal(type), hop = Math.max(4, Nw / 4), w = windowFn('hann', Nw), frames = Math.floor((x.length - Nw) / hop) + 1, bins = Nw / 2;
  const off = document.createElement('canvas'); off.width = frames; off.height = bins;
  const og = off.getContext('2d'), img = og.createImageData(frames, bins);
  const re = new Float64Array(Nw), im = new Float64Array(Nw);
  for (let f = 0; f < frames; f++) {
    for (let i = 0; i < Nw; i++) { re[i] = x[f * hop + i] * w[i]; im[i] = 0; }
    fft(re, im);
    for (let k = 0; k < bins; k++) {
      const v = (dB(Math.hypot(re[k], im[k]) / (Nw / 4)) + 70) / 70, c = cmap(v), idx = ((bins - 1 - k) * frames + f) * 4;
      img.data[idx] = c[0]; img.data[idx + 1] = c[1]; img.data[idx + 2] = c[2]; img.data[idx + 3] = 255;
    }
  }
  og.putImageData(img, 0, 0);
  const T = x.length / FS12, p = new Plot($('c12b')); p.m.l = 46;
  p.range(0, T, 0, FS12 / 2).frame({ xt: 0.2, yt: 1000, xl: 't (s)', yf: v => (v / 1000) + 'k' });
  p.x.imageSmoothingEnabled = Nw >= 64;
  const t0 = Nw / 2 / FS12, t1 = ((frames - 1) * hop + Nw / 2) / FS12;
  p.x.drawImage(off, p.X(t0), p.Y(FS12 / 2), p.X(t1) - p.X(t0), p.Y(0) - p.Y(FS12 / 2));
  $('s12cap').textContent = `Cửa sổ Hann N = ${Nw}: độ phân giải thời gian ≈ ${(1000 * Nw / FS12).toFixed(1)} ms, độ phân giải tần số ≈ ${(FS12 / Nw).toFixed(1)} Hz (fs = 8 kHz, bước nhảy N/4). ` +
    (Nw <= 32 ? 'Cửa sổ ngắn: tiếng gõ sắc nét theo thời gian nhưng các hài bị nhoè theo tần số.' : Nw >= 256 ? 'Cửa sổ dài: vạch tần số mảnh nhưng ranh giới các nốt và tiếng gõ bị nhoè theo thời gian.' : 'Cân bằng giữa thời gian và tần số.');
});
bind(['s12sig', 's12L'], demos[demos.length - 1]);
$('s12play').onclick = () => playSamples(s12signal($('s12sig').value), FS12);

/* ================= C13: đa tốc độ ================= */
demo(function c13() {
  const mode = $('s13mode').value, M = val('s13M'), useF = $('s13filt').checked; out('s13Mo', M);
  const L0 = 512, hann = n => 0.5 - 0.5 * Math.cos(TAU * n / (n.length || 1));
  const spec = (sig) => { const n = sig.length, nf = 1 << Math.ceil(Math.log2(n * 2)), w = windowFn('hann', n), m = magSpec(sig.map((v, i) => v * w[i]), nf), s = w.reduce((a, b) => a + b, 0); return { w: range(0, nf / 2).map(k => k / (nf / 2)), m: Array.from(m).map(v => 2 * v / s) }; };
  let x, y, info = '';
  const lpf = firDesign(63, 'lp', PI / M, 0, 'hamming').h;
  if (mode === 'dec') {
    const wl = 0.08 * PI, wh = 0.78 * PI;
    x = range(0, L0 - 1).map(n => Math.cos(wl * n) + 0.7 * Math.cos(wh * n));
    const xf = useF ? Array.from(filt(lpf, [1], x)) : x;
    y = []; for (let n = 0; n * M < L0; n++) y.push(xf[n * M]);
    const wa = Math.abs(((wh * M + PI) % TAU + TAU) % TAU - PI);
    $('s13capA').textContent = `x[n] (xám) và các mẫu được giữ y[n] = x[${M}n] (xanh lá, đặt tại vị trí ${M}n)`;
    const pa = new Plot($('c13a')).range(0, 72, -2, 2).frame({ xt: 8, xl: 'n (tốc độ gốc)' });
    pa.line(range(0, 72), x.slice(0, 73), alpha(COL.muted, .6), 1.2);
    pa.stem(range(0, Math.floor(72 / M)).map(n => n * M), y.slice(0, Math.floor(72 / M) + 1), COL.a3, 3);
    info = `Thành phần thấp 0.08π → sau ↓${M} thành ${(0.08 * M).toFixed(2)}π (giãn ${M} lần, vẫn < π: giữ được).\n` +
      `Thành phần cao 0.78π → ${(0.78 * M).toFixed(2)}π > π nên gấp về ${(wa / PI).toFixed(2)}π: ` +
      (useF ? `nhưng bộ lọc thông thấp π/${M} đã chặn nó trước khi hạ tốc nên chỉ còn vạch rất nhỏ.` : `<b>chồng phổ!</b> Một vạch giả xuất hiện, không thể phân biệt với tín hiệu thật.`);
  } else {
    const L = M; const xs = 140;
    x = range(0, xs - 1).map(n => Math.cos(0.12 * PI * n) + 0.6 * Math.cos(0.45 * PI * n));
    const v = new Array(xs * L).fill(0); x.forEach((s, i) => v[i * L] = s);
    const lpL = firDesign(63, 'lp', PI / L, 0, 'hamming').h.map(c => c * L);
    y = useF ? Array.from(filt(lpL, [1], v)).slice(31) : v;
    $('s13capA').textContent = `Mẫu gốc (xanh dương, tại vị trí ${L}n) và tín hiệu sau ↑${L} (xanh lá)`;
    const pa = new Plot($('c13a')).range(0, 72, -2, 2).frame({ xt: 8, xl: 'n (tốc độ mới)' });
    pa.stem(range(0, Math.floor(72 / L)).map(n => n * L), x.slice(0, Math.floor(72 / L) + 1), alpha(COL.trace, .45), 5);
    pa.stem(range(0, 72), y.slice(0, 73), COL.a3, 2.5);
    info = `Chèn ${L - 1} số 0 giữa các mẫu nén phổ ${L} lần: vạch 0.12π → ${(0.12 / L).toFixed(3)}π, 0.45π → ${(0.45 / L).toFixed(3)}π, và xuất hiện ${L - 1} bộ ảnh lặp quanh 2πk/${L}.\n` +
      (useF ? `Bộ lọc thông thấp π/${L} (khuếch đại ${L}) xoá ảnh, số 0 được thay bằng giá trị nội suy mượt.` : `<b>Chưa lọc:</b> các ảnh vẫn còn, tín hiệu trong miền thời gian có “răng cưa” vì toàn số 0 xen giữa.`);
  }
  const S0 = spec(x), S1 = spec(y);
  const pb = new Plot($('c13b')).range(0, 1, 0, 1.15).frame({ xt: .25, xf: v => v === 0 ? '0' : v === 1 ? 'π' : v + 'π', xl: 'ω' });
  pb.line(S0.w, S0.m.map(v => v / Math.max(...S0.m)), alpha(COL.muted, .7), 1.4);
  pb.line(S1.w, S1.m.map(v => v / Math.max(...S1.m)), COL.a3, 2);
  if (useF) pb.vline(mode === 'dec' ? 1 / M : 1 / M, alpha(COL.warn, .7));
  $('s13info').innerHTML = info;
});
bind(['s13mode', 's13M', 's13filt'], demos[demos.length - 1]);

/* ================= C14: LMS ================= */
let c14anim = null;
const c14data = () => {
  const L = 3000, r = rng(33), h = [0.8, -0.5, 0.3, 0.2, -0.1];
  const s = range(0, L - 1).map(n => 0.6 * Math.sin(0.05 * n) * (0.6 + 0.4 * Math.sin(0.004 * n)));
  const v = range(0, L - 1).map(n => Math.sin(0.3 * n) + 0.5 * Math.sin(0.71 * n + 1) + 0.5 * r.n());
  const hv = conv(v, h).slice(0, L);
  const d = s.map((x, i) => x + hv[i]);
  return { L, h, s, v, d };
};
const C14 = c14data();
function c14(reveal = 1) {
  const mu = Math.pow(10, val('s14mu')), M = val('s14M'); out('s14muo', mu < 0.01 ? mu.toExponential(1) : mu.toFixed(3)); out('s14Mo', M);
  const { L, h, s, v, d } = C14, R = lms(v, d, M, mu), e = Array.from(R.e);
  const upto = Math.max(2, Math.floor(1500 * reveal));
  const pa = new Plot($('c14a')).range(0, 1500, -3.5, 3.5).frame({ xt: 250, xl: 'n' });
  pa.clip();
  pa.line(range(0, upto - 1), d.slice(0, upto), alpha(COL.muted, .45), 1);
  pa.line(range(0, upto - 1), s.slice(0, upto), alpha(COL.trace, .9), 1.2);
  pa.line(range(0, upto - 1), e.slice(0, upto), COL.a3, 1.5);
  pa.unclip();
  // đường cong học
  const lc = []; let acc = 0; const W = 60;
  const err = e.map((x, i) => (x - s[i]) * (x - s[i]));
  for (let n = 0; n < L; n++) { acc += isFinite(err[n]) ? err[n] : 1e6; if (n >= W) acc -= isFinite(err[n - W]) ? err[n - W] : 1e6; lc.push(10 * Math.log10(Math.max(acc / Math.min(n + 1, W), 1e-8))); }
  const up2 = Math.floor(L * reveal);
  const pb = new Plot($('c14b')).range(0, L, -60, 20).frame({ xt: 500, yt: 20, xl: 'n' });
  pb.clip(); pb.line(range(0, up2 - 1), lc.slice(0, up2), COL.sample, 1.6); pb.unclip();
  const pc = new Plot($('c14c')).range(-.6, Math.max(M, h.length) - .4, -1, 1.1).frame({ xt: 1, xl: 'k' });
  pc.stem(range(0, M - 1), Array.from(R.w).map(x => isFinite(x) ? clamp(x, -5, 5) : 0), COL.sample, 3.5);
  h.forEach((x, i) => pc.dot(i, x, COL.trace, 6, true));
  const Px = v.reduce((a, b) => a + b * b, 0) / L, bound = 2 / (M * Px);
  const fin = lc.slice(-300).filter(isFinite), mse = fin.reduce((a, b) => a + b, 0) / (fin.length || 1);
  const werr = Math.sqrt(h.map((x, i) => (x - (i < M ? R.w[i] : 0)) ** 2).reduce((a, b) => a + b, 0));
  $('s14info').textContent =
    `μ = ${mu.toExponential(2)}   Px ≈ ${Px.toFixed(3)}   giới hạn ổn định gần đúng 2/(M·Px) = ${bound.toExponential(2)}\n` +
    (R.diverged ? '⚠ Thuật toán PHÂN KỲ: μ quá lớn, sai số bùng nổ.' :
      `MSE cuối (e − s)² ≈ ${mse.toFixed(1)} dB   ·   ‖w − h‖ = ${werr.toFixed(3)}` +
      (M < h.length ? `\nM = ${M} < độ dài đường truyền thật (${h.length}): không thể mô hình đủ, còn sót nhiễu.` : '') +
      (mu < bound / 200 ? '\nμ rất nhỏ: hội tụ chậm, chưa kịp học hết trong 3000 mẫu.' : mu > bound / 4 ? '\nμ lớn: hội tụ nhanh nhưng sai số dư cao (hệ số dao động quanh nghiệm).' : ''));
}
demo(() => c14(1));
const c14run = () => {
  if (c14anim) cancelAnimationFrame(c14anim);
  const t0 = performance.now(), D = 1600;
  const step = t => { const r = Math.min(1, (t - t0) / D); c14(r); if (r < 1) c14anim = requestAnimationFrame(step); else c14anim = null; };
  c14anim = requestAnimationFrame(step);
};
bind(['s14mu', 's14M'], () => c14(1));
$('s14run').onclick = c14run;

/* ================= C15: dấu phẩy tĩnh ================= */
let s15int = 0;
function s15fromValue() {
  const B = val('s15B'), nS = $('s15n'); nS.max = B - 1; if (+nS.value > B - 1) nS.value = B - 1;
  const n = val('s15n'), v = parseFloat($('s15v').value) || 0;
  const lo = -Math.pow(2, B - 1), hi = Math.pow(2, B - 1) - 1;
  let i = Math.round(v * Math.pow(2, n));
  if ($('s15sat').checked) i = clamp(i, lo, hi);
  else { const m = Math.pow(2, B); i = ((i - lo) % m + m) % m + lo; }
  s15int = i; s15render(v);
}
function s15render(vIn) {
  const B = val('s15B'), n = val('s15n'), m = B - 1 - n; out('s15Bo', B); out('s15no', n);
  const u = s15int < 0 ? s15int + Math.pow(2, B) : s15int;
  const bits = []; for (let k = B - 1; k >= 0; k--) bits.push(Math.floor(u / Math.pow(2, k)) % 2);
  const box = $('s15bits'); box.innerHTML = '';
  bits.forEach((b, j) => {
    const pos = B - 1 - j, wexp = pos - n;
    if (pos === n - 1 && n > 0) { const d = document.createElement('div'); d.className = 'bit point'; d.title = 'dấu phẩy nhị phân'; box.appendChild(d); }
    const d = document.createElement('div'); d.className = 'bit' + (j === 0 ? ' sign' : '');
    const wt = j === 0 ? '−2^' + (B - 1 - n) : '2^' + wexp;
    d.innerHTML = `<button type="button" class="${b ? 'on' : ''}" aria-label="bit ${pos}, trọng số ${wt}">${b}</button><small>${wt}</small>`;
    d.firstChild.onclick = () => {
      let uu = u ^ 0; const p2 = Math.pow(2, pos);
      uu = b ? uu - p2 : uu + p2;
      s15int = uu >= Math.pow(2, B - 1) ? uu - Math.pow(2, B) : uu;
      $('s15v').value = +(s15int / Math.pow(2, n)).toPrecision(10); s15render();
    };
    box.appendChild(d);
  });
  const val2 = s15int / Math.pow(2, n), v = vIn !== undefined ? vIn : val2;
  const hex = u.toString(16).toUpperCase().padStart(Math.ceil(B / 4), '0');
  const lo = -Math.pow(2, m), hi = Math.pow(2, m) - Math.pow(2, -n);
  $('s15info').textContent =
    `Định dạng Q${m}.${n} (${B} bit: 1 dấu + ${m} nguyên + ${n} phân số)\n` +
    `Dải biểu diễn: [${lo}, ${+hi.toPrecision(8)}]    Độ phân giải (1 LSB) = 2^−${n} = ${Math.pow(2, -n).toPrecision(5)}\n` +
    `Số nguyên lưu trữ: ${s15int}    Hex: 0x${hex}    Nhị phân: ${bits.join('')}\n` +
    `Giá trị = ${s15int} / 2^${n} = ${+val2.toPrecision(10)}\n` +
    `Sai số so với ${v}: ${(val2 - v).toExponential(3)}` + (Math.abs(val2 - v) > Math.pow(2, -n) ? '   ⚠ vượt dải → ' + ($('s15sat').checked ? 'đã bão hoà' : 'đã tràn quay vòng (sai hoàn toàn!)') : '');
}
s15fromValue();
bind(['s15B', 's15n', 's15v', 's15sat'], s15fromValue);

demo(function c15q() {
  const qb = val('s15qb'); out('s15qbo', qb);
  const B = butter(6, 0.06 * PI), Q = v => Math.round(v * Math.pow(2, qb)) / Math.pow(2, qb);
  const aD = B.a.map(Q);
  // nối tầng: ghép cặp cực liên hợp
  const ups = B.zPoles.filter(p => p[1] > 1e-12);
  const sos = ups.map(p => [1, Q(-2 * p[0]), Q(p[0] * p[0] + p[1] * p[1])]);
  const F = freqz(B.b, B.a, 800);
  const FD = freqz(B.b, aD, 800);
  const g1 = B.g; // tử số chung (1+z^-1)^6·g giữ chính xác
  const aC = sos.reduce((acc, s) => conv(acc, s), [1]);
  const FC = freqz(B.b, aC, 800);
  const nrm = arr => { const ref = arr[0] || 1; return arr.map(v => dB(v)); };
  const pa = new Plot($('c15a')).range(0, PI / 2, -100, 30).frame({ xt: PI / 8, xf: piF, yt: 20 });
  pa.clip();
  pa.line(F.w, nrm(F.mag), COL.muted, 2.4, [5, 4]);
  pa.line(FD.w, nrm(FD.mag), COL.a4, 1.6);
  pa.line(FC.w, nrm(FC.mag), COL.a3, 1.8);
  pa.unclip();
  const rD = polyRoots(aD), rC = sos.flatMap(s => polyRoots(s));
  const pb = new Plot($('c15b')); pb.m = { l: 36, r: 10, t: 10, b: 22 };
  pb.range(0.55, 1.15, -0.3, 0.3);
  const W = pb.w - pb.m.l - pb.m.r, H = pb.h - pb.m.t - pb.m.b, sc = Math.min(W / 0.6, H / 0.6);
  pb.range(0.85 - W / (2 * sc), 0.85 + W / (2 * sc), -H / (2 * sc), H / (2 * sc)).frame({ yAxis0: true, xt: 0.1, yt: 0.1 });
  pb.circle(0, 0, 1, COL.muted, 1.5);
  B.zPoles.forEach(p => pb.dot(p[0], p[1], COL.ink, 3.5));
  rD.forEach(p => pb.cross(p[0], p[1], COL.a4, 5, 1.8));
  rC.forEach(p => pb.plus(p[0], p[1], COL.a3, 6, 1.8));
  const mD = Math.max(...rD.map(p => Math.hypot(p[0], p[1]))), mC = Math.max(...rC.map(p => Math.hypot(p[0], p[1])));
  const amax = Math.max(...B.a.map(Math.abs));
  $('s15qinfo').innerHTML =
    `Hệ số mẫu số dạng trực tiếp: a = [${B.a.map(v => v.toFixed(4)).join(', ')}] → lớn nhất ${amax.toFixed(2)}, cần ${Math.ceil(Math.log2(amax + 1))} bit nguyên + ${qb} bit phân số = ${1 + Math.ceil(Math.log2(amax + 1)) + qb} bit.\n` +
    `Mỗi biquad chỉ có |a₁| &lt; 2, |a₂| &lt; 1 → 1 bit nguyên + ${qb} bit phân số = ${qb + 2} bit.\n` +
    `Dạng trực tiếp: |p|max = ${mD.toFixed(5)} ${mD >= 1 ? '<span class="pill bad">KHÔNG ỔN ĐỊNH</span>' : '<span class="pill good">ổn định</span>'}   ·   Biquad: |p|max = ${mC.toFixed(5)} ${mC >= 1 ? '<span class="pill bad">KHÔNG ỔN ĐỊNH</span>' : '<span class="pill good">ổn định</span>'}\n` +
    `Lý do: cực của bộ lọc băng hẹp chụm sát z = 1; nghiệm của đa thức bậc cao rất nhạy với sai số hệ số, còn mỗi biquad chỉ quyết định đúng một cặp cực. Tử số (1 + z⁻¹)⁶ có hệ số nguyên nên ở đây giữ chính xác.`;
});
bind(['s15qb'], demos[demos.length - 1]);

demo(function c15c() {
  const g = val('s15g'); out('s15go', g.toFixed(2));
  const ts = range(0, 400).map(i => i / 200), ideal = ts.map(t => g * Math.sin(TAU * t));
  const q = v => Math.round(v * 128);
  const wrap = ideal.map(v => { const i = q(v); return ((((i + 128) % 256) + 256) % 256 - 128) / 128; });
  const sat = ideal.map(v => clamp(q(v), -128, 127) / 128);
  const p = new Plot($('c15c')).range(0, 2, -Math.max(1.3, g * 1.1), Math.max(1.3, g * 1.1)).frame({ xt: 0.25 });
  p.hline(1, alpha(COL.warn, .7)); p.hline(-1, alpha(COL.warn, .7));
  p.line(ts, ideal, alpha(COL.muted, .7), 1.4, [5, 4]);
  p.line(ts, wrap, COL.bad, 1.6);
  p.line(ts, sat, COL.a3, 2.2);
});
bind(['s15g'], demos[demos.length - 1]);
