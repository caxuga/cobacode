function openTab(tab) {
    document.querySelectorAll('textarea').forEach(el => el.classList.remove('active'));
    document.getElementById(tab).classList.add('active');

    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

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
</html>
`;

    const blob = new Blob([finalCode], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "my-code.html";
    link.click();
}

document.querySelectorAll("textarea").forEach(el => {
    el.addEventListener("input", runCode);
});

function toggleTheme() {
    document.body.classList.toggle("light");
    localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
}

window.onload = () => {
    document.getElementById("html").value = localStorage.getItem("htmlCode") || `<h1>Hello World!</h1>\n<p>This is my first HTML page.</p>`;
    document.getElementById("css").value = localStorage.getItem("cssCode") || `body {\n    font-family: Arial, sans-serif;\n    background-color: #f0f0f0;\n    color: #333;\n}\nh1 {\n    color: #4CAF50;\n}`;
    document.getElementById("js").value = localStorage.getItem("jsCode") || `console.log("Hello from JavaScript!");`;

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
        document.body.classList.add("light");
    }
    runCode();
};
