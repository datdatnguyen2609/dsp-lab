
/* ================= MINI-MATLAB: trình thông dịch tập con MATLAB chạy trong trình duyệt ================= */
const MLAB = (() => {
  class MErr extends Error { constructor(m, line) { super(m); this.line = line; } }
  const err = m => { throw new MErr(m); };
  class BreakSig { } class ContSig { } class RetSig { }

  /* ---------- kiểu giá trị ---------- */
  class Mat {
    constructor(r, c, re, im) { this.r = r; this.c = c; this.re = re || new Float64Array(r * c); this.im = im || null; this.lg = false; }
    get n() { return this.r * this.c; }
  }
  class Str { constructor(s) { this.s = s; } }
  class Cell { constructor(v, r, c) { this.v = v; this.r = r !== undefined ? r : (v.length ? 1 : 0); this.c = c !== undefined ? c : v.length; } get n() { return this.v.length; } }
  class Struct { constructor(r, c, el) { this.r = r; this.c = c; this.el = el; } get n() { return this.el.length; } }
  class CSL { constructor(v) { this.v = v; } }   // danh sách giá trị tách rời: c{:}, s.ten của mảng struct
  class Obj { constructor(C, p) { this.C = C; this.p = p; } }   // đối tượng của lớp classdef (C: thông tin lớp, p: thuộc tính)
  class OArr { constructor(C, r, c, el) { this.C = C; this.r = r; this.c = c; this.el = el; } get n() { return this.el.length; } }   // mảng đối tượng
  const isA = (C, name) => { for (let c = C; c; c = c.sup) if (c.name === name) return true; return name === 'handle' && C.isHandle; };
  class Fun { constructor(params, body, env, src) { Object.assign(this, { params, body, env, src }); } }
  class FH { constructor(name) { this.name = name; } }
  const COLON = { colon: true };
  const S = v => new Mat(1, 1, Float64Array.of(v));
  const CX = (re, im) => clean(new Mat(1, 1, Float64Array.of(re), Float64Array.of(im)));
  const rowv = a => new Mat(1, a.length, Float64Array.from(a));
  const colv = a => new Mat(a.length, 1, Float64Array.from(a));
  const EMPTY = () => new Mat(0, 0);
  const B = v => { const m = S(v ? 1 : 0); m.lg = true; return m; };
  function clean(m) { if (m.im) { let z = true; for (let k = 0; k < m.im.length; k++) if (m.im[k] !== 0) { z = false; break; } if (z) m.im = null; } return m; }
  function cloneV(v) {
    if (v instanceof Mat) { const m = new Mat(v.r, v.c, Float64Array.from(v.re), v.im ? Float64Array.from(v.im) : null); m.lg = v.lg; if (v.dims) m.dims = v.dims.slice(); return m; }
    if (v instanceof Cell) return new Cell(v.v.map(cloneV), v.r, v.c);
    if (v instanceof Struct) return new Struct(v.r, v.c, v.el.map(mp => new Map([...mp].map(([k, x]) => [k, cloneV(x)]))));
    if (v instanceof Obj) { if (v.C.isHandle || v.enumName) return v; const o = new Obj(v.C, new Map([...v.p].map(([k, x]) => [k, cloneV(x)]))); return o; }   // handle/enum: dùng chung
    if (v instanceof OArr) return new OArr(v.C, v.r, v.c, v.el.map(cloneV));
    return v;
  }
  /* mảng nhiều chiều: Mat lưu như ma trận r × (tích các chiều còn lại), kèm trường dims */
  const prod = a => a.reduce((s, v) => s * v, 1);
  const dimsOf = m => m.dims ? m.dims.slice() : [m.r, m.c];
  function normDims(d) { d = d.map(v => Math.max(0, v)); while (d.length > 2 && d[d.length - 1] === 1) d.pop(); while (d.length < 2) d.push(1); return d; }
  function mkND(d, re, im) { d = normDims(d); const m = new Mat(d[0], prod(d.slice(1)), re, im); if (d.length > 2) m.dims = d; return m; }
  function withDims(m, d) { const o = cloneV(m); delete o.dims; const nd = normDims(d); o.r = nd[0]; o.c = prod(nd.slice(1)); if (nd.length > 2) o.dims = nd; return o; }
  const keepDims = (a, o) => { if (a.dims) o.dims = a.dims.slice(); return o; };
  const vshape = v => v instanceof Mat ? dimsOf(v) : v instanceof Str ? [v.s.length ? 1 : 0, v.s.length] : (v instanceof Cell || v instanceof Struct || v instanceof OArr) ? [v.r, v.c] : [1, 1];
  const typeName = v => (v instanceof Obj || v instanceof OArr) ? v.C.name : v instanceof Str ? 'char' : v instanceof Cell ? 'cell' : v instanceof Struct ? 'struct' : (v instanceof Fun || v instanceof FH) ? 'function_handle' : (v instanceof Mat && v.lg) ? 'logical' : 'double';
  function asM(v) {
    if (v instanceof Mat) return v;
    if (v instanceof Str) { const m = new Mat(v.s.length ? 1 : 0, v.s.length); for (let k = 0; k < v.s.length; k++) m.re[k] = v.s.charCodeAt(k); return m; }
    if (typeof v === 'number') return S(v);
    if (v instanceof Fun || v instanceof FH) err('Không dùng được hàm như một số. Bạn có quên gọi hàm với đối số không?');
    if (v instanceof Cell) err('Không thể tính toán trực tiếp trên cell array; dùng c{k} để lấy phần tử.');
    if (v instanceof Struct) err('Không thể tính toán trên struct; lấy trường bằng s.ten');
    if (v instanceof Obj || v instanceof OArr) err(`Không tính toán trực tiếp được trên đối tượng lớp ${v.C.name}; dùng thuộc tính obj.ten`);
    if (v instanceof CSL) { if (!v.v.length) err('Danh sách giá trị rỗng'); return asM(v.v[0]); }
    if (v === COLON) err("Dấu ':' đứng một mình chỉ dùng được trong chỉ số, ví dụ x(:)");
    err('Giá trị không hợp lệ');
  }
  const num = (v, what) => { const m = asM(v); if (!m.n) err(`${what || 'Đối số'} đang rỗng`); return m.re[0]; };
  const isStr = v => v instanceof Str;
  const str = (v, what) => { if (v instanceof Str) return v.s; err(`${what || 'Đối số'} phải là chuỗi ký tự '...'`); };
  const truthy = v => { const m = asM(v); if (!m.n) return false; for (let k = 0; k < m.n; k++) if (m.re[k] === 0 && !(m.im && m.im[k] !== 0)) return false; return true; };
  const isVec = m => m.r === 1 || m.c === 1;
  const like = (src, arr, im) => { const m = (src.r === 1 || src.n === 0) ? new Mat(1, arr.length, Float64Array.from(arr)) : new Mat(arr.length, 1, Float64Array.from(arr)); if (im) m.im = Float64Array.from(im); return clean(m); };
  const same = (src, fill) => new Mat(src.r, src.c);

  /* ---------- số phức ---------- */
  const cmul = (a, b, c, d) => [a * c - b * d, a * d + b * c];
  const cdiv = (a, b, c, d) => { const q = c * c + d * d; return [(a * c + b * d) / q, (b * c - a * d) / q]; };
  const cexp = (a, b) => { const e = Math.exp(a); return [e * Math.cos(b), e * Math.sin(b)]; };
  const clog = (a, b) => [Math.log(Math.hypot(a, b)), Math.atan2(b, a)];
  const cpow = (a, b, c, d) => {
    if (a === 0 && b === 0) return (c === 0 && d === 0) ? [1, 0] : [0, 0];
    if (d === 0 && b === 0 && Number.isInteger(c) && Math.abs(c) <= 64) { // luỹ thừa nguyên chính xác
      let r = [1, 0], base = [a, b], e = Math.abs(c);
      while (e) { if (e & 1) r = cmul(r[0], r[1], base[0], base[1]); base = cmul(base[0], base[1], base[0], base[1]); e >>= 1; }
      return c < 0 ? cdiv(1, 0, r[0], r[1]) : r;
    }
    const [lr, li] = clog(a, b); const [x, y] = cmul(lr, li, c, d); return cexp(x, y);
  };

  /* ---------- phép toán từng phần tử có mở rộng ngầm (implicit expansion) ---------- */
  function bshape(a, b) {
    const r = a.r === b.r ? a.r : a.r === 1 ? b.r : b.r === 1 ? a.r : -1;
    const c = a.c === b.c ? a.c : a.c === 1 ? b.c : b.c === 1 ? a.c : -1;
    if (r < 0 || c < 0) err(`Kích thước không khớp: ${a.r}×${a.c} và ${b.r}×${b.c}. Gợi ý: kiểm tra vector hàng/cột (dùng ' hoặc (:)), hoặc dùng .* ./ .^ cho phép tính từng phần tử.`);
    return [r, c];
  }
  function ewND(a, b, fr, fc, forceC) {
    const da = dimsOf(a), db = dimsOf(b), L = Math.max(da.length, db.length);
    while (da.length < L) da.push(1); while (db.length < L) db.push(1);
    const d = da.map((x, k) => { const y = db[k]; if (x === y || y === 1) return x; if (x === 1) return y; err(`Kích thước không khớp: ${da.join('×')} và ${db.join('×')}`); });
    const N = prod(d), o = mkND(d), useC = !!(a.im || b.im || forceC); if (useC) o.im = new Float64Array(N);
    const sa = [], sb = []; let ta = 1, tb = 1;
    for (let k = 0; k < L; k++) { sa.push(da[k] === 1 ? 0 : ta); sb.push(db[k] === 1 ? 0 : tb); ta *= da[k]; tb *= db[k]; }
    const sub = new Array(L).fill(0);
    for (let q = 0; q < N; q++) {
      let ia = 0, ib = 0; for (let k = 0; k < L; k++) { ia += sub[k] * sa[k]; ib += sub[k] * sb[k]; }
      if (useC) { const z = fc(a.re[ia], a.im ? a.im[ia] : 0, b.re[ib], b.im ? b.im[ib] : 0); o.re[q] = z[0]; o.im[q] = z[1]; } else o.re[q] = fr(a.re[ia], b.re[ib]);
      for (let k = 0; k < L; k++) { if (++sub[k] < d[k]) break; sub[k] = 0; }
    }
    return clean(o);
  }
  function ew(a, b, fr, fc, forceC) {
    a = asM(a); b = asM(b);
    if (a.dims || b.dims) return ewND(a, b, fr, fc, forceC);
    const [r, c] = bshape(a, b), o = new Mat(r, c);
    const useC = !!(a.im || b.im || forceC);
    if (useC) o.im = new Float64Array(r * c);
    for (let j = 0; j < c; j++) for (let i = 0; i < r; i++) {
      const ia = (a.r === 1 ? 0 : i) + (a.c === 1 ? 0 : j) * a.r, ib = (b.r === 1 ? 0 : i) + (b.c === 1 ? 0 : j) * b.r, k = i + j * r;
      if (useC) { const z = fc(a.re[ia], a.im ? a.im[ia] : 0, b.re[ib], b.im ? b.im[ib] : 0); o.re[k] = z[0]; o.im[k] = z[1]; }
      else o.re[k] = fr(a.re[ia], b.re[ib]);
    }
    return clean(o);
  }
  function map(a, fr, fc) {
    a = asM(a); const o = keepDims(a, new Mat(a.r, a.c));
    if (a.im && fc) { o.im = new Float64Array(a.n); for (let k = 0; k < a.n; k++) { const z = fc(a.re[k], a.im[k]); o.re[k] = z[0]; o.im[k] = z[1]; } return clean(o); }
    for (let k = 0; k < a.n; k++) o.re[k] = fr(a.re[k]);
    return o;
  }
  // map có thể sinh số phức từ đầu vào thực (sqrt, log của số âm)
  function mapC(a, needC, fr, fc) {
    a = asM(a); let anyC = !!a.im;
    if (!anyC) for (let k = 0; k < a.n; k++) if (needC(a.re[k])) { anyC = true; break; }
    if (!anyC) return map(a, fr);
    const o = keepDims(a, new Mat(a.r, a.c)); o.im = new Float64Array(a.n);
    for (let k = 0; k < a.n; k++) { const z = fc(a.re[k], a.im ? a.im[k] : 0); o.re[k] = z[0]; o.im[k] = z[1]; }
    return clean(o);
  }
  const plus = (a, b) => ew(a, b, (x, y) => x + y, (a1, b1, c1, d1) => [a1 + c1, b1 + d1]);
  const minus = (a, b) => ew(a, b, (x, y) => x - y, (a1, b1, c1, d1) => [a1 - c1, b1 - d1]);
  const times = (a, b) => ew(a, b, (x, y) => x * y, cmul);
  const rdiv = (a, b) => ew(a, b, (x, y) => x / y, cdiv);
  function power(a, b) {
    a = asM(a); b = asM(b); let need = false;
    if (!a.im && !b.im) {
      const [r, c] = bshape(a, b);
      for (let j = 0; j < c && !need; j++) for (let i = 0; i < r; i++) {
        const x = a.re[(a.r === 1 ? 0 : i) + (a.c === 1 ? 0 : j) * a.r], y = b.re[(b.r === 1 ? 0 : i) + (b.c === 1 ? 0 : j) * b.r];
        if (x < 0 && !Number.isInteger(y)) { need = true; break; }
      }
    }
    return ew(a, b, Math.pow, cpow, need);
  }
  const cmpOp = f => (a, b) => { const o = ew(a, b, (x, y) => f(x, y) ? 1 : 0, (p, q, r, s) => [f(p, r) ? 1 : 0, 0]); o.im = null; o.lg = true; return o; };
  const eqOp = neg => (a, b) => {
    if (a instanceof Obj || b instanceof Obj || a instanceof OArr || b instanceof OArr) {   // so sánh đối tượng: cùng một thực thể (handle, enumeration)
      if (a instanceof OArr || b instanceof OArr) { const A = a instanceof OArr ? a : null, Bv = b instanceof OArr ? b : null, L = A || Bv, o = new Mat(L.r, L.c); o.lg = true; L.el.forEach((x, k) => { const y = A && Bv ? Bv.el[k] : (A ? b : a); o.re[k] = ((x === y) !== neg) ? 1 : 0; }); return o; }
      return B((a === b) !== neg);
    }
    const o = ew(a, b, (x, y) => ((x === y) !== neg) ? 1 : 0, (p, q, r, s) => [(((p === r) && (q === s)) !== neg) ? 1 : 0, 0]); o.im = null; o.lg = true; return o; };
  const OPS = {
    '+': plus, '-': minus, '.*': times, './': rdiv, '.\\': (a, b) => rdiv(b, a), '.^': power,
    '<': cmpOp((x, y) => x < y), '<=': cmpOp((x, y) => x <= y), '>': cmpOp((x, y) => x > y), '>=': cmpOp((x, y) => x >= y),
    '==': eqOp(false), '~=': eqOp(true),
    '&': (a, b) => { const o = ew(a, b, (x, y) => (x !== 0 && y !== 0) ? 1 : 0); o.lg = true; return o; },
    '|': (a, b) => { const o = ew(a, b, (x, y) => (x !== 0 || y !== 0) ? 1 : 0); o.lg = true; return o; },
    '*': mtimes, '/': mrdiv, '\\': (a, b) => { a = asM(a); if (a.n === 1) return rdiv(b, a); err('Phép chia trái A\\b cho ma trận chưa được hỗ trợ.'); }, '^': mpower
  };
  function mtimes(a, b) {
    a = asM(a); b = asM(b);
    if (a.n === 1 || b.n === 1) return times(a, b);
    if (a.dims || b.dims) err('Phép * chỉ dùng cho ma trận 2 chiều; dùng .* để nhân từng phần tử');
    if (a.c !== b.r) err(`Nhân ma trận cần số cột vế trái (${a.c}) = số hàng vế phải (${b.r}). Muốn nhân từng phần tử hãy dùng .*`);
    const o = new Mat(a.r, b.c), C = a.im || b.im; if (C) o.im = new Float64Array(a.r * b.c);
    for (let i = 0; i < a.r; i++) for (let j = 0; j < b.c; j++) {
      let sr = 0, si = 0;
      for (let k = 0; k < a.c; k++) {
        const ar = a.re[i + k * a.r], ai = a.im ? a.im[i + k * a.r] : 0, br = b.re[k + j * b.r], bi = b.im ? b.im[k + j * b.r] : 0;
        sr += ar * br - ai * bi; si += ar * bi + ai * br;
      }
      o.re[i + j * a.r] = sr; if (C) o.im[i + j * a.r] = si;
    }
    return clean(o);
  }
  function mrdiv(a, b) { b = asM(b); if (b.n === 1) return rdiv(a, b); err('Phép chia ma trận A/B chưa được hỗ trợ; muốn chia từng phần tử hãy dùng ./'); }
  function mpower(a, b) {
    a = asM(a); b = asM(b);
    if (a.n === 1 && b.n === 1) return power(a, b);
    if (a.r === a.c && b.n === 1 && Number.isInteger(b.re[0]) && b.re[0] >= 1) { let r = a; for (let k = 1; k < b.re[0]; k++) r = mtimes(r, a); return r; }
    err('Phép ^ trên vector là luỹ thừa ma trận. Muốn luỹ thừa từng phần tử hãy dùng .^');
  }
  function transpose(a, conj) {
    if (a instanceof Str) return a.s.length <= 1 ? a : err('Chuyển vị chuỗi chưa được hỗ trợ');
    if (a instanceof Cell || a instanceof Struct || a instanceof OArr) {
      const src = a instanceof Struct ? a.el : a.v || a.el, v = new Array(src.length);
      for (let i = 0; i < a.r; i++) for (let j = 0; j < a.c; j++) v[j + i * a.c] = src[i + j * a.r];
      return a instanceof Cell ? new Cell(v, a.c, a.r) : a instanceof Struct ? new Struct(a.c, a.r, v) : new OArr(a.C, a.c, a.r, v);
    }
    a = asM(a); if (a.dims) err("Chuyển vị chỉ dùng cho ma trận 2 chiều; với mảng nhiều chiều dùng permute(A, [2 1 3])");
    const o = new Mat(a.c, a.r); if (a.im) o.im = new Float64Array(a.n);
    for (let i = 0; i < a.r; i++) for (let j = 0; j < a.c; j++) { o.re[j + i * a.c] = a.re[i + j * a.r]; if (a.im) o.im[j + i * a.c] = conj ? -a.im[i + j * a.r] : a.im[i + j * a.r]; }
    o.lg = a.lg; return o;
  }
  function colonRange(a, s, b) {
    a = num(a, 'Đầu dải'); b = num(b, 'Cuối dải'); s = s === undefined ? 1 : num(s, 'Bước');
    if (s === 0 || (s > 0 && a > b) || (s < 0 && a < b)) return new Mat(1, 0);
    const n = Math.floor((b - a) / s + 1e-10) + 1;
    if (n > 5e6) err('Dải số quá lớn (> 5 triệu phần tử)');
    const o = new Mat(1, n); for (let k = 0; k < n; k++) o.re[k] = a + k * s; return o;
  }
  function objCat(list, row) {
    const parts = list.filter(v => !(v instanceof Mat && v.n === 0));
    if (!parts.every(v => v instanceof Obj || v instanceof OArr)) err('Chỉ ghép được đối tượng với đối tượng');
    const el = parts.flatMap(v => v instanceof OArr ? v.el : [v]), C = el[0].C;
    if (el.some(o => !isA(o.C, C.name) && !isA(C, o.C.name))) err('Các đối tượng trong một mảng phải cùng lớp');
    return el.length === 1 ? el[0] : new OArr(C, row ? 1 : el.length, row ? el.length : 1, el);
  }
  function horz(list) {
    if (list.some(isStr)) {
      return new Str(list.map(v => v instanceof Str ? v.s : String.fromCharCode(...Array.from(asM(v).re))).join(''));
    }
    if (list.some(v => v instanceof Cell)) return new Cell(list.flatMap(v => v instanceof Cell ? v.v : [v]));
    if (list.some(v => v instanceof Struct)) { if (!list.every(v => v instanceof Struct || (v instanceof Mat && v.n === 0))) err('Chỉ ghép được struct với struct'); const el = list.filter(v => v instanceof Struct).flatMap(v => v.el); return new Struct(1, el.length, el); }
    if (list.some(v => v instanceof Obj || v instanceof OArr)) return objCat(list, true);
    if (list.some(v => v instanceof Mat && v.dims)) err('Ghép mảng nhiều chiều bằng [ ] chưa hỗ trợ; dùng cat(dim, A, B)');
    const ms = list.map(asM).filter(m => m.n > 0 || m.r > 0 && m.c > 0);
    const ne = ms.filter(m => m.n > 0); if (!ne.length) return ms.length ? ms[0] : EMPTY();
    const r = ne[0].r; for (const m of ne) if (m.r !== r) err(`Ghép ngang [a, b] cần cùng số hàng (${r} và ${m.r}).`);
    const c = ne.reduce((s, m) => s + m.c, 0), o = new Mat(r, c), C = ne.some(m => m.im); if (C) o.im = new Float64Array(r * c);
    let off = 0; for (const m of ne) { o.re.set(m.re, off); if (C && m.im) o.im.set(m.im, off); off += m.n; }
    o.lg = ne.every(m => m.lg); return o;
  }
  function vert(list) {
    if (list.length === 1) return list[0];
    if (list.some(isStr)) { if (list.every(isStr)) return new Str(list.map(v => v.s).join('\n')); err('Không ghép dọc chuỗi với số được'); }
    if (list.some(v => v instanceof Cell)) { const cs = list.filter(v => v instanceof Cell && v.n); if (!cs.length) return new Cell([], 0, 0); const c = cs[0].c; if (cs.some(x => x.c !== c)) err('Ghép dọc cell cần cùng số cột'); const r = cs.reduce((s, x) => s + x.r, 0), v = new Array(r * c); let ro = 0; for (const x of cs) { for (let j = 0; j < c; j++) for (let i = 0; i < x.r; i++) v[ro + i + j * r] = x.v[i + j * x.r]; ro += x.r; } return new Cell(v, r, c); }
    if (list.some(v => v instanceof Struct)) { const el = list.filter(v => v instanceof Struct).flatMap(v => v.el); return new Struct(el.length, 1, el); }
    if (list.some(v => v instanceof Obj || v instanceof OArr)) return objCat(list, false);
    if (list.some(v => v instanceof Mat && v.dims)) err('Ghép mảng nhiều chiều bằng [ ; ] chưa hỗ trợ; dùng cat(dim, A, B)');
    const ne = list.map(asM).filter(m => m.n > 0); if (!ne.length) return EMPTY();
    const c = ne[0].c; for (const m of ne) if (m.c !== c) err(`Ghép dọc [a; b] cần cùng số cột (${c} và ${m.c}).`);
    const r = ne.reduce((s, m) => s + m.r, 0), o = new Mat(r, c), C = ne.some(m => m.im); if (C) o.im = new Float64Array(r * c);
    let roff = 0;
    for (const m of ne) { for (let j = 0; j < c; j++) for (let i = 0; i < m.r; i++) { o.re[roff + i + j * r] = m.re[i + j * m.r]; if (C && m.im) o.im[roff + i + j * r] = m.im[i + j * m.r]; } roff += m.r; }
    return o;
  }

  /* ---------- chỉ số (đánh từ 1!) ---------- */
  function idxList(v, len) {
    if (v === COLON) { const a = new Array(len); for (let k = 0; k < len; k++) a[k] = k; return a; }
    const m = asM(v), out = [];
    if (m.lg) { for (let k = 0; k < m.n; k++) if (m.re[k] !== 0) { if (k >= len) err(`Chỉ số logic dài hơn mảng (${m.n} > ${len})`); out.push(k); } return out; }
    for (let k = 0; k < m.n; k++) {
      const x = m.re[k];
      if (!Number.isInteger(x) || x < 1) err(x === 0 ? 'Chỉ số 0 không hợp lệ: MATLAB đánh chỉ số từ 1, phần tử đầu tiên là x(1).' : `Chỉ số phải là số nguyên dương (đang là ${+x.toFixed(4)}).`);
      out.push(x - 1);
    }
    return out;
  }
  function getIndex(v, args) {
    if (v instanceof Str) { const r = getIndex(asM(v), args); return new Str(String.fromCharCode(...Array.from(r.re))); }
    if (v instanceof Obj) v = new OArr(v.C, 1, 1, [v]);
    if (v instanceof OArr) {
      if (!args.length) return v.n === 1 ? v.el[0] : v;
      const ks = linIdx(v, args, false);
      if (ks.length === 1) return v.el[ks[0]];
      return new OArr(v.C, v.c === 1 && v.r > 1 ? ks.length : 1, v.c === 1 && v.r > 1 ? 1 : ks.length, ks.map(k => v.el[k]));
    }
    if (v instanceof Cell || v instanceof Struct) {
      if (!args.length) return v;
      const arr = v instanceof Cell ? v.v : v.el, ks = linIdx(v, args, false);
      let r, c;
      if (args.length === 2) { r = idxList(args[0], v.r).length; c = idxList(args[1], v.c).length; }
      else if (args[0] === COLON) { r = ks.length; c = 1; }
      else if (v.c === 1 && v.r > 1) { r = ks.length; c = 1; } else { r = ks.length ? 1 : 0; c = ks.length; }
      return v instanceof Cell ? new Cell(ks.map(k => arr[k]), r, c) : new Struct(r, c, ks.map(k => arr[k]));
    }
    const m = asM(v);
    if (args.length === 0) return m;
    if (args.length >= 3 || (m.dims && args.length === 2)) return getND(m, args);
    if (args.length === 1) {
      const ii = idxList(args[0], m.n);
      for (const k of ii) if (k >= m.n) err(`Chỉ số vượt quá kích thước: truy cập phần tử ${k + 1} nhưng mảng chỉ có ${m.n} phần tử.`);
      let r, c;
      if (args[0] === COLON) { r = ii.length; c = 1; }
      else {
        const im = asM(args[0]);
        if (m.r === 1 && (isVec(im) || im.lg)) { r = 1; c = ii.length; }
        else if (m.c === 1 && (isVec(im) || im.lg)) { r = ii.length; c = 1; }
        else if (im.lg) { r = ii.length; c = 1; }
        else { r = im.r; c = im.c; }
      }
      const o = new Mat(r, c); if (m.im) o.im = new Float64Array(r * c);
      ii.forEach((k, t) => { o.re[t] = m.re[k]; if (m.im) o.im[t] = m.im[k]; });
      o.lg = m.lg; return clean(o);
    }
    if (args.length === 2) {
      const ri = idxList(args[0], m.r), ci = idxList(args[1], m.c);
      for (const k of ri) if (k >= m.r) err(`Chỉ số hàng ${k + 1} vượt quá số hàng (${m.r}).`);
      for (const k of ci) if (k >= m.c) err(`Chỉ số cột ${k + 1} vượt quá số cột (${m.c}).`);
      const o = new Mat(ri.length, ci.length); if (m.im) o.im = new Float64Array(o.n);
      ci.forEach((cj, j) => ri.forEach((rk, i) => { o.re[i + j * o.r] = m.re[rk + cj * m.r]; if (m.im) o.im[i + j * o.r] = m.im[rk + cj * m.r]; }));
      o.lg = m.lg; return clean(o);
    }
    err('Chỉ hỗ trợ tối đa 2 chiều chỉ số (hàng, cột).');
  }
  /* chỉ số tuyến tính cho cell / mảng struct (2 chiều) */
  function linIdx(v, args, allowGrow) {
    if (args.length === 1) { const ks = idxList(args[0], v.n); if (!allowGrow) for (const k of ks) if (k >= v.n) err(`Chỉ số ${k + 1} vượt quá số phần tử (${v.n})`); return ks; }
    if (args.length === 2) {
      const ri = idxList(args[0], v.r), ci = idxList(args[1], v.c), out = [];
      for (const cj of ci) for (const rk of ri) { if (!allowGrow && (rk >= v.r || cj >= v.c)) err(`Chỉ số (${rk + 1}, ${cj + 1}) vượt quá kích thước ${v.r}×${v.c}`); out.push(rk + cj * v.r); }
      return out;
    }
    err('Cell và mảng struct chỉ hỗ trợ tối đa 2 chỉ số');
  }
  function cellAssign(c, args, vals) {
    let r = c.r, cc = c.c, ks;
    if (args.length === 1) {
      ks = idxList(args[0], c.n); const mx = Math.max(-1, ...ks);
      if (mx >= c.n) { if (c.n === 0 || c.r === 1) { r = 1; cc = mx + 1; } else if (c.c === 1) { r = mx + 1; cc = 1; } else err('Không mở rộng được cell 2 chiều bằng một chỉ số'); }
    } else if (args.length === 2) {
      const ri = idxList(args[0], c.r), ci = idxList(args[1], c.c);
      r = Math.max(c.r, ...ri.map(q => q + 1)); cc = Math.max(c.c, ...ci.map(q => q + 1));
      ks = []; for (const cj of ci) for (const rk of ri) ks.push(rk + cj * r);
    } else err('Cell chỉ hỗ trợ tối đa 2 chỉ số');
    let v = c.v.slice();
    if (r !== c.r || cc !== c.c) { v = new Array(r * cc); for (let q = 0; q < v.length; q++) v[q] = EMPTY(); for (let j = 0; j < c.c; j++) for (let i = 0; i < c.r; i++) v[i + j * r] = c.v[i + j * c.r]; }
    if (vals.length !== 1 && vals.length !== ks.length) err(`Gán không khớp số phần tử: ${ks.length} vị trí, ${vals.length} giá trị`);
    ks.forEach((k, t) => { v[k] = vals.length === 1 ? vals[0] : vals[t]; });
    return new Cell(v, r, cc);
  }
  function structAssign(s, args, els) {
    const ks = linIdx(s, args, true), mx = Math.max(-1, ...ks);
    let el = s.el.slice(), r = s.r, c = s.c;
    if (mx >= el.length) {
      if (el.length > 1 && s.r !== 1 && s.c !== 1) err('Không mở rộng được mảng struct 2 chiều');
      while (el.length <= mx) el.push(new Map());
      if (s.c === 1 && s.r > 1) { r = el.length; c = 1; } else { r = 1; c = el.length; }
    }
    if (els.length !== 1 && els.length !== ks.length) err('Số phần tử struct không khớp');
    ks.forEach((k, t) => { el[k] = new Map(els.length === 1 ? els[0] : els[t]); });
    const keys = []; for (const mp of el) for (const k of mp.keys()) if (!keys.includes(k)) keys.push(k);
    el = el.map(mp => { const o = new Map(); for (const k of keys) o.set(k, mp.has(k) ? mp.get(k) : EMPTY()); return o; });
    return new Struct(r, c, el);
  }
  /* mảng nhiều chiều: kích thước hiệu dụng khi dùng k chỉ số (chiều cuối gộp các chiều còn lại) */
  function edims(m, k) { const d = dimsOf(m); while (d.length < k) d.push(1); return d.slice(0, k - 1).concat([prod(d.slice(k - 1))]); }
  function getND(m, args) {
    const k = args.length, ed = edims(m, k);
    const L = args.map((a, t) => { const l = idxList(a, ed[t]); for (const q of l) if (q >= ed[t]) err(`Chỉ số ${q + 1} ở chiều ${t + 1} vượt quá kích thước (${ed[t]})`); return l; });
    const od = L.map(l => l.length), N = prod(od), o = mkND(od); if (m.im) o.im = new Float64Array(N);
    const st = []; let s = 1; for (let t = 0; t < k; t++) { st.push(s); s *= ed[t]; }
    const sub = new Array(k).fill(0);
    for (let q = 0; q < N; q++) {
      let src = 0; for (let t = 0; t < k; t++) src += L[t][sub[t]] * st[t];
      o.re[q] = m.re[src]; if (m.im) o.im[q] = m.im[src];
      for (let t = 0; t < k; t++) { if (++sub[t] < od[t]) break; sub[t] = 0; }
    }
    o.lg = m.lg; return clean(o);
  }
  function setND(m, args, R) {
    const k = args.length, old = edims(m, k);
    const L = args.map((a, t) => idxList(a, old[t]));
    const nd = old.map((x, t) => Math.max(x, ...L[t].map(q => q + 1)));
    if (nd.some((x, t) => x !== old[t])) {
      if (m.dims && k < m.dims.length) err('Không mở rộng được mảng nhiều chiều khi dùng ít chỉ số hơn số chiều');
      const g = mkND(nd); if (m.im) g.im = new Float64Array(g.n);
      const sub = new Array(k).fill(0), sn = []; let b = 1; for (let t = 0; t < k; t++) { sn.push(b); b *= nd[t]; }
      for (let q = 0; q < m.n; q++) { let di = 0; for (let t = 0; t < k; t++) di += sub[t] * sn[t]; g.re[di] = m.re[q]; if (m.im) g.im[di] = m.im[q]; for (let t = 0; t < k; t++) { if (++sub[t] < old[t]) break; sub[t] = 0; } }
      m = g;
    }
    const cnt = prod(L.map(l => l.length));
    if (R.n !== 1 && R.n !== cnt) err(`Gán không khớp số phần tử: vế trái ${cnt}, vế phải ${R.n}`);
    if (R.im && !m.im) m.im = new Float64Array(m.n);
    const st = []; let s = 1; for (let t = 0; t < k; t++) { st.push(s); s *= nd[t]; }
    const sub = new Array(k).fill(0);
    for (let q = 0; q < cnt; q++) {
      let di = 0; for (let t = 0; t < k; t++) di += L[t][sub[t]] * st[t];
      const si = R.n === 1 ? 0 : q; m.re[di] = R.re[si]; if (m.im) m.im[di] = R.im ? R.im[si] : 0;
      for (let t = 0; t < k; t++) { if (++sub[t] < L[t].length) break; sub[t] = 0; }
    }
    m.lg = false; return clean(m);
  }
  function setIndex(t, args, rhs, del) {
    if (t instanceof Cell || rhs instanceof Cell || t instanceof Struct || rhs instanceof Struct) err('Kiểu dữ liệu không khớp khi gán: dùng c{i} = ... cho cell, s.ten = ... cho struct.');
    if (t instanceof Str) t = asM(t);
    let m = t ? asM(t) : EMPTY();
    if (rhs instanceof Str) rhs = asM(rhs);
    const R = asM(rhs);
    if (args.length >= 3 || (m.dims && args.length === 2)) { if (del) err('Xoá phần tử của mảng nhiều chiều chưa hỗ trợ'); return setND(m, args, R); }
    if (del) {
      if (args.length !== 1) err('Xoá phần tử x(idx) = [] chỉ hỗ trợ chỉ số tuyến tính.');
      const kill = new Set(idxList(args[0], m.n)), keep = [];
      for (let k = 0; k < m.n; k++) if (!kill.has(k)) keep.push(k);
      const o = m.c === 1 && m.r > 1 ? new Mat(keep.length, 1) : new Mat(1, keep.length); if (m.im) o.im = new Float64Array(keep.length);
      keep.forEach((k, t2) => { o.re[t2] = m.re[k]; if (m.im) o.im[t2] = m.im[k]; }); return o;
    }
    if (args.length === 1) {
      const ii = idxList(args[0], m.n);
      if (R.n !== 1 && R.n !== ii.length) err(`Gán không khớp số phần tử: vế trái ${ii.length}, vế phải ${R.n}.`);
      const mx = ii.length ? Math.max(...ii) : -1;
      if (mx >= m.n) {
        if (m.n === 0 || m.r === 1) m = grow(m, 1, mx + 1); else if (m.c === 1) m = grow(m, mx + 1, 1);
        else err(`Không thể mở rộng ma trận ${m.r}×${m.c} bằng chỉ số tuyến tính ${mx + 1}.`);
      }
      if (R.im && !m.im) m.im = new Float64Array(m.n);
      ii.forEach((k, t2) => { const s = R.n === 1 ? 0 : t2; m.re[k] = R.re[s]; if (m.im) m.im[k] = R.im ? R.im[s] : 0; });
      m.lg = false; return clean(m);
    }
    if (args.length === 2) {
      const ri = idxList(args[0], m.r), ci = idxList(args[1], m.c);
      if (R.n !== 1 && R.n !== ri.length * ci.length) err(`Gán không khớp kích thước: vế trái ${ri.length}×${ci.length}, vế phải ${R.r}×${R.c}.`);
      const mr = Math.max(m.r, ...ri.map(k => k + 1)), mc = Math.max(m.c, ...ci.map(k => k + 1));
      if (mr > m.r || mc > m.c) m = grow(m, mr, mc);
      if (R.im && !m.im) m.im = new Float64Array(m.n);
      let t2 = 0;
      for (const cj of ci) for (const rk of ri) { const s = R.n === 1 ? 0 : t2; m.re[rk + cj * m.r] = R.re[s]; if (m.im) m.im[rk + cj * m.r] = R.im ? R.im[s] : 0; t2++; }
      m.lg = false; return clean(m);
    }
    err('Chỉ hỗ trợ tối đa 2 chiều chỉ số.');
  }
  function grow(m, r, c) {
    const o = new Mat(r, c); if (m.im) o.im = new Float64Array(r * c);
    for (let j = 0; j < m.c; j++) for (let i = 0; i < m.r; i++) { o.re[i + j * r] = m.re[i + j * m.r]; if (m.im) o.im[i + j * r] = m.im[i + j * m.r]; }
    return o;
  }

  /* ---------- bộ tách từ (lexer) ---------- */
  const KW = new Set(['if', 'elseif', 'else', 'end', 'for', 'while', 'break', 'continue', 'return', 'function', 'switch', 'case', 'otherwise']);
  function lex(src) {
    const toks = [], st = []; let i = 0, line = 1; const L = src.length;
    const inMat = () => st.length && (st[st.length - 1] === '[' || st[st.length - 1] === '{');
    const prev = () => toks[toks.length - 1];
    const valEnd = t => t && (t.t === 'num' || t.t === 'id' || t.t === 'str' || (t.t === 'op' && [')', ']', '}', "'", ".'"].includes(t.v)) || (t.t === 'kw' && t.v === 'end'));
    const push = (t, v, x) => { const o = { t, v, line }; if (x) Object.assign(o, x); toks.push(o); return o; };
    while (i < L) {
      const ch = src[i];
      if (ch === '.' && src.startsWith('...', i)) { while (i < L && src[i] !== '\n') i++; i++; line++; continue; }
      if (ch === ' ' || ch === '\t' || ch === '\r') {
        let j = i; while (j < L && (src[j] === ' ' || src[j] === '\t' || src[j] === '\r')) j++;
        if (inMat() && valEnd(prev()) && j < L) {
          const a = src[j], b = src[j + 1] || '';
          let starts = /[0-9A-Za-z_(\[{'"@]/.test(a) || (a === '.' && /[0-9]/.test(b));
          if ((a === '+' || a === '-') && b !== ' ' && b !== '\t' && b !== '=') starts = true;
          if (a === '~' && b !== '=') starts = true;
          if (a === '.' && src.startsWith('...', j)) starts = false;
          if (starts) push('op', ',');
        }
        i = j; continue;
      }
      if (ch === '%') {
        const ls = src.lastIndexOf('\n', i - 1) + 1, le = src.indexOf('\n', i) < 0 ? L : src.indexOf('\n', i);
        if (src.startsWith('%{', i) && src.slice(ls, le).trim() === '%{') {
          const endm = src.slice(i).search(/\n[ \t]*%\}[ \t]*(\n|$)/);
          const stop = endm < 0 ? L : i + endm + 1;
          for (let k = i; k < stop; k++) if (src[k] === '\n') line++;
          i = src.indexOf('\n', stop) < 0 ? L : src.indexOf('\n', stop); continue;
        }
        while (i < L && src[i] !== '\n') i++; continue;
      }
      if (ch === '\n') {
        if (inMat()) { const p = prev(); if (p && !(p.t === 'op' && (p.v === ';' || p.v === ',' || p.v === '[' || p.v === '{'))) push('op', ';'); }
        else push('nl', '\n');
        line++; i++; continue;
      }
      if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(src[i + 1] || ''))) {
        let j = i; while (/[0-9]/.test(src[j] || '')) j++;
        if (src[j] === '.' && !/[*\/\\^']/.test(src[j + 1] || '')) { j++; while (/[0-9]/.test(src[j] || '')) j++; }
        if (/[eE]/.test(src[j] || '')) { let k = j + 1; if (src[k] === '+' || src[k] === '-') k++; if (/[0-9]/.test(src[k] || '')) { j = k; while (/[0-9]/.test(src[j] || '')) j++; } }
        const v = parseFloat(src.slice(i, j)); let imag = false;
        if ((src[j] === 'i' || src[j] === 'j') && !/[0-9A-Za-z_]/.test(src[j + 1] || '')) { imag = true; j++; }
        push('num', v, { imag }); i = j; continue;
      }
      if (/[A-Za-z_]/.test(ch)) {
        let j = i; while (/[A-Za-z0-9_]/.test(src[j] || '')) j++;
        const w = src.slice(i, j);
        push(KW.has(w) ? 'kw' : 'id', w, { sp: src[j] === ' ' || src[j] === '\t' }); i = j; continue;
      }
      if (ch === "'") {
        const pc = src[i - 1];
        if (valEnd(prev()) && !(inMat() && (pc === ' ' || pc === '\t'))) { push('op', "'"); i++; continue; }
        let j = i + 1, s = '';
        while (true) {
          if (j >= L || src[j] === '\n') throw new MErr("Chuỗi ký tự chưa đóng dấu nháy '", line);
          if (src[j] === "'") { if (src[j + 1] === "'") { s += "'"; j += 2; continue; } break; }
          s += src[j++];
        }
        push('str', s); i = j + 1; continue;
      }
      if (ch === '"') {
        let j = i + 1, s = '';
        while (true) {
          if (j >= L || src[j] === '\n') throw new MErr('Chuỗi ký tự chưa đóng dấu nháy kép "', line);
          if (src[j] === '"') { if (src[j + 1] === '"') { s += '"'; j += 2; continue; } break; }
          s += src[j++];
        }
        push('str', s); i = j + 1; continue;
      }
      const two = src.substr(i, 2);
      if (['==', '~=', '!=', '<=', '>=', '&&', '||', '.*', './', '.\\', '.^', ".'"].includes(two)) { push('op', two === '!=' ? '~=' : two); i += 2; continue; }
      if ('+-*/\\^<>=&|~!(),;:[]{}@.'.includes(ch)) {
        if (ch === '(' || ch === '[' || ch === '{') st.push(ch);
        if (ch === ')' || ch === ']' || ch === '}') st.pop();
        if (inMat() && ch === ',' ) { const p = prev(); if (p && p.t === 'op' && p.v === ',') { i++; continue; } }
        push('op', ch === '!' ? '~' : ch); i++; continue;
      }
      throw new MErr(`Ký tự không hợp lệ '${ch}'`, line);
    }
    push('eof', '');
    return toks;
  }

  /* ---------- bộ phân tích cú pháp (parser) ---------- */
  const CMDS = new Set(['hold', 'grid', 'axis', 'close', 'clear', 'clc', 'format', 'figure', 'clf', 'box', 'warning', 'more', 'rng', 'legend', 'colorbar', 'colormap', 'disp', 'pkg']);
  function parse(toks) {
    let p = 0, idxDepth = 0;
    const peek = (o = 0) => toks[Math.min(p + o, toks.length - 1)];
    const next = () => toks[p++];
    const isOp = (v, o = 0) => peek(o).t === 'op' && peek(o).v === v;
    const isKw = v => peek().t === 'kw' && peek().v === v;
    const perr = m => { throw new MErr(m, peek().line); };
    const expectOp = v => { if (!isOp(v)) perr(`Thiếu '${v}'` + (peek().t === 'eof' ? ' ở cuối chương trình' : ` (gặp '${peek().v}')`)); next(); };
    const expectKw = v => { if (!isKw(v)) perr(`Thiếu từ khoá '${v}'`); next(); };
    function block(terms, eofOk) {
      const out = [];
      for (; ;) {
        const t = peek();
        if (t.t === 'eof') { if (terms && !eofOk) perr(`Thiếu 'end' để đóng khối lệnh`); break; }
        if (t.t === 'kw' && terms && terms.includes(t.v)) break;
        if (t.t === 'nl' || (t.t === 'op' && (t.v === ';' || t.v === ','))) { next(); continue; }
        out.push(statement());
      }
      return out;
    }
    function endStmt() {
      const t = peek();
      if (t.t === 'op' && t.v === ';') { next(); return false; }
      if (t.t === 'op' && t.v === ',') { next(); return true; }
      if (t.t === 'nl') { next(); return true; }
      if (t.t === 'eof') return true;
      if (t.t === 'kw' && ['end', 'else', 'elseif', 'case', 'otherwise'].includes(t.v)) return true;
      perr(`Cú pháp không hợp lệ gần '${t.v}'` + (t.v === '=' ? " (so sánh bằng phải viết là ==)" : ''));
    }
    function statement() {
      const t = peek(), line = t.line;
      if (t.t === 'kw') {
        switch (t.v) {
          case 'if': {
            next(); const clauses = []; let cond = expr(); let body = block(['elseif', 'else', 'end']); clauses.push({ cond, body });
            while (isKw('elseif')) { next(); cond = expr(); body = block(['elseif', 'else', 'end']); clauses.push({ cond, body }); }
            let els = null; if (isKw('else')) { next(); els = block(['end']); }
            expectKw('end'); return { t: 'if', clauses, els, line };
          }
          case 'for': {
            next(); const par = isOp('('); if (par) next();
            const v = next(); if (v.t !== 'id') perr('Thiếu tên biến sau for');
            expectOp('='); const e = expr(); if (par) expectOp(')');
            const body = block(['end']); expectKw('end'); return { t: 'for', v: v.v, e, body, line };
          }
          case 'while': { next(); const cond = expr(); const body = block(['end']); expectKw('end'); return { t: 'while', cond, body, line }; }
          case 'break': next(); endStmt(); return { t: 'break', line };
          case 'continue': next(); endStmt(); return { t: 'continue', line };
          case 'return': next(); endStmt(); return { t: 'return', line };
          case 'switch': {
            next(); const e = expr(); const cases = []; let other = null;
            while (peek().t === 'nl' || isOp(';') || isOp(',')) next();
            while (isKw('case')) { next(); const v = expr(); const body = block(['case', 'otherwise', 'end']); cases.push({ v, body }); }
            if (isKw('otherwise')) { next(); other = block(['end']); }
            expectKw('end'); return { t: 'switch', e, cases, other, line };
          }
          case 'function': {
            // function name(a,b) | function y = name(a) | function [y1, y2] = name(a, b)
            next(); let outs = [], name;
            if (isOp('[')) {
              next();
              while (!isOp(']')) { if (isOp(',')) { next(); continue; } const o = next(); if (o.t !== 'id') perr('Tên biến đầu ra không hợp lệ'); outs.push(o.v); }
              next(); expectOp('='); const nm = next(); if (nm.t !== 'id') perr('Thiếu tên hàm'); name = nm.v;
            } else {
              const a = next(); if (a.t !== 'id') perr('Thiếu tên hàm sau từ khoá function');
              if (isOp('=')) { next(); outs = [a.v]; const nm = next(); if (nm.t !== 'id') perr('Thiếu tên hàm'); name = nm.v; } else name = a.v;
            }
            if ((name === 'get' || name === 'set') && isOp('.') && peek(1).t === 'id') { next(); name += '.' + next().v; }   // get.ThuocTinh / set.ThuocTinh
            const params = [];
            if (isOp('(')) {
              next();
              while (!isOp(')')) {
                if (isOp(',')) { next(); continue; }
                if (isOp('~')) { next(); params.push('~'); continue; }
                const v = next(); if (v.t !== 'id') perr('Tham số hàm phải là tên biến'); params.push(v.v);
              }
              next();
            }
            const body = block(['end', 'function'], true);
            if (isKw('end')) next();
            return { t: 'func', name, outs, params, body, line };
          }
          default: perr(`Từ khoá '${t.v}' đặt không đúng chỗ`);
        }
      }
      if (t.t === 'id' && t.v === 'import' && peek(1).t === 'id' && peek(1).line === line) {
        next(); const names = [];
        while (peek().t === 'id' && peek().line === line) {
          let s = next().v;
          while (isOp('.') || isOp('.*')) { if (isOp('.*')) { next(); s += '.*'; break; } next(); if (isOp('*')) { next(); s += '.*'; break; } const q = next(); if (q.t !== 'id') perr('import: tên gói không hợp lệ'); s += '.' + q.v; }
          names.push(s); if (isOp(',')) next();
        }
        endStmt(); return { t: 'import', names, line };
      }
      if (t.t === 'id' && t.v === 'classdef') perr('classdef phải nằm ở đầu một file .m riêng có tên trùng tên lớp (tạo tệp mới trong Thư mục làm việc)');
      if (t.t === 'id' && CMDS.has(t.v) && t.sp && (peek(1).t === 'id' || peek(1).t === 'num') && peek(1).line === line && !(peek(2).t === 'op' && (peek(2).v === '=' || peek(2).v === '('))) {
        next(); const args = []; while ((peek().t === 'id' || peek().t === 'num') && peek().line === line) args.push(String(next().v));
        endStmt(); return { t: 'cmd', name: t.v, args, line };
      }
      if (isOp('[')) {
        const save = p, lhs = tryMulti();
        if (lhs) { const rhs = expr(); const show = endStmt(); return { t: 'massign', lhs, rhs, show, line }; }
        p = save;
      }
      if (t.t === 'id') {
        const save = p, lhs = tryLhs();
        if (lhs && isOp('=')) { next(); const rhs = expr(); const show = endStmt(); return { t: 'assign', lhs, rhs, show, line }; }
        p = save;
      }
      const e = expr(); const show = endStmt(); return { t: 'expr', e, show, line };
    }
    // vế trái: ten, rồi chuỗi truy cập (...) {...} .truong .(bieu_thuc)
    function tryLhs() {
      const id = next(); const chain = parseChain(); if (!chain) return null; return { name: id.v, chain };
    }
    function parseChain() {
      const chain = [];
      for (; ;) {
        if (isOp('(') || isOp('{')) {
          const brace = isOp('{'), close = brace ? '}' : ')'; next(); idxDepth++; const args = [];
          try { if (!isOp(close)) { args.push(arg()); while (isOp(',')) { next(); args.push(arg()); } } }
          catch (e) { idxDepth--; return null; }
          idxDepth--; if (!isOp(close)) return null; next();
          chain.push({ k: brace ? 'brace' : 'paren', args }); continue;
        }
        if (isOp('.') && peek(1).t === 'id') { next(); chain.push({ k: 'field', name: next().v }); continue; }
        if (isOp('.') && isOp('(', 1)) {
          next(); next(); let e; try { e = expr(); } catch (er) { return null; }
          if (!isOp(')')) return null; next(); chain.push({ k: 'dfield', e }); continue;
        }
        break;
      }
      return chain;
    }
    function tryMulti() {
      next(); const names = [];
      while (!isOp(']')) {
        if (isOp(',')) { next(); continue; }
        if (peek().t === 'id') { const nm = next().v, ch = parseChain(); if (!ch) return null; names.push({ name: nm, chain: ch }); }
        else if (isOp('~')) { next(); names.push('~'); }
        else return null;
      }
      next(); if (!isOp('=')) return null; next();
      return names.length ? names : null;
    }
    function arg() {
      if (isOp(':') && (isOp(',', 1) || isOp(')', 1) || isOp('}', 1))) { next(); return { t: 'colon' }; }
      return expr();
    }
    const expr = () => oror();
    function binl(sub, ops) { return () => { let l = sub(); while (peek().t === 'op' && ops.includes(peek().v)) { const op = next().v; l = { t: 'bin', op, l, r: sub() }; } return l; }; }
    function rangeE() {
      const a = add();
      if (isOp(':') && !(isOp(',', 1) || isOp(')', 1))) {
        next(); const b = add();
        if (isOp(':')) { next(); const c = add(); return { t: 'range', a, s: b, b: c }; }
        return { t: 'range', a, s: null, b };
      }
      return a;
    }
    function unary() {
      if (isOp('-') || isOp('+') || isOp('~')) { const op = next().v; return { t: 'un', op, e: unary() }; }
      return powE();
    }
    function powOperand() {
      if (isOp('-') || isOp('+') || isOp('~')) { const op = next().v; return { t: 'un', op, e: powOperand() }; }
      return postfix();
    }
    function powE() {
      let l = postfix();
      while (isOp('^') || isOp('.^')) { const op = next().v; l = { t: 'bin', op, l, r: powOperand() }; }
      return l;
    }
    function postfix() {
      let e = primary();
      for (; ;) {
        if (isOp("'") || isOp(".'")) { const op = next().v; e = { t: 'tr', conj: op === "'", e }; continue; }
        if (isOp('(') || isOp('{')) {
          const brace = isOp('{'), close = brace ? '}' : ')'; next(); idxDepth++;
          const args = [];
          if (!isOp(close)) { args.push(arg()); while (isOp(',')) { next(); args.push(arg()); } }
          idxDepth--; expectOp(close);
          e = { t: 'idx', target: e, args, brace }; continue;
        }
        if (e.t === 'id' && isOp('@') && peek(1).t === 'id') {   // obj@LopCha(...)  hoặc  phuongThuc@LopCha(...)
          next(); let cls = next().v; while (isOp('.') && peek(1).t === 'id') { next(); cls += '.' + next().v; }
          const args = [];
          if (isOp('(')) { next(); idxDepth++; if (!isOp(')')) { args.push(expr()); while (isOp(',')) { next(); args.push(expr()); } } idxDepth--; expectOp(')'); }
          e = { t: 'super', name: e.v, cls, args }; continue;
        }
        if (isOp('.') && peek(1).t === 'id') { next(); e = { t: 'field', e, name: next().v }; continue; }
        if (isOp('.') && isOp('(', 1)) { next(); next(); const ne = expr(); expectOp(')'); e = { t: 'dfield', e, ne }; continue; }
        break;
      }
      return e;
    }
    function primary() {
      const t = peek();
      if (t.t === 'num') { next(); return { t: 'num', v: t.v, imag: t.imag }; }
      if (t.t === 'str') { next(); return { t: 'str', v: t.v }; }
      if (t.t === 'id') { next(); return { t: 'id', v: t.v }; }
      if (t.t === 'kw' && t.v === 'end' && idxDepth > 0) { next(); return { t: 'end' }; }
      if (isOp('(')) { next(); const d = idxDepth; idxDepth = d; const e = expr(); expectOp(')'); return { t: 'paren', e }; }
      if (isOp('[') || isOp('{')) {
        const cell = isOp('{'), close = cell ? '}' : ']'; next(); const rows = [[]];
        while (!isOp(close)) {
          if (peek().t === 'eof') perr(`Thiếu '${close}'`);
          if (isOp(';')) { next(); rows.push([]); continue; }
          if (isOp(',')) { next(); continue; }
          rows[rows.length - 1].push(expr());
        }
        next(); return { t: cell ? 'cell' : 'mat', rows: rows.filter(r => r.length) };
      }
      if (isOp('@')) {
        next();
        if (isOp('(')) {
          next(); const params = [];
          while (!isOp(')')) { if (isOp(',')) { next(); continue; } const v = next(); if (v.t !== 'id') perr('Tham số của hàm ẩn danh phải là tên biến'); params.push(v.v); }
          next(); const s0 = p; const body = expr();
          const src = toks.slice(s0, p).map(x => x.t === 'str' ? `'${x.v}'` : (x.t === 'num' && x.imag ? x.v + 'i' : x.v)).join(' ').replace(/ ([,)\]])/g, '$1').replace(/([([]) /g, '$1');
          return { t: 'anon', params, body, src };
        }
        const v = next(); if (v.t !== 'id') perr('Sau @ cần tên hàm hoặc (tham số)'); return { t: 'fh', v: v.v };
      }
      if (t.t === 'eof') perr('Biểu thức chưa hoàn chỉnh');
      perr(`Không mong đợi '${t.v}'` + (t.v === '=' ? ' (so sánh bằng phải viết là ==)' : ''));
    }
    function parseAttrs() {
      const at = new Set();
      if (isOp('(')) { next(); while (!isOp(')')) { if (peek().t === 'eof') perr("Thiếu ')' trong thuộc tính"); const t = next(); if (t.t === 'id') at.add(t.v); } next(); }
      return at;
    }
    // classdef Ten < handle ... properties ... methods ... end
    function parseClassdef() {
      const line = peek().line; next(); parseAttrs();
      const nm = next(); if (nm.t !== 'id') perr('Thiếu tên lớp sau classdef');
      const supers = [];
      if (isOp('<')) { next(); const s = next(); if (s.t !== 'id') perr('Thiếu tên lớp cha'); supers.push(s.v); while (isOp('&')) { next(); supers.push(next().v); } }
      const cd = { t: 'classdef', name: nm.v, supers, props: [], methods: [], events: [], enums: [], line };
      const skip = () => { while (peek().t === 'nl' || isOp(';') || isOp(',')) next(); };
      for (; ;) {
        skip();
        if (isKw('end')) { next(); break; }
        const t = peek();
        if (t.t === 'eof') perr(`Thiếu 'end' đóng classdef ${nm.v}`);
        if (t.t === 'id' && (t.v === 'properties' || t.v === 'methods' || t.v === 'events' || t.v === 'enumeration')) {
          next(); const at = parseAttrs();
          if (t.v === 'properties') {
            for (; ;) {
              skip(); if (isKw('end')) { next(); break; }
              const p = next(); if (p.t !== 'id') perr('Tên thuộc tính không hợp lệ');
              while (!(isOp('=') || peek().t === 'nl' || isOp(';') || isOp(',') || peek().t === 'eof' || isKw('end'))) next();  // bỏ qua kiểu/kích thước
              let def = null; if (isOp('=')) { next(); def = expr(); }
              cd.props.push({ name: p.v, def, constant: at.has('Constant'), dependent: at.has('Dependent') });
            }
          } else if (t.v === 'events') {
            for (; ;) { skip(); if (isKw('end')) { next(); break; } const e = next(); if (e.t !== 'id') perr('Tên sự kiện không hợp lệ'); cd.events.push(e.v); }
          } else if (t.v === 'enumeration') {
            for (; ;) {
              skip(); if (isKw('end')) { next(); break; }
              const e = next(); if (e.t !== 'id') perr('Tên thành viên enumeration không hợp lệ');
              const args = []; if (isOp('(')) { next(); while (!isOp(')')) { if (isOp(',')) { next(); continue; } args.push(expr()); } next(); }
              cd.enums.push({ name: e.v, args });
            }
          } else if (t.v === 'methods') {
            for (; ;) {
              skip(); if (isKw('end')) { next(); break; }
              if (!isKw('function')) perr("Trong khối methods chỉ được khai báo function ... end");
              const f = statement(); f.static = at.has('Static'); cd.methods.push(f);
            }
          }
          continue;
        }
        perr(`Không mong đợi '${t.v}' trong classdef (chỉ có properties, methods)`);
      }
      return cd;
    }
    const mul = binl(unary, ['*', '/', '\\', '.*', './', '.\\']);
    const add = binl(mul, ['+', '-']);
    const cmp = binl(rangeE, ['<', '<=', '>', '>=', '==', '~=']);
    const andE = binl(cmp, ['&']);
    const orE = binl(andE, ['|']);
    const andand = binl(orE, ['&&']);
    const oror = binl(andand, ['||']);
    while (peek().t === 'nl' || isOp(';')) next();
    if (peek().t === 'id' && peek().v === 'classdef') { const cd = parseClassdef(); return [cd, ...block(null)]; }
    return block(null);
  }

  /* ---------- định dạng hiển thị ---------- */
  function fnum(x, long) {
    if (Number.isNaN(x)) return 'NaN';
    if (!isFinite(x)) return x > 0 ? 'Inf' : '-Inf';
    if (Number.isInteger(x) && Math.abs(x) < 1e10) return String(x);
    const a = Math.abs(x);
    if (long) return (a >= 1e5 || a < 1e-4) ? x.toExponential(14) : x.toFixed(15).replace(/0+$/, '').replace(/\.$/, '.0');
    if (a >= 1e5 || a < 1e-4) return x.toExponential(4).replace(/e([+-])(\d)$/, 'e$10$2');
    return x.toFixed(4);
  }
  function fixedAll(m, long) { // mọi phần tử cùng một kiểu như MATLAB 'format short'
    let mx = 0; for (let k = 0; k < m.n; k++) { if (isFinite(m.re[k])) mx = Math.max(mx, Math.abs(m.re[k])); if (m.im && isFinite(m.im[k])) mx = Math.max(mx, Math.abs(m.im[k])); }
    const d = long ? 15 : 4, useE = mx >= 1e5 || (mx > 0 && mx < 1e-3);
    const f = x => !isFinite(x) ? fnum(x) : useE ? x.toExponential(d).replace(/e([+-])(\d)$/, 'e$10$2') : x.toFixed(d);
    return (re, im) => im === null || im === undefined ? f(re) : f(re) + (im < 0 || Object.is(im, -0) ? ' - ' : ' + ') + f(Math.abs(im)) + 'i';
  }
  function fcx(re, im, long) {
    if (im === undefined || im === null) return fnum(re, long);
    return fnum(re, long) + (im < 0 || Object.is(im, -0) ? ' - ' : ' + ') + fnum(Math.abs(im), long) + 'i';
  }
  function fmtMat(m, long) {
    if (m.n === 0) return '     []';
    const allInt = Array.from(m.re).every(x => Number.isInteger(x) || !isFinite(x)) && (!m.im || Array.from(m.im).every(x => Number.isInteger(x)));
    const F = allInt ? (re, im) => fcx(re, im, long) : fixedAll(m, long);
    const cells = [];
    for (let i = 0; i < m.r; i++) { const row = []; for (let j = 0; j < m.c; j++) { const k = i + j * m.r; row.push(F(m.re[k], m.im ? m.im[k] : null)); } cells.push(row); }
    const w = Math.max(...cells.flat().map(s => s.length)) + (allInt ? 3 : 3);
    const per = Math.max(1, Math.floor(76 / w));
    let out = '';
    for (let c0 = 0; c0 < m.c; c0 += per) {
      const c1 = Math.min(m.c, c0 + per);
      if (m.c > per) out += (c0 ? '\n' : '') + `  Cột ${c0 + 1}${c1 - c0 > 1 ? ` đến ${c1}` : ''}:\n\n`;
      for (let i = 0; i < m.r; i++) out += cells[i].slice(c0, c1).map(s => s.padStart(w)).join('') + '\n';
    }
    return out.replace(/\n$/, '');
  }
  const sz = v => vshape(v).join('×');
  function brief(x) {
    if (x instanceof Str) return `'${x.s}'`;
    if (x instanceof Cell) return `{${sz(x)} cell}`;
    if (x instanceof Struct) return `[${sz(x)} struct]`;
    if (x instanceof Obj) return x.enumName ? `${x.C.name}.${x.enumName}` : `[1×1 ${x.C.name}]`;
    if (x instanceof OArr) return `[${x.r}×${x.c} ${x.C.name}]`;
    if (x instanceof Fun) return `@(${x.params.join(',')}) ${x.src}`;
    if (x instanceof FH) return '@' + x.name;
    if (x instanceof Mat) {
      if (x.n === 0) return '[]';
      if (x.n === 1) return fcx(x.re[0], x.im ? x.im[0] : null);
      if (x.r === 1 && !x.dims && x.n <= 10) return '[' + Array.from(x.re).map((r, k) => x.im ? fcx(r, x.im[k]) : fnum(r)).join(' ') + ']';
      return `[${sz(x)} ${x.lg ? 'logical' : 'double'}]`;
    }
    return '…';
  }
  function cellBrief(x) {
    if (x instanceof Str) return `{'${x.s}'}`;
    if (x instanceof Mat && x.n === 1) return `{[${fcx(x.re[0], x.im ? x.im[0] : null)}]}`;
    if (x instanceof Mat && x.n === 0) return '{0×0 double}';
    if (x instanceof Mat && x.r === 1 && !x.dims && x.n <= 4 && !x.im) return `{[${Array.from(x.re).map(fnum).join(' ')}]}`;
    return `{${sz(x)} ${typeName(x)}}`;
  }
  function display(name, v, long) {
    if (v instanceof Str) return `${name} = '${v.s}'`;
    if (v instanceof Fun) return `${name} = @(${v.params.join(',')}) ${v.src}`;
    if (v instanceof FH) return `${name} = @${v.name}`;
    if (v instanceof CSL) return v.v.map(x => display(name, x, long)).join('\n');
    if (v instanceof OArr) return `${name} = \n  mảng ${v.r}×${v.c} đối tượng ${v.C.name}${v.el[0] && v.el[0].enumName ? ': ' + v.el.map(o => o.enumName).join(', ') : ' với các thuộc tính:\n\n' + [...v.C.props.keys()].map(k => '    ' + k).join('\n')}\n`;
    if (v instanceof Obj && v.enumName) return `${name} = \n  ${v.C.name} enumeration\n\n    ${v.enumName}\n`;
    if (v instanceof Obj) {
      const w = Math.max(0, ...[...v.p.keys()].map(k => k.length));
      return `${name} = \n  ${v.C.name}${v.C.isHandle ? ' (lớp handle)' : ''} với các thuộc tính:\n\n` + [...v.p].map(([k, x]) => `    ${k.padStart(w)}: ${brief(x)}`).join('\n') + '\n';
    }
    if (v instanceof Struct) {
      if (v.n === 1) {
        const mp = v.el[0], w = Math.max(0, ...[...mp.keys()].map(k => k.length));
        return `${name} = \n  struct với các trường:\n\n` + [...mp].map(([k, x]) => `    ${k.padStart(w)}: ${brief(x)}`).join('\n') + '\n';
      }
      return `${name} = \n  mảng struct ${v.r}×${v.c} với các trường:\n\n` + (v.el[0] ? [...v.el[0].keys()].map(k => '    ' + k).join('\n') : '') + '\n';
    }
    if (v instanceof Cell) {
      if (!v.n) return `${name} =\n  {}  (cell rỗng ${v.r}×${v.c})`;
      const cells = []; for (let i = 0; i < v.r; i++) { const row = []; for (let j = 0; j < v.c; j++) row.push(cellBrief(v.v[i + j * v.r])); cells.push(row); }
      const w = Math.max(...cells.flat().map(s => s.length));
      return `${name} =\n  cell array ${v.r}×${v.c}\n\n` + cells.map(r => '    ' + r.map(s => s.padEnd(w)).join('    ')).join('\n') + '\n';
    }
    const m = asM(v);
    if (m.dims) {
      const d = m.dims, pg = d[0] * d[1], np = prod(d.slice(2)); let out = '';
      for (let p = 0; p < np; p++) {
        const subs = []; let q = p; for (let t = 2; t < d.length; t++) { subs.push(q % d[t] + 1); q = Math.floor(q / d[t]); }
        const P = new Mat(d[0], d[1], m.re.slice(p * pg, (p + 1) * pg), m.im ? m.im.slice(p * pg, (p + 1) * pg) : null);
        out += `${name}(:,:,${subs.join(',')}) =\n\n${fmtMat(clean(P), long)}\n\n`;
      }
      return out.replace(/\n+$/, '\n');
    }
    if (m.n === 1) return `${name} = ${fcx(m.re[0], m.im ? m.im[0] : null, long)}`;
    if (m.n === 0) return `${name} =\n     []  (${m.r}×${m.c})`;
    return `${name} =\n\n${fmtMat(m, long)}\n`;
  }
  function gfmt(x, p) {
    if (!isFinite(x)) return Number.isNaN(x) ? 'NaN' : (x > 0 ? 'Inf' : '-Inf');
    if (x === 0) return '0';
    p = p === undefined ? 6 : Math.max(1, p);
    const e = Math.floor(Math.log10(Math.abs(x)));
    if (e < -4 || e >= p) { let s = x.toExponential(p - 1); s = s.replace(/\.?0+e/, 'e'); return s.replace(/e([+-])(\d)$/, 'e$10$2'); }
    let s = x.toFixed(Math.max(0, p - 1 - e)); if (s.includes('.')) s = s.replace(/\.?0+$/, ''); return s;
  }
  function sprintfImpl(fmt, args) {
    const items = [];
    for (const a of args) { if (a instanceof Str) items.push(a.s); else { const m = asM(a); for (let k = 0; k < m.n; k++) items.push(m.re[k]); } }
    fmt = fmt.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\\\/g, '\\');
    const re = /%([-+ 0#]*)(\d+)?(?:\.(\d+))?([dicfeEgGsxXu%])/g;
    let out = '', ai = 0, first = true;
    while (first || ai < items.length) {
      let used = false;
      out += fmt.replace(re, (all, flags, width, prec, conv) => {
        if (conv === '%') return '%';
        if (ai >= items.length) { if (!first) return ''; return ''; }
        used = true; const v = items[ai++]; let s;
        const P = prec !== undefined ? +prec : undefined;
        if (conv === 's') s = typeof v === 'string' ? v : gfmt(v, P || 6);
        else if (typeof v === 'string') s = v;
        else if (conv === 'd' || conv === 'i' || conv === 'u') s = Number.isInteger(v) ? String(v) : v.toExponential(6);
        else if (conv === 'c') s = String.fromCharCode(v);
        else if (conv === 'f') s = v.toFixed(P === undefined ? 6 : P);
        else if (conv === 'e' || conv === 'E') { s = v.toExponential(P === undefined ? 6 : P).replace(/e([+-])(\d)$/, 'e$10$2'); if (conv === 'E') s = s.toUpperCase(); }
        else if (conv === 'g' || conv === 'G') { s = gfmt(v, P); if (conv === 'G') s = s.toUpperCase(); }
        else if (conv === 'x' || conv === 'X') { s = Math.round(v).toString(16); if (conv === 'X') s = s.toUpperCase(); }
        if (flags.includes('+') && typeof v === 'number' && v >= 0 && conv !== 's') s = '+' + s;
        if (width) { const w = +width; if (flags.includes('-')) s = s.padEnd(w); else if (flags.includes('0') && conv !== 's') { const neg = s[0] === '-'; s = (neg ? '-' : '') + s.slice(neg ? 1 : 0).padStart(w - (neg ? 1 : 0), '0'); } else s = s.padStart(w); }
        return s;
      });
      first = false;
      if (!used) break;
    }
    return out.replace(/−/g, '-');
  }
  function texify(s) {
    const G = { alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', Delta: 'Δ', epsilon: 'ε', theta: 'θ', lambda: 'λ', mu: 'μ', pi: 'π', Pi: 'Π', sigma: 'σ', Sigma: 'Σ', tau: 'τ', phi: 'φ', omega: 'ω', Omega: 'Ω', infty: '∞', leq: '≤', geq: '≥', times: '×', cdot: '·', rightarrow: '→', approx: '≈', pm: '±' };
    const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻', 'n': 'ⁿ', 'j': 'ʲ', 'i': 'ⁱ', '(': '⁽', ')': '⁾', 'k': 'ᵏ', 'N': 'ᴺ', 'x': 'ˣ', 'm': 'ᵐ' };
    const SUB = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', '+': '₊', '-': '₋', 'n': 'ₙ', 'k': 'ₖ', 'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ', 's': 'ₛ', 'd': 'd', 'c': 'c' };
    s = s.replace(/\\([A-Za-z]+)/g, (a, w) => G[w] || w);
    const conv = (txt, M, mark) => [...txt].every(c => M[c]) ? [...txt].map(c => M[c]).join('') : mark + txt;
    s = s.replace(/\^\{([^}]*)\}/g, (a, t) => conv(t, SUP, '^')).replace(/\^(.)/g, (a, t) => conv(t, SUP, '^'));
    s = s.replace(/_\{([^}]*)\}/g, (a, t) => conv(t, SUB, '_')).replace(/_(.)/g, (a, t) => conv(t, SUB, '_'));
    return s;
  }

  /* ---------- mô hình đồ thị ---------- */
  function newFig(I) { I.figs.push({ axes: [], cur: null, title: '' }); I.cf = I.figs.length - 1; return I.figs[I.cf]; }
  function fig(I) { return I.cf >= 0 ? I.figs[I.cf] : newFig(I); }
  function newAx(m, n, ps) { return { m, n, ps, series: [], title: '', xl: '', yl: '', legend: null, grid: false, hold: false, xlim: null, ylim: null, equal: false, ci: 0, freqAxisPi: false }; }
  function ax(I) { const f = fig(I); if (!f.cur) { f.cur = newAx(1, 1, [1]); f.axes.push(f.cur); } return f.cur; }
  const PALETTE = ['trace', 'sample', 'a3', 'a4', 'warn', 'bad', 'ink'];
  const CMAP = { b: 'trace', r: 'bad', g: 'a3', m: 'a4', k: 'ink', c: 'trace', y: 'warn', w: 'panel' };
  function parseSpec(s) {
    const o = {}; let t = s;
    const ls = t.match(/--|-\.|-|:/); if (ls) { o.dash = ls[0]; t = t.replace(ls[0], ''); }
    const mk = t.match(/[ox+*.sd^v<>ph]/); if (mk) { o.marker = mk[0]; t = t.replace(mk[0], ''); }
    const cl = t.match(/[rgbcmykw]/); if (cl) o.color = CMAP[cl[0]];
    if (o.marker && !ls) o.dash = 'none';
    return o;
  }
  const isSpec = v => v instanceof Str && /^[-.:rgbcmykwox+*sd^v<>ph]{1,4}$/.test(v.s) && !/^(on|off)$/.test(v.s);
  function nameVals(args, o) {
    for (let k = 0; k < args.length - 1; k += 2) {
      const nm = args[k] instanceof Str ? args[k].s.toLowerCase() : ''; const v = args[k + 1];
      if (nm === 'linewidth') o.lw = num(v); else if (nm === 'displayname') o.name = str(v); else if (nm === 'markersize') o.ms = num(v);
      else if (nm === 'color') { if (v instanceof Str) o.color = CMAP[v.s[0]] || o.color; }
      else if (nm === 'markerfacecolor') o.filled = true;
    }
  }
  function addSeries(I, kind, args, opts = {}) {
    const A = ax(I);
    if (!A.hold) { A.series = []; A.ci = 0; A.legend = null; }
    // tách các nhóm (x, y, spec)
    const groups = []; let k = 0; const extra = {};
    while (k < args.length) {
      if (args[k] instanceof Str) {
        if (kind === 'stem' && /^filled$/i.test(args[k].s)) { extra.filled = true; k++; continue; }
        if (isSpec(args[k]) && groups.length) { Object.assign(groups[groups.length - 1].o, parseSpec(args[k].s)); k++; continue; }
        nameVals(args.slice(k), extra); break;
      }
      const a = asM(args[k]), b = args[k + 1];
      if (b !== undefined && !(b instanceof Str)) { groups.push({ x: a, y: asM(b), o: {} }); k += 2; }
      else { groups.push({ x: null, y: a, o: {} }); k += 1; }
    }
    for (const g of groups) {
      let { x, y } = g;
      if (!x && y.im && kind === 'line') { x = new Mat(y.r, y.c, Float64Array.from(y.re)); y = new Mat(y.r, y.c, Float64Array.from(y.im)); }
      const cols = isVec(y) ? [Array.from(y.re)] : Array.from({ length: y.c }, (_, j) => Array.from(y.re.slice(j * y.r, (j + 1) * y.r)));
      cols.forEach(yy => {
        const xx = x ? Array.from(x.re) : yy.map((_, t) => t + 1);
        if (xx.length !== yy.length) err(`${kind === 'stem' ? 'stem' : 'plot'}(x, y): x có ${xx.length} phần tử nhưng y có ${yy.length} phần tử.`);
        const s = Object.assign({ kind, x: xx, y: yy, color: PALETTE[A.ci++ % PALETTE.length], dash: kind === 'line' ? '-' : 'none', lw: kind === 'line' || kind === 'stairs' ? 1.6 : 1.4 }, opts, g.o, extra);
        A.series.push(s);
      });
    }
  }

  /* ---------- tiện ích DSP ---------- */
  const reArr = v => Array.from(asM(v).re);
  function fftV(x, N) {
    x = asM(x); const L = N || x.n; const re = new Float64Array(L), im = new Float64Array(L);
    for (let k = 0; k < Math.min(L, x.n); k++) { re[k] = x.re[k]; im[k] = x.im ? x.im[k] : 0; }
    if (L && (L & (L - 1)) === 0) fft(re, im);
    else { const D = dft(Array.from(re), Array.from(im)); re.set(D.re); im.set(D.im); }
    return { re, im };
  }
  function vecOut(src, re, im) { const m = (src.r === 1) ? new Mat(1, re.length, Float64Array.from(re)) : new Mat(re.length, 1, Float64Array.from(re)); if (im) m.im = Float64Array.from(im); return clean(m); }
  function polyC(rootsRe, rootsIm) { // Π(x - r) với r phức, trả hệ số bậc cao trước
    let pr = [1], pi = [0];
    for (let k = 0; k < rootsRe.length; k++) {
      const nr = new Array(pr.length + 1).fill(0), ni = new Array(pr.length + 1).fill(0);
      for (let i = 0; i < pr.length; i++) { nr[i] += pr[i]; ni[i] += pi[i]; nr[i + 1] -= pr[i] * rootsRe[k] - pi[i] * rootsIm[k]; ni[i + 1] -= pr[i] * rootsIm[k] + pi[i] * rootsRe[k]; }
      pr = nr; pi = ni;
    }
    const mx = Math.max(1e-300, ...pr.map(Math.abs)); if (pi.every(v => Math.abs(v) < 1e-10 * mx)) pi = null;
    return { re: pr, im: pi };
  }
  function rootsOf(p) {
    let c = reArr(p); while (c.length && c[0] === 0) c.shift();
    let nz = 0; while (c.length && c[c.length - 1] === 0) { c.pop(); nz++; }
    const r = c.length > 1 ? polyRoots(c) : [];
    for (let k = 0; k < nz; k++) r.push([0, 0]);
    const sc = Math.max(1, ...r.map(z => Math.hypot(z[0], z[1])));
    return r.map(z => [z[0], Math.abs(z[1]) < 1e-9 * sc ? 0 : z[1]]);
  }
  function filterV(b, a, x) {
    const bb = reArr(b), aa = reArr(a); if (!aa.length || aa[0] === 0) err('filter: a(1) phải khác 0');
    const a0 = aa[0], bn = bb.map(v => v / a0), an = aa.map(v => v / a0);
    x = asM(x);
    const yr = filt(bn, an, x.re), yi = x.im ? filt(bn, an, x.im) : null;
    const o = new Mat(x.r, x.c, Float64Array.from(yr)); if (yi) o.im = Float64Array.from(yi); return clean(o);
  }
  function freqzV(b, a, n, whole) {
    const bb = reArr(b), aa = reArr(a), w = [], hr = [], hi = [];
    for (let k = 0; k < n; k++) { const om = (whole ? 2 : 1) * PI * k / n; const z = H_at(bb, aa, om); w.push(om); hr.push(z[0]); hi.push(z[1]); }
    return { w, hr, hi };
  }
  function winCol(name, N, beta) { if (!(N >= 1) || !Number.isInteger(N)) err(`${name}(N): N phải là số nguyên dương`); return colv(N === 1 ? [1] : windowFn(name, N, beta)); }
  function fir1V(n, Wn, type, win) {
    if (!Number.isInteger(n) || n < 1) err('fir1(n, Wn): n là BẬC bộ lọc (số hệ số = n + 1), phải là số nguyên dương');
    const w = reArr(Wn); if (w.some(v => v <= 0 || v >= 1)) err('fir1: Wn phải nằm trong khoảng (0, 1) — chuẩn hoá theo tần số Nyquist fs/2. Ví dụ fc = 1000 Hz, fs = 8000 Hz thì Wn = 1000/4000 = 0.25');
    type = type || (w.length === 2 ? 'bandpass' : 'low');
    if ((type === 'high' || type === 'stop') && n % 2) { n++; }
    const N = n + 1, al = n / 2, lp = wc => { const h = new Array(N); for (let k = 0; k < N; k++) { const m = k - al; h[k] = m === 0 ? wc / PI : Math.sin(wc * m) / (PI * m); } return h; };
    let h;
    if (type === 'low') h = lp(w[0] * PI);
    else if (type === 'high') h = lp(w[0] * PI).map((v, k) => (k === al ? 1 : 0) - v);
    else if (type === 'bandpass') { const a = lp(w[1] * PI), b = lp(w[0] * PI); h = a.map((v, k) => v - b[k]); }
    else if (type === 'stop') { const a = lp(w[1] * PI), b = lp(w[0] * PI); h = a.map((v, k) => (k === al ? 1 : 0) - (v - b[k])); }
    else err(`fir1: loại '${type}' không hỗ trợ (dùng 'low', 'high', 'bandpass', 'stop')`);
    const wv = win ? reArr(win) : windowFn('hamming', N);
    if (wv.length !== N) err(`fir1: cửa sổ phải có ${N} phần tử (= n + 1)`);
    h = h.map((v, k) => v * wv[k]);
    const f0 = type === 'low' || type === 'stop' ? 0 : type === 'high' ? PI : (w[0] + w[1]) / 2 * PI;
    const g = Math.hypot(...H_at(h, [1], f0)); h = h.map(v => v / g);
    return { h, n };
  }
  // căn bậc hai phức
  const csqrt = (a, b) => { const r = Math.hypot(a, b), x = Math.sqrt((r + a) / 2), y = Math.sign(b || 1) * Math.sqrt(Math.max(0, (r - a) / 2)); return [x, y]; };
  /* Butterworth số: nguyên mẫu tương tự (cực trên đường tròn đơn vị) → biến đổi tần số
     (thấp→thấp/cao/dải/chắn dải) với tần số đã prewarp Ω = tan(πWn/2) → song tuyến z = (1+s)/(1−s) */
  function butterV(n, Wn, type) {
    if (!Number.isInteger(n) || n < 1) err('butter(n, Wn): n là bậc (số nguyên dương)');
    const w = reArr(Wn);
    if (w.length > 2 || !w.length) err('butter: Wn là một số (thông thấp/cao) hoặc [w1 w2] (thông dải/chắn dải)');
    if (w.some(v => !(v > 0 && v < 1))) err('butter: Wn phải nằm trong (0, 1), chuẩn hoá theo Nyquist: Wn = fc / (fs/2)');
    if (w.length === 2 && !(w[0] < w[1])) err('butter: với Wn = [w1 w2] cần w1 < w2');
    type = type || (w.length === 2 ? 'bandpass' : 'low');
    if (type === 'band') type = 'bandpass';
    if (w.length === 2 && (type === 'low' || type === 'high')) err(`butter: kiểu '${type}' cần Wn là một số`);
    if (w.length === 1 && (type === 'bandpass' || type === 'stop')) err(`butter: kiểu '${type}' cần Wn = [w1 w2]`);
    if (!['low', 'high', 'bandpass', 'stop'].includes(type)) err(`butter: kiểu '${type}' không hỗ trợ (dùng 'low', 'high', 'bandpass', 'stop')`);
    const proto = []; for (let k = 1; k <= n; k++) { const th = PI * (2 * k + n - 1) / (2 * n); proto.push([Math.cos(th), Math.sin(th)]); }
    const W = w.map(v => Math.tan(PI * v / 2));
    let sp = [], sz = [], at;
    if (type === 'low') { sp = proto.map(p => [W[0] * p[0], W[0] * p[1]]); at = 0; }
    else if (type === 'high') { sp = proto.map(p => cdiv(W[0], 0, p[0], p[1])); sz = new Array(n).fill([0, 0]); at = PI; }
    else {
      const Bw = W[1] - W[0], W0s = W[0] * W[1];
      for (const p of proto) {
        if (type === 'bandpass') { // s² − pB·s + Ω0² = 0
          const pb = [p[0] * Bw, p[1] * Bw], d = csqrt(pb[0] * pb[0] - pb[1] * pb[1] - 4 * W0s, 2 * pb[0] * pb[1]);
          sp.push([(pb[0] + d[0]) / 2, (pb[1] + d[1]) / 2], [(pb[0] - d[0]) / 2, (pb[1] - d[1]) / 2]);
        } else { // p·s² − B·s + p·Ω0² = 0
          const d = csqrt(Bw * Bw - 4 * W0s * (p[0] * p[0] - p[1] * p[1]), -8 * W0s * p[0] * p[1]);
          sp.push(cdiv(Bw + d[0], d[1], 2 * p[0], 2 * p[1]), cdiv(Bw - d[0], -d[1], 2 * p[0], 2 * p[1]));
        }
      }
      if (type === 'bandpass') { sz = new Array(n).fill([0, 0]); at = 2 * Math.atan(Math.sqrt(W0s)); }
      else { const r = Math.sqrt(W0s); for (let k = 0; k < n; k++) sz.push([0, r], [0, -r]); at = 0; }
    }
    const bil = s => cdiv(1 + s[0], s[1], 1 - s[0], -s[1]);
    const p = sp.map(bil), z = sz.map(bil);
    while (z.length < p.length) z.push([-1, 0]);           // không ở vô cực → z = −1
    const A = polyC(p.map(q => q[0]), p.map(q => q[1])).re, Bp = polyC(z.map(q => q[0]), z.map(q => q[1])).re;
    const k = 1 / Math.hypot(...H_at(Bp, A, at));
    return { b: Bp.map(v => v * k), a: A, z, p, k };
  }
  const NOT_FN = new Set(['plot', 'stem', 'stairs', 'bar', 'title', 'xlabel', 'ylabel']);

  /* ---------- thư viện hàm có sẵn ---------- */
  const FN = {};
  const def = (names, f) => names.split(' ').forEach(n => FN[n] = f);
  const elem = (names, fr, fc) => def(names, (I, a) => { if (!a.length) err('Thiếu đối số'); return map(a[0], fr, fc); });
  // toán học cơ bản
  elem('sin', Math.sin, (a, b) => [Math.sin(a) * Math.cosh(b), Math.cos(a) * Math.sinh(b)]);
  elem('cos', Math.cos, (a, b) => [Math.cos(a) * Math.cosh(b), -Math.sin(a) * Math.sinh(b)]);
  elem('tan', Math.tan); elem('asin', Math.asin); elem('acos', Math.acos); elem('atan', Math.atan);
  elem('sinh', Math.sinh); elem('cosh', Math.cosh); elem('tanh', Math.tanh);
  elem('exp', Math.exp, cexp);
  def('log', (I, a) => mapC(a[0], x => x < 0, Math.log, clog));
  def('log10', (I, a) => mapC(a[0], x => x < 0, Math.log10, (x, y) => { const z = clog(x, y); return [z[0] / Math.LN10, z[1] / Math.LN10]; }));
  def('log2', (I, a) => map(a[0], Math.log2));
  def('sqrt', (I, a) => mapC(a[0], x => x < 0, Math.sqrt, (x, y) => y === 0 ? (x < 0 ? [0, Math.sqrt(-x)] : [Math.sqrt(x), 0]) : cpow(x, y, 0.5, 0)));
  def('abs', (I, a) => { const m = asM(a[0]); const o = new Mat(m.r, m.c); for (let k = 0; k < m.n; k++) o.re[k] = m.im ? Math.hypot(m.re[k], m.im[k]) : Math.abs(m.re[k]); return o; });
  def('angle', (I, a) => { const m = asM(a[0]); const o = new Mat(m.r, m.c); for (let k = 0; k < m.n; k++) o.re[k] = Math.atan2(m.im ? m.im[k] : 0, m.re[k]); return o; });
  def('real', (I, a) => { const m = asM(a[0]); return new Mat(m.r, m.c, Float64Array.from(m.re)); });
  def('imag', (I, a) => { const m = asM(a[0]); return new Mat(m.r, m.c, m.im ? Float64Array.from(m.im) : null); });
  def('conj', (I, a) => { const m = cloneV(asM(a[0])); if (m.im) for (let k = 0; k < m.n; k++) m.im[k] = -m.im[k]; return m; });
  def('complex', (I, a) => ew(a[0], a[1] || S(0), null, (p, q, r) => [p, r], true));
  def('round', (I, a) => { const d = a[1] ? num(a[1]) : 0, f = Math.pow(10, d); const r = x => Math.sign(x) * Math.round(Math.abs(x) * f) / f; return map(a[0], r, (x, y) => [r(x), r(y)]); });
  elem('floor', Math.floor, (x, y) => [Math.floor(x), Math.floor(y)]); elem('ceil', Math.ceil, (x, y) => [Math.ceil(x), Math.ceil(y)]); elem('fix', Math.trunc, (x, y) => [Math.trunc(x), Math.trunc(y)]);
  elem('sign', Math.sign);
  def('mod', (I, a) => ew(a[0], a[1], (x, y) => y === 0 ? x : x - Math.floor(x / y) * y));
  def('rem', (I, a) => ew(a[0], a[1], (x, y) => y === 0 ? x : x - Math.trunc(x / y) * y));
  def('atan2', (I, a) => ew(a[0], a[1], Math.atan2));
  def('hypot', (I, a) => ew(a[0], a[1], Math.hypot));
  def('power', (I, a) => power(a[0], a[1])); def('times', (I, a) => times(a[0], a[1])); def('plus', (I, a) => plus(a[0], a[1])); def('minus', (I, a) => minus(a[0], a[1]));
  def('sinc', (I, a) => map(a[0], x => x === 0 ? 1 : Math.sin(PI * x) / (PI * x)));
  def('deg2rad', (I, a) => map(a[0], x => x * PI / 180)); def('rad2deg', (I, a) => map(a[0], x => x * 180 / PI));
  def('isnan', (I, a) => { const o = map(a[0], x => Number.isNaN(x) ? 1 : 0); o.lg = true; return o; });
  def('isinf', (I, a) => { const o = map(a[0], x => (!isFinite(x) && !Number.isNaN(x)) ? 1 : 0); o.lg = true; return o; });
  def('isfinite', (I, a) => { const o = map(a[0], x => isFinite(x) ? 1 : 0); o.lg = true; return o; });
  def('gcd', (I, a) => ew(a[0], a[1], (x, y) => gcd(x, y))); def('lcm', (I, a) => ew(a[0], a[1], (x, y) => x * y / gcd(x, y)));
  def('nextpow2', (I, a) => map(a[0], x => x === 0 ? 0 : Math.ceil(Math.log2(Math.abs(x)))));
  def('factorial', (I, a) => map(a[0], x => { let r = 1; for (let k = 2; k <= x; k++) r *= k; return r; }));
  // hằng số
  FN.pi = () => S(PI); FN.eps = () => S(Number.EPSILON); FN.Inf = FN.inf = () => S(Infinity); FN.NaN = FN.nan = () => S(NaN);
  FN.i = FN.j = FN['1i'] = () => CX(0, 1);
  // tạo mảng
  const dims = (a, f) => {
    if (!a.length) return [1, 1];
    if (a.length === 1) { const m = asM(a[0]); if (m.n >= 2) return [m.re[0], m.re[1]]; return [m.re[0], m.re[0]]; }
    return [num(a[0]), num(a[1])];
  };
  const sizeArgs = a => { a = a.filter(v => !(v instanceof Str)); if (!a.length) return [1, 1]; if (a.length === 1) { const m = asM(a[0]); return m.n >= 2 ? Array.from(m.re) : [m.re[0], m.re[0]]; } return a.map(v => num(v)); };
  const filled = f => (I, a) => { const d = sizeArgs(a).map(x => Math.max(0, Math.floor(x))); if (prod(d) > 2e7) err('Mảng quá lớn'); const o = mkND(d); for (let k = 0; k < o.n; k++) o.re[k] = f(I); return o; };
  FN.zeros = filled(() => 0); FN.ones = filled(() => 1);
  FN.rand = filled(I => I.rand()); FN.randn = filled(I => I.rand.n());
  FN.randi = (I, a) => { const mx = num(a[0]); return filled(I2 => 1 + Math.floor(I2.rand() * mx))(I, a.slice(1)); };
  FN.true = (I, a) => { const o = filled(() => 1)(I, a); o.lg = true; return o; };
  FN.false = (I, a) => { const o = filled(() => 0)(I, a); o.lg = true; return o; };
  FN.eye = (I, a) => { const [r, c] = dims(a); const o = new Mat(r, c); for (let k = 0; k < Math.min(r, c); k++) o.re[k + k * r] = 1; return o; };
  FN.rng = (I, a) => { if (a.length && !(a[0] instanceof Str)) I.rand = rng(Math.floor(num(a[0])) + 1); };
  FN.linspace = (I, a) => { const x0 = num(a[0]), x1 = num(a[1]), n = a[2] ? Math.floor(num(a[2])) : 100; const o = new Mat(1, n); for (let k = 0; k < n; k++) o.re[k] = n === 1 ? x1 : x0 + (x1 - x0) * k / (n - 1); return o; };
  FN.logspace = (I, a) => { const l = FN.linspace(I, a); return map(l, x => Math.pow(10, x)); };
  FN.colon = (I, a) => colonRange(a[0], a.length > 2 ? a[1] : undefined, a[a.length - 1]);
  FN.repmat = (I, a) => { const m = asM(a[0]); const [rr, cc] = dims(a.slice(1)); let row = horz(new Array(cc).fill(m)); return vert(new Array(rr).fill(row)); };
  FN.reshape = (I, a) => {
    const m = asM(a[0]); const d = a.length === 2 ? reArr(a[1]) : a.slice(1).map(v => asM(v).n ? num(v) : NaN);
    const miss = d.findIndex(Number.isNaN); if (miss >= 0) d[miss] = m.n / prod(d.filter((_, k) => k !== miss));
    if (prod(d) !== m.n || d.some(x => !Number.isInteger(x))) err(`reshape: không thể đổi ${m.n} phần tử thành ${d.join('×')}`);
    return withDims(m, d);
  };
  FN.squeeze = (I, a) => { const m = asM(a[0]); if (!m.dims) return m; let d = m.dims.filter(x => x !== 1); if (d.length === 1) d = [d[0], 1]; return withDims(m, d.length ? d : [1, 1]); };
  FN.permute = (I, a) => {
    const m = asM(a[0]), ord = reArr(a[1]).map(x => x - 1), d = dimsOf(m); while (d.length < ord.length) d.push(1);
    if (ord.length < d.length || ord.slice().sort((x, y) => x - y).some((x, k) => x !== k)) err('permute: thứ tự chiều phải là một hoán vị của 1..ndims');
    const nd = ord.map(k => d[k]), o = mkND(nd); if (m.im) o.im = new Float64Array(o.n);
    const sIn = []; let s = 1; for (let k = 0; k < d.length; k++) { sIn.push(s); s *= d[k]; }
    const sub = new Array(nd.length).fill(0);
    for (let q = 0; q < o.n; q++) {
      let src = 0; for (let k = 0; k < nd.length; k++) src += sub[k] * sIn[ord[k]];
      o.re[q] = m.re[src]; if (m.im) o.im[q] = m.im[src];
      for (let k = 0; k < nd.length; k++) { if (++sub[k] < nd[k]) break; sub[k] = 0; }
    }
    return clean(o);
  };
  FN.cat = (I, a) => {
    const dim = num(a[0]), L = a.slice(1).filter(v => !(v instanceof Mat && v.n === 0));
    if (!L.length) return EMPTY();
    if (dim === 1 && !L.some(v => v.dims)) return vert(L);
    if (dim === 2 && !L.some(v => v.dims)) return horz(L);
    const ms = L.map(asM), D = ms.map(m => { const d = dimsOf(m); while (d.length < dim) d.push(1); return d; }), base = D[0];
    for (const d of D) if (d.length !== base.length || d.some((x, k) => k !== dim - 1 && x !== base[k])) err('cat: các mảng phải cùng kích thước ở mọi chiều trừ chiều ghép');
    const od = base.slice(); od[dim - 1] = D.reduce((s, d) => s + d[dim - 1], 0);
    const o = mkND(od), C = ms.some(m => m.im); if (C) o.im = new Float64Array(o.n);
    const before = prod(base.slice(0, dim - 1)), after = prod(base.slice(dim)); let off = 0;
    ms.forEach((m, t) => {
      const len = D[t][dim - 1];
      for (let a2 = 0; a2 < after; a2++) for (let l = 0; l < len; l++) for (let b = 0; b < before; b++) {
        const src = b + l * before + a2 * before * len, dst = b + (off + l) * before + a2 * before * od[dim - 1];
        o.re[dst] = m.re[src]; if (C) o.im[dst] = m.im ? m.im[src] : 0;
      }
      off += len;
    });
    return clean(o);
  };
  // struct
  FN.struct = (I, a) => {
    if (!a.length) return new Struct(1, 1, [new Map()]);
    if (a.length % 2) err("struct: cần các cặp 'tên', giá trị");
    let n = 1; for (let k = 1; k < a.length; k += 2) if (a[k] instanceof Cell && a[k].n !== 1) { if (n !== 1 && a[k].n !== n) err('struct: các cell giá trị phải cùng số phần tử'); n = a[k].n; }
    const el = [];
    for (let t = 0; t < n; t++) { const mp = new Map(); for (let k = 0; k < a.length; k += 2) { const v = a[k + 1]; mp.set(str(a[k], 'Tên trường'), v instanceof Cell ? (v.n === 1 ? cloneV(v.v[0]) : cloneV(v.v[t])) : cloneV(v)); } el.push(mp); }
    return new Struct(n ? 1 : 0, n, el);
  };
  const needS = (v, f) => { if (!(v instanceof Struct)) err(`${f}: đối số phải là struct`); return v; };
  FN.fieldnames = (I, a) => { const s = needS(a[0], 'fieldnames'); const ks = s.el[0] ? [...s.el[0].keys()] : []; return new Cell(ks.map(k => new Str(k)), ks.length, 1); };
  FN.isfield = (I, a) => { if (!(a[0] instanceof Struct)) return B(false); const has = k => !!a[0].el[0] && a[0].el[0].has(k); if (a[1] instanceof Cell) { const o = rowv(a[1].v.map(x => has(str(x)) ? 1 : 0)); o.lg = true; return o; } return B(has(str(a[1], 'Tên trường'))); };
  FN.rmfield = (I, a) => { const s = cloneV(needS(a[0], 'rmfield')), k = str(a[1], 'Tên trường'); if (!s.el[0] || !s.el[0].has(k)) err(`rmfield: không có trường '${k}'`); s.el.forEach(mp => mp.delete(k)); return s; };
  FN.getfield = (I, a) => { const s = needS(a[0], 'getfield'), k = str(a[1]); if (!s.el[0] || !s.el[0].has(k)) err(`getfield: không có trường '${k}'`); return s.el[0].get(k); };
  FN.setfield = (I, a) => { const s = a[0] instanceof Struct ? cloneV(a[0]) : new Struct(1, 1, [new Map()]); s.el[0].set(str(a[1]), cloneV(a[2])); return s; };
  FN.isstruct = (I, a) => B(a[0] instanceof Struct);
  // cell
  FN.cell = (I, a) => { const d = sizeArgs(a); if (d.length > 2) err('cell: chỉ hỗ trợ 2 chiều'); const n = d[0] * d[1]; return new Cell(Array.from({ length: n }, () => EMPTY()), d[0], d[1]); };
  FN.iscell = (I, a) => B(a[0] instanceof Cell);
  FN.iscellstr = (I, a) => B(a[0] instanceof Cell && a[0].v.every(isStr));
  FN.num2cell = (I, a) => { const m = asM(a[0]); return new Cell(Array.from(m.re).map((x, k) => m.im ? CX(x, m.im[k]) : S(x)), m.r, m.c); };
  FN.cell2mat = (I, a) => { const c = a[0]; if (!(c instanceof Cell)) err('cell2mat: cần cell array'); if (!c.n) return EMPTY(); const rows = []; for (let i = 0; i < c.r; i++) { const r = []; for (let j = 0; j < c.c; j++) r.push(c.v[i + j * c.r]); rows.push(horz(r)); } return vert(rows); };
  FN.cellfun = (I, a) => {
    let f = a[0]; if (f instanceof Str) f = new FH(f.s);
    let k = 1; const cs = []; while (k < a.length && a[k] instanceof Cell) cs.push(a[k++]);
    let uni = true; for (; k < a.length - 1; k += 2) if (a[k] instanceof Str && /uniformoutput/i.test(a[k].s)) uni = truthy(a[k + 1]);
    if (!cs.length) err('cellfun: cần ít nhất một cell array');
    const res = [];
    for (let t = 0; t < cs[0].n; t++) { let r = I.callValue(f, cs.map(c => c.v[t]), 1); if (Array.isArray(r)) r = r[0]; res.push(r); }
    if (!uni) return new Cell(res, cs[0].r, cs[0].c);
    const o = new Mat(cs[0].r, cs[0].c); res.forEach((r, t) => { const m = asM(r); if (m.n !== 1) err("cellfun: kết quả không phải một số; thêm 'UniformOutput', false"); o.re[t] = m.re[0]; }); return o;
  };
  FN.strjoin = (I, a) => { const c = a[0]; if (!(c instanceof Cell)) err('strjoin: cần cell chứa chuỗi'); const d = a[1] ? str(a[1]).replace(/\\n/g, '\n').replace(/\\t/g, '\t') : ' '; return new Str(c.v.map(x => str(x)).join(d)); };
  FN.strsplit = (I, a) => { const s = str(a[0]); const parts = a[1] ? s.split(str(a[1])) : s.split(/\s+/).filter((x, k, arr) => x.length || (k > 0 && k < arr.length - 1)); return new Cell(parts.map(p => new Str(p))); };
  FN.class = (I, a) => new Str(typeName(a[0]));
  FN.isnumeric = (I, a) => B(a[0] instanceof Mat && !a[0].lg);
  FN.islogical = (I, a) => B(a[0] instanceof Mat && !!a[0].lg);
  FN.deal = (I, a, no) => { const out = []; for (let k = 0; k < Math.max(no, 1); k++) out.push(cloneV(a.length === 1 ? a[0] : a[k])); return no >= 2 ? out : out[0]; };
  FN.horzcat = (I, a) => horz(a); FN.vertcat = (I, a) => vert(a);
  FN.double = FN.single = (I, a) => a[0] instanceof Str ? asM(a[0]) : cloneV(asM(a[0]));
  FN.logical = (I, a) => { const o = map(a[0], x => x !== 0 ? 1 : 0); o.lg = true; return o; };
  const intc = (lo, hi) => (I, a) => map(a[0], x => clamp(Math.round(x), lo, hi));
  FN.int8 = intc(-128, 127); FN.int16 = intc(-32768, 32767); FN.int32 = intc(-2147483648, 2147483647); FN.uint8 = intc(0, 255); FN.uint16 = intc(0, 65535);
  // kích thước
  FN.length = (I, a) => { const d = vshape(a[0]); return S(prod(d) ? Math.max(...d) : 0); };
  FN.numel = (I, a) => S(prod(vshape(a[0])));
  FN.size = (I, a, no) => {
    const d = vshape(a[0]);
    if (a[1]) { const k = num(a[1]); return S(k <= d.length ? d[k - 1] : 1); }
    if (no >= 2) { const out = []; for (let k = 0; k < no; k++) out.push(S(k < no - 1 ? (k < d.length ? d[k] : 1) : prod(d.slice(k)))); return out; }
    return rowv(d);
  };
  FN.ndims = (I, a) => S(vshape(a[0]).length);
  FN.isempty = (I, a) => B(prod(vshape(a[0])) === 0);
  FN.isrow = (I, a) => B(asM(a[0]).r === 1); FN.iscolumn = (I, a) => B(asM(a[0]).c === 1);
  FN.isvector = (I, a) => { const m = asM(a[0]); return B(isVec(m) && m.n >= 1); }; FN.isscalar = (I, a) => B(asM(a[0]).n === 1);
  FN.isreal = (I, a) => B(!asM(a[0]).im); FN.ischar = FN.isstring = (I, a) => B(a[0] instanceof Str);
  FN.isequal = (I, a) => { const x = asM(a[0]), y = asM(a[1]); if (x.r !== y.r || x.c !== y.c) return B(false); for (let k = 0; k < x.n; k++) if (x.re[k] !== y.re[k] || (x.im ? x.im[k] : 0) !== (y.im ? y.im[k] : 0)) return B(false); return B(true); };
  // rút gọn theo chiều
  const firstDim = m => (dimsOf(m).findIndex(x => x !== 1) + 1) || 1;
  function reduceND(m, dim, f, init) {
    const d = dimsOf(m); while (d.length < dim) d.push(1);
    const od = d.slice(); od[dim - 1] = 1; const o = mkND(od), C = !!m.im; if (C) o.im = new Float64Array(o.n);
    const before = prod(d.slice(0, dim - 1)), len = d[dim - 1], after = prod(d.slice(dim));
    for (let a2 = 0; a2 < after; a2++) for (let b = 0; b < before; b++) {
      let acc = [init, 0];
      for (let t = 0; t < len; t++) { const k = b + t * before + a2 * before * len; acc = f(acc, m.re[k], C ? m.im[k] : 0); }
      const q = b + a2 * before; o.re[q] = acc[0]; if (C) o.im[q] = acc[1];
    }
    return clean(o);
  }
  function reduce(a, dimArg, f, init) {
    const m0 = asM(a);
    if (m0.dims || (dimArg && num(dimArg) >= 3)) return reduceND(m0, dimArg ? num(dimArg) : firstDim(m0), f, init);
    const m = m0; let dim = dimArg ? num(dimArg) : (m.r === 1 ? 2 : 1);
    if (m.n === 0) return S(init);
    if (dim === 1) { const o = new Mat(1, m.c); if (m.im) o.im = new Float64Array(m.c); for (let j = 0; j < m.c; j++) { let acc = [init, 0]; for (let i = 0; i < m.r; i++) acc = f(acc, m.re[i + j * m.r], m.im ? m.im[i + j * m.r] : 0); o.re[j] = acc[0]; if (o.im) o.im[j] = acc[1]; } return clean(o); }
    const o = new Mat(m.r, 1); if (m.im) o.im = new Float64Array(m.r); for (let i = 0; i < m.r; i++) { let acc = [init, 0]; for (let j = 0; j < m.c; j++) acc = f(acc, m.re[i + j * m.r], m.im ? m.im[i + j * m.r] : 0); o.re[i] = acc[0]; if (o.im) o.im[i] = acc[1]; } return clean(o);
  }
  FN.sum = (I, a) => reduce(a[0], a[1], (s, x, y) => [s[0] + x, s[1] + y], 0);
  FN.prod = (I, a) => reduce(a[0], a[1], (s, x, y) => cmul(s[0], s[1], x, y), 1);
  FN.mean = (I, a) => { const m = asM(a[0]); const d = dimsOf(m); const dim = a[1] ? num(a[1]) : (m.dims ? firstDim(m) : (m.r === 1 ? 2 : 1)); return rdiv(FN.sum(I, [m, S(dim)]), S(dim <= d.length ? d[dim - 1] : 1)); };
  FN.rms = (I, a) => FN.sqrt(I, [FN.mean(I, [map(FN.abs(I, [a[0]]), x => x * x)])]);
  FN.var = (I, a) => { const x = reArr(a[0]), n = x.length, mu = x.reduce((s, v) => s + v, 0) / n; return S(x.reduce((s, v) => s + (v - mu) ** 2, 0) / Math.max(1, n - 1)); };
  FN.std = (I, a) => S(Math.sqrt(num(FN.var(I, a))));
  FN.norm = (I, a) => { const m = asM(a[0]); let s = 0; for (let k = 0; k < m.n; k++) s += m.re[k] ** 2 + (m.im ? m.im[k] ** 2 : 0); return S(Math.sqrt(s)); };
  FN.dot = (I, a) => { const x = asM(a[0]), y = asM(a[1]); if (x.n !== y.n) err('dot: hai vector phải cùng độ dài'); let s = 0; for (let k = 0; k < x.n; k++) s += x.re[k] * y.re[k]; return S(s); };
  const cum = f => (I, a) => { const m = asM(a[0]); const o = cloneV(m); if (!isVec(m)) err('Chỉ hỗ trợ vector'); let acc = [f === 'p' ? 1 : 0, 0]; for (let k = 0; k < m.n; k++) { acc = f === 'p' ? cmul(acc[0], acc[1], m.re[k], m.im ? m.im[k] : 0) : [acc[0] + m.re[k], acc[1] + (m.im ? m.im[k] : 0)]; o.re[k] = acc[0]; if (o.im) o.im[k] = acc[1]; } return o; };
  FN.cumsum = cum('s'); FN.cumprod = cum('p');
  const minmax = sgn => (I, a, no) => {
    if (a.length >= 2 && asM(a[1]).n > 0) return ew(a[0], a[1], (x, y) => sgn * x > sgn * y ? x : y);
    const pick = (s, x) => [sgn * x > sgn * s[0] ? x : s[0], 0];
    if (a.length >= 3) return reduceND(asM(a[0]), num(a[2]), pick, sgn > 0 ? -Infinity : Infinity);
    if (asM(a[0]).dims) return reduceND(asM(a[0]), firstDim(asM(a[0])), pick, sgn > 0 ? -Infinity : Infinity);
    const m = asM(a[0]); if (!m.n) return no >= 2 ? [EMPTY(), EMPTY()] : EMPTY();
    const key = k => m.im ? Math.hypot(m.re[k], m.im[k]) : m.re[k];
    const one = ks => { let bi = ks[0]; for (const k of ks) if (sgn * key(k) > sgn * key(bi) || Number.isNaN(key(bi))) bi = k; return bi; };
    if (isVec(m)) { const ks = range(0, m.n - 1), bi = one(ks); const v = m.im ? CX(m.re[bi], m.im[bi]) : S(m.re[bi]); return no >= 2 ? [v, S(bi + 1)] : v; }
    const o = new Mat(1, m.c), ix = new Mat(1, m.c); for (let j = 0; j < m.c; j++) { const bi = one(range(j * m.r, j * m.r + m.r - 1)); o.re[j] = m.re[bi]; ix.re[j] = bi - j * m.r + 1; }
    return no >= 2 ? [o, ix] : o;
  };
  FN.max = minmax(1); FN.min = minmax(-1);
  FN.sort = (I, a, no) => { const m = asM(a[0]); const desc = a[1] instanceof Str && /desc/i.test(a[1].s); const key = k => m.im ? Math.hypot(m.re[k], m.im[k]) : m.re[k]; const ks = range(0, m.n - 1).sort((p, q) => desc ? key(q) - key(p) : key(p) - key(q)); const o = vecOut(m, ks.map(k => m.re[k]), m.im ? ks.map(k => m.im[k]) : null); return no >= 2 ? [o, vecOut(m, ks.map(k => k + 1))] : o; };
  FN.find = (I, a) => { const m = asM(a[0]); const lim = a[1] ? num(a[1]) : Infinity; const out = []; for (let k = 0; k < m.n && out.length < lim; k++) if (m.re[k] !== 0 || (m.im && m.im[k] !== 0)) out.push(k + 1); return m.r === 1 ? rowv(out) : colv(out); };
  FN.any = (I, a) => { const m = asM(a[0]); for (let k = 0; k < m.n; k++) if (m.re[k] !== 0) return B(true); return B(false); };
  FN.all = (I, a) => { const m = asM(a[0]); for (let k = 0; k < m.n; k++) if (m.re[k] === 0) return B(false); return B(true); };
  FN.diff = (I, a) => { const m = asM(a[0]); if (!isVec(m)) err('diff: chỉ hỗ trợ vector'); const r = []; for (let k = 1; k < m.n; k++) r.push(m.re[k] - m.re[k - 1]); return vecOut(m, r); };
  FN.fliplr = FN.flip = (I, a) => { const m = asM(a[0]); if (isVec(m)) { const o = cloneV(m); o.re.reverse(); if (o.im) o.im.reverse(); return o; } const o = new Mat(m.r, m.c); for (let j = 0; j < m.c; j++) for (let i = 0; i < m.r; i++) o.re[i + j * m.r] = m.re[i + (m.c - 1 - j) * m.r]; return o; };
  FN.flipud = (I, a) => { const m = asM(a[0]); const o = new Mat(m.r, m.c); for (let j = 0; j < m.c; j++) for (let i = 0; i < m.r; i++) o.re[i + j * m.r] = m.re[m.r - 1 - i + j * m.r]; return o; };
  FN.circshift = (I, a) => { const m = asM(a[0]); if (!isVec(m)) err('circshift: chỉ hỗ trợ vector'); const k = num(a[1]), n = m.n; const o = cloneV(m); for (let t = 0; t < n; t++) { const s = ((t - k) % n + n) % n; o.re[t] = m.re[s]; if (o.im) o.im[t] = m.im[s]; } return o; };
  FN.unwrap = (I, a) => { const x = reArr(a[0]); const o = x.slice(); for (let k = 1; k < x.length; k++) { let d = x[k] - x[k - 1]; d -= TAU * Math.round(d / TAU); o[k] = o[k - 1] + d; } return vecOut(asM(a[0]), o); };
  FN.floor2 = null;
  // đa thức
  FN.roots = (I, a) => { const r = rootsOf(a[0]); return clean(new Mat(r.length, 1, Float64Array.from(r.map(z => z[0])), Float64Array.from(r.map(z => z[1])))); };
  FN.poly = (I, a) => { const m = asM(a[0]); const P = polyC(Array.from(m.re), m.im ? Array.from(m.im) : new Array(m.n).fill(0)); const o = rowv(P.re); if (P.im) o.im = Float64Array.from(P.im); return o; };
  FN.polyval = (I, a) => { const p = asM(a[0]); return ew(a[1], S(0), null, (x, y) => { let r = [0, 0]; for (let k = 0; k < p.n; k++) { r = cmul(r[0], r[1], x, y); r[0] += p.re[k]; r[1] += p.im ? p.im[k] : 0; } return r; }, true); };
  FN.conv = (I, a) => { const x = asM(a[0]), h = asM(a[1]); const L = x.n + h.n - 1; if (!x.n || !h.n) return EMPTY(); const yr = new Float64Array(L), yi = new Float64Array(L); const C = x.im || h.im; for (let i = 0; i < x.n; i++) for (let j = 0; j < h.n; j++) { const z = cmul(x.re[i], x.im ? x.im[i] : 0, h.re[j], h.im ? h.im[j] : 0); yr[i + j] += z[0]; yi[i + j] += z[1]; } return vecOut(x.r === 1 && h.r === 1 || x.r === 1 && x.n > 1 ? { r: 1 } : (x.n === 1 ? h : x), yr, C ? yi : null); };
  FN.filter = (I, a) => filterV(a[0], a[1], a[2]);
  // FFT
  FN.fft = (I, a) => { const x = asM(a[0]); if (!isVec(x)) err('fft: trình chạy web chỉ hỗ trợ vector'); const N = a[1] ? num(a[1]) : x.n; const { re, im } = fftV(x, N); return vecOut(x.r === 1 ? x : { r: 0 }, re, im); };
  FN.ifft = (I, a) => { const x = asM(a[0]); const N = a[1] ? num(a[1]) : x.n; const c = cloneV(x); if (c.im) for (let k = 0; k < c.n; k++) c.im[k] = -c.im[k]; const { re, im } = fftV(c, N); for (let k = 0; k < N; k++) { re[k] /= N; im[k] = -im[k] / N; } const mx = Math.max(1e-300, ...Array.from(re).map(Math.abs)); const isR = Array.from(im).every(v => Math.abs(v) < 1e-10 * mx); return vecOut(x.r === 1 ? x : { r: 0 }, re, isR ? null : im); };
  FN.fftshift = (I, a) => { const m = asM(a[0]); return FN.circshift(I, [m, S(Math.floor(m.n / 2))]); };
  FN.ifftshift = (I, a) => { const m = asM(a[0]); return FN.circshift(I, [m, S(-Math.floor(m.n / 2))]); };
  FN.bitrevorder = (I, a) => { const m = asM(a[0]), N = m.n, b = Math.log2(N); if (!Number.isInteger(b)) err('bitrevorder: độ dài phải là luỹ thừa của 2'); const ord = range(0, N - 1).map(k => { let r = 0; for (let t = 0; t < b; t++) if (k & (1 << t)) r |= 1 << (b - 1 - t); return r; }); return vecOut(m, ord.map(k => m.re[k]), m.im ? ord.map(k => m.im[k]) : null); };
  // cửa sổ (trả về VECTOR CỘT như MATLAB)
  FN.hamming = (I, a) => winCol('hamming', num(a[0])); FN.hann = (I, a) => winCol('hann', num(a[0])); FN.blackman = (I, a) => winCol('blackman', num(a[0]));
  FN.rectwin = (I, a) => winCol('rect', num(a[0])); FN.kaiser = (I, a) => winCol('kaiser', num(a[0]), a[1] ? num(a[1]) : 0.5);
  FN.hanning = (I, a) => { const N = num(a[0]); return colv(range(1, N).map(k => 0.5 - 0.5 * Math.cos(TAU * k / (N + 1)))); };
  FN.bartlett = FN.triang = (I, a) => { const N = num(a[0]); return colv(range(0, N - 1).map(k => 1 - Math.abs(2 * k / (N - 1) - 1))); };
  // thiết kế bộ lọc
  FN.fir1 = (I, a) => { const n = num(a[0]); let type, win; for (const v of a.slice(2)) { if (v instanceof Str) type = v.s.toLowerCase().replace('pass', '') === 'band' ? 'bandpass' : v.s.toLowerCase(); else win = v; } if (type === 'low' || type === 'high' || type === 'stop' || type === 'bandpass' || !type); else if (type === 'band') type = 'bandpass'; const R = fir1V(n, a[1], type, win); if (R.n !== n) I.print(`Cảnh báo: bộ lọc thông cao/chắn dải cần bậc chẵn, đã tăng bậc lên ${R.n}.`); return rowv(R.h); };
  FN.butter = (I, a, no) => {
    const type = a[2] instanceof Str ? a[2].s.toLowerCase() : undefined; const R = butterV(num(a[0]), a[1], type);
    const cv = L => clean(new Mat(L.length, 1, Float64Array.from(L.map(q => q[0])), Float64Array.from(L.map(q => Math.abs(q[1]) < 1e-12 ? 0 : q[1]))));
    if (no >= 3) return [cv(R.z), cv(R.p), S(R.k)];
    return [rowv(R.b), rowv(R.a)];
  };
  FN.freqz = (I, a, no) => {
    const b = a[0], aa = a[1] && !(a[1] instanceof Str) ? a[1] : S(1);
    let n = 512, fs = null, whole = false;
    const rest = a.slice(2); if (rest[0] && !(rest[0] instanceof Str)) n = num(rest[0]);
    for (const v of rest.slice(1)) { if (v instanceof Str) whole = /whole/i.test(v.s); else fs = num(v); }
    const R = freqzV(b, aa, n, whole);
    const H = new Mat(n, 1, Float64Array.from(R.hr), Float64Array.from(R.hi));
    const W = colv(fs ? R.w.map(w => w / TAU * fs) : R.w);
    if (no >= 1) return [clean(H), W];
    const f = fig(I); f.axes = []; f.cur = null;
    const xs = fs ? R.w.map(w => w / TAU * fs) : R.w.map(w => w / PI);
    const A1 = newAx(2, 1, [1]); A1.series.push({ kind: 'line', x: xs, y: R.hr.map((r, k) => dB(Math.hypot(r, R.hi[k]))), color: 'trace', dash: '-', lw: 1.6 }); A1.grid = true; A1.yl = 'Biên độ (dB)'; A1.xl = fs ? 'Tần số (Hz)' : 'Tần số chuẩn hoá (×π rad/mẫu)';
    const A2 = newAx(2, 1, [2]); const ph = FN.unwrap(I, [rowv(R.hr.map((r, k) => Math.atan2(R.hi[k], r)))]); A2.series.push({ kind: 'line', x: xs, y: Array.from(ph.re).map(v => v * 180 / PI), color: 'trace', dash: '-', lw: 1.6 }); A2.grid = true; A2.yl = 'Pha (độ)'; A2.xl = A1.xl;
    f.axes.push(A1, A2); f.cur = A2;
  };
  FN.impz = (I, a, no) => {
    const b = a[0], aa = a[1] && !(a[1] instanceof Str) ? a[1] : S(1); const n = a[2] ? num(a[2]) : (asM(aa).n === 1 ? asM(b).n : 64);
    const d = new Float64Array(n); d[0] = 1; const h = filterV(b, aa, new Mat(n, 1, d));
    if (no >= 1) return no >= 2 ? [h, colv(range(0, n - 1))] : h;
    addSeries(I, 'stem', [rowv(range(0, n - 1)), h]); const A = ax(I); A.xl = 'n (mẫu)'; A.yl = 'Biên độ'; A.title = 'Đáp ứng xung';
  };
  FN.zplane = (I, a) => {
    const z0 = asM(a[0]), p0 = a[1] ? asM(a[1]) : new Mat(0, 1);
    let Z, P;
    if (z0.c === 1 && z0.n > 1 || p0.c === 1 && p0.n > 1) { Z = Array.from(z0.re).map((r, k) => [r, z0.im ? z0.im[k] : 0]); P = Array.from(p0.re).map((r, k) => [r, p0.im ? p0.im[k] : 0]); }
    else { Z = rootsOf(z0); P = rootsOf(p0); const d = (asM(a[1] || S(1)).n) - z0.n; for (let k = 0; k < d; k++) Z.push([0, 0]); for (let k = 0; k < -d; k++) P.push([0, 0]); }
    const A = ax(I); if (!A.hold) { A.series = []; A.ci = 0; }
    A.series.push({ kind: 'zp', zeros: Z, poles: P }); A.equal = true; A.xl = 'Phần thực'; A.yl = 'Phần ảo';
  };
  FN.downsample = (I, a) => { const m = asM(a[0]), M = num(a[1]), ph = a[2] ? num(a[2]) : 0; const r = []; for (let k = ph; k < m.n; k += M) r.push(m.re[k]); return vecOut(m, r); };
  FN.upsample = (I, a) => { const m = asM(a[0]), L = num(a[1]), ph = a[2] ? num(a[2]) : 0; const r = new Array(m.n * L).fill(0); for (let k = 0; k < m.n; k++) r[k * L + ph] = m.re[k]; return vecOut(m, r); };
  FN.chirp = (I, a) => { const f0 = a[1] ? num(a[1]) : 0, t1 = a[2] ? num(a[2]) : 1, f1 = a[3] ? num(a[3]) : 100; return map(a[0], t => Math.cos(TAU * (f0 * t + (f1 - f0) / (2 * t1) * t * t))); };
  FN.square = (I, a) => { const d = a[1] ? num(a[1]) / 100 : 0.5; return map(a[0], t => { const u = ((t % TAU) + TAU) % TAU / TAU; return u < d ? 1 : -1; }); };
  FN.sawtooth = (I, a) => { const w = a[1] ? num(a[1]) : 1; return map(a[0], t => { const u = ((t % TAU) + TAU) % TAU / TAU; return u < w ? -1 + 2 * u / w : 1 - 2 * (u - w) / (1 - w); }); };
  FN.rectpuls = (I, a) => { const w = a[1] ? num(a[1]) : 1; return map(a[0], t => (t >= -w / 2 && t < w / 2) ? 1 : 0); };
  FN.mag2db = FN.db = (I, a) => map(FN.abs(I, [a[0]]), x => 20 * Math.log10(x));
  FN.pow2db = (I, a) => map(a[0], x => 10 * Math.log10(x)); FN.db2mag = (I, a) => map(a[0], x => Math.pow(10, x / 20)); FN.db2pow = (I, a) => map(a[0], x => Math.pow(10, x / 10));
  FN.spectrogram = (I, a, no) => {
    const x = reArr(a[0]); let w, L;
    if (a[1] && asM(a[1]).n > 1) { w = reArr(a[1]); L = w.length; } else { L = a[1] ? num(a[1]) : Math.floor(x.length / 4.5); w = windowFn('hamming', L); }
    const nov = a[2] && asM(a[2]).n ? num(a[2]) : Math.floor(L / 2), nfft = a[3] && asM(a[3]).n ? num(a[3]) : Math.max(256, Math.pow(2, Math.ceil(Math.log2(L))));
    const fs = a[4] && !(a[4] instanceof Str) ? num(a[4]) : null, yaxis = a.some(v => v instanceof Str && /yaxis/i.test(v.s));
    const hop = L - nov; if (hop <= 0) err('spectrogram: noverlap phải nhỏ hơn độ dài cửa sổ');
    const F = Math.floor((x.length - L) / hop) + 1; if (F < 1) err('spectrogram: tín hiệu ngắn hơn cửa sổ');
    const bins = Math.floor(nfft / 2) + 1, img = new Float32Array(F * bins);
    const Sre = no ? new Float64Array(F * bins) : null, Sim = no ? new Float64Array(F * bins) : null;
    const re = new Float64Array(nfft), im = new Float64Array(nfft), pw2 = nfft & (nfft - 1);
    for (let f = 0; f < F; f++) {
      re.fill(0); im.fill(0);
      for (let k = 0; k < L; k++) re[k % nfft] += x[f * hop + k] * w[k];
      if (!pw2) fft(re, im); else { const D = dft(Array.from(re)); re.set(D.re); im.set(D.im); }
      for (let k = 0; k < bins; k++) { img[k * F + f] = 10 * Math.log10(re[k] * re[k] + im[k] * im[k] + 1e-20); if (Sre) { Sre[k + f * bins] = re[k]; Sim[k + f * bins] = im[k]; } }
    }
    const fsx = fs || TAU, fax = range(0, bins - 1).map(k => k * fsx / nfft), tax = range(0, F - 1).map(f => (f * hop + L / 2) / fsx);
    if (no >= 1) return [clean(new Mat(bins, F, Sre, Sim)), colv(fs ? fax : fax), rowv(tax)];
    let mx = -Infinity; for (const v of img) mx = Math.max(mx, v);
    const A = ax(I); A.series = []; A.ci = 0;
    const fmax = fs ? fs / 2 : 1, tmax = (x.length) / (fs || 1);
    const t0 = tax[0], t1 = tax[F - 1];
    A.series.push({ kind: 'image', data: img, w: F, h: bins, lo: mx - 80, hi: mx, x0: yaxis ? t0 : 0, x1: yaxis ? t1 : fmax, y0: yaxis ? 0 : t0, y1: yaxis ? fmax : t1, transpose: !yaxis });
    const fl = fs ? 'Tần số (Hz)' : 'Tần số chuẩn hoá (×π rad/mẫu)', tl = fs ? 'Thời gian (s)' : 'Mẫu';
    A.xl = yaxis ? tl : fl; A.yl = yaxis ? fl : tl; A.xlim = null; A.ylim = null; A.tight = true;
  };
  FN.imagesc = (I, a) => {
    let x = null, y = null, Cm; if (a.length >= 3) { x = reArr(a[0]); y = reArr(a[1]); Cm = asM(a[2]); } else Cm = asM(a[0]);
    const Fw = Cm.c, Hh = Cm.r, img = new Float32Array(Fw * Hh); let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < Hh; i++) for (let j = 0; j < Fw; j++) { const v = Cm.re[i + j * Hh]; img[i * Fw + j] = v; if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }
    const A = ax(I); A.series = []; A.series.push({ kind: 'image', data: img, w: Fw, h: Hh, lo, hi, x0: x ? x[0] : 1, x1: x ? x[x.length - 1] : Fw, y0: y ? y[0] : 1, y1: y ? y[y.length - 1] : Hh, flipY: !y }); A.tight = true;
  };
  // âm thanh
  FN.sound = FN.soundsc = (I, a) => { const fs = a[1] ? num(a[1]) : 8192; if (I.allowSound && I.onSound) I.onSound(reArr(a[0]), fs); else I.print('(Âm thanh chỉ phát khi bạn bấm nút Chạy.)'); };
  // đồ thị
  FN.figure = (I, a) => { if (a.length && !(a[0] instanceof Str)) { const k = num(a[0]) - 1; while (I.figs.length <= k) newFig(I); I.cf = k; } else newFig(I); };
  FN.clf = I => { const f = fig(I); f.axes = []; f.cur = null; };
  FN.close = I => { I.figs = []; I.cf = -1; };
  FN.subplot = (I, a) => {
    let m, n, ps;
    if (a.length === 1) { const v = num(a[0]); m = Math.floor(v / 100); n = Math.floor(v / 10) % 10; ps = [v % 10]; }
    else { m = num(a[0]); n = num(a[1]); ps = reArr(a[2]); }
    if (ps.some(p => p < 1 || p > m * n)) err(`subplot(${m},${n},p): p phải từ 1 đến ${m * n}`);
    const f = fig(I), key = `${m},${n},${ps.join('.')}`;
    let A = f.axes.find(x => `${x.m},${x.n},${x.ps.join('.')}` === key);
    if (!A) { A = newAx(m, n, ps); f.axes.push(A); }
    f.cur = A;
  };
  FN.plot = (I, a) => addSeries(I, 'line', a);
  FN.stem = (I, a) => addSeries(I, 'stem', a);
  FN.stairs = (I, a) => addSeries(I, 'stairs', a);
  FN.bar = (I, a) => addSeries(I, 'bar', a);
  FN.area = (I, a) => addSeries(I, 'line', a, { fill: true });
  FN.scatter = (I, a) => addSeries(I, 'line', a.slice(0, 2), { dash: 'none', marker: 'o' });
  FN.semilogy = (I, a) => { addSeries(I, 'line', a); const A = ax(I); A.logy = true; };
  FN.hold = (I, a) => { const A = ax(I); A.hold = a.length ? /^on$/i.test(a[0].s) : !A.hold; };
  FN.grid = (I, a) => { ax(I).grid = a.length ? !/^off$/i.test(a[0].s) : !ax(I).grid; };
  FN.box = () => { }; FN.colorbar = () => { }; FN.colormap = () => { }; FN.drawnow = () => { }; FN.shg = () => { }; FN.set = () => { }; FN.pause = () => { };
  FN.gca = FN.gcf = () => S(1);
  FN.title = (I, a) => { ax(I).title = texify(a[0] instanceof Str ? a[0].s : ''); };
  FN.sgtitle = (I, a) => { fig(I).title = texify(str(a[0])); };
  FN.xlabel = (I, a) => { ax(I).xl = texify(str(a[0], 'xlabel')); }; FN.ylabel = (I, a) => { ax(I).yl = texify(str(a[0], 'ylabel')); };
  FN.legend = (I, a) => {
    const A = ax(I); let names = [];
    for (let k = 0; k < a.length; k++) { const v = a[k]; if (v instanceof Cell) names.push(...v.v.map(x => str(x))); else if (v instanceof Str) { if (/^location$/i.test(v.s)) { k++; continue; } if (/^(show|boxoff|boxon|off)$/i.test(v.s)) continue; names.push(v.s); } }
    A.legend = a.length === 1 && a[0] instanceof Str && /^off$/i.test(a[0].s) ? null : names.map(texify);
  };
  FN.xlim = (I, a) => { ax(I).xlim = reArr(a[0]); }; FN.ylim = (I, a) => { ax(I).ylim = reArr(a[0]); };
  FN.axis = (I, a) => { const A = ax(I); for (const v of a) { if (v instanceof Str) { if (/equal|square/i.test(v.s)) A.equal = true; if (/tight/i.test(v.s)) A.tight = true; } else { const l = reArr(v); A.xlim = l.slice(0, 2); if (l.length >= 4) A.ylim = l.slice(2, 4); } } };
  FN.text = (I, a) => { const A = ax(I); A.series.push({ kind: 'text', x: num(a[0]), y: num(a[1]), s: texify(str(a[2], 'text')) }); };
  FN.xline = (I, a) => { const A = ax(I); for (const v of reArr(a[0])) A.series.push({ kind: 'xline', v, color: 'muted', dash: (a[1] instanceof Str && parseSpec(a[1].s).dash) || '--', label: a[2] instanceof Str ? texify(a[2].s) : '' }); };
  FN.yline = (I, a) => { const A = ax(I); for (const v of reArr(a[0])) A.series.push({ kind: 'yline', v, color: 'muted', dash: (a[1] instanceof Str && parseSpec(a[1].s).dash) || '--', label: a[2] instanceof Str ? texify(a[2].s) : '' }); };
  // chuỗi và in ấn
  FN.disp = (I, a) => { const v = a[0]; if (v instanceof Obj && v.C.methods.has('disp')) { I.callUser(v.C.methods.get('disp'), [v], 0); return; } if (v instanceof Obj || v instanceof Struct || v instanceof Cell || (v instanceof Mat && v.dims)) { I.print(display('ans', v, I.long).replace(/^ans =\s*\n/, '').replace(/\n+$/, '')); return; } if (v instanceof Str) I.print(v.s); else if (v instanceof Mat && v.n === 0) { } else if (v instanceof Mat && v.n === 1) I.print(fcx(v.re[0], v.im ? v.im[0] : null, I.long).trim()); else if (v instanceof Mat) I.print(fmtMat(v, I.long)); else I.print(display('', v).replace(/^ = /, '')); };
  FN.fprintf = (I, a) => { let args = a; if (args[0] instanceof Mat && args[0].n === 1 && args[0].re[0] === 1) args = args.slice(1); if (!(args[0] instanceof Str)) { I.print(fmtMat(asM(args[0]))); return; } I.write(sprintfImpl(args[0].s, args.slice(1))); };
  FN.sprintf = (I, a) => new Str(sprintfImpl(str(a[0], 'Định dạng'), a.slice(1)));
  FN.num2str = (I, a) => {
    const v = a[0]; if (v instanceof Str) return v;
    if (a[1] instanceof Str) return new Str(sprintfImpl(a[1].s, [v]));
    const m = asM(v), one = (x, y) => {
      const f = r => { if (Number.isInteger(r)) return String(r); const p = a[1] ? num(a[1]) : Math.max(Math.floor(Math.log10(Math.abs(r) || 1)) + 5, 5); return gfmt(r, p); };
      return y ? f(x) + (y < 0 ? '-' : '+') + f(Math.abs(y)) + 'i' : f(x);
    };
    return new Str(Array.from(m.re).map((x, k) => one(x, m.im ? m.im[k] : 0)).join('  '));
  };
  FN.mat2str = (I, a) => {
    const m = asM(a[0]), p = a[1] ? num(a[1]) : 15, f = x => gfmt(x, p);
    const el = k => m.im && m.im[k] !== 0 ? f(m.re[k]) + (m.im[k] < 0 ? '-' : '+') + f(Math.abs(m.im[k])) + 'i' : f(m.re[k]);
    if (m.n === 1) return new Str(el(0));
    const rows = []; for (let i = 0; i < m.r; i++) { const r = []; for (let j = 0; j < m.c; j++) r.push(el(i + j * m.r)); rows.push(r.join(' ')); }
    return new Str('[' + rows.join(';') + ']');
  };
  FN.str2num = FN.str2double = (I, a) => S(parseFloat(str(a[0])));
  FN.dec2bin = (I, a) => { const d = num(a[0]); if (d < 0 || !Number.isInteger(d)) err('dec2bin: cần số nguyên không âm (với số âm bù 2, dùng dec2bin(mod(x, 2^B), B))'); let s = d.toString(2); if (a[1]) s = s.padStart(num(a[1]), '0'); return new Str(s); };
  FN.dec2hex = (I, a) => { const d = num(a[0]); if (d < 0 || !Number.isInteger(d)) err('dec2hex: cần số nguyên không âm'); let s = d.toString(16).toUpperCase(); if (a[1]) s = s.padStart(num(a[1]), '0'); return new Str(s); };
  FN.bin2dec = (I, a) => S(parseInt(str(a[0]).replace(/\s/g, ''), 2)); FN.hex2dec = (I, a) => S(parseInt(str(a[0]), 16));
  FN.upper = (I, a) => new Str(str(a[0]).toUpperCase()); FN.lower = (I, a) => new Str(str(a[0]).toLowerCase());
  FN.strcmp = (I, a) => B(a[0] instanceof Str && a[1] instanceof Str && a[0].s === a[1].s);
  FN.strcat = (I, a) => new Str(a.map(v => str(v)).join(''));
  FN.error = (I, a) => err(a.length > 1 ? sprintfImpl(str(a[0]), a.slice(1)) : str(a[0], 'error'));
  FN.warning = (I, a) => { if (a[0] instanceof Str && /^(on|off)$/i.test(a[0].s)) return; I.print('Cảnh báo: ' + (a.length ? sprintfImpl(str(a[0]), a.slice(1)) : '')); };
  FN.tic = I => { I.ticT = performance.now(); };
  FN.toc = (I, a, no) => { const t = (performance.now() - (I.ticT || I.t0)) / 1000; if (no >= 1) return S(t); I.print(`Elapsed time is ${t.toFixed(6)} seconds.`); };
  FN.clc = I => { I.out.length = 0; };
  FN.clear = (I, a) => { if (!a.length || a.some(v => /^all$/i.test(v.s))) I.vars.clear(); else a.forEach(v => I.vars.delete(v.s)); };
  FN.format = (I, a) => { I.long = a.length && /long/i.test(a[0].s); };
  FN.more = FN.pkg = () => { };
  FN.exist = (I, a) => { const n = str(a[0]).replace(/\.m$/, ''); return S(I.vars.has(n) ? 1 : (I.files && I.files.has(n)) ? 2 : FN[n] ? 5 : 0); };
  FN.feval = (I, a) => I.callValue(a[0] instanceof Str ? new FH(a[0].s) : a[0], a.slice(1), 1);
  FN.arrayfun = (I, a) => { const f = a[0], m = asM(a[1]); const o = new Mat(m.r, m.c); for (let k = 0; k < m.n; k++) o.re[k] = num(I.callValue(f, [S(m.re[k])], 1)); return o; };
  FN.isa = (I, a) => { const c = str(a[1], 'Tên kiểu'), t = typeName(a[0]); if (a[0] instanceof Obj || a[0] instanceof OArr) return B(isA(a[0].C, c)); return B(c === t || (c === 'numeric' && t === 'double') || (c === 'float' && t === 'double')); };
  // lớp và file
  const objOrClass = (I, v) => v instanceof Obj ? v.C : (v instanceof Str ? (I.loadClass(v.s) || err(`Không có lớp '${v.s}'`)) : err('Cần một đối tượng hoặc tên lớp'));
  FN.properties = (I, a) => { const C = objOrClass(I, a[0]); const ks = [...C.props.keys()]; return new Cell(ks.map(k => new Str(k)), ks.length, 1); };
  FN.methods = (I, a) => { const C = objOrClass(I, a[0]); const ks = [...C.methods.keys(), ...C.statics.keys()]; return new Cell(ks.map(k => new Str(k)), ks.length, 1); };
  FN.isprop = (I, a) => B(a[0] instanceof Obj && a[0].p.has(str(a[1])));
  FN.ismethod = (I, a) => B(a[0] instanceof Obj && (a[0].C.methods.has(str(a[1])) || a[0].C.statics.has(str(a[1]))));
  FN.isobject = (I, a) => B(a[0] instanceof Obj || a[0] instanceof OArr);
  // sự kiện (chỉ lớp handle): addlistener(obj, 'TenSuKien', @(nguon, sk) ...), notify(obj, 'TenSuKien')
  FN.addlistener = (I, a) => {
    const o = a[0]; if (!(o instanceof Obj)) err('addlistener: đối số đầu phải là đối tượng lớp handle');
    const ev = str(a[1], 'Tên sự kiện'); if (!o.C.events.has(ev)) err(`Lớp ${o.C.name} không khai báo sự kiện '${ev}' trong khối events`);
    if (!(a[2] instanceof Fun || a[2] instanceof FH)) err('addlistener: đối số thứ ba phải là hàm, ví dụ @(src, evt) disp(evt.EventName)');
    if (!o.listeners) o.listeners = [];
    o.listeners.push({ ev, cb: a[2] });
    return new Struct(1, 1, [new Map([['EventName', new Str(ev)], ['Source', o]])]);
  };
  FN.notify = (I, a) => {
    const o = a[0]; if (!(o instanceof Obj)) err('notify: đối số đầu phải là đối tượng');
    const ev = str(a[1], 'Tên sự kiện'); if (!o.C.events.has(ev)) err(`Lớp ${o.C.name} không có sự kiện '${ev}'`);
    for (const L of (o.listeners || []).filter(x => x.ev === ev)) {
      const data = new Map([['Source', o], ['EventName', new Str(ev)]]);
      if (a[2] instanceof Struct && a[2].el[0]) for (const [k, v] of a[2].el[0]) data.set(k, v);
      I.callValue(L.cb, [o, new Struct(1, 1, [data])], 0);
    }
  };
  FN.enumeration = (I, a, no) => {
    const C = a[0] instanceof Obj || a[0] instanceof OArr ? a[0].C : (I.loadClass(str(a[0], 'Tên lớp')) || err(`Không có lớp '${a[0].s}'`));
    const names = [...C.enumDefs.keys()]; if (!names.length) err(`${C.name} không phải enumeration`);
    const el = names.map(nm => I.enumMember(C, nm)), arr = el.length === 1 ? el[0] : new OArr(C, el.length, 1, el);
    return no >= 2 ? [arr, new Cell(names.map(s => new Str(s)), names.length, 1)] : arr;
  };
  FN.char = (I, a) => { const v = a[0]; if (v instanceof Str) return v; if (v instanceof Obj && v.enumName) return new Str(v.enumName); return new Str(String.fromCharCode(...Array.from(asM(v).re))); };
  FN.string = (I, a) => FN.char(I, a);
  FN.run = (I, a) => { const nm = str(a[0], 'Tên script').replace(/\.m$/, ''); const fi = I.fileInfo(nm); if (!fi) err(`Không tìm thấy file ${nm}.m`); if (fi.kind !== 'script') err(`${nm}.m không phải script`); I.runScript(fi); };
  FN.help = I => I.print('Trình chạy MATLAB trên web hỗ trợ: ' + Object.keys(FN).filter(k => FN[k]).sort().join(', '));
  FN.floor2 = undefined; delete FN.floor2;

  /* ---------- trình thông dịch ---------- */
  class Interp {
    constructor(o = {}) {
      this.vars = new Map(); this.out = ['']; this.figs = []; this.cf = -1; this.rand = rng(o.seed || 20241); this.endStack = [];
      this.files = o.files instanceof Map ? o.files : new Map(Object.entries(o.files || {}));
      this.fcache = new Map(); this.classes = new Map(); this.localStack = []; this.curFile = null; this.acc = []; this.imports = [];
      this.allowSound = !!o.allowSound; this.onSound = o.onSound; this.t0 = performance.now(); this.deadline = Date.now() + (o.timeout || 8000); this.ops = 0; this.long = false; this.depth = 0;
    }
    write(s) { const parts = s.split('\n'); this.out[this.out.length - 1] += parts[0]; for (let k = 1; k < parts.length; k++) this.out.push(parts[k]); }
    print(s) { if (this.out[this.out.length - 1] !== '') this.out.push(''); this.write(s + '\n'); }
    text() { return this.out.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+/, ''); }
    tick() { if ((++this.ops & 1023) === 0 && Date.now() > this.deadline) throw new MErr('Hết thời gian chạy (quá 8 giây). Kiểm tra vòng lặp vô hạn hoặc giảm kích thước dữ liệu.'); }
    run(src) {
      const ast = parse(lex(src));
      const cdef = ast.find(s => s.t === 'classdef');
      if (cdef) throw new MErr(`classdef phải nằm trong file riêng tên ${cdef.name}.m (tạo tệp mới trong Thư mục làm việc), không đặt trong script`, cdef.line);
      this.ufuncs = new Map();
      for (const s of ast) if (s.t === 'func') {
        if (this.ufuncs.has(s.name)) throw new MErr(`Hàm '${s.name}' được khai báo hai lần`, s.line);
        this.ufuncs.set(s.name, s);
      }
      try { this.block(ast); } catch (e) { if (e instanceof RetSig) return; if (e instanceof BreakSig || e instanceof ContSig) throw new MErr('break/continue chỉ dùng trong vòng lặp'); throw e; }
    }
    /* ---- file .m riêng: hàm, script, classdef ---- */
    fileInfo(name) {
      if (!this.files || !this.files.has(name)) return null;
      if (this.fcache.has(name)) return this.fcache.get(name);
      let ast;
      try { ast = parse(lex(this.files.get(name))); } catch (e) { if (e instanceof MErr) e.file = name; throw e; }
      const funcs = ast.filter(s => s.t === 'func'), locals = new Map(funcs.map(f => [f.name, f]));
      funcs.forEach(f => { f.file = name; f.locals = locals; });
      let fi;
      if (ast[0] && ast[0].t === 'classdef') { ast[0].methods.forEach(m => { m.file = name; m.locals = locals; }); fi = { kind: 'class', name, cd: ast[0], locals }; }
      else if (ast[0] && ast[0].t === 'func') fi = { kind: 'func', name, main: ast[0], locals };
      else fi = { kind: 'script', name, ast, locals };
      this.fcache.set(name, fi); return fi;
    }
    runScript(fi) {
      const sf = this.curFile; this.curFile = fi.name; this.localStack.push(fi.locals);
      try { this.block(fi.ast); } catch (e) { if (!(e instanceof RetSig)) throw e; } finally { this.curFile = sf; this.localStack.pop(); }
    }
    isClassName(n) { const fi = this.fileInfo(n); return !!fi && fi.kind === 'class'; }
    loadClass(name) {
      if (this.classes.has(name)) return this.classes.get(name);
      const fi = this.fileInfo(name); if (!fi || fi.kind !== 'class') return null;
      const cd = fi.cd, short = name.split('.').pop();
      if (cd.name !== short) { const e = new MErr(`Tên lớp '${cd.name}' phải trùng tên file ${short}.m`, cd.line); e.file = name; throw e; }
      const C = { name, short, sup: null, isHandle: false, props: new Map(), consts: new Map(), methods: new Map(), statics: new Map(), ctor: null,
        getters: new Map(), setters: new Map(), dependent: new Set(), events: new Set(), enumDefs: new Map(), enumVals: new Map() };
      for (const s of cd.supers) {
        if (s === 'handle') { C.isHandle = true; continue; }
        const P = this.loadClass(s) || this.loadImported(s); if (!P) err(`Không tìm thấy lớp cha '${s}' (cần file ${s}.m)`);
        C.sup = P; if (P.isHandle) C.isHandle = true;
        for (const key of ['props', 'consts', 'methods', 'statics', 'getters', 'setters']) for (const [k, v] of P[key]) C[key].set(k, v);
        for (const k of P.dependent) C.dependent.add(k); for (const k of P.events) C.events.add(k);
      }
      this.classes.set(name, C);
      for (const p of cd.props) {
        if (p.dependent) { C.dependent.add(p.name); continue; }
        let v = EMPTY();
        if (p.def) { const saved = this.vars; this.vars = new Map(); try { v = this.val(p.def); } catch (e) { if (e instanceof MErr) { e.line = e.line || cd.line; e.file = name; } throw e; } finally { this.vars = saved; } }
        (p.constant ? C.consts : C.props).set(p.name, v);
      }
      const hasSuper = n => { if (!n || typeof n !== 'object') return false; if (n.t === 'super') return true; return Object.values(n).some(x => Array.isArray(x) ? x.some(hasSuper) : (x && typeof x === 'object' && x.t ? hasSuper(x) : false)); };
      for (const m of cd.methods) {
        if (m.name === short) { C.ctor = m; m.superCalled = m.body.some(hasSuper); }
        else if (m.name.startsWith('get.')) C.getters.set(m.name.slice(4), m);
        else if (m.name.startsWith('set.')) C.setters.set(m.name.slice(4), m);
        else (m.static ? C.statics : C.methods).set(m.name, m);
      }
      for (const e of cd.events) C.events.add(e);
      if (C.events.size && !C.isHandle) err(`Lớp ${name} có events nên phải kế thừa handle: classdef ${short} < handle`);
      for (const e of cd.enums) C.enumDefs.set(e.name, e.args);
      return C;
    }
    loadImported(short) {
      for (const imp of this.imports || []) {
        const full = imp.endsWith('.*') ? imp.slice(0, -2) + '.' + short : (imp.split('.').pop() === short ? imp : null);
        if (full && this.files.has(full)) return this.loadClass(full);
      }
      return null;
    }
    // chạy hàm khởi tạo của lớp cha P trên đối tượng o (o@P(...))
    runSuperCtor(P, o, args) {
      let pc = P; while (pc && !pc.ctor) pc = pc.sup;
      if (!pc) { if (args.length) err(`Lớp ${P.name} không có hàm khởi tạo nên không nhận đối số`); return o; }
      if (pc.sup && !pc.ctor.superCalled) this.runSuperCtor(pc.sup, o, []);
      const r = this.callUser(pc.ctor, args, 1, { [pc.ctor.outs[0]]: o });
      if (r instanceof Obj && r !== o) for (const [k, v] of r.p) o.p.set(k, v);   // lớp giá trị: chép kết quả về o
      return o;
    }
    construct(C, args) {
      const o = new Obj(C, new Map([...C.props].map(([k, v]) => [k, cloneV(v)])));
      let cc = C; while (cc && !cc.ctor) cc = cc.sup;
      if (!cc) { if (args.length) err(`Lớp ${C.name} không có hàm khởi tạo nên không nhận đối số`); return o; }
      const out = cc.ctor.outs[0]; if (!out) err(`Hàm khởi tạo phải có dạng: function obj = ${cc.short}(...)`);
      if (cc.sup && !cc.ctor.superCalled) this.runSuperCtor(cc.sup, o, []);   // MATLAB gọi ngầm hàm khởi tạo lớp cha không đối số
      const r = this.callUser(cc.ctor, args, 1, { [out]: o });
      if (!(r instanceof Obj)) err(`Hàm khởi tạo ${cc.short} phải trả về đối tượng`);
      return r;
    }
    enumMember(C, name) {
      if (C.enumVals.has(name)) return C.enumVals.get(name);
      const argNodes = C.enumDefs.get(name);
      const saved = this.vars; this.vars = new Map();
      let o; try { o = this.construct(C, argNodes.map(a => this.val(a))); } finally { this.vars = saved; }
      o.enumName = name; C.enumVals.set(name, o); return o;
    }
    getProp(o, name, no) {
      if (o.C.getters.has(name) && !this.acc.includes('get.' + name)) return this.callAccessor(o.C.getters.get(name), 'get.' + name, [o], 1);
      if (o.p.has(name)) return o.p.get(name);
      err(`Lớp ${o.C.name} không có thuộc tính '${name}'`);
    }
    callAccessor(m, key, args, no) { this.acc.push(key); try { return this.callUser(m, args, no); } finally { this.acc.pop(); } }
    // tên có dấu chấm không bắt đầu bằng biến: goi.ham, goi.Lop, Lop.Hang ...
    dottedName(n) {
      if (n.t === 'id') return this.vars.has(n.v) ? null : n.v;
      if (n.t === 'field') { const p = this.dottedName(n.e); return p ? p + '.' + n.name : null; }
      return null;
    }
    resolveName(nm) {   // tên đầy đủ trong thư mục, có xét import
      if (this.files.has(nm)) return nm;
      for (const imp of this.imports || []) {
        if (imp.endsWith('.*')) { const f = imp.slice(0, -2) + '.' + nm; if (this.files.has(f)) return f; }
        else if (imp.split('.').pop() === nm && this.files.has(imp)) return imp;
      }
      return null;
    }
    classMember(cls, name, argNodes, no) {
      const C = this.loadClass(cls);
      if (C.enumDefs.has(name)) { const e = this.enumMember(C, name); return argNodes.length ? getIndex(e, this.evalArgs(argNodes, e)) : e; }
      const sm = C.statics.get(name); if (sm) return this.callUser(sm, this.flat(argNodes), no);
      if (C.consts.has(name)) { const v = C.consts.get(name); return argNodes.length ? getIndex(v, this.evalArgs(argNodes, v)) : v; }
      err(`Lớp ${cls} không có phương thức tĩnh hay hằng số '${name}'`);
    }
    callUser(f, args, no, preset) {
      const np = f.params.length;
      if (args.length > np) err(`Hàm ${f.name} nhận tối đa ${np} đối số nhưng được gọi với ${args.length}`);
      if (no > Math.max(1, f.outs.length)) err(`Hàm ${f.name} chỉ trả về ${f.outs.length} giá trị`);
      if (++this.depth > 150) { this.depth = 0; err(`Đệ quy quá sâu trong hàm ${f.name} (thiếu điều kiện dừng?)`); }
      const scope = new Map();
      f.params.forEach((p, k) => { if (p !== '~' && args[k] !== undefined) scope.set(p, cloneV(args[k])); });
      scope.set('nargin', S(args.length)); scope.set('nargout', S(no));
      if (preset) for (const k in preset) scope.set(k, preset[k]);
      const saved = this.vars, savedFile = this.curFile; this.vars = scope;
      if (f.file !== undefined) this.curFile = f.file;
      if (f.locals) this.localStack.push(f.locals);
      try {
        try { this.block(f.body); }
        catch (e) { if (e instanceof RetSig) { } else if (e instanceof BreakSig || e instanceof ContSig) err('break/continue chỉ dùng trong vòng lặp'); else throw e; }
        const outs = [];
        for (let k = 0; k < Math.max(no, 1) && k < f.outs.length; k++) {
          const o = f.outs[k];
          if (!scope.has(o)) { if (k === 0 && no === 0) break; err(`Biến đầu ra '${o}' chưa được gán giá trị trong hàm ${f.name}`); }
          outs.push(scope.get(o));
        }
        return no >= 2 ? outs : outs[0];
      } finally { this.vars = saved; this.depth--; this.curFile = savedFile; if (f.locals) this.localStack.pop(); }
    }
    block(list) { for (const s of list) this.exec(s); }
    exec(s) {
      this.tick();
      try {
        switch (s.t) {
          case 'expr': {
            const e = s.e;
            let v;
            if (e.t === 'id' && this.vars.has(e.v)) { v = this.vars.get(e.v); if (s.show) this.print(display(e.v, v, this.long)); return; }
            v = this.eval(e, 0);
            if (Array.isArray(v)) v = v[0];
            if (v instanceof CSL) { for (const x of v.v) { this.vars.set('ans', x); if (s.show) this.print(display('ans', x, this.long)); } return; }
            if (v !== undefined) { this.vars.set('ans', v); if (s.show) this.print(display('ans', v, this.long)); }
            return;
          }
          case 'assign': {
            const L = s.lhs; let v = this.eval(s.rhs, 1); if (Array.isArray(v)) v = v[0];
            if (v instanceof CSL) { if (!v.v.length) err('Vế phải là danh sách rỗng'); v = v.v[0]; }
            if (v === undefined) err('Vế phải không trả về giá trị');
            if (!L.chain.length) { if (['id', 'field', 'dfield', 'idx'].includes(s.rhs.t)) v = cloneV(v); this.vars.set(L.name, v); }
            else {
              const cur = this.vars.get(L.name);
              if (cur instanceof Fun || cur instanceof FH) err(`'${L.name}' là hàm, không gán chỉ số được`);
              if (v instanceof Mat || v instanceof Cell || v instanceof Struct) v = cloneV(v);
              this.vars.set(L.name, this.assignPath(cur, L.chain, v, s.rhs.t === 'mat' && s.rhs.rows.length === 0));
            }
            if (s.show) this.print(display(L.name, this.vars.get(L.name), this.long));
            return;
          }
          case 'massign': {
            let vs = this.eval(s.rhs, s.lhs.length); if (vs instanceof CSL) vs = vs.v; if (!Array.isArray(vs)) vs = [vs];
            s.lhs.forEach((L, k) => {
              if (L === '~') return;
              if (vs[k] === undefined) err(`Hàm không trả về đủ ${s.lhs.length} giá trị`);
              if (!L.chain.length) this.vars.set(L.name, vs[k]);
              else this.vars.set(L.name, this.assignPath(this.vars.get(L.name), L.chain, cloneV(vs[k]), false));
              if (s.show) this.print(display(L.name, this.vars.get(L.name), this.long));
            });
            return;
          }
          case 'if': {
            for (const c of s.clauses) if (truthy(this.eval(c.cond, 1))) { this.block(c.body); return; }
            if (s.els) this.block(s.els); return;
          }
          case 'for': {
            const v = this.eval(s.e, 1);
            const items = v instanceof Cell ? range(0, v.c - 1).map(j => new Cell(v.v.slice(j * v.r, (j + 1) * v.r), v.r, 1)) : v instanceof Struct ? v.el.map(mp => new Struct(1, 1, [mp])) : v instanceof OArr ? v.el.slice() : v instanceof Obj ? [v] : (() => { const m = asM(v); const r = []; for (let j = 0; j < m.c; j++) r.push(m.r === 1 ? (m.im ? CX(m.re[j], m.im[j]) : S(m.re[j])) : getIndex(m, [COLON, S(j + 1)])); return r; })();
            for (const it of items) {
              this.vars.set(s.v, it); this.tick();
              try { this.block(s.body); } catch (e) { if (e instanceof BreakSig) break; if (e instanceof ContSig) continue; throw e; }
            }
            return;
          }
          case 'while': {
            while (truthy(this.eval(s.cond, 1))) {
              this.tick();
              try { this.block(s.body); } catch (e) { if (e instanceof BreakSig) break; if (e instanceof ContSig) continue; throw e; }
            }
            return;
          }
          case 'switch': {
            const v = this.eval(s.e, 1);
            const match = c => { if (c instanceof Cell) return c.v.some(match); if (v instanceof Obj || c instanceof Obj) return v === c; if (v instanceof Str || c instanceof Str) return v instanceof Str && c instanceof Str && v.s === c.s; return num(v) === num(c); };
            for (const c of s.cases) if (match(this.eval(c.v, 1))) { this.block(c.body); return; }
            if (s.other) this.block(s.other); return;
          }
          case 'break': throw new BreakSig();
          case 'continue': throw new ContSig();
          case 'return': throw new RetSig();
          case 'func': case 'classdef': return;
          case 'import': for (const n of s.names) if (!this.imports.includes(n)) this.imports.push(n); return;
          case 'cmd': { const f = FN[s.name]; if (!f) err(`Không có lệnh '${s.name}'`); f(this, s.args.map(a => new Str(a)), 0); return; }
        }
      } catch (e) { if (e instanceof MErr && e.line == null) { e.line = s.line; e.file = this.curFile; } throw e; }
    }
    evalArgs(args, target) {
      return args.map((a, k) => {
        if (a.t === 'colon') return COLON;
        this.endStack.push({ v: target, k, n: args.length });
        try { const v = this.eval(a, 1); return Array.isArray(v) ? v[0] : v; } finally { this.endStack.pop(); }
      });
    }
    callValue(f, args, no) {
      if (f instanceof FH) return this.callFn(f.name, args, no);
      if (f instanceof Fun) {
        if (args.length > f.params.length) err(`Hàm ẩn danh nhận ${f.params.length} đối số nhưng được gọi với ${args.length}`);
        if (++this.depth > 200) err('Đệ quy quá sâu');
        const saved = this.vars; this.vars = new Map(f.env); f.params.forEach((p, k) => { if (args[k] !== undefined) this.vars.set(p, args[k]); });
        try { return this.eval(f.body, no); } finally { this.vars = saved; this.depth--; }
      }
      err('Giá trị này không gọi như hàm được');
    }
    callFn(name, args, no) {
      // thứ tự tìm: phương thức của đối tượng > hàm cục bộ trong file > hàm cuối script > file .m > hàm có sẵn
      const ob = args.find(a => a instanceof Obj);
      if (ob) { const m = ob.C.methods.get(name); if (m) return this.callUser(m, args, no); }
      const loc = this.localStack[this.localStack.length - 1];
      if (loc && loc.has(name)) return this.callUser(loc.get(name), args, no);
      if (this.ufuncs && this.ufuncs.has(name)) return this.callUser(this.ufuncs.get(name), args, no);
      const full = this.resolveName(name);
      if (full && full !== name) return this.callFn(full, args, no);
      const fi = this.fileInfo(name);
      if (fi) {
        if (fi.kind === 'class') { const C = this.loadClass(name); if (C.enumDefs.size && !args.length) err(`${name} là enumeration: dùng ${name}.TenThanhVien`); return this.construct(C, args); }
        if (fi.kind === 'func') return this.callUser(fi.main, args, no);
        if (args.length) err(`${name}.m là script nên không nhận đối số`);
        this.runScript(fi); return undefined;
      }
      const f = FN[name];
      if (!f) {
        const hint = { sum: '', length: '' }[name];
        const sim = Object.keys(FN).find(k => k.toLowerCase() === name.toLowerCase());
        err(`Không có biến hoặc hàm tên '${name}'` + (sim ? ` (MATLAB phân biệt hoa thường: ý bạn là '${sim}'?)` : ''));
      }
      return f(this, args, no);
    }
    eval(n, no = 1) {
      switch (n.t) {
        case 'num': return n.imag ? CX(0, n.v) : S(n.v);
        case 'str': return new Str(n.v);
        case 'paren': { const v = this.eval(n.e, 1); return Array.isArray(v) ? v[0] : v; }
        case 'id': {
          if (this.vars.has(n.v)) return this.vars.get(n.v);
          const r = this.callFn(n.v, [], no);
          if (r === undefined && no >= 1) err(`'${n.v}' không trả về giá trị`);
          return r;
        }
        case 'end': {
          const c = this.endStack[this.endStack.length - 1]; if (!c) err("'end' chỉ dùng trong chỉ số, ví dụ x(end)");
          const v = c.v; const m = v instanceof Cell ? new Mat(1, v.v.length) : asM(v);
          return S(c.n === 1 ? m.n : c.k === 0 ? m.r : m.c);
        }
        case 'colon': return COLON;
        case 'bin': {
          if (n.op === '&&' || n.op === '||') {
            const l = truthy(this.eval(n.l, 1));
            if (n.op === '&&') return B(l && truthy(this.eval(n.r, 1)));
            return B(l || truthy(this.eval(n.r, 1)));
          }
          const a = this.val(n.l), b = this.val(n.r);
          return OPS[n.op](a, b);
        }
        case 'un': {
          const v = this.val(n.e);
          if (n.op === '-') return map(v, x => -x, (x, y) => [-x, -y]);
          if (n.op === '+') return asM(v);
          const o = map(v, x => x === 0 ? 1 : 0); o.lg = true; return o;
        }
        case 'tr': return transpose(this.val(n.e), n.conj);
        case 'super': {
          const P = this.loadClass(n.cls) || this.loadImported(n.cls); if (!P) err(`Không tìm thấy lớp '${n.cls}'`);
          const cur = this.vars.get(n.name);
          if (cur instanceof Obj && !P.methods.has(n.name)) {   // obj = obj@LopCha(...): khởi tạo phần lớp cha
            if (!isA(cur.C, P.name)) err(`${cur.C.name} không kế thừa ${P.name}`);
            return this.runSuperCtor(P, cur, this.flat(n.args));
          }
          const m = P.methods.get(n.name) || P.statics.get(n.name);   // phuongThuc@LopCha(obj, ...): gọi bản của lớp cha
          if (!m) err(`Lớp ${P.name} không có phương thức '${n.name}'`);
          return this.callUser(m, this.flat(n.args), no);
        }
        case 'range': return colonRange(this.val(n.a), n.s ? this.val(n.s) : undefined, this.val(n.b));
        case 'mat': {
          if (!n.rows.length) return EMPTY();
          return vert(n.rows.map(r => horz(this.flat(r))));
        }
        case 'cell': {
          const rows = n.rows.map(r => this.flat(r)).filter(r => r.length);
          if (!rows.length) return new Cell([], 0, 0);
          const c = rows[0].length; if (rows.some(r => r.length !== c)) err('Các hàng của cell { } phải có cùng số phần tử');
          const v = []; for (let j = 0; j < c; j++) for (let i = 0; i < rows.length; i++) v.push(rows[i][j]);
          return new Cell(v, rows.length, c);
        }
        case 'field': case 'dfield': {
          if (n.t === 'field') {
            const full = this.dottedName(n);
            if (full && this.files.has(full)) return this.callFn(full, [], no);          // goi.ham  (không đối số)
            const pre = this.dottedName(n.e), cls = pre && (this.isClassName(pre) ? pre : this.resolveName(pre));
            if (cls && this.isClassName(cls)) return this.classMember(cls, n.name, [], no);  // Lop.Hang / Lop.thanhVienEnum / goi.Lop.tinh
            if (pre && !this.vars.has(pre.split('.')[0]) && [...this.files.keys()].some(k => k.startsWith(pre + '.'))) err(`Gói '${pre}' không có '${n.name}'`);
          }
          const b = this.val(n.e), name = n.t === 'field' ? n.name : str(this.val(n.ne), 'Tên trường động');
          if (b instanceof OArr) return new CSL(b.el.map(o => this.getProp(o, name, 1)));
          if (b instanceof Obj) {
            if (b.C.getters.has(name) && !this.acc.includes('get.' + name)) return this.callAccessor(b.C.getters.get(name), 'get.' + name, [b], 1);
            if (b.C.dependent.has(name)) err(`Thuộc tính phụ thuộc '${name}' cần phương thức get.${name}`);
            if (b.p.has(name)) return b.p.get(name);
            const m = b.C.methods.get(name); if (m) return this.callUser(m, [b], no);
            const sm = b.C.statics.get(name); if (sm) return this.callUser(sm, [], no);
            if (b.C.consts.has(name)) return b.C.consts.get(name);
            err(`Lớp ${b.C.name} không có thuộc tính hay phương thức '${name}'`);
          }
          if (!(b instanceof Struct)) err(`Không truy cập được .${name}: giá trị là ${typeName(b)}, không phải struct`);
          const get = mp => { if (!mp.has(name)) err(`Struct không có trường '${name}'` + (mp.size ? ` (các trường: ${[...mp.keys()].join(', ')})` : '')); return mp.get(name); };
          if (b.el.length === 1) return get(b.el[0]);
          return new CSL(b.el.map(get));
        }
        case 'anon': return new Fun(n.params, n.body, new Map([...this.vars].map(([k, v]) => [k, cloneV(v)])), n.src);
        case 'fh': return new FH(n.v);
        case 'idx': {
          const tg = n.target;
          if (tg.t === 'field') {   // obj.phuongThuc(...)  |  TenLop.phuongThucTinh(...)  |  goi.ham(...)
            const full = this.dottedName(tg);
            if (full && this.files.has(full)) return this.callFn(full, this.flat(n.args), no);
            const pre = this.dottedName(tg.e), cls = pre && (this.isClassName(pre) ? pre : this.resolveName(pre));
            if (cls && this.isClassName(cls)) return this.classMember(cls, tg.name, n.args, no);
            if (pre && [...this.files.keys()].some(k => k.startsWith(pre + '.'))) err(`Gói '${pre}' không có '${tg.name}'`);
            const b0 = this.val(tg.e);
            if (b0 instanceof Obj && !b0.p.has(tg.name)) {
              const m = b0.C.methods.get(tg.name); if (m) return this.callUser(m, [b0, ...this.flat(n.args)], no);
              const sm = b0.C.statics.get(tg.name); if (sm) return this.callUser(sm, this.flat(n.args), no);
            }
          }
          if (tg.t === 'id' && !this.vars.has(tg.v)) {
            if (n.brace) err(`Không có biến cell '${tg.v}'`);
            if (n.args.some(a => a.t === 'colon')) err(`Không có biến '${tg.v}' để lấy chỉ số`);
            const r = this.callFn(tg.v, this.flat(n.args), no);
            if (r === undefined && no >= 1) err(`Hàm '${tg.v}' không trả về giá trị (nó chỉ vẽ/in ra)`);
            return r;
          }
          const v = tg.t === 'id' ? this.vars.get(tg.v) : this.val(tg);
          if (v instanceof Fun || v instanceof FH) return this.callValue(v, this.flat(n.args), no);
          const args = this.evalArgs(n.args, v);
          if (n.brace) {
            if (!(v instanceof Cell)) err(`Dấu { } chỉ dùng với cell array (giá trị đang là ${typeName(v)}); dùng ( )`);
            const ks = linIdx(v, args, false);
            return ks.length === 1 ? v.v[ks[0]] : new CSL(ks.map(k => v.v[k]));
          }
          return getIndex(v, args);
        }
      }
      err('Biểu thức không hỗ trợ');
    }
    val(n) { const v = this.eval(n, 1); if (Array.isArray(v)) return v[0]; if (v instanceof CSL) { if (!v.v.length) err('Danh sách giá trị rỗng (ví dụ c{:} với c rỗng)'); return v.v[0]; } return v; }
    flat(list) { return list.flatMap(e => { const v = this.eval(e, 1); if (v instanceof CSL) return v.v; return [Array.isArray(v) ? v[0] : v]; }); }
    // gán qua chuỗi truy cập: s.a.b = v, s(2).ten = v, c{3} = v, c{2}(4) = v, x(i, j) = v ...
    assignPath(cur, chain, rhs, del) {
      const [acc, ...rest] = chain;
      const isEmpty = x => x === undefined || (x instanceof Mat && x.n === 0);
      if (acc.k === 'field' || acc.k === 'dfield') {
        const name = acc.k === 'field' ? acc.name : str(this.val(acc.e), 'Tên trường động');
        if (!/^[A-Za-z]\w*$/.test(name)) err(`Tên trường không hợp lệ: '${name}'`);
        if (cur instanceof Obj) {
          const C = cur.C;
          if (cur.enumName) err(`Không gán được thuộc tính của thành viên enumeration ${C.name}.${cur.enumName}`);
          if (!cur.p.has(name) && !C.dependent.has(name)) err(`Lớp ${C.name} không có thuộc tính '${name}'` + (C.props.size ? ` (các thuộc tính: ${[...C.props.keys()].join(', ')})` : ''));
          let val = rhs;
          if (rest.length) val = this.assignPath(cloneV(this.getProp(cur, name, 1)), rest, rhs, del);
          if (C.setters.has(name) && !this.acc.includes('set.' + name)) {   // set.ThuocTinh(obj, giaTri)
            const r = this.callAccessor(C.setters.get(name), 'set.' + name, [cur, val], C.isHandle ? 0 : 1);
            if (C.isHandle) return cur;
            if (!(r instanceof Obj)) err(`set.${name} của lớp giá trị phải trả về obj: function obj = set.${name}(obj, v)`);
            return r;
          }
          if (C.dependent.has(name)) err(`Thuộc tính phụ thuộc '${name}' cần phương thức set.${name} để gán`);
          cur.p.set(name, val);
          return cur;
        }
        let s = isEmpty(cur) ? new Struct(1, 1, [new Map()]) : cur;
        if (!(s instanceof Struct)) err(`Không gán được .${name}: biến đang là ${typeName(s)}, không phải struct`);
        if (s.el.length !== 1) err(`Mảng struct có ${s.el.length} phần tử: dùng s(k).${name} = ...`);
        const mp = s.el[0];
        mp.set(name, rest.length ? this.assignPath(mp.get(name), rest, rhs, del) : rhs);
        return s;
      }
      if (acc.k === 'brace') {
        const c = isEmpty(cur) ? new Cell([], 0, 0) : cur;
        if (!(c instanceof Cell)) err(`Dấu { } chỉ dùng để gán cho cell array (biến đang là ${typeName(c)})`);
        const args = this.evalArgs(acc.args, c);
        let val = rhs;
        if (rest.length) { const ks = linIdx(c, args, true); if (ks.length !== 1) err('Chỉ gán sâu vào một ô cell mỗi lần'); val = this.assignPath(ks[0] < c.n ? c.v[ks[0]] : undefined, rest, rhs, del); }
        return cellAssign(c, args, [val]);
      }
      // dấu ( ) trên mảng đối tượng: arr(3) = Lop(...), arr(2).x = 5
      if (cur instanceof Obj || cur instanceof OArr || (isEmpty(cur) && !rest.length && (rhs instanceof Obj || rhs instanceof OArr))) {
        let A = cur instanceof OArr ? cur : cur instanceof Obj ? new OArr(cur.C, 1, 1, [cur]) : null;
        const C = A ? A.C : rhs.C; if (!A) A = new OArr(C, 0, 0, []);
        const args = this.evalArgs(acc.args, A);
        if (del && !rest.length) { const kill = new Set(linIdx(A, args, false)); const el = A.el.filter((_, k) => !kill.has(k)); return el.length === 1 ? el[0] : new OArr(C, el.length ? 1 : 0, el.length, el); }
        const ks = linIdx(A, args, true);
        let vals;
        if (rest.length) {
          if (ks.length !== 1) err('Chỉ gán thuộc tính cho một phần tử mỗi lần');
          vals = [this.assignPath(ks[0] < A.n ? A.el[ks[0]] : this.construct(C, []), rest, rhs, del)];
        } else {
          vals = rhs instanceof OArr ? rhs.el : rhs instanceof Obj ? [rhs] : err(`Phần tử của mảng ${C.name} phải là đối tượng ${C.name}`);
          if (vals.some(o => !isA(o.C, C.name))) err(`Phần tử của mảng ${C.name} phải là đối tượng ${C.name}`);
        }
        const el = A.el.slice(), mx = Math.max(-1, ...ks);
        while (el.length <= mx) el.push(this.construct(C, []));   // MATLAB tạo phần tử thiếu bằng hàm khởi tạo không đối số
        if (vals.length !== 1 && vals.length !== ks.length) err('Số đối tượng không khớp số vị trí');
        ks.forEach((k, t) => { el[k] = vals.length === 1 ? vals[0] : vals[t]; });
        const col = A.c === 1 && A.r > 1;
        return el.length === 1 ? el[0] : new OArr(C, col ? el.length : 1, col ? 1 : el.length, el);
      }
      const structPath = cur instanceof Struct || (isEmpty(cur) && rest.length && rest[0].k !== 'paren') || (isEmpty(cur) && !rest.length && rhs instanceof Struct);
      if (structPath) {
        const s = cur instanceof Struct ? cur : new Struct(0, 0, []);
        const args = this.evalArgs(acc.args, s);
        if (!rest.length) {
          if (del) { const kill = new Set(linIdx(s, args, false)); const el = s.el.filter((_, k) => !kill.has(k)); return s.c === 1 && s.r > 1 ? new Struct(el.length, 1, el) : new Struct(el.length ? 1 : 0, el.length, el); }
          if (!(rhs instanceof Struct)) err('Gán s(k) = ... cần giá trị là struct');
          return structAssign(s, args, rhs.el);
        }
        const ks = linIdx(s, args, true); if (ks.length !== 1) err('Chỉ gán trường cho một phần tử struct mỗi lần');
        const ne = this.assignPath(ks[0] < s.n ? new Struct(1, 1, [s.el[ks[0]]]) : undefined, rest, rhs, del);
        return structAssign(s, args, ne.el);
      }
      if (cur instanceof Cell) {
        if (rest.length) err('Cú pháp c(i).x hoặc c(i){j} không hỗ trợ; dùng c{i}');
        const args = this.evalArgs(acc.args, cur);
        if (del) { const kill = new Set(linIdx(cur, args, false)); const v = cur.v.filter((_, k) => !kill.has(k)); return cur.c === 1 && cur.r > 1 ? new Cell(v, v.length, 1) : new Cell(v); }
        if (!(rhs instanceof Cell)) err('Gán c(i) = ... cần giá trị cell, ví dụ c(2) = {5}; hoặc dùng c{2} = 5');
        return cellAssign(cur, args, rhs.v);
      }
      if (rest.length) err('Không hỗ trợ cú pháp gán này (ví dụ x(i).ten khi x không phải struct)');
      return setIndex(cur, this.evalArgs(acc.args, cur || EMPTY()), rhs, del);
    }
  }
  function run(src, opts) {
    const I = new Interp(opts); let error = null;
    try { I.run(src); } catch (e) {
      if (e instanceof MErr) error = { msg: e.message, line: e.line, file: e.file || null };
      else { error = { msg: 'Lỗi nội bộ: ' + (e && e.message), line: null }; if (typeof console !== 'undefined') console.error(e); }
    }
    return { text: I.text(), figs: I.figs.filter(f => f.axes.length), error, vars: I.vars, I };
  }
  const BUILTINS = Object.keys(FN);
  return { run, texify, BUILTINS, Mat, Str };
})();
