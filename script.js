function openTab(tab) {
    document.querySelectorAll('.code-area').forEach(el => el.classList.remove('active'));
    document.getElementById(tab).classList.add('active');

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

/* ========== RENDER HIGHLIGHT ========== */
function renderHighlight(lang) {
    const el = document.getElementById(lang);
    let text = el.innerText;

    if (lang === "html") el.innerHTML = highlightHTML(text);
    else if (lang === "css") el.innerHTML = highlightCSS(text);
    else if (lang === "js") el.innerHTML = highlightJS(text);

    placeCaretAtEnd(el);
    runCode();
}

function placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
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
    const css = `<style>${document.getElementById("css").innerText}</style>`;
    const js = `<script>${document.getElementById("js").innerText}<\/script>`;

    const iframeDoc = document.getElementById("preview").contentDocument || document.getElementById("preview").contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(html + css + js);
    iframeDoc.close();

    localStorage.setItem("htmlCode", html);
    localStorage.setItem("cssCode", document.getElementById("css").innerText);
    localStorage.setItem("jsCode", document.getElementById("js").innerText);
}

/* ========== SAVE FILE ========== */
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
</html>
`;

    const blob = new Blob([finalCode], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "my-code.html";
    link.click();
}

/* ========== EVENTS ========== */
["html", "css", "js"].forEach(lang => {
    document.getElementById(lang).addEventListener("input", () => renderHighlight(lang));
});

function toggleTheme() {
    document.body.classList.toggle("light");
    localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
}

/* ========== INIT ========== */
window.onload = () => {
    document.getElementById("html").innerText = localStorage.getItem("htmlCode") || `<h1>Hello World!</h1>\n<p>This is my first HTML page.</p>`;
    document.getElementById("css").innerText = localStorage.getItem("cssCode") || `body {\n    font-family: Arial, sans-serif;\n    background-color: #f0f0f0;\n    color: #333;\n}\nh1 {\n    color: #4CAF50;\n}`;
    document.getElementById("js").innerText = localStorage.getItem("jsCode") || `console.log("Hello from JavaScript!");`;

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
        document.body.classList.add("light");
    }

    renderHighlight("html");
    renderHighlight("css");
    renderHighlight("js");
};

/* ===== UPDATE: Cek tag HTML ===== */
function checkHTMLTags() {
    const html = document.getElementById("html").innerText;
    const tagPattern = /<([a-zA-Z0-9]+)(\s[^>]*)?>|<\/([a-zA-Z0-9]+)>/g;
    let stack = [];
    let match;

    while ((match = tagPattern.exec(html)) !== null) {
        if (match[1]) {
            stack.push(match[1]);
        } else if (match[3]) {
            if (stack[stack.length - 1] === match[3]) {
                stack.pop();
            } else {
                showError(`Tag penutup </${match[3]}> tidak sesuai dengan pembuka <${stack[stack.length - 1]}>`);
                return;
            }
        }
    }

    if (stack.length > 0) {
        showError(`Tag <${stack[stack.length - 1]}> tidak memiliki penutup </${stack[stack.length - 1]}>`);
    } else {
        hideError();
    }
}

function showError(msg) {
    const err = document.getElementById("error-msg");
    err.innerText = "Error: " + msg;
    err.style.display = "block";
}

function hideError() {
    const err = document.getElementById("error-msg");
    err.innerText = "";
    err.style.display = "none";
}

/* ===== INIT ===== */
window.onload = () => {
    // Tambah div error di bawah HTML editor
    const htmlArea = document.getElementById("html");
    const errorDiv = document.createElement("div");
    errorDiv.id = "error-msg";
    htmlArea.parentNode.appendChild(errorDiv);

    // Pasang line number ke semua editor
    ["html", "css", "js"].forEach(lang => attachLineNumber(lang));

    // Load kode terakhir
    document.getElementById("html").innerText = localStorage.getItem("htmlCode") || `<h1>Hello World!</h1>\n<p>This is my first HTML page.</p>`;
    document.getElementById("css").innerText = localStorage.getItem("cssCode") || `body {\n    font-family: Arial, sans-serif;\n    background-color: #f0f0f0;\n    color: #333;\n}\nh1 {\n    color: #4CAF50;\n}`;
    document.getElementById("js").innerText = localStorage.getItem("jsCode") || `console.log("Hello from JavaScript!");`;

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
        document.body.classList.add("light");
    }

    // Render awal dan cek tag
    renderHighlight("html");
    renderHighlight("css");
    renderHighlight("js");
    checkHTMLTags();
};

/* ===== Update cek tag setiap edit HTML ===== */
document.getElementById("html").addEventListener("input", () => {
    renderHighlight("html");
    checkHTMLTags();
});

