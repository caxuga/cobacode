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

// ---------------- Nomor Baris ----------------
function updateLineNumbers(id) {
    const codeArea = document.getElementById(id);
    const lineNumberElem = document.getElementById(`lines-${id}`);
    
    const textContent = codeArea.innerText;
    const lines = textContent.split("\n").length;
    
    // Jika tidak ada teks, jangan tampilkan nomor baris, atau tampilkan hanya satu baris
    if (textContent.trim() === "") {
        lineNumberElem.innerHTML = '1';
    } else {
        lineNumberElem.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join("<br>");
    }
}

// ---------------- Syntax Highlighting ----------------
function highlightSyntax(id) {
    const codeArea = document.getElementById(id);
    const rawText = codeArea.innerText;
    
    // Simpan posisi kursor saat ini
    const selection = window.getSelection();
    let range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(codeArea);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    let caretPos = preCaretRange.toString().length;

    let highlightedText = '';
    if (id === 'html') {
        highlightedText = rawText
            // Tag dan atribut
            .replace(/<([^>]+)>/g, (match, p1) => {
                let parts = p1.split(/\s+/);
                let tagName = parts[0];
                let attributes = parts.slice(1).map(attr => {
                    let [name, value] = attr.split('=');
                    if (value) {
                        return `<span class="attr">${name}</span>=<span class="value">${value}</span>`;
                    }
                    return `<span class="attr">${name}</span>`;
                }).join(' ');
                
                return `<span class="tag">&lt;${tagName}</span> ${attributes}<span class="tag">&gt;</span>`;
            })
            // Komentar
            .replace(/&lt;!--([\s\S]*?)--&gt;/g, '<span class="comment">&lt;!--$1--&gt;</span>');
            
    } else if (id === 'css') {
        highlightedText = rawText
            // Selector
            .replace(/([#\.][\w-]+)/g, '<span class="css-selector">$1</span>')
            // Properti
            .replace(/([\w-]+)\s*:/g, '<span class="css-property">$1</span>:')
            // Value
            .replace(/:([^;]+)/g, ':<span class="css-value">$1</span>')
            // Komentar
            .replace(/\/\*([\s\S]*?)\*\//g, '<span class="comment">/*$1*/</span>');
            
    } else if (id === 'js') {
        highlightedText = rawText
            // Keywords
            .replace(/\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|import|export|try|catch|new|this|await|async|await)\b/g, '<span class="js-keyword">$1</span>')
            // Strings
            .replace(/(".*?"|'.*?')/g, '<span class="js-string">$1</span>')
            // Numbers
            .replace(/(\b\d+\b)/g, '<span class="js-number">$1</span>')
            // Comments
            .replace(/(\/\/.*)/g, '<span class="js-comment">$1</span>')
            .replace(/\/\*([\s\S]*?)\*\//g, '<span class="js-comment">/*$1*/</span>');
    }

    // Hindari pembaruan jika teks tidak berubah untuk menjaga posisi kursor
    if (codeArea.innerHTML !== highlightedText) {
        codeArea.innerHTML = highlightedText;
        
        // Kembalikan posisi kursor
        if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
            range = document.createRange();
            range.selectNodeContents(codeArea);
            range.collapse(false); // Atur kursor ke akhir
            selection.removeAllRanges();
            selection.addRange(range);
        } else if (typeof document.body.createTextRange != "undefined") {
            let textRange = document.body.createTextRange();
            textRange.moveToElementText(codeArea);
            textRange.collapse(false);
            textRange.select();
        }
    }
}

// Tambahkan event listener untuk setiap area kode
["html", "css", "js"].forEach(lang => {
    const codeArea = document.getElementById(lang);
    codeArea.addEventListener("input", () => {
        // Panggil fungsi highlighting
        highlightSyntax(lang);
        updateLineNumbers(lang);
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

    // Perbarui nomor baris saat inisialisasi
    ["html", "css", "js"].forEach(lang => {
        updateLineNumbers(lang);
        highlightSyntax(lang);
    });
    
    // Jalankan kode dan periksa kesalahan pada saat memuat
    runCode();
    checkHTMLTags();
};
