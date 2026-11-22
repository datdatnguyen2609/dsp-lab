
/* ================= THƯ MỤC LÀM VIỆC: nhiều file .m (hàm, script, classdef) ================= */
const ML_DEFAULT_FILES = {
main: `%% main.m: script chính, gọi hàm và lớp nằm trong các file .m khác
x = sin(2*pi*0.05*(0:199)) + 0.4*randn(1, 200);

% 1) Hàm trong file riêng nang_luong.m (có hàm phụ bên trong file)
[E, P] = nang_luong(x);
fprintf('Năng lượng %.2f, công suất %.3f\\n', E, P);

% 2) Lớp giá trị BoLocFIR (file BoLocFIR.m)
lp = BoLocFIR(31, 0.1)            % gọi hàm khởi tạo
y  = lp.loc(x);                   % gọi phương thức: obj.phuongThuc(...)
lp2 = lp.doiTanSo(0.3);           % lớp giá trị: thay đổi trả về đối tượng MỚI
fprintf('lp.wc = %.2f (không đổi), lp2.wc = %.2f\\n', lp.wc, lp2.wc);

% 3) Phương thức tĩnh và hằng số của lớp
h = BoLocFIR.thongThap(0.25);
fprintf('%s, %d hệ số\\n', BoLocFIR.MO_TA, h.N);

% 4) Lớp tham chiếu BoDem < handle (file BoDem.m)
d = BoDem();
d.tang();  tang(d, 10);           % hai cách gọi phương thức
d2 = d;    d2.tang();             % d2 và d là CÙNG một đối tượng
disp(d)                           % dùng phương thức disp tự định nghĩa

% 5) Gán nhiều đầu ra thẳng vào trường struct
[cfg.b, cfg.a] = butter(4, 0.2);
fprintf('cfg.a có %d hệ số\\n', numel(cfg.a));

% 6) Enumeration (file LoaiLoc.m)
k = LoaiLoc.ThongCao;
fprintf('%s: %s\\n', char(k), k.moTa);

% 7) Hàm trong gói +dsp (file +dsp/trung_binh.m)
ym = dsp.trung_binh(x, 8);

% 8) Mảng đối tượng
ds = [BoDem(), BoDem(), BoDem()];
ds(2).tang(5);
fprintf('Giá trị các bộ đếm: %s\\n', mat2str([ds.giaTri]));

plot(x); hold on; plot(y, 'LineWidth', 2); plot(ym, '--'); hold off; grid on
legend('x', 'lp.loc(x)', 'dsp.trung_binh(x, 8)'); title('Hàm và lớp trong các file .m riêng')`,
nang_luong: `function [E, P] = nang_luong(x)
% NANG_LUONG  Năng lượng và công suất trung bình của tín hiệu
%   [E, P] = nang_luong(x)
    E = tong_binh_phuong(x);
    P = E / numel(x);
end

function s = tong_binh_phuong(x)
% Hàm phụ: chỉ gọi được từ bên trong file nang_luong.m
    s = sum(abs(x).^2);
end`,
BoLocFIR: `classdef BoLocFIR
% BOLOCFIR  Bộ lọc FIR thông thấp thiết kế bằng cửa sổ Hamming (lớp giá trị)
    properties
        N = 31          % số hệ số
        wc = 0.2        % tần số cắt, chuẩn hoá theo Nyquist
        h               % các hệ số
    end
    properties (Constant)
        MO_TA = 'FIR thông thấp, cửa sổ Hamming'
    end
    methods
        function obj = BoLocFIR(N, wc)
            % Hàm khởi tạo: đối số là tuỳ chọn
            if nargin >= 1, obj.N = N; end
            if nargin >= 2, obj.wc = wc; end
            obj.h = fir1(obj.N - 1, obj.wc);
        end
        function y = loc(obj, x)
            y = filter(obj.h, 1, x);
        end
        function obj = doiTanSo(obj, wc)
            % Lớp giá trị: phải trả về obj đã sửa
            obj.wc = wc;
            obj.h = fir1(obj.N - 1, wc);
        end
    end
    methods (Static)
        function obj = thongThap(wc)
            obj = BoLocFIR(51, wc);
        end
    end
end`,
BoDem: `classdef BoDem < handle
% BODEM  Bộ đếm (lớp handle): mọi biến cùng trỏ tới một đối tượng
    properties
        giaTri = 0
    end
    methods
        function tang(obj, k)
            if nargin < 2, k = 1; end
            obj.giaTri = obj.giaTri + k;   % sửa trực tiếp, không cần trả về
        end
        function disp(obj)
            fprintf('BoDem đang ở %d\\n', obj.giaTri);
        end
    end
end`,
LoaiLoc: `classdef LoaiLoc
% LOAILOC  Enumeration: các loại bộ lọc, mỗi thành viên có một mô tả
    properties
        moTa
    end
    methods
        function obj = LoaiLoc(s)
            obj.moTa = s;
        end
    end
    enumeration
        ThongThap ('cho qua tần số thấp')
        ThongCao  ('cho qua tần số cao')
        ThongDai  ('cho qua một dải tần')
    end
end`,
'dsp.trung_binh': `function y = trung_binh(x, M)
% DSP.TRUNG_BINH  Bộ lọc trung bình trượt M điểm (hàm trong gói +dsp)
    y = filter(ones(1, M)/M, 1, x);
end`
};
const ML_FILES_KEY = 'dsp-lab-files-v2';
let mlFiles = (() => {
  try { const s = JSON.parse(localStorage.getItem(ML_FILES_KEY) || 'null'); if (s && typeof s === 'object' && typeof s.main === 'string') return s; } catch (e) { }
  return Object.assign({}, ML_DEFAULT_FILES);
})();
let mlSaveT = 0;
const mlSaveFiles = () => { clearTimeout(mlSaveT); mlSaveT = setTimeout(() => { try { localStorage.setItem(ML_FILES_KEY, JSON.stringify(mlFiles)); } catch (e) { } }, 300); };
function mlFilesMap() { return new Map(Object.entries(mlFiles)); }
const mlKind = src => { const s = src.replace(/^(\s*%[^\n]*\n|\s*\n)*/, ''); return /^\s*classdef\b/.test(s) ? 'class' : /^\s*function\b/.test(s) ? 'func' : 'script'; };
const ML_KIND_LABEL = { class: 'lớp', func: 'hàm', script: 'script' };
const mlPath = n => { const p = n.split('.'); return p.slice(0, -1).map(s => '+' + s + '/').join('') + p[p.length - 1] + '.m'; };   // dsp.ham → +dsp/ham.m

