// ---------------- Penanganan Tab ----------------
function openTab(tab) {
    // Sembunyikan semua editor
    document.querySelectorAll('.editor-wrapper').forEach(el => el.classList.remove('active'));
    // Tampilkan editor yang dipilih
    document.getElementById(`editor-${tab}`).classList.add('active');

    // Hapus kelas aktif dari semua tombol tab
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    // Tambahkan kelas aktif ke tombol yang diklik
    event.target.classList.add('active');

    if (tab === "html") checkHTMLTags();
}

// ---------------- Jalankan & Simpan ----------------
function runCode() {
    // Gunakan innerText untuk HTML, CSS, dan JS agar iframe dapat merender kode dengan benar
    const html = document.getElementById("html").innerText;
    const css = `<style>${document.getElementById("css").innerText}</style>`;
    const js = `<script>${document.getElementById("js").innerText}<\/script>`;

    const iframeDoc = document.getElementById("preview").contentDocument || document.getElementById("preview").contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(html + css + js);
    iframeDoc.close();

    // Simpan kode ke localStorage
    localStorage.setItem("htmlCode", html);
    localStorage.setItem("cssCode", document.getElementById("css").innerText);
    localStorage.setItem("jsCode", document.getElementById("js").innerText);
}

function saveAsFile() {
    const htmlContent = document.getElementById("html").innerText;
    const cssContent = document.getElementById("css").innerText;
    const jsContent = document.getElementById("js").innerText;

    const finalCode = `
<!DOCTYPE html>
<html>
<head>
<style>
${cssContent}
</style>
</head>
<body>
${htmlContent}
<script>
${jsContent}
<\/script>
</body>
</html>`;

    const blob = new Blob([finalCode], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "my-code.html";
    link.click();
}

// Tambahkan event listener untuk setiap area kode
["html", "css", "js"].forEach(lang => {
    const codeArea = document.getElementById(lang);
    codeArea.addEventListener("input", () => {
        runCode();
        if (lang === "html") checkHTMLTags();
    });
    // Sinkronkan guliran antara area kode dan nomor baris
    codeArea.addEventListener("scroll", () => {
        document.getElementById(`lines-${lang}`).scrollTop = codeArea.scrollTop;
    });
});

// ---------------- Pemeriksa Kesalahan HTML ----------------
function checkHTMLTags() {
    // Ambil teks dari editor HTML
    const src = document.getElementById("html").innerText;
    const errors = [];
    const stack = [];
    // Daftar tag yang tidak memerlukan penutup
    const VOID_TAGS = new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);

    // Cek ketidaksesuaian < dan >
    const lt = (src.match(/</g) || []).length;
    const gt = (src.match(/>/g) || []).length;
    if (gt < lt) errors.push('Ada tanda "<" yang tidak ditutup ">".');

    // Parsing tag untuk validasi
    const re = /<\/?([a-zA-Z][\w-]*)\b[^>]*>/g;
    let m;
    while ((m = re.exec(src)) !== null) {
        const full = m[0];
        const name = m[1].toLowerCase();
        const isClose = full.startsWith("</");
        const selfClose = /\/>$/.test(full) || VOID_TAGS.has(name);

        if (!isClose) {
            if (!selfClose) stack.push(name);
        } else {
            if (stack.length === 0) {
                errors.push(`Tidak ada pembuka untuk </${name}>.`);
            } else if (stack[stack.length - 1] === name) {
                stack.pop();
            } else {
                const open = stack[stack.length - 1];
                errors.push(`Tag penutup </${name}> tidak sesuai dengan pembuka <${open}>.`);
                break;
            }
        }
    }

    // Cek tag yang tidak ditutup
    if (errors.length === 0 && stack.length > 0) {
        stack.reverse().forEach(n => errors.push(`Tag <${n}> tidak memiliki penutup </${n}>.`));
    }

    const box = document.getElementById("error-msg");
    if (errors.length) {
        box.innerHTML = "Error:<br>• " + errors.join("<br>• ");
        box.style.display = "block";
    } else {
        box.innerHTML = "";
        box.style.display = "none";
    }
}

// ---------------- Pengalih Tema ----------------
function toggleTheme() {
    document.body.classList.toggle("light");
    localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
}

// ---------------- Inisialisasi ----------------
window.onload = () => {
    // Muat kode terakhir dari localStorage
    document.getElementById("html").innerText = localStorage.getItem("htmlCode") || `<h1>Hello World!</h1>\n<p>This is my first HTML page.</p>`;
    document.getElementById("css").innerText = localStorage.getItem("cssCode") || `body {\n    font-family: Arial, sans-serif;\n    background-color: #f0f0f0;\n    color: #333;\n}\nh1 {\n    color: #4CAF50;\n}`;
    document.getElementById("js").innerText = localStorage.getItem("jsCode") || `console.log("Hello from JavaScript!");`;

    // Atur tema
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") document.body.classList.add("light");
    
    // Jalankan kode dan periksa kesalahan pada saat memuat
    runCode();
    checkHTMLTags();
};
