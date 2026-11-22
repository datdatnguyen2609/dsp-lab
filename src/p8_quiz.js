
/* ================= CÂU HỎI KIỂM TRA ================= */
const QUIZ = {
  0: [
    ['Cho x = [10 20 30 40]. Biểu thức nào trả về 10?', ['x(0)', 'x(1)', 'x[0]', 'x(end-4)'], 1, 'MATLAB đánh chỉ số từ 1. x(0) báo lỗi; x[0] sai cú pháp (MATLAB dùng ngoặc tròn).'],
    ['Muốn nhân tín hiệu x (vector hàng 1×N) với cửa sổ Hamming cùng độ dài, viết:', ['x * hamming(N)', 'x .* hamming(N)', "x .* hamming(N)'", 'hamming(x)'], 2, "hamming(N) trả về vector cột N×1. x .* hamming(N) không báo lỗi mà mở rộng ngầm thành ma trận N×N. Phải chuyển vị: hamming(N)'."],
    ['fs = 8000 Hz, muốn FIR thông thấp 61 hệ số, tần số cắt 1 kHz. Lệnh đúng là:', ['fir1(61, 1000)', 'fir1(60, 1000/8000)', 'fir1(60, 1000/4000)', 'fir1(61, 0.125)'], 2, 'fir1 nhận BẬC n = số hệ số − 1 = 60 và Wn chuẩn hoá theo Nyquist fs/2 = 4000 Hz: Wn = 0.25.'],
    ['Phương trình y[n] = x[n] + 0.9·y[n−1] ứng với lệnh nào?', ['filter(1, [1 0.9], x)', 'filter(1, [1 -0.9], x)', 'filter([1 0.9], 1, x)', 'conv(x, [1 0.9])'], 1, 'Chuyển y sang vế trái: y[n] − 0.9y[n−1] = x[n], nên a = [1 −0.9], b = 1.']
  ],
  1: [
    ['Hệ y[n] = n·x[n] có tính chất nào?', ['Tuyến tính và bất biến thời gian', 'Tuyến tính nhưng biến thiên theo thời gian', 'Phi tuyến và bất biến', 'Phi tuyến và biến thiên'], 1, 'Nhân với hằng số và cộng vẫn giữ nguyên (tuyến tính). Nhưng trễ đầu vào n₀ cho n·x[n−n₀], khác với đầu ra trễ (n−n₀)·x[n−n₀], nên không bất biến.'],
    ['Biểu thức nào bằng δ[n]?', ['u[n] + u[n−1]', 'u[n] − u[n−1]', 'u[n]·u[−n−1]', 'n·u[n]'], 1, 'u[n] − u[n−1] chỉ khác 0 tại n = 0, nơi u[0] = 1 còn u[−1] = 0.'],
    ['x[n] = cos(0.3πn) có tuần hoàn không? Nếu có, chu kỳ cơ bản là bao nhiêu?', ['Không tuần hoàn', 'N = 10', 'N = 20', 'N = 3'], 2, 'ω₀/2π = 0.15 = 3/20, tối giản nên N = 20 mẫu (gồm 3 chu kỳ của đường bao liên tục).']
  ],
  2: [
    ['Tín hiệu có thành phần cao nhất 7 kHz. Tần số lấy mẫu tối thiểu theo Nyquist?', ['7 kHz', '14 kHz (phải lớn hơn)', '3,5 kHz', '21 kHz'], 1, 'Cần fs > 2·f_max = 14 kHz. Thực tế chọn cao hơn để bộ lọc chống chồng phổ có khoảng chuyển tiếp.'],
    ['Lấy mẫu sin 9 kHz với fs = 10 kHz, ta nghe thấy tần số nào sau khi khôi phục?', ['9 kHz', '1 kHz', '19 kHz', '5 kHz'], 1, 'f_alias = |9 − 10·round(0.9)| = |9 − 10| = 1 kHz.'],
    ['Vì sao bộ lọc chống chồng phổ phải đặt TRƯỚC bộ ADC?', ['Để giảm công suất tiêu thụ', 'Vì sau khi lấy mẫu, tần số bí danh không phân biệt được với tần số thật', 'Để tăng số bit', 'Không cần thiết nếu dùng FFT'], 1, 'Các mẫu của f và f + kfs giống hệt nhau, nên phải loại thành phần cao tần khi tín hiệu còn ở dạng tương tự.']
  ],
  3: [
    ['Nâng ADC từ 12 bit lên 16 bit thì SQNR tăng khoảng bao nhiêu?', ['4 dB', '12 dB', '24 dB', '48 dB'], 2, 'Mỗi bit thêm ~6,02 dB, 4 bit thêm ~24 dB.'],
    ['Công suất nhiễu lượng tử (phân bố đều, bước Δ) là:', ['Δ/2', 'Δ²/12', 'Δ²/4', 'Δ/√12'], 1, 'Phương sai của phân bố đều trên [−Δ/2, Δ/2] là Δ²/12. (Δ/√12 là độ lệch chuẩn.)'],
    ['Tín hiệu chỉ dùng 1/4 dải đo của ADC. SQNR so với toàn thang giảm:', ['Không đổi', '~6 dB', '~12 dB', '~24 dB'], 2, '20·log10(1/4) ≈ −12 dB: biên độ giảm 2 lần thì mất ~6 dB, tương đương mất 1 bit.']
  ],
  4: [
    ['x = [1, 2] và h = [1, 1, 1]. Tích chập y = x * h bằng:', ['[1, 3, 3, 2]', '[1, 2, 1, 2]', '[1, 3, 2]', '[2, 3, 3, 1]'], 0, 'y[0]=1·1=1, y[1]=1·1+2·1=3, y[2]=1·1+2·1=3, y[3]=2·1=2. Độ dài 2+3−1 = 4.'],
    ['Hệ LTI có h[n] = 0.5ⁿu[n]. Hệ này:', ['Nhân quả và ổn định', 'Nhân quả, không ổn định', 'Không nhân quả, ổn định', 'Không nhân quả, không ổn định'], 0, 'h[n] = 0 với n < 0 nên nhân quả; Σ|0.5ⁿ| = 2 < ∞ nên ổn định.'],
    ['Thứ tự thao tác khi tính y[n] bằng phương pháp đồ thị:', ['Nhân, dịch, lật, cộng', 'Lật h, dịch n, nhân với x, cộng', 'Cộng, nhân, lật, dịch', 'Lật x và h, rồi nhân'], 1, 'y[n] = Σ x[k]h[n−k]: lật h[k] thành h[−k], dịch n, nhân từng điểm với x[k], rồi cộng.']
  ],
  5: [
    ['Hệ y[n] = x[n] + 1.2·y[n−1] là:', ['FIR ổn định', 'IIR ổn định', 'IIR không ổn định', 'FIR không ổn định'], 2, 'Có hồi tiếp nên IIR; h[n] = 1.2ⁿu[n] tăng không giới hạn vì |α| > 1.'],
    ['Phương trình nào mô tả bộ lọc FIR?', ['y[n] = 0.5x[n] + 0.5x[n−1]', 'y[n] = x[n] − 0.9y[n−1]', 'y[n] = y[n−1] + x[n]', 'y[n] = x[n] + 0.1y[n−2]'], 0, 'Không có số hạng y[n−k] ở vế phải nên đáp ứng xung hữu hạn: h = [0.5, 0.5].'],
    ['Với y[n] = x[n] + 0.5y[n−1] và x[n] = u[n], giá trị xác lập y[∞] là:', ['1', '1.5', '2', '∞'], 2, 'Ở trạng thái xác lập y = 1 + 0.5y nên y = 2 (tức H(1) = 1/(1−0.5)).']
  ],
  6: [
    ['Cho cos(ω₀n) qua hệ LTI ổn định, đầu ra là:', ['Sin tần số 2ω₀', 'Sin cùng tần số ω₀, biên độ và pha thay đổi', 'Xung vuông', 'Luôn giống đầu vào'], 1, 'Mũ phức là hàm riêng của hệ LTI: chỉ bị nhân với H(e^jω₀).'],
    ['Bộ trung bình trượt M = 4 triệt tiêu hoàn toàn tần số nào?', ['ω = π/4', 'ω = π/2 và π', 'ω = π/3', 'Không tần số nào'], 1, 'Điểm không tại ω = 2πk/4: π/2, π (và 3π/2 ≡ −π/2).'],
    ['DTFT của tín hiệu rời rạc luôn:', ['Tuần hoàn chu kỳ 2π theo ω', 'Không tuần hoàn', 'Tuần hoàn chu kỳ π', 'Là hàm thực'], 0, 'e^{−j(ω+2π)n} = e^{−jωn} vì n nguyên.']
  ],
  7: [
    ['fs = 1000 Hz, N = 250 điểm. Khoảng cách giữa hai bin DFT là:', ['0,25 Hz', '4 Hz', '250 Hz', '1000 Hz'], 1, 'Δf = fs/N = 1000/250 = 4 Hz.'],
    ['x[n] thực, N = 16, |X[3]| = 5. Suy ra:', ['|X[13]| = 5', '|X[3]| = |X[8]|', 'X[0] = 5', 'Không suy ra được gì'], 0, 'Đối xứng liên hợp: X[N−k] = X*[k], nên |X[13]| = |X[3]|.'],
    ['DFT của x[n] = δ[n] (N điểm) là:', ['X[k] = δ[k]', 'X[k] = 1 với mọi k', 'X[k] = N', 'X[k] = 0'], 1, 'Chỉ có số hạng n = 0, e⁰ = 1 nên X[k] = 1: xung chứa mọi tần số với biên độ như nhau.']
  ],
  8: [
    ['FFT radix-2 cho N = 1024 cần khoảng bao nhiêu phép nhân phức?', ['1 048 576', '5 120', '10 240', '1 024'], 1, '(N/2)·log₂N = 512·10 = 5120.'],
    ['Phép bướm (butterfly) tính:', ['X[k] = E[k]·O[k]', 'X[k] = E[k] ± W_N^k·O[k]', 'X[k] = E[k] + O[k+1]', 'X[k] = W_N^k·E[k]'], 1, 'Một phép nhân W·O dùng cho cả hai đầu ra: cộng và trừ.'],
    ['Với FFT DIT 8 điểm, vị trí 1 của đầu vào sau khi đảo bit chứa mẫu:', ['x[1]', 'x[4]', 'x[2]', 'x[7]'], 1, '1 = 001₂, đảo thành 100₂ = 4.']
  ],
  9: [
    ['Hệ nhân quả ổn định khi và chỉ khi:', ['Mọi không nằm trong vòng tròn đơn vị', 'Mọi cực nằm trong vòng tròn đơn vị', 'Có ít nhất một cực tại z = 0', 'Tử số bậc cao hơn mẫu số'], 1, 'ROC của hệ nhân quả là |z| > max|p|; ổn định khi ROC chứa |z| = 1.'],
    ['Đặt một cặp không trên vòng tròn đơn vị tại e^(±jπ/3) tạo ra:', ['Đỉnh cộng hưởng tại π/3', 'Điểm triệt tiêu hoàn toàn tại ω = π/3', 'Hệ không ổn định', 'Pha tuyến tính'], 1, 'Khi e^jω chạm đúng điểm không, khoảng cách bằng 0 nên |H| = 0: bộ lọc notch.'],
    ['Biến đổi Z của x[n−3] là:', ['z³X(z)', 'z⁻³X(z)', 'X(z − 3)', '3X(z)'], 1, 'Tính chất dịch thời gian: trễ k mẫu tương ứng nhân z^(−k).']
  ],
  10: [
    ['Vì sao phải nhân h_d[n] với cửa sổ?', ['Để tăng độ lợi', 'Vì h_d[n] dài vô hạn, phải cắt thành hữu hạn', 'Để biến FIR thành IIR', 'Để lấy mẫu lại'], 1, 'sinc lý tưởng dài vô hạn và không nhân quả; cửa sổ cắt cụt nó một cách “mềm”.'],
    ['Đổi cửa sổ Chữ nhật sang Blackman (giữ N) thì:', ['Suy hao dải chặn tăng, vùng chuyển tiếp rộng hơn', 'Suy hao giảm, chuyển tiếp hẹp hơn', 'Không đổi gì', 'Mất pha tuyến tính'], 0, 'Búp phụ thấp hơn (~−57 dB) nhưng búp chính rộng hơn (~5,5·2π/N).'],
    ['FIR đối xứng N = 51 hệ số có độ trễ nhóm:', ['51 mẫu', '25 mẫu', '50 mẫu', 'Thay đổi theo tần số'], 1, '(N − 1)/2 = 25 mẫu, như nhau ở mọi tần số (pha tuyến tính).']
  ],
  11: [
    ['Prewarping trong biến đổi song tuyến dùng để:', ['Làm bộ lọc ổn định', 'Bù méo trục tần số để tần số cắt rơi đúng vị trí', 'Giảm bậc bộ lọc', 'Loại bỏ aliasing'], 1, 'Ω = (2/T)tan(ω/2) phi tuyến; tính Ωc từ ωc mong muốn trước khi thiết kế tương tự.'],
    ['Butterworth bậc N suy giảm ngoài dải thông với tốc độ:', ['6 dB/octave', '20N dB/decade', '3 dB cố định', '40 dB/decade với mọi N'], 1, '|H|² ~ (Ωc/Ω)^(2N) nên |H| giảm 20N dB mỗi decade (≈ 6N dB/octave).'],
    ['Biến đổi song tuyến ánh xạ trục jΩ thành:', ['Trục thực của mặt phẳng z', 'Đường tròn đơn vị', 'Điểm z = 1', 'Nửa trái mặt phẳng z'], 1, 'Toàn bộ trục jΩ (−∞..∞) được nén lên đường tròn đơn vị, Ω → ∞ ứng với z = −1.']
  ],
  12: [
    ['Zero-padding một khung 64 mẫu lên 512 điểm FFT sẽ:', ['Tăng độ phân giải tần số thật lên 8 lần', 'Cho lưới bin mịn hơn nhưng không tách được hai sin gần hơn', 'Giảm rò rỉ phổ', 'Tăng SNR'], 1, 'Chỉ nội suy cùng một phổ; độ phân giải phụ thuộc thời gian quan sát (64 mẫu).'],
    ['Rò rỉ phổ xảy ra khi:', ['Tín hiệu có đúng số chu kỳ nguyên trong khung', 'Tín hiệu không có số chu kỳ nguyên trong khung (hai đầu khung không khớp)', 'Dùng FFT thay cho DFT', 'fs quá cao'], 1, 'DFT coi khung là một chu kỳ; chỗ nhảy ở hai đầu sinh thành phần ở mọi bin.'],
    ['Muốn thấy rõ thời điểm một tiếng gõ ngắn trong spectrogram, nên:', ['Dùng cửa sổ dài', 'Dùng cửa sổ ngắn', 'Tăng zero-padding', 'Giảm fs'], 1, 'Cửa sổ ngắn cho độ phân giải thời gian tốt (đổi lại độ phân giải tần số kém).']
  ],
  13: [
    ['Trước khi hạ tốc độ ↓4 cần bộ lọc thông thấp với tần số cắt:', ['π/2', 'π/4', '4π', 'Không cần lọc'], 1, 'Sau ↓M phổ giãn M lần; băng thông phải dưới π/M để không chồng phổ.'],
    ['Sau khi chèn số 0 (↑L) mà chưa lọc, phổ có:', ['Aliasing', 'L − 1 bản ảnh (image)', 'Không thay đổi', 'Mất thành phần DC'], 1, 'V(e^jω) = X(e^jωL): phổ bị nén, các bản lặp lọt vào [−π, π].'],
    ['Ưu điểm chính của cấu trúc polyphase cho decimator M lần:', ['Giảm M lần số phép tính', 'Tăng độ dốc bộ lọc', 'Bỏ được bộ lọc', 'Tăng fs'], 0, 'Đẳng thức Noble cho phép lọc ở tốc độ thấp, không tính các mẫu sẽ bị bỏ.']
  ],
  14: [
    ['Công thức cập nhật LMS:', ['w ← w − μ·e·x', 'w ← w + μ·e[n]·x[n]', 'w ← μ·w + e', 'w ← (XᵀX)⁻¹Xᵀd'], 1, 'Hạ gradient với gradient tức thời −2e·x (hệ số 2 gộp vào μ).'],
    ['Tăng μ quá lớn thì:', ['Hội tụ chậm hơn', 'Thuật toán có thể phân kỳ', 'Sai số dư bằng 0', 'Không ảnh hưởng'], 1, 'Cần 0 < μ < 2/(M·Px) (gần đúng); vượt ngưỡng thì trọng số dao động và bùng nổ.'],
    ['Trong khử nhiễu chủ động, tín hiệu đã làm sạch chính là:', ['Đầu ra bộ lọc y[n]', 'Sai số e[n] = d[n] − y[n]', 'Tham chiếu x[n]', 'Trọng số w'], 1, 'Bộ lọc học cách tái tạo phần nhiễu trong d; trừ đi còn lại tín hiệu có ích.']
  ],
  15: [
    ['Số 16 bit Q0.15 (Q15) biểu diễn dải:', ['[0, 1)', '[−1, 1)', '[−32768, 32767]', '[−2, 2)'], 1, 'Bit dấu trọng số −1, 15 bit phân số: [−1, 1 − 2⁻¹⁵].'],
    ['Nhân hai số Q0.15 (16 bit) cho tích ở định dạng:', ['Q0.15 (16 bit)', 'Q1.30 (32 bit)', 'Q0.30 (31 bit)', 'Q2.28 (31 bit)'], 1, 'Q(a+c+1).(b+d) = Q(0+0+1).(15+15) = Q1.30, tổng 1 + 1 + 30 = 32 bit. Bit nguyên thêm vào để chứa (−1)×(−1) = +1.'],
    ['Vì sao bộ lọc IIR bậc cao nên chia thành các khâu biquad nối tầng?', ['Giảm độ trễ', 'Giảm độ nhạy của vị trí cực với sai số lượng tử hệ số', 'Tăng bậc bộ lọc', 'Để có pha tuyến tính'], 1, 'Nghiệm đa thức bậc cao rất nhạy; mỗi biquad chỉ điều khiển một cặp cực.']
  ]
};
document.querySelectorAll('.quiz[data-quiz]').forEach(box => {
  const ch = box.dataset.quiz, qs = QUIZ[ch] || [];
  box.innerHTML = `<h4>Kiểm tra nhanh <span id="qs${ch}">0/${qs.length} câu đã trả lời</span></h4>`;
  let answered = 0, right = 0;
  qs.forEach(([q, opts, ans, why], qi) => {
    const d = document.createElement('div'); d.className = 'q';
    d.innerHTML = `<div class="qt">${qi + 1}. ${q}</div><div class="opts"></div><div class="exp" hidden></div>`;
    const op = d.querySelector('.opts'), ex = d.querySelector('.exp');
    opts.forEach((o, oi) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'opt'; b.textContent = String.fromCharCode(65 + oi) + '. ' + o;
      b.onclick = () => {
        op.querySelectorAll('button').forEach((bb, j) => { bb.disabled = true; if (j === ans) bb.classList.add('right'); });
        if (oi !== ans) b.classList.add('wrong'); else right++;
        answered++;
        ex.hidden = false; ex.innerHTML = (oi === ans ? '<b class="c-a3">Chính xác.</b> ' : '<b style="color:var(--bad)">Chưa đúng.</b> ') + why;
        $('qs' + ch).textContent = `${answered}/${qs.length} câu · đúng ${right}`;
        if (answered === qs.length) { done['c' + ch] = true; saveDone(); updateProgress(); }
      };
      op.appendChild(b);
    });
    box.appendChild(d);
  });
});
updateProgress();
