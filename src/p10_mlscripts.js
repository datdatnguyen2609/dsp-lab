
/* ================= KỊCH BẢN MATLAB CHO TỪNG CHƯƠNG ================= */
const ML_SCRIPTS = {
c0a: { title: 'Vector, ma trận và dải số', desc: 'Không có dấu ; ở cuối dòng thì MATLAB in kết quả ra. Dấu ; trong ngoặc vuông nghĩa là xuống hàng.', code:
`% Vector hàng: các phần tử cách nhau bằng dấu cách hoặc dấu phẩy
x = [1 2 3 4]
% Vector cột: dùng dấu ; để xuống hàng
y = [1; 2; 3]
% Ma trận 2x3
A = [1 2 3; 4 5 6]
% Dải số  a:b  (bước 1)  và  a:bước:b
n = 0:5
t = 0:0.25:1
% Kích thước
N = length(t)
[r, c] = size(A)
% Chuyển vị: ' biến hàng thành cột
xc = x'` },
c0b: { title: 'Phép toán từng phần tử: .* ./ .^', desc: 'Lỗi số một khi mới học MATLAB: dùng * thay cho .* khi muốn nhân từng phần tử của hai tín hiệu.', code:
`a = [1 2 3];
b = [4 5 6];
a .* b        % nhân từng phần tử  -> [4 10 18]
a ./ b        % chia từng phần tử
a .^ 2        % bình phương từng phần tử
a * b'        % nhân MA TRẬN: hàng (1x3) × cột (3x1) = tích vô hướng 32
2 * a + 1     % số vô hướng thì * hay .* đều được
% Thử bỏ dấu % ở dòng dưới để xem lỗi kích thước:
% a * b` },
c0c: { title: 'Chỉ số bắt đầu từ 1', desc: 'Công thức DSP viết x[0], x[1], … nhưng MATLAB lưu ở x(1), x(2), … Nhớ cộng 1 khi chuyển công thức sang code.', code:
`x = [10 20 30 40 50];
x(1)            % phần tử ĐẦU TIÊN là x(1), không có x(0)
x(end)          % phần tử cuối
x(2:4)          % lấy một đoạn
x(end:-1:1)     % đảo ngược thứ tự
x(x > 25)       % chỉ số logic: lấy các phần tử lớn hơn 25
x(6) = 60       % gán ra ngoài kích thước: vector tự dài thêm
% Thử bỏ % để thấy lỗi:
% x(0)` },
c0d: { title: 'Số phức', desc: 'i và j đều là đơn vị ảo. Nên viết 1j để không bị nhầm khi i, j đã dùng làm biến đếm vòng lặp.', code:
`z = 3 + 4j
abs(z)           % mô-đun = 5
angle(z)         % pha (rad)
conj(z)          % liên hợp
w = exp(1j*pi/4) % công thức Euler: cos(pi/4) + j sin(pi/4)
real(w), imag(w)
% Vectơ quay e^(j w0 n): mỗi mẫu quay thêm w0 radian
n = 0:7;
v = exp(1j*pi/4*n);
plot(real(v), imag(v), 'o-'); axis equal; grid on
title('e^{j\\pi n/4}: 8 điểm trên vòng tròn đơn vị')` },
c0e: { title: 'Vẽ đồ thị: plot, stem, subplot', desc: 'plot nối các điểm (hợp với tín hiệu liên tục), stem vẽ từng mẫu (tín hiệu rời rạc). subplot(m,n,k) chia khung thành lưới m×n.', code:
`fs = 100;                 % tần số lấy mẫu (Hz)
t  = 0:1/fs:1;            % trục thời gian 0..1 s
x  = sin(2*pi*3*t);       % sin 3 Hz
n  = 0:20;

subplot(2,1,1)
plot(t, x, 'LineWidth', 1.5)
title('plot: nối các điểm như tín hiệu liên tục')
xlabel('t (s)'); grid on

subplot(2,1,2)
stem(n, 0.8.^n, 'filled')
title('stem: tín hiệu rời rạc 0.8^n')
xlabel('n')` },
c0f: { title: 'Vòng lặp và vector hoá', desc: 'Code vector hoá (không dùng vòng lặp) thường ngắn hơn và chạy nhanh hơn nhiều trong MATLAB. Hai cách phải cho cùng kết quả.', code:
`N = 20000;
tic
y = zeros(1, N);          % cấp phát trước để vòng lặp nhanh
for n = 1:N
    y(n) = sin(0.01*n)^2;
end
t1 = toc;

tic
y2 = sin(0.01*(1:N)).^2;  % một dòng, không vòng lặp
t2 = toc;

fprintf('Vòng lặp: %.2f ms, vector hoá: %.2f ms\\n', 1000*t1, 1000*t2);
fprintf('Sai khác lớn nhất: %g\\n', max(abs(y - y2)));` },
c0g: { title: 'Hàm ẩn danh và in kết quả', desc: 'f = @(t) ... tạo hàm một dòng. fprintf in có định dạng: %d số nguyên, %.3f số thực 3 chữ số thập phân, %s chuỗi, \\n xuống dòng.', code:
`f = @(t) exp(-t) .* cos(2*pi*t);   % tín hiệu dao động tắt dần
t = linspace(0, 3, 300);           % 300 điểm từ 0 đến 3
plot(t, f(t)); grid on
title('f(t) = e^{-t} cos(2\\pi t)')

dB = @(x) 20*log10(abs(x));        % hàm đổi sang decibel
fprintf('Biên độ 0.5 = %.2f dB\\n', dB(0.5));
fprintf('Có %d mẫu, giá trị lớn nhất %.4f tại t = %.3f s\\n', length(t), max(f(t)), t(f(t) == max(f(t))));
s = sprintf('Tần số lấy mẫu %g Hz', 1/(t(2) - t(1)));
disp(s)` },
c0h: { title: 'Viết hàm của riêng bạn (function)', desc: 'Hàm cục bộ đặt ở CUỐI script, mỗi hàm kết thúc bằng end. Hàm có không gian biến riêng: biến bên trong không ảnh hưởng ra ngoài. nargin/nargout cho biết số đối số được truyền vào và số đầu ra được yêu cầu.', code:
`x = [1 2 3 1];  h = [1 1 0.5];
y = my_conv(x, h)
fprintf('Khớp với conv()? %d\\n', isequal(y, conv(x, h)));

[E, P] = energy_power(sin(2*pi*0.05*(0:99)));
fprintf('Năng lượng = %.2f, công suất trung bình = %.3f\\n', E, P);

n = 0:30;
stem(n, decay(n), 'filled'); hold on
stem(n, decay(n, 0.6)); hold off
legend('decay(n): a mặc định 0.9', 'decay(n, 0.6)'); xlabel('n')

% ---------- các hàm cục bộ ----------
function y = my_conv(x, h)
    % Tích chập viết tay: mỗi mẫu x(k) cộng một bản sao h đã dịch
    y = zeros(1, length(x) + length(h) - 1);
    for k = 1:length(x)
        idx = k:k+length(h)-1;
        y(idx) = y(idx) + x(k) * h;
    end
end

function [E, P] = energy_power(x)
    % Hàm nhiều đầu ra
    E = sum(abs(x).^2);
    P = E / length(x);
end

function h = decay(n, a)
    % Đối số tuỳ chọn: nếu không truyền a thì dùng 0.9
    if nargin < 2
        a = 0.9;
    end
    h = a.^n .* (n >= 0);
end` },
c0i: { title: 'Struct, cell array và mảng nhiều chiều', desc: 'struct gom các thông số có tên vào một biến (s.fc, s.order). Cell array {…} chứa các phần tử khác kiểu hoặc khác độ dài. Mảng 3 chiều hợp với dữ liệu nhiều kênh: (mẫu × khung × kênh).', code:
`%% Struct: gom thông số của một bộ lọc vào một biến
flt.name  = 'Thông thấp 1 kHz';
flt.fs    = 8000;
flt.fc    = 1000;
flt.order = 4;
[b, a] = butter(flt.order, flt.fc/(flt.fs/2));
flt.b = b;  flt.a = a;
flt

%% Mảng struct: nhiều bộ lọc, duyệt bằng vòng lặp
specs = struct('name', {'Thông thấp', 'Thông cao', 'Thông dải'}, ...
               'type', {'low', 'high', 'bandpass'}, ...
               'wn',   {0.2, 0.2, [0.3 0.5]});
for k = 1:numel(specs)
    if strcmp(specs(k).type, 'bandpass')
        [b, a] = butter(3, specs(k).wn);
    else
        [b, a] = butter(3, specs(k).wn, specs(k).type);
    end
    [H, w] = freqz(b, a, 512);
    plot(w/pi, 20*log10(abs(H))); hold on
end
hold off; grid on; ylim([-60 5]); xlabel('\\omega/\\pi')
legend(specs.name)               % specs.name trả về danh sách 3 chuỗi

%% Cell array: các tín hiệu có độ dài khác nhau
sigs = {randn(1, 50), sin(0.2*pi*(0:99)), ones(1, 20)};
do_dai    = cellfun(@length, sigs)
nang_luong = cellfun(@(x) sum(x.^2), sigs)

%% Mảng 3 chiều: (mẫu trong khung) × (khung) × (kênh)
fs = 1000;  t = (0:999)/fs;  f0 = [50 120 200];
X = zeros(100, 10, 3);
for ch = 1:3
    x = sin(2*pi*f0(ch)*t) .* (1 + t*ch);   % biên độ tăng dần theo thời gian
    X(:, :, ch) = reshape(x, 100, 10);      % 10 khung, mỗi khung 100 mẫu
end
size(X)
E = squeeze(sum(X.^2, 1));                  % năng lượng: 10 khung × 3 kênh
figure; plot(1:10, E, 'o-'); grid on
legend('kênh 50 Hz', 'kênh 120 Hz', 'kênh 200 Hz'); xlabel('khung'); title('Năng lượng từng khung')` },
sandbox: { title: 'Sân chơi tự do', desc: 'Viết bất kỳ code nào bạn muốn thử. Ctrl + Enter để chạy. Gõ help để xem danh sách hàm được hỗ trợ.', code:
`% Thử tạo tín hiệu của riêng bạn rồi xem phổ
fs = 1000;  t = 0:1/fs:0.5;
x = sin(2*pi*50*t) + 0.5*sin(2*pi*120*t) + 0.3*randn(size(t));
X = fft(x);
N = length(x);
f = (0:N-1)*fs/N;               % trục tần số (Hz)
subplot(2,1,1); plot(t, x); title('x(t)'); xlabel('t (s)')
subplot(2,1,2); plot(f(1:floor(N/2)), abs(X(1:floor(N/2)))*2/N)
title('Phổ biên độ một phía'); xlabel('Hz'); grid on` },

c1: { title: 'Tạo các tín hiệu cơ bản và biến đổi trục thời gian', desc: 'Dùng phép so sánh (n == 0), (n >= 0) để tạo δ[n] và u[n]: kết quả là 0/1 cho từng phần tử.', code:
`%% Tín hiệu cơ bản trên n = -10..20
n = -10:20;                        % trục chỉ số mẫu
delta = (n == 0);                  % xung đơn vị δ[n]
u     = (n >= 0);                  % bậc thang u[n]
a = 0.8;
x_exp = a.^n .* u;                 % a^n u[n]  (nhân TỪNG PHẦN TỬ)
x_sin = cos(0.2*pi*n);             % sin rời rạc, ω0 = 0.2π

subplot(2,2,1); stem(n, delta, 'filled'); title('\\delta[n]')
subplot(2,2,2); stem(n, u, 'filled');     title('u[n]')
subplot(2,2,3); stem(n, x_exp, 'filled'); title('0.8^n u[n]')
subplot(2,2,4); stem(n, x_sin, 'filled'); title('cos(0.2\\pi n)'); xlabel('n')

%% Biến đổi trục thời gian: y[n] = x[-n - 2]
xn = [0.5 1 2 3 1.5 -1];  nx = -1:4;   % x[n] chỉ khác 0 trên n = -1..4
y = zeros(size(n));
for k = 1:length(n)
    m = -n(k) - 2;                 % chỉ số gốc cần đọc
    idx = find(nx == m);           % vị trí của m trong nx
    if ~isempty(idx), y(k) = xn(idx); end
end
figure
stem(n, y, 'filled'); title('y[n] = x[-n-2]: lật rồi dịch'); xlabel('n')` },

c2: { title: 'Lấy mẫu và tần số bí danh', desc: 'Đổi f và fs ở hai dòng đầu rồi chạy lại để thấy khi nào xảy ra chồng phổ.', code:
`f  = 9;   fs = 10;                % thử: f = 3, fs = 10  rồi  f = 9, fs = 10
t  = 0:0.001:1;                    % lưới thời gian mịn ~ "liên tục"
tn = (0:fs)/fs;                    % các thời điểm lấy mẫu trong 1 s
x  = cos(2*pi*f*t);
xn = cos(2*pi*f*tn);               % x[n] = x(n/fs)
fa = abs(f - fs*round(f/fs));      % công thức gấp tần số

plot(t, x); hold on
stem(tn, xn, 'filled')
plot(t, cos(2*pi*fa*t), '--', 'LineWidth', 2)
hold off; grid on
legend('x(t)', 'mẫu x[n]', sprintf('bí danh %.1f Hz', fa))
title(sprintf('f = %g Hz, fs = %g Hz', f, fs)); xlabel('t (s)')
fprintf('Tần số Nyquist: %g Hz. Tần số nghe thấy sau khôi phục: %.2f Hz\\n', fs/2, fa);
% Nghe thử (chỉ phát khi bấm Chạy):
% sound([cos(2*pi*100*f*(0:1/44100:0.6)), cos(2*pi*100*fa*(0:1/44100:0.6))], 44100)` },

c3: { title: 'Lượng tử hoá N bit và đo SQNR', desc: 'Lượng tử kiểu mid-rise: xq = Δ·(floor(x/Δ) + 0.5). Đổi N để kiểm chứng quy tắc 6 dB/bit.', code:
`N  = 3;                            % số bit
A  = 1;                            % biên độ (toàn thang = 1)
fs = 80;  t = (0:fs-1)/fs;
x  = A*sin(2*pi*2*t + 0.3);
D  = 2/2^N;                        % bước lượng tử Δ
xq = D*(floor(x/D) + 0.5);         % làm tròn về mức gần nhất
xq = min(max(xq, -1 + D/2), 1 - D/2);   % chặn trong dải
e  = xq - x;                       % sai số lượng tử

subplot(2,1,1); plot(t, x); hold on; stairs(t, xq); hold off
title(sprintf('Lượng tử %d bit (%d mức)', N, 2^N))
subplot(2,1,2); stem(t, e/D); ylim([-0.6 0.6])
title('Sai số e[n] (đơn vị \\Delta)'); xlabel('t (s)')

% Đo SQNR với nhiều mẫu
xx = A*sin(2*pi*0.01234567*(0:19999));
qq = min(max(D*(floor(xx/D) + 0.5), -1 + D/2), 1 - D/2);
sqnr = 10*log10(sum(xx.^2) / sum((qq - xx).^2));
fprintf('SQNR đo được: %.2f dB | lý thuyết 6.02N + 1.76: %.2f dB\\n', sqnr, 6.02*N + 1.76 + 20*log10(A));` },

c4: { title: 'Tích chập: conv() và tự cài đặt bằng vòng lặp', desc: 'Công thức y[n] = Σ x[k]h[n−k] với chỉ số từ 0; trong MATLAB chỉ số từ 1 nên h[n−k] trở thành h(n−k+1).', code:
`x = [1 2 3 1];
h = [1 1 0.5];
y = conv(x, h)                     % hàm có sẵn

% Tự cài đặt đúng công thức tích chập
Lx = length(x);  Lh = length(h);
y2 = zeros(1, Lx + Lh - 1);        % độ dài Lx + Lh - 1
for n = 1:length(y2)
    for k = 1:Lx
        if n-k+1 >= 1 && n-k+1 <= Lh         % h(n-k+1) phải tồn tại
            y2(n) = y2(n) + x(k) * h(n-k+1);
        end
    end
end
y2
fprintf('Hai cách giống nhau? %d\\n', isequal(round(y, 10), round(y2, 10)));

subplot(3,1,1); stem(0:Lx-1, x, 'filled'); title('x[n]')
subplot(3,1,2); stem(0:Lh-1, h, 'filled'); title('h[n]')
subplot(3,1,3); stem(0:length(y)-1, y, 'filled'); title('y[n] = (x * h)[n]'); xlabel('n')` },

c5: { title: 'Giải phương trình sai phân bằng filter()', desc: 'filter(b, a, x) giải y[n] = Σ b_k x[n−k] − Σ a_k y[n−k] với a(1) = 1. Chú ý dấu: hồi tiếp +α·y[n−1] thì a = [1 −α].', code:
`alpha = 0.8;  b0 = 1;  b1 = 0;
b = [b0 b1];                       % hệ số phía đầu vào
a = [1 -alpha];                    % y[n] - alpha*y[n-1] = b0 x[n] + b1 x[n-1]
n = 0:39;
x = double(n == 0);                % xung đơn vị
y = filter(b, a, x);               % đáp ứng xung

% Kiểm tra bằng vòng lặp viết tay
y2 = zeros(size(x));  xprev = 0;  yprev = 0;
for k = 1:length(x)
    y2(k) = b0*x(k) + b1*xprev + alpha*yprev;
    xprev = x(k);  yprev = y2(k);
end
fprintf('Sai khác filter / vòng lặp: %g\\n', max(abs(y - y2)));

stem(n, y, 'filled'); hold on; plot(n, alpha.^n, '--'); hold off
legend('filter()', '\\alpha^n'); title('Đáp ứng xung h[n] = \\alpha^n u[n]'); xlabel('n')
if abs(alpha) < 1, disp('|alpha| < 1: hệ ổn định'), else, disp('|alpha| >= 1: hệ KHÔNG ổn định'), end` },

c6: { title: 'Đáp ứng tần số với freqz() và sin đi qua hệ', desc: '[H, w] = freqz(b, a, N) trả về H(e^jω) tại N tần số trên [0, π). Biên độ: abs(H), pha: angle(H).', code:
`M = 5;
h = ones(1, M)/M;                  % trung bình trượt M điểm
[H, w] = freqz(h, 1, 512);

subplot(2,2,1); plot(w/pi, abs(H)); grid on
title('|H(e^{j\\omega})|'); xlabel('\\omega / \\pi')
subplot(2,2,2); plot(w/pi, angle(H)); grid on
title('Pha (rad)'); xlabel('\\omega / \\pi')

% Cho sin đi qua: biên độ nhân |H(w0)|, pha cộng angle(H(w0))
w0 = 0.15*pi;  n = 0:47;
x  = cos(w0*n);
y  = filter(h, 1, x);
H0 = sum(h .* exp(-1j*w0*(0:M-1)));     % DTFT tại w0, tính tay
fprintf('|H(w0)| = %.4f, pha = %.4f rad, trễ = %.2f mẫu\\n', abs(H0), angle(H0), -angle(H0)/w0);
subplot(2,1,2); stem(n, x); hold on; stem(n, y, 'filled'); hold off
legend('x[n]', 'y[n]'); xlabel('n'); title('Sau quá độ M-1 mẫu, y là sin cùng tần số')` },

c7: { title: 'DFT bằng ma trận và so sánh với fft()', desc: 'X = W·x với W(k+1, n+1) = e^(−j2πkn/N). Lưu ý bin k = 0 nằm ở X(1).', code:
`N = 16;  n = 0:N-1;
x = 1 + cos(2*pi*2*n/N) + 0.5*sin(2*pi*5*n/N);

k = (0:N-1)';                      % cột chỉ số tần số
W = exp(-1j*2*pi*k*n/N);           % (Nx1)*(1xN) -> ma trận DFT NxN
X = W * x.';                       % .' chuyển vị KHÔNG liên hợp
X2 = fft(x);                       % thuật toán FFT có sẵn
fprintf('Sai khác DFT tay / fft: %.2e\\n', max(abs(X.' - X2)));

stem(0:N-1, abs(X2), 'filled'); xlabel('k'); ylabel('|X[k]|')
title('Phổ: bin 0 (DC = N), bin 2 và 14 (cos), bin 5 và 11 (sin)')
disp('|X[k]| với k = 0..N-1:')
disp(round(abs(X2), 3))` },

c8: { title: 'Tự cài đặt FFT radix-2 (bướm tại chỗ)', desc: 'bitrevorder sắp xếp đầu vào theo thứ tự đảo bit, sau đó mỗi tầng ghép các DFT nhỏ bằng phép bướm.', code:
`x = [1 2 1 0 -1 -2 -1 0];
N = length(x);
X = x(bitrevorder(1:N));           % [x0 x4 x2 x6 x1 x5 x3 x7]
for s = 1:log2(N)                  % log2(N) tầng
    L = 2^s;  half = L/2;
    W = exp(-1j*2*pi*(0:half-1)/L);        % hệ số xoay của tầng
    for g = 1:L:N                          % từng nhóm L điểm
        a = g:g+half-1;   b = a + half;
        t = W .* X(b);
        X(b) = X(a) - t;                   % bướm: nhánh trừ
        X(a) = X(a) + t;                   % bướm: nhánh cộng
    end
    fprintf('Tầng %d: %s\\n', s, mat2str(round(X, 2)));
end
fprintf('Sai khác với fft(): %.2e\\n', max(abs(X - fft(x))));

% So sánh số phép nhân
Ns = 2.^(2:14);
semilogy(log2(Ns), Ns.^2, 'o-'); hold on
semilogy(log2(Ns), Ns/2.*log2(Ns), 's-'); hold off; grid on
legend('DFT: N^2', 'FFT: (N/2)log_2N'); xlabel('log_2 N')` },

c9: { title: 'Cực, không và đáp ứng của hệ cộng hưởng', desc: 'poly() dựng đa thức từ nghiệm, roots() tìm nghiệm, zplane() vẽ mặt phẳng z, impz() tính đáp ứng xung.', code:
`r = 0.9;  th = pi/4;
p = r*exp([1j -1j]*th);            % cặp cực liên hợp
z = [1 -1];                        % không tại z = ±1
b = poly(z);                       % B(z) từ các không
a = real(poly(p));                 % A(z) từ các cực
fprintf('b = %s\\na = %s\\n', mat2str(b, 4), mat2str(a, 4));

subplot(1,3,1); zplane(b, a); title('Mặt phẳng z')
[H, w] = freqz(b, a, 512);
subplot(1,3,2); plot(w/pi, 20*log10(abs(H)/max(abs(H)))); grid on
ylim([-50 5]); title('|H| (dB)'); xlabel('\\omega/\\pi')
h = impz(b, a, 40);
subplot(1,3,3); stem(0:39, h, 'filled'); title('h[n]')

if max(abs(roots(a))) < 1
    fprintf('max|cực| = %.3f < 1: hệ ổn định\\n', max(abs(roots(a))));
else
    disp('Có cực ngoài vòng tròn đơn vị: hệ KHÔNG ổn định');
end` },

c10: { title: 'Thiết kế FIR bằng cửa sổ, so sánh với fir1()', desc: 'hamming(N) trả về vector CỘT, cần chuyển vị trước khi nhân với vector hàng. fir1(n, Wn) nhận bậc n = N − 1 và Wn = ωc/π.', code:
`N  = 31;                           % số hệ số
wc = 0.3*pi;                       % tần số cắt (rad/mẫu)
n  = 0:N-1;   m = n - (N-1)/2;
hd = sin(wc*m) ./ (pi*m);          % sinc lý tưởng đã dịch
hd(m == 0) = wc/pi;                % sửa điểm 0/0
w  = hamming(N)';                  % CỘT -> HÀNG
h  = hd .* w;                      % nhân cửa sổ
h2 = fir1(N-1, wc/pi);             % hàm có sẵn (chuẩn hoá DC = 1)
fprintf('Sai khác h/sum(h) so với fir1: %.2e\\n', max(abs(h/sum(h) - h2)));

[H, wf] = freqz(h, 1, 1024);
subplot(2,1,1); stem(n, h, 'filled'); title('h[n] = h_d[n]·w[n]')
subplot(2,1,2); plot(wf/pi, 20*log10(abs(H))); grid on; ylim([-100 5])
xlabel('\\omega/\\pi'); ylabel('dB'); title('Đáp ứng biên độ (Hamming, N = 31)')

% Lọc tín hiệu thử: sin chậm + sin nhanh
x = sin(0.05*pi*(0:259)) + 0.6*sin(0.6*pi*(0:259));
y = filter(h2, 1, x);
figure; plot(x); hold on; plot(y, 'LineWidth', 2); hold off
legend('vào', 'ra (trễ 15 mẫu)'); xlabel('n')` },

c11: { title: 'Butterworth với butter() và tự làm biến đổi song tuyến', desc: 'butter(N, Wn) với Wn = fc/(fs/2). Wn = [w1 w2] cho bộ lọc thông dải bậc 2N, thêm \'stop\' cho chắn dải, \'high\' cho thông cao. [z, p, k] = butter(...) trả về dạng cực-không.', code:
`fs = 8000;  fc = 800;  N = 4;
[b, a]    = butter(N, fc/(fs/2));  % hệ số đa thức
[z, p, k] = butter(N, fc/(fs/2));  % cực - không - hệ số khuếch đại
disp('|cực| (đều < 1):'); disp(abs(p).')

[H, f] = freqz(b, a, 1024, fs);    % trục tần số theo Hz
bf = fir1(2*N, fc/(fs/2));         % FIR cùng số phép nhân (2N+1)
Hf = freqz(bf, 1, 1024, fs);
plot(f, 20*log10(abs(H))); hold on
plot(f, 20*log10(abs(Hf)), '--'); hold off; grid on
ylim([-80 5]); xlabel('Hz'); ylabel('dB'); legend('Butterworth IIR', 'FIR Hamming')

% Tự tính cực bằng biến đổi song tuyến (T = 2)
Wc  = tan(pi*fc/fs);                         % prewarp
kk  = 1:N;
s_p = Wc*exp(1j*pi*(2*kk + N - 1)/(2*N));    % cực tương tự
z_p = (1 + s_p)./(1 - s_p);                  % ánh xạ s -> z
fprintf('Sai khác |cực| tự tính và butter: %.2e\\n', max(abs(sort(abs(z_p)) - sort(abs(p.')))));

% Lọc âm thanh: tông 300 Hz + tiếng rít 2500 Hz + nhiễu
t = 0:1/fs:2;
x = 0.5*sin(2*pi*300*t) + 0.25*sin(2*pi*2500*t) + 0.12*randn(size(t));
y = filter(b, a, x);
% soundsc(y, fs)        % bỏ % rồi bấm Chạy để nghe

%% Bốn loại bộ lọc Butterworth bậc 4 (thông dải/chắn dải có bậc 2N = 8)
[b1, a1] = butter(4, 800/(fs/2));                 % thông thấp
[b2, a2] = butter(4, 800/(fs/2), 'high');         % thông cao
[b3, a3] = butter(4, [1500 2000]/(fs/2));         % thông dải 1500-2000 Hz
[b4, a4] = butter(4, [1500 2000]/(fs/2), 'stop'); % chắn dải
figure
for kk = 1:4
    switch kk
        case 1, bb = b1; aa = a1; ten = 'Thông thấp 800 Hz';
        case 2, bb = b2; aa = a2; ten = 'Thông cao 800 Hz';
        case 3, bb = b3; aa = a3; ten = 'Thông dải 1500-2000 Hz';
        case 4, bb = b4; aa = a4; ten = 'Chắn dải 1500-2000 Hz';
    end
    [Hk, fk] = freqz(bb, aa, 1024, fs);
    subplot(2,2,kk); plot(fk, 20*log10(abs(Hk))); grid on; ylim([-60 5])
    yline(-3, ':'); title(ten); xlabel('Hz')
end
fprintf('Thông dải: bậc %d, |cực| lớn nhất = %.4f\\n', length(a3) - 1, max(abs(roots(a3))));
x3 = filter(b3, a3, x);       % chỉ giữ thành phần quanh 1500-2000 Hz` },

c12: { title: 'Rò rỉ phổ, cửa sổ và spectrogram()', desc: 'fft(x, Nfft) tự thêm số 0 (zero-padding). spectrogram(x, window, noverlap, nfft, fs, \'yaxis\') vẽ phổ đồ.', code:
`N = 64;  n = 0:N-1;
x = cos(2*pi*10*n/N) + 10^(-20/20)*cos(2*pi*13*n/N + 0.7);
w = hann(N)';                      % cửa sổ Hann (chuyển thành hàng)
Nfft = 256;                        % zero-padding x4
X1 = fft(x, Nfft);                 % cửa sổ chữ nhật
X2 = fft(x .* w, Nfft);            % cửa sổ Hann
k  = (0:Nfft/2)*N/Nfft;            % trục theo bin của N = 64
plot(k, 20*log10(abs(X1(1:Nfft/2+1))*2/N)); hold on
plot(k, 20*log10(abs(X2(1:Nfft/2+1))*2/sum(w)), 'LineWidth', 1.8); hold off
ylim([-100 5]); grid on; legend('chữ nhật', 'Hann'); xlabel('bin'); ylabel('dB')
title('Sin −20 dB ở bin 13 bị che bởi rò rỉ của cửa sổ chữ nhật')

% Phổ đồ của chirp 100 -> 3800 Hz
fs = 8000;  t = 0:1/fs:1.6;
xc = chirp(t, 100, 1.6, 3800);
figure
spectrogram(xc, hann(128), 96, 128, fs, 'yaxis')
title('spectrogram: cửa sổ 128 mẫu (16 ms)')` },

c13: { title: 'Decimation và interpolation', desc: 'downsample(x, M) giữ một mẫu trong M; upsample(x, L) chèn L − 1 số 0. Bộ lọc fir1(62, 1/M) có tần số cắt π/M.', code:
`M = 3;  n = 0:511;
x = cos(0.08*pi*n) + 0.7*cos(0.78*pi*n);
h = fir1(62, 1/M);                         % thông thấp π/M, 63 hệ số
y_bad  = downsample(x, M);                 % KHÔNG lọc -> chồng phổ
y_good = downsample(filter(h, 1, x), M);   % lọc trước rồi mới bỏ mẫu

Nf = 1024;  f = (0:Nf/2)/(Nf/2);
P  = @(s) abs(fft(s, Nf)) / max(abs(fft(s, Nf)));   % phổ chuẩn hoá
X = P(x);  Yb = P(y_bad);  Yg = P(y_good);
plot(f, X(1:Nf/2+1), ':'); hold on
plot(f, Yb(1:Nf/2+1)); plot(f, Yg(1:Nf/2+1), 'LineWidth', 2); hold off
legend('x gốc', '↓3 không lọc', '↓3 có lọc'); xlabel('\\omega/\\pi'); grid on
fprintf('0.78π × %d = %.2fπ, gấp về %.2fπ: vạch giả khi không lọc\\n', M, 0.78*M, abs(mod(0.78*M + 1, 2) - 1));

% Nội suy L = 3 lần
L = 3;  xs = cos(0.12*pi*(0:139));
v  = upsample(xs, L);                      % chèn 2 số 0 giữa các mẫu
yi = L * filter(fir1(62, 1/L), 1, v);      % lọc xoá ảnh, khuếch đại L
figure; stem(0:71, v(1:72)); hold on; plot(0:71, yi(32:103), 'LineWidth', 2); hold off
legend('sau chèn số 0', 'sau lọc (đã bù trễ 31 mẫu)'); xlabel('n')` },

c14: { title: 'Khử nhiễu bằng LMS viết tay', desc: 'Toàn bộ thuật toán chỉ là 4 dòng trong vòng lặp: dịch thanh ghi, tính đầu ra, tính sai số, cập nhật trọng số.', code:
`L = 3000;  n = 0:L-1;
s = 0.6*sin(0.05*n) .* (0.6 + 0.4*sin(0.004*n));      % tín hiệu có ích
v = sin(0.3*n) + 0.5*sin(0.71*n + 1) + 0.5*randn(1, L); % nhiễu tham chiếu
hpath = [0.8 -0.5 0.3 0.2 -0.1];                       % đường truyền chưa biết
d = s + filter(hpath, 1, v);                           % micro chính

M = 8;  mu = 0.02;
w = zeros(M, 1);  xbuf = zeros(M, 1);  e = zeros(1, L);
for k = 1:L
    xbuf = [v(k); xbuf(1:M-1)];    % dịch thanh ghi trễ
    yk   = w' * xbuf;              % đầu ra bộ lọc (ước lượng nhiễu)
    e(k) = d(k) - yk;              % sai số = tín hiệu đã làm sạch
    w    = w + mu * e(k) * xbuf;   % cập nhật LMS
end

subplot(2,1,1); plot(n(1:1500), d(1:1500)); hold on
plot(n(1:1500), e(1:1500), 'LineWidth', 1.4); hold off
legend('d = s + nhiễu', 'e (đã khử nhiễu)'); title('Khử nhiễu bằng LMS')
subplot(2,1,2); stem(0:M-1, w, 'filled'); hold on; stem(0:4, hpath); hold off
legend('w học được', 'h thật'); xlabel('k')
fprintf('w = %s\\n', mat2str(w', 3));
fprintf('MSE 500 mẫu cuối: %.2f dB\\n', 10*log10(mean((e(end-499:end) - s(end-499:end)).^2)));` },

c15: { title: 'Định dạng Q, lượng tử hệ số và tràn số', desc: 'Mô phỏng số học dấu phẩy tĩnh bằng round, min/max (bão hoà) và mod (tràn quay vòng). dec2bin(mod(q, 2^B), B) cho chuỗi bit bù 2.', code:
`%% Biểu diễn 0.7071 ở Q0.15 (16 bit)
B = 16;  nf = 15;  v = 0.70710678;
q = round(v * 2^nf);                       % số nguyên lưu trữ
q = min(max(q, -2^(B-1)), 2^(B-1) - 1);    % bão hoà
fprintf('Số nguyên: %d | hex: 0x%s | giá trị: %.8f | sai số: %.2e\\n', q, dec2hex(mod(q, 2^B), 4), q/2^nf, q/2^nf - v);
fprintf('Nhị phân: %s\\n', dec2bin(mod(q, 2^B), B));

%% Lượng tử hệ số IIR: dạng trực tiếp và nối tầng biquad
[b, a] = butter(6, 0.06);
Q = @(c, bits) round(c * 2^bits) / 2^bits;
bits = 12;
aq = Q(a, bits);
fprintf('max|cực|: số thực %.5f | trực tiếp đã lượng tử %.5f\\n', max(abs(roots(a))), max(abs(roots(aq))));
p = roots(a);  p = p(imag(p) > 0);         % mỗi cặp liên hợp -> một biquad
pc = [];
for k = 1:length(p)
    sec = Q([1, -2*real(p(k)), abs(p(k))^2], bits);
    pc = [pc; roots(sec)];
end
fprintf('max|cực| nối tầng biquad đã lượng tử: %.5f\\n', max(abs(pc)));

%% Tràn số 8 bit Q0.7: quay vòng và bão hoà
t  = linspace(0, 2, 400);  x = 1.4*sin(2*pi*t);
xi = round(x*128);
wrap = mod(xi + 128, 256) - 128;           % tràn quay vòng (bù 2)
sat  = min(max(xi, -128), 127);            % bão hoà
plot(t, x, ':'); hold on; plot(t, wrap/128); plot(t, sat/128, 'LineWidth', 2); hold off
legend('lý tưởng', 'wrap', 'saturate'); grid on; title('Khuếch đại 1.4 vượt dải [-1, 1)')` }
};
