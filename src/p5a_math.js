"use strict";
/* ================= THƯ VIỆN TOÁN DSP (thuần, không DOM) ================= */
const PI = Math.PI, TAU = 2 * Math.PI;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dB = v => 20 * Math.log10(Math.max(Math.abs(v), 1e-12));
const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
const fmt = (v, d = 3) => {
  if (!isFinite(v)) return v > 0 ? '∞' : (v < 0 ? '−∞' : 'NaN');
  const s = (Math.abs(v) < 0.5 * Math.pow(10, -d) ? 0 : v).toFixed(d);
  return s.replace('-', '−');
};
const cfmt = (re, im, d = 2) => {
  const r = Math.abs(re) < 0.5 * Math.pow(10, -d) ? 0 : re, i = Math.abs(im) < 0.5 * Math.pow(10, -d) ? 0 : im;
  if (i === 0) return fmt(r, d);
  if (r === 0) return fmt(i, d) + 'j';
  return fmt(r, d) + (i < 0 ? ' − ' : ' + ') + Math.abs(i).toFixed(d) + 'j';
};
// bộ sinh số giả ngẫu nhiên có hạt giống (để đồ thị ổn định giữa các lần vẽ)
function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  const u = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  u.n = () => { let a = 0; for (let i = 0; i < 6; i++) a += u(); return (a - 3) / Math.sqrt(0.5); };
  return u;
}

