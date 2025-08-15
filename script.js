// ---------------- Tab Handling ----------------
function openTab(tab) {
    document.querySelectorAll('textarea').forEach(el => el.classList.remove('active'));
    document.getElementById(tab).classList.add('active');

    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    document.querySelectorAll('.line-numbers').forEach(el => el.style.display = "none");
    document.getElementById(`lines-${tab}`).style.display = "block";

    if (tab === "html") checkHTMLTags();
}

// ---------------- Run & Save ----------------
function runCode() {
    const html = document.getElementById("html").value;
    const css = `<style>${document.getElementById("css").value}</style>`;
    const js = `<script>${document.getElementById("js").value}<\/script>`;

    const iframeDoc = document.getElementById("preview").contentDocument || document.getElementById("preview").contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(html + css + js);
    iframeDoc.close();

    localStorage.setItem("htmlCode", html);
    localStorage.setItem("cssCode", document.getElementById("css").value);
    localStorage.setItem("jsCode", document.getElementById("js").value);
}

function saveAsFile() {
    const htmlContent = document.getElementById("html").value;
    const cssContent = document.getElementById("css").value;
    const jsContent = document.getElementById("js").value;

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

// ---------------- Line Numbers ----------------
function updateLineNumbers(id) {
    const textarea = document.getElementById(id);
    const lineNumberElem = document.getElementById(`lines-${id}`);
    const lines = textarea.value.split("\n").length;
    lineNumberElem.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join("\n");
}

["html", "css", "js"].forEach(lang => {
    const textarea = document.getElementById(lang);
    textarea.addEventListener("input", () => {
        runCode();
        updateLineNumbers(lang);
        if (lang === "html") checkHTMLTags();
    });
    textarea.addEventListener("scroll", () => {
        document.getElementById(`lines-${lang}`).scrollTop = textarea.scrollTop;
    });
});

// ---------------- Error Checker HTML ----------------
function checkHTMLTags() {
    const src = document.getElementById("html").value;
    const errors = [];
    const stack = [];
    const VOID_TAGS = new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);

    // < tanpa >
    const lt = (src.match(/</g) || []).length;
    const gt = (src.match(/>/g) || []).length;
    if (gt < lt) errors.push('Ada tanda "<" yang tidak ditutup ">".');

    // Parsing tag
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

// ---------------- Theme Toggle ----------------
function toggleTheme() {
    document.body.classList.toggle("light");
    localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
}

// ---------------- Init ----------------
window.onload = () => {
    // Tambah line number div
    ["html", "css", "js"].forEach(lang => {
        const textarea = document.getElementById(lang);
        const wrapper = document.createElement("div");
        const gutter = document.createElement("pre");

        wrapper.style.display = "flex";
        wrapper.style.height = "100%";
        gutter.id = `lines-${lang}`;
        gutter.className = "line-numbers";
        gutter.style.margin = 0;
        gutter.style.padding = "10px";
        gutter.style.width = "40px";
        gutter.style.background = "#2b2b2b";
        gutter.style.color = "#999";
        gutter.style.overflow = "hidden";
        gutter.style.textAlign = "right";
        gutter.style.userSelect = "none";

        textarea.parentNode.insertBefore(wrapper, textarea);
        wrapper.appendChild(gutter);
        wrapper.appendChild(textarea);

        updateLineNumbers(lang);
    });

    // Load code terakhir
    document.getElementById("html").value = localStorage.getItem("htmlCode") || `<h1>Hello World!</h1>\n<p>This is my first HTML page.</p>`;
    document.getElementById("css").value = localStorage.getItem("cssCode") || `body {\n    font-family: Arial, sans-serif;\n    background-color: #f0f0f0;\n    color: #333;\n}\nh1 {\n    color: #4CAF50;\n}`;
    document.getElementById("js").value = localStorage.getItem("jsCode") || `console.log("Hello from JavaScript!");`;

    // Theme
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") document.body.classList.add("light");

    runCode();
    checkHTMLTags();
};
