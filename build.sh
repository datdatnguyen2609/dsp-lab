#!/usr/bin/env bash
# Ghép các phần trong src/ thành index.html (trang đầy đủ) và dist/artifact.html (bản không có <html>/<head>/<body>, để publish lên claude.ai).
# Chạy: bash build.sh        Kiểm tra: bash build.sh test
set -euo pipefail
cd "$(dirname "$0")"
JS=(p5a_math.js p5b_ui.js p6_demosA.js p7_demosB.js p8_quiz.js p9_mlab.js p10_mlscripts.js p11_mlab_ui.js p12_workspace.js)
mkdir -p dist
( cd src && cat "${JS[@]}" ) > dist/all.js
node --check dist/all.js
body() {
  cat src/p2_body1.html src/p3_body2.html src/p4_body3.html
  printf '<script>\n(function(){\n'; cat dist/all.js; printf '\n})();\n</script>\n'
}
{ cat src/p1_head.html src/p1b_mlab.css; body; } > dist/artifact.html
{
  printf '<!doctype html>\n<html lang="vi">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
  cat src/p1_head.html src/p1b_mlab.css
  printf '</head>\n<body>\n'; body; printf '</body>\n</html>\n'
} > index.html
echo "Đã build: index.html ($(wc -c < index.html) byte), dist/artifact.html"

if [ "${1:-}" = "test" ]; then
  # Chạy mọi đoạn MATLAB mẫu + main.m qua trình thông dịch trong Node (giả lập DOM)
  { echo 'globalThis.document = { querySelectorAll: () => [] };'
    ( cd src && cat p5a_math.js p9_mlab.js p10_mlscripts.js p12_workspace.js )
    cat <<'EOF'
let bad = 0;
for (const [id, s] of Object.entries(ML_SCRIPTS)) { const r = MLAB.run(s.code, { seed: 1, files: mlFilesMap() }); if (r.error) { bad++; console.log('LỖI', id, r.error); } }
const m = MLAB.run(mlFiles.main, { seed: 1, files: mlFilesMap() }); if (m.error) { bad++; console.log('LỖI main.m', m.error); }
console.log(`Kiểm tra MATLAB: ${bad} lỗi / ${Object.keys(ML_SCRIPTS).length + 1} đoạn code`);
process.exit(bad ? 1 : 0);
EOF
  } > dist/test.js
  node dist/test.js
fi