// FFT radix-2 tại chỗ, decimation-in-time (đảo bit + bướm)
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -TAU / len, half = len >> 1;
    for (let i = 0; i < n; i += len) {
      for (let k = 0; k < half; k++) {
        const wr = Math.cos(ang * k), wi = Math.sin(ang * k);
        const a = i + k, b = a + half;
        const tr = re[b] * wr - im[b] * wi, ti = re[b] * wi + im[b] * wr;
        re[b] = re[a] - tr; im[b] = im[a] - ti;
        re[a] += tr; im[a] += ti;
      }
    }
  }
}
function dft(x, xi) {
  const N = x.length, re = new Array(N).fill(0), im = new Array(N).fill(0);
  for (let k = 0; k < N; k++) for (let n = 0; n < N; n++) {
    const a = -TAU * k * n / N, c = Math.cos(a), s = Math.sin(a), xr = x[n], xim = xi ? xi[n] : 0;
    re[k] += xr * c - xim * s; im[k] += xr * s + xim * c;
  }
  return { re, im };
}
// phổ biên độ thực, độ dài nfft (lũy thừa 2) có zero-padding
function magSpec(x, nfft) {
  const re = new Float64Array(nfft), im = new Float64Array(nfft);
  for (let i = 0; i < Math.min(x.length, nfft); i++) re[i] = x[i];
  fft(re, im);
  const m = new Float64Array(nfft / 2 + 1);
  for (let k = 0; k <= nfft / 2; k++) m[k] = Math.hypot(re[k], im[k]);
  return m;
}
function conv(x, h) {
  const y = new Array(x.length + h.length - 1).fill(0);
  for (let i = 0; i < x.length; i++) for (let j = 0; j < h.length; j++) y[i + j] += x[i] * h[j];
  return y;
}
// đáp ứng tần số H(e^jw) = B(e^jw)/A(e^jw), w ∈ [0, π]
function freqz(b, a = [1], n = 512) {
  const w = [], mag = [], ph = [], re = [], im = [];
  for (let i = 0; i <= n; i++) {
    const om = PI * i / n;
    let br = 0, bi = 0, ar = 0, ai = 0;
    for (let k = 0; k < b.length; k++) { br += b[k] * Math.cos(om * k); bi -= b[k] * Math.sin(om * k); }
    for (let k = 0; k < a.length; k++) { ar += a[k] * Math.cos(om * k); ai -= a[k] * Math.sin(om * k); }
    const den = ar * ar + ai * ai || 1e-30;
    const hr = (br * ar + bi * ai) / den, hi = (bi * ar - br * ai) / den;
    w.push(om); re.push(hr); im.push(hi); mag.push(Math.hypot(hr, hi)); ph.push(Math.atan2(hi, hr));
  }
  return { w, mag, ph, re, im };
}
function H_at(b, a, om) {
  let br = 0, bi = 0, ar = 0, ai = 0;
  for (let k = 0; k < b.length; k++) { br += b[k] * Math.cos(om * k); bi -= b[k] * Math.sin(om * k); }
  for (let k = 0; k < a.length; k++) { ar += a[k] * Math.cos(om * k); ai -= a[k] * Math.sin(om * k); }
  const den = ar * ar + ai * ai || 1e-30;
  return [(br * ar + bi * ai) / den, (bi * ar - br * ai) / den];
}
// lọc theo phương trình sai phân, a[0] = 1
function filt(b, a, x) {
  const y = new Float64Array(x.length);
  for (let n = 0; n < x.length; n++) {
    let acc = 0;
    for (let k = 0; k < b.length; k++) if (n - k >= 0) acc += b[k] * x[n - k];
    for (let k = 1; k < a.length; k++) if (n - k >= 0) acc -= a[k] * y[n - k];
    y[n] = acc;
  }
  return y;
}
function besselI0(x) {
  let s = 1, t = 1;
  for (let k = 1; k < 50; k++) { t *= (x / (2 * k)) * (x / (2 * k)); s += t; if (t < 1e-12 * s) break; }
  return s;
}
function windowFn(name, N, beta = 6) {
  const w = new Array(N);
  for (let n = 0; n < N; n++) {
    const r = N > 1 ? n / (N - 1) : 0.5;
    switch (name) {
      case 'hann': w[n] = 0.5 - 0.5 * Math.cos(TAU * r); break;
      case 'hamming': w[n] = 0.54 - 0.46 * Math.cos(TAU * r); break;
      case 'blackman': w[n] = 0.42 - 0.5 * Math.cos(TAU * r) + 0.08 * Math.cos(2 * TAU * r); break;
      case 'kaiser': { const t = 2 * r - 1; w[n] = besselI0(beta * Math.sqrt(Math.max(0, 1 - t * t))) / besselI0(beta); break; }
      default: w[n] = 1;
    }
  }
  return w;
}
// thông thấp lý tưởng dịch alpha: sin(wc (n-α)) / (π (n-α))
function idealLP(N, wc) {
  const al = (N - 1) / 2, h = new Array(N);
  for (let n = 0; n < N; n++) { const m = n - al; h[n] = Math.abs(m) < 1e-9 ? wc / PI : Math.sin(wc * m) / (PI * m); }
  return h;
}
function firIdeal(N, type, wc, bw) {
  const al = (N - 1) / 2;
  if (type === 'hp') { const lp = idealLP(N, wc); return lp.map((v, n) => (Math.abs(n - al) < 1e-9 ? 1 : 0) - v); }
  if (type === 'bp') {
    const w1 = clamp(wc - bw / 2, 0.001, PI), w2 = clamp(wc + bw / 2, 0, PI - 0.001);
    const a = idealLP(N, w2), b = idealLP(N, w1); return a.map((v, i) => v - b[i]);
  }
  return idealLP(N, wc);
}
function firDesign(N, type, wc, bw, win) {
  const hd = firIdeal(N, type, wc, bw), w = windowFn(win, N);
  return { hd, w, h: hd.map((v, i) => v * w[i]) };
}
// nhân đa thức theo z^-1 từ danh sách nghiệm phức [re, im]: Π(1 - r z^-1)
function polyFromRoots(roots) {
  let pr = [1], pi = [0];
  for (const [rr, ri] of roots) {
    const nr = new Array(pr.length + 1).fill(0), ni = new Array(pr.length + 1).fill(0);
    for (let i = 0; i < pr.length; i++) {
      nr[i] += pr[i]; ni[i] += pi[i];
      nr[i + 1] -= pr[i] * rr - pi[i] * ri;
      ni[i + 1] -= pr[i] * ri + pi[i] * rr;
    }
    pr = nr; pi = ni;
  }
  return pr;
}
// nghiệm đa thức a[0] z^N + a[1] z^{N-1} + ... (tức 1 + a1 z^-1 + ...) bằng Durand–Kerner
function polyRoots(a) {
  const N = a.length - 1; if (N < 1) return [];
  const c = a.map(v => v / a[0]);
  let zr = [], zi = [];
  for (let i = 0; i < N; i++) { const ang = TAU * i / N + 0.4; zr.push(0.9 * Math.cos(ang)); zi.push(0.9 * Math.sin(ang)); }
  for (let it = 0; it < 500; it++) {
    let delta = 0;
    for (let i = 0; i < N; i++) {
      // p(z) bằng Horner
      let pr = 1, pi = 0;
      for (let k = 1; k <= N; k++) { const t = pr * zr[i] - pi * zi[i] + c[k]; pi = pr * zi[i] + pi * zr[i]; pr = t; }
      let dr = 1, di = 0;
      for (let j = 0; j < N; j++) if (j !== i) { const xr = zr[i] - zr[j], xi = zi[i] - zi[j]; const t = dr * xr - di * xi; di = dr * xi + di * xr; dr = t; }
      const den = dr * dr + di * di || 1e-30;
      const qr = (pr * dr + pi * di) / den, qi = (pi * dr - pr * di) / den;
      zr[i] -= qr; zi[i] -= qi; delta = Math.max(delta, Math.hypot(qr, qi));
    }
    if (delta < 1e-13) break;
  }
  return zr.map((r, i) => [r, zi[i]]);
}
// Butterworth thông thấp bậc N, tần số cắt số wc (rad/mẫu), biến đổi song tuyến với T = 2
function butter(N, wc) {
  const Wc = Math.tan(wc / 2);
  const sP = [], zP = [];
  for (let k = 1; k <= N; k++) {
    const th = PI * (2 * k + N - 1) / (2 * N);
    const pr = Wc * Math.cos(th), pi = Wc * Math.sin(th);
    sP.push([pr, pi]);
    // z = (1 + s) / (1 - s)
    const nr = 1 + pr, ni = pi, dr = 1 - pr, di = -pi, den = dr * dr + di * di;
    zP.push([(nr * dr + ni * di) / den, (ni * dr - nr * di) / den]);
  }
  const a = polyFromRoots(zP);
  const b0 = polyFromRoots(new Array(N).fill([-1, 0]));
  const g = a.reduce((s, v) => s + v, 0) / b0.reduce((s, v) => s + v, 0);
  return { b: b0.map(v => v * g), a, g, Wc, sPoles: sP, zPoles: zP };
}
// LMS: x tham chiếu, d mong muốn
function lms(x, d, M, mu) {
  const L = x.length, w = new Float64Array(M), e = new Float64Array(L), y = new Float64Array(L);
  let diverged = false;
  for (let n = 0; n < L; n++) {
    let acc = 0;
    for (let k = 0; k < M; k++) if (n - k >= 0) acc += w[k] * x[n - k];
    y[n] = acc; e[n] = d[n] - acc;
    if (!isFinite(e[n]) || Math.abs(e[n]) > 1e6) { diverged = true; for (let m = n; m < L; m++) e[m] = NaN; break; }
    for (let k = 0; k < M; k++) if (n - k >= 0) w[k] += mu * e[n] * x[n - k];
  }
  return { w, e, y, diverged };
}
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }
