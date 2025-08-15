/* ====== Tab Handling: aktifkan wrapper, bukan code-area ====== */
function openTab(tab) {
    document.querySelectorAll('.editor-wrapper').forEach(w => w.classList.remove('active'));
    const target = document.querySelector(`.editor-wrapper[data-lang="${tab}"]`);
    if (target) target.classList.add('active');

    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

/* ========== HIGHLIGHT FUNCTIONS ========== */
function highlightHTML(content) {
    return content
        .replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/(&lt;\/?)([a-zA-Z0-9\-]+)([^&]*?)(&gt;)/g,
            (match, open, tagName, attrs, close) => {
                attrs = attrs.replace(/([a-zA-Z-:]+)(="[^"]*")/g,
                    (m, attrName, attrValue) =>
                        `<span class="attr">${attrName}</span><span class="value">${attrValue}</span>`);
                return `${open}<span class="tag">${tagName}</span>${attrs}${close}`;
            });
}
function highlightCSS(content) {
    return content
        .replace(/([^{]+)\{/g, '<span class="css-selector">$1</span>{')
        .replace(/([a-z-]+):/g, '<span class="css-property">$1</span>:')
        .replace(/:([^;]+);/g, ':<span class="css-value">$1</span>;');
}
function highlightJS(content) {
    return content
        .replace(/\b(var|let|const|function|if|else|return|for|while|switch|case|break|true|false|null|undefined)\b/g,
            '<span class="js-keyword">$1</span>')
        .replace(/("[^"]*"|'[^']*')/g, '<span class="js-string">$1</span>')
        .replace(/\b(\d+)\b/g, '<span class="js-number">$1</span>');
}

/* ========== Rendering + caret ========== */
function renderHighlight(lang) {
    const el = document.getElementById(lang);
    let text = el.innerText;

    if (lang === "html") el.innerHTML = highlightHTML(text);
    else if (lang === "css") el.innerHTML = highlightCSS(text);
    else if (lang === "js") el.innerHTML = highlightJS(text);

    placeCaretAtEnd(el);
    runCode();
    if (lang === "html") checkHTMLTags();
}
function placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
        let range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        let sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
}

/* ========== RUN CODE ========== */
function runCode() {
    const html = document.getElementById("html").innerText;
    const css  = `<style>${document.getElementById("css").innerText}</style>`;
    const js   = `<script>${document.getElementById("js").innerText}<\/script>`;

    const iframe = document.getElementById("preview");
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open(); iframeDoc.write(html + css + js); iframeDoc.close();

    localStorage.setItem("htmlCode", html);
    localStorage.setItem("cssCode",  document.getElementById("css").innerText);
    localStorage.setItem("jsCode",   document.getElementById("js").innerText);
}

/* ========== SAVE FILE ========== */
function saveAsFile() {
    const htmlContent = document.getElementById("html").innerText;
    const cssContent  = document.getElementById("css").innerText;
    const jsContent   = document.getElementById("js").innerText;

    const finalCode = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
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

/* ========== LINE NUMBERS ========== */
function attachLineNumber(lang) {
    const codeArea = document.getElementById(lang);
    const wrapper = document.createElement("div");
    const gutter = document.createElement("div");

    wrapper.classList.add("editor-wrapper");
    wrapper.dataset.lang = lang;
    gutter.classList.add("line-numbers");

    // Jika sebelumnya area aktif → aktifkan wrapper
    if (codeArea.classList.contains("active")) {
        wrapper.classList.add("active");
        codeArea.classList.remove("active");
    }

    // Bungkus
    codeArea.parentNode.insertBefore(wrapper, codeArea);
    wrapper.appendChild(gutter);
    wrapper.appendChild(codeArea);

    // Update nomor baris + sinkron scroll
    const update = () => updateLineNumbers(codeArea, gutter);
    codeArea.addEventListener("input", update);
    codeArea.addEventListener("scroll", () => (gutter.scrollTop = codeArea.scrollTop));
    update();
}
function updateLineNumbers(area, gutter) {
    const lines = area.innerText.split("\n").length || 1;
    let html = "";
    for (let i = 1; i <= lines; i++) html += i + "<br>";
    gutter.innerHTML = html;
}

/* ========== HTML TAG CHECKER ========== */
const VOID_TAGS = new Set([
    "area","base","br","col","embed","hr","img","input","link","meta",
    "param","source","track","wbr"
]);
function checkHTMLTags() {
    const src = document.getElementById("html").innerText;
    const errors = [];
    const stack = [];

    // Deteksi ada '<' yang tidak memiliki '>' (kasus <h)
    const ltCount = (src.match(/</g) || []).length;
    const gtCount = (src.match(/>/g) || []).length;
    if (gtCount < ltCount) {
        errors.push(`Ada tanda "<" yang tidak ditutup dengan ">".`);
    }

    // Parse tag pembuka/penutup
    const tagRe = /<\/?([a-zA-Z][\w-]*)\b[^>]*>/g;
    let m;
    while ((m = tagRe.exec(src)) !== null) {
        const full = m[0];
        const name = m[1].toLowerCase();
        const isClosing = full.startsWith("</");
        const selfClosing = /\/>$/.test(full) || VOID_TAGS.has(name);

        if (!isClosing) {
            if (!selfClosing) stack.push({ name, index: m.index });
        } else {
            if (stack.length === 0) {
                errors.push(`Tidak ada pembuka untuk </${name}>.`);
            } else if (stack[stack.length - 1].name === name) {
                stack.pop();
            } else {
                const open = stack[stack.length - 1].name;
                errors.push(`Tag penutup </${name}> tidak sesuai dengan pembuka <${open}>.`);
                // hentikan di sini supaya tidak banjir error berantai
                break;
            }
        }
    }

    // Sisa pembuka tanpa penutup
    if (errors.length === 0 && stack.length > 0) {
        stack.reverse().forEach(s => {
            errors.push(`Tag <${s.name}> tidak memiliki penutup </${s.name}>.`);
        });
    }

    // Tampilkan / sembunyikan
    const errBox = document.getElementById("error-msg");
    if (errors.length > 0) {
        errBox.innerHTML = "Error:<br>• " + errors.join("<br>• ");
        errBox.style.display = "block";
    } else {
        errBox.innerHTML = "";
        errBox.style.display = "none";
    }
}

/* ========== EVENTS ========== */
["html", "css", "js"].forEach(lang => {
    const el = document.getElementById(lang);
    el.addEventListener("input", () => renderHighlight(lang));
});

function toggleTheme() {
    document.body.classList.toggle("light");
    localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
}

/* ========== INIT ========== */
window.onload = () => {
    // Bungkus editor + line numbers
    ["html", "css", "js"].forEach(lang => attachLineNumber(lang));

    // Tempat error (di bawah HTML editor)
    const errorDiv = document.createElement("div");
    errorDiv.id = "error-msg";
    document.querySelector(".editor-container").appendChild(errorDiv);

    // Restore kode terakhir
    document.getElementById("html").innerText =
        localStorage.getItem("htmlCode") ||
        `<h1>Hello World!</h1>\n<p>This is my first HTML page.</p>`;
    document.getElementById("css").innerText =
        localStorage.getItem("cssCode") ||
        `body {\n  font-family: Arial, sans-serif;\n  background-color: #f0f0f0;\n  color: #333;\n}\nh1 { color: #4CAF50; }`;
    document.getElementById("js").innerText =
        localStorage.getItem("jsCode") || `console.log("Hello from JavaScript!");`;

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") document.body.classList.add("light");

    // Render awal
    renderHighlight("html");
    renderHighlight("css");
    renderHighlight("js");

    // Pastikan tab HTML tampil pertama
    openTab("html");
};
