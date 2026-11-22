# Phòng Lab Tín Hiệu Số (dsp-lab)

Trang web tương tác (tiếng Việt) dạy xử lý tín hiệu số từ cơ bản đến nâng cao, có trình chạy MATLAB thu gọn chạy ngay trong trình duyệt. Toàn bộ là một file HTML tĩnh, không framework, không bước build nào ngoài việc ghép file.

- Trang công khai: https://datdatnguyen2609.github.io/dsp-lab/ (GitHub Pages, nhánh `main`, thư mục gốc)
- Bản riêng trên claude.ai (Artifact): https://claude.ai/artifact/R4Syem3g9WeCY5fUtopBof — cập nhật bằng cách publish `dist/artifact.html` với `url` này
- Người dùng giao tiếp bằng tiếng Việt; mọi nội dung trên trang và thông báo lỗi đều bằng tiếng Việt.

## Sửa và build
- **Không sửa `index.html` trực tiếp.** Sửa các phần trong `src/`, rồi chạy `bash build.sh test` (ghép file, `node --check`, chạy toàn bộ đoạn MATLAB mẫu qua trình thông dịch).
- `build.sh` tạo `index.html` (có `<!doctype>`, dùng cho GitHub Pages) và `dist/artifact.html` (không có html/head/body — Artifact tự bọc khung).
- Kiểm tra giao diện: Edge headless (`msedge.exe --headless=new --screenshot=... --virtual-time-budget=15000`). Chụp màn hình headless không vẽ lại sau khi cuộn, nên muốn xem một khung ở giữa trang thì tạo bản tạm có CSS ẩn các phần khác.
- Commit: tên/email đã đặt riêng cho repo (noreply của GitHub), không đổi cấu hình git toàn cục.

## Cấu trúc `src/`
| File | Nội dung |
|---|---|
| `p1_head.html` | `<title>`, font, MathJax 3 (cdnjs, tex-svg-full), toàn bộ CSS chính + token màu sáng/tối |
| `p1b_mlab.css` | CSS cho khung MATLAB, tab file, `[hidden]` |
| `p2_body1.html` | Thanh trên, mục lục, hero, **chương 0 (MATLAB cấp tốc)**, chương 1–5 |
| `p3_body2.html` | Chương 6–9 |
| `p4_body3.html` | Chương 10–15, bảng công thức |
| `p5a_math.js` | Thư viện DSP thuần (fft, dft, conv, freqz, filt, windowFn, firDesign, butter, polyRoots, lms, rng…) — kiểm thử được bằng Node |
| `p5b_ui.js` | Lớp `Plot` (canvas), registry `demo()` vẽ lại khi đổi theme/kích thước, stepper "Bước tiếp", tiến độ (localStorage `dsp-lab-done`), mục lục |
| `p6_demosA.js`, `p7_demosB.js` | Thí nghiệm tương tác chương 1–8 và 9–15 |
| `p8_quiz.js` | `QUIZ` (chương 0–15) và dựng câu hỏi |
| `p9_mlab.js` | **Trình thông dịch MATLAB** `MLAB.run(src, {files, seed, allowSound, onSound})` |
| `p10_mlscripts.js` | `ML_SCRIPTS`: code MATLAB mẫu cho từng khung (`c0a…c0i`, `sandbox`, `c1…c15`) |
| `p11_mlab_ui.js` | Trình soạn thảo (tô màu, số dòng), vẽ đồ thị kiểu MATLAB (`mlDrawAxes`), dựng các khung `.mlab[data-ml]`, tự chạy khi cuộn tới |
| `p12_workspace.js` | "Thư mục làm việc" nhiều file .m (`.mlab[data-ml=workspace]`), file mẫu `ML_DEFAULT_FILES`, lưu localStorage `dsp-lab-files-v2` |

Tất cả JS được ghép vào **một** IIFE, nên các file dùng chung phạm vi (ví dụ `p11` dùng `cmap` của `p7`, `gcd` của `p5a`).

## Trình thông dịch MATLAB (`p9_mlab.js`)
- Kiểu giá trị: `Mat` (lưu theo cột, `re`/`im` Float64Array, `dims` cho mảng N chiều), `Str`, `Cell` (2 chiều), `Struct` (mảng các `Map`), `Fun` (hàm ẩn danh), `FH` (`@ten`), `CSL` (danh sách tách rời `c{:}`), `Obj`/`OArr` (đối tượng classdef và mảng đối tượng).
- Lexer xử lý dấu cách trong `[ ]` như MATLAB (`[1 -2]` là 2 phần tử), `'` là chuyển vị hay chuỗi tuỳ ngữ cảnh, `2.^n`.
- Parser: biểu thức theo đúng độ ưu tiên MATLAB, vế trái là chuỗi truy cập (`s(2).a{3}(4)`), `function` (kể cả `get.X`/`set.X`), `classdef` (properties/methods/events/enumeration, thuộc tính Static/Constant/Dependent), `obj@Cha(...)`, `import`.
- `Interp`: thứ tự tìm hàm = phương thức của đối tượng > hàm cục bộ trong file > hàm cuối script > file trong thư mục (có xét `import`, tên gói dạng `goi.ham`) > hàm có sẵn `FN`. Lớp giá trị được sao chép khi gán (`cloneV`), lớp handle dùng chung.
- Khoảng 200 hàm có sẵn trong `FN` (toán, ma trận, fft/filter/freqz/fir1/butter đủ 4 loại/zplane/spectrogram, đồ thị, chuỗi, struct/cell, class). Đồ thị chỉ lưu mô hình (`figs → axes → series`), phần vẽ nằm ở `p11`.
- Lỗi là `MErr` có `line` và `file`; thông báo bằng tiếng Việt, có gợi ý (chỉ số từ 1, `.*`…).
- Chưa có: phần lớn các toolbox ngoài các hàm DSP thường dùng.

## Lưu ý thiết kế
- Trang phải chạy được cả khi mở file trực tiếp lẫn trong khung Artifact (không `alert/confirm/prompt`, xác nhận xoá bằng bấm hai lần, âm thanh chỉ phát sau khi người dùng bấm nút).
- Màu lấy từ token CSS; canvas đọc lại token qua `readColors()` mỗi lần vẽ.
- Mọi thay đổi MATLAB cần giữ `bash build.sh test` = 0 lỗi.