document.querySelectorAll('.mlab[data-ml=workspace]').forEach(box => {
  box.innerHTML = `<div class="lab-h"><b>Thư mục làm việc: nhiều file .m</b><span class="tag">MATLAB · chạy ngay trên trang</span></div>
  <div class="ml-body">
    <p class="ml-desc">Mỗi tab là một file. Nút Chạy luôn chạy <code>main.m</code> (hoặc file script đang mở). Các file được lưu trên trình duyệt này, và mọi khung code khác trên trang cũng gọi được các hàm, lớp ở đây.</p>
    <div class="ml-tabs" role="tablist" aria-label="Các file .m"></div>
    <div class="ml-newfile" hidden>
      <label class="ctl"><span class="lbl">Tên file (vd: loc_tb, hoặc +dsp/loc_tb cho gói)</span><input type="text" id="mlNewName" placeholder="vd: loc_trung_binh" autocomplete="off"></label>
      <label class="ctl"><span class="lbl">Loại</span><select id="mlNewKind"><option value="func">Hàm (function)</option><option value="class">Lớp (classdef)</option><option value="handle">Lớp handle</option><option value="script">Script</option></select></label>
      <div class="btns"><button class="btn" type="button" data-a="create">Tạo file</button><button class="btn ghost" type="button" data-a="cancel">Huỷ</button></div>
      <span class="ml-note" id="mlNewMsg" aria-live="polite"></span>
    </div>
    <div class="ml-ed"><div class="ml-wrap"><pre class="ml-hl" aria-hidden="true"></pre><textarea class="ml-ta" id="ml-workspace" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" aria-label="Nội dung file .m đang mở"></textarea></div></div>
    <div class="ml-bar">
      <button class="btn" type="button" data-a="run">▶ Chạy main.m</button>
      <button class="btn ghost" type="button" data-a="del">Xoá file này</button>
      <button class="btn ghost" type="button" data-a="restore">Khôi phục file mẫu</button>
      <button class="btn ghost" type="button" data-a="copy">Sao chép file</button>
      <span class="st" aria-live="polite"></span>
    </div>
    <pre class="ml-con" hidden></pre>
    <div class="ml-figs"></div>
  </div>`;
  const $q = s => box.querySelector(s);
  const tabs = $q('.ml-tabs'), ta = $q('textarea'), hl = $q('.ml-hl'), con = $q('.ml-con'), figs = $q('.ml-figs'), st = $q('.st');
  const runB = $q('[data-a=run]'), delB = $q('[data-a=del]'), resB = $q('[data-a=restore]'), form = $q('.ml-newfile');
  let cur = 'main', errLine = null, arm = null;
  const disarm = () => { arm = null; delB.textContent = 'Xoá file này'; resB.textContent = 'Khôi phục file mẫu'; };
  const paint = () => { hl.innerHTML = mlHighlight(ta.value, errLine); };
  const renderTabs = () => {
    tabs.innerHTML = Object.keys(mlFiles).map(n => `<button type="button" role="tab" class="ml-tab${n === cur ? ' on' : ''}" aria-selected="${n === cur}" data-f="${escH(n)}">${escH(mlPath(n))} <small>${ML_KIND_LABEL[mlKind(mlFiles[n])]}</small></button>`).join('') +
      '<button type="button" class="ml-tab add" data-new="1">+ Tệp mới</button>';
  };
  const open = n => {
    cur = n; ta.value = mlFiles[n]; errLine = null; disarm(); paint(); renderTabs();
    const k = mlKind(mlFiles[n]);
    runB.textContent = k === 'script' ? `▶ Chạy ${n}.m` : '▶ Chạy main.m';
    delB.disabled = n === 'main';
  };
  tabs.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.new) { form.hidden = false; $q('#mlNewMsg').textContent = ''; $q('#mlNewName').focus(); return; }
    open(b.dataset.f);
  });
  ta.addEventListener('input', () => { mlFiles[cur] = ta.value; mlSaveFiles(); errLine = null; paint(); const k = mlKind(ta.value); runB.textContent = k === 'script' ? `▶ Chạy ${cur}.m` : '▶ Chạy main.m'; });
  ta.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(true); return; }
    if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); ta.setRangeText('    ', ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); }
  });
  const run = user => {
    disarm();
    const target = mlKind(mlFiles[cur]) === 'script' ? cur : 'main';
    if (mlFiles[target] === undefined) { st.className = 'st bad'; st.textContent = 'Không có main.m: hãy tạo một file script tên main'; return; }
    const t0 = performance.now();
    const r = MLAB.run(mlFiles[target], { allowSound: user, onSound: (x, fs) => playSamples(x, fs), seed: 2024, files: mlFilesMap() });
    const ms = performance.now() - t0;
    let txt = escH(r.text.replace(/\s+$/, ''));
    if (r.error) {
      const ef = r.error.file || target;
      txt += (txt ? '\n' : '') + `<span class="e">Lỗi${r.error.line ? ` ở dòng ${r.error.line}` : ''} của ${escH(mlPath(ef))}: ${escH(r.error.msg)}</span>`;
      if (ef !== cur && mlFiles[ef] !== undefined) open(ef);
      errLine = ef === cur ? r.error.line : null; paint();
    } else { errLine = null; paint(); }
    con.innerHTML = txt; con.hidden = !txt;
    mlRenderFigs(figs, r.figs);
    st.className = 'st' + (r.error ? ' bad' : '');
    st.textContent = r.error ? 'Có lỗi, xem bên dưới' : `Đã chạy ${target}.m trong ${ms < 1 ? '<1' : Math.round(ms)} ms`;
  };
  box._mlRun = run;
  runB.onclick = () => run(true);
  $q('[data-a=cancel]').onclick = () => { form.hidden = true; };
  $q('[data-a=create]').onclick = () => {
    // cho phép gói: "+dsp/ham", "dsp/ham" hoặc "dsp.ham"
    const name = $q('#mlNewName').value.trim().replace(/\.m$/, '').replace(/\+/g, '').replace(/\//g, '.'), kind = $q('#mlNewKind').value, msg = $q('#mlNewMsg');
    if (!/^([A-Za-z]\w*\.)*[A-Za-z]\w{0,62}$/.test(name)) { msg.textContent = 'Tên không hợp lệ: chữ không dấu, số và _, bắt đầu bằng chữ. Hàm trong gói: +goi/ten.'; return; }
    if (mlFiles[name] !== undefined) { msg.textContent = `Đã có file ${mlPath(name)}.`; return; }
    if (kind === 'script' && name.includes('.')) { msg.textContent = 'Script không đặt trong gói được; chọn Hàm hoặc Lớp.'; return; }
    const sh = name.split('.').pop();
    const tpl = kind === 'func' ? `function y = ${sh}(x)\n% ${name.toUpperCase()}  Mô tả ngắn về hàm\n    y = x;\nend\n`
      : kind === 'script' ? `% ${name}.m: script\ndisp('Xin chào từ ${name}.m')\n`
        : `classdef ${sh}${kind === 'handle' ? ' < handle' : ''}\n    properties\n        giaTri = 0\n    end\n    methods\n        function obj = ${sh}(v)\n            if nargin >= 1, obj.giaTri = v; end\n        end\n        function hienThi(obj)\n            fprintf('${sh}: %g\\n', obj.giaTri);\n        end\n    end\nend\n`;
    mlFiles[name] = tpl; mlSaveFiles(); form.hidden = true; $q('#mlNewName').value = '';
    open(name);
    st.className = 'st'; st.textContent = MLAB.BUILTINS.includes(name) ? `Đã tạo ${name}.m (chú ý: tên này che hàm có sẵn ${name})` : `Đã tạo ${name}.m. Gọi nó từ main.m: ${kind === 'script' ? name : kind === 'func' ? name + '(3)' : 'o = ' + name + '(5); o.hienThi()'}`;
  };
  delB.onclick = () => {
    if (cur === 'main') return;
    if (arm !== 'del') { disarm(); arm = 'del'; delB.textContent = `Bấm lần nữa để xoá ${cur}.m`; return; }
    delete mlFiles[cur]; mlSaveFiles(); open('main'); st.className = 'st'; st.textContent = 'Đã xoá file.';
  };
  resB.onclick = () => {
    if (arm !== 'restore') { disarm(); arm = 'restore'; resB.textContent = 'Bấm lần nữa: mọi thay đổi sẽ mất'; return; }
    mlFiles = Object.assign({}, ML_DEFAULT_FILES); mlSaveFiles(); open('main'); run(false); st.textContent = 'Đã khôi phục các file mẫu.';
  };
  $q('[data-a=copy]').onclick = async () => {
    try { await navigator.clipboard.writeText(ta.value); st.className = 'st'; st.textContent = `Đã sao chép ${cur}.m. Trong MATLAB, lưu thành file ${cur}.m cùng thư mục.`; }
    catch (e) { ta.focus(); ta.select(); st.className = 'st'; st.textContent = 'Đã chọn toàn bộ, nhấn Ctrl + C để sao chép.'; }
  };
  open('main');
  mlObs.observe(box);
});
