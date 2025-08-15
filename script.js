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
</
