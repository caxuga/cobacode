 // ========================= UTIL =========================
function escapeHTML(s){
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function fromStorageOrDefault(key, def){
  const v = localStorage.getItem(key);
  return (v && v.trim() !== "") ? v : def;
}

// ========================= HIGHLIGHT =========================
function highlightHTMLCode(text){
  let s = escapeHTML(text);
  // tag + attrs
  s = s.replace(/(&lt;\/?)([a-zA-Z][\w-]*)([^&]*?)(&gt;)/g,(m,open,tag,attrs,close)=>{
    attrs = attrs.replace(/([a-zA-Z-:]+)(\s*=\s*)(".*?"|'.*?')/g,
      (mm,name,eq,val)=> `<span style="color:#ff9800">${name}</span>${eq}<span style="color:#4caf50">${val}</span>`);
    return `${open}<span style="color:#4da6ff">${tag}</span>${attrs}${close}`;
  });
  return s;
}
function highlightCSSCode(text){
  let s = escapeHTML(text);
  // selector { ... }
  s = s.replace(/([^{\n]+)\{/g,(m,sel)=> `<span style="color:#ff9800">${sel}</span>{`);
  // property: value;
  s = s.replace(/([a-zA-Z-]+)(\s*:\s*)([^;}{]+)/g,
    (m,prop,sep,val)=> `<span style="color:#4da6ff">${prop}</span>${sep}<span style="color:#4caf50">${escapeHTML(val)}</span>`);
  return s;
}
function highlightJSCode(text){
  let s = escapeHTML(text);
  const master = /("[^"\n]*"|'[^'\n]*'|`[^`]*`)|\b(\d+)\b|\b(var|let|const|function|if|else|return|for|while|switch|case|break|true|false|null|undefined|class|new|try|catch|finally|throw)\b/g;
  s = s.replace(master, (m, str, num, kw) => {
    if (str) return `<span style="color:#4caf50">${str}</span>`;
    if (num) return `<span style="color:#bdb76b">${num}</span>`;
    if (kw)  return `<span style="color:#ff9800">${kw}</span>`;
    return m;
  });
  return s;
}
function renderHighlight(lang){
  const ta = document.getElementById(lang);
  const hl = document.getElementById(`hl-${lang}`);
  if (!ta || !hl) return;
  const val = ta.value;
  let html = "";
  if (lang === "html") html = highlightHTMLCode(val);
  else if (lang === "css") html = highlightCSSCode(val);
  else html = highlightJSCode(val);
  // Spacer agar baris terakhir terlihat
  hl.innerHTML = html + (val.endsWith("\n") ? " " : "");
}

// ========================= LINE NUMBERS =========================
function updateLineNumbers(id){
  const ta = document.getElementById(id);
  const ln = document.getElementById(`lines-${id}`);
  if (!ta || !ln) return;
  const lines = ta.value.split("\n").length;
  ln.textContent = Array.from({length: lines}, (_,i)=> i+1).join("\n");
}
function syncScroll(lang){
  const ta = document.getElementById(lang);
  const ln = document.getElementById(`lines-${lang}`);
  const hl = document.getElementById(`hl-${lang}`);
  if (!ta) return;
  if (ln) ln.scrollTop = ta.scrollTop;
  if (hl){
    hl.scrollTop = ta.scrollTop;
    hl.scrollLeft = ta.scrollLeft;
  }
}

// ========================= TAG CHECKER =========================
const VOID_TAGS = new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);
function checkHTMLTags(){
  const src = document.getElementById("html").value;
  const errors = [];
  const stack = [];

  const lt = (src.match(/</g)||[]).length;
  const gt = (src.match(/>/g)||[]).length;
  if (gt < lt) errors.push('Ada tanda "<" yang tidak ditutup ">".');

  const re = /<\/?([a-zA-Z][\w-]*)\b[^>]*>/g;
  let m;
  while ((m = re.exec(src)) !== null){
    const full = m[0];
    const name = m[1].toLowerCase();
    const isClose = full.startsWith("</");
    const selfClose = /\/>$/.test(full) || VOID_TAGS.has(name);

    if (!isClose){
      if (!selfClose) stack.push(name);
    } else {
      if (stack.length===0){
        errors.push(`Tidak ada pembuka untuk </${name}>.`);
      } else if (stack[stack.length-1] === name){
        stack.pop();
      } else {
        const open = stack[stack.length-1];
        errors.push(`Tag penutup </${name}> tidak sesuai dengan pembuka <${open}>.`);
        break;
      }
    }
  }
  if (errors.length===0 && stack.length>0){
    stack.reverse().forEach(n => errors.push(`Tag <${n}> tidak memiliki penutup </${n}>.`));
  }

  const box = document.getElementById("error-msg");
  if (box){
    if (errors.length){
      box.innerHTML = "Error:<br>• " + errors.join("<br>• ");
      box.style.display = "block";
    } else {
      box.innerHTML = "";
      box.style.display = "none";
    }
  }
}

// ========================= RUN & SAVE =========================
function runCode(){
  const html = document.getElementById("html").value;
  const css  = `<style>${document.getElementById("css").value}</style>`;
  const js   = `<script>${document.getElementById("js").value}<\/script>`;
  const doc = document.getElementById("preview").contentDocument || document.getElementById("preview").contentWindow.document;
  doc.open(); doc.write(html + css + js); doc.close();

  localStorage.setItem("htmlCode", html);
  localStorage.setItem("cssCode",  document.getElementById("css").value);
  localStorage.setItem("jsCode",   document.getElementById("js").value);
}
function saveAsFile(){
  const html = document.getElementById("html").value;
  const css  = document.getElementById("css").value;
  const js   = document.getElementById("js").value;
  const code = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
${css}
</style>
</head>
<body>
${html}
<script>
${js}
<\/script>
</body>
</html>`;
  const blob = new Blob([code], {type:"text/html"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "my-code.html";
  a.click();
}

// ========================= THEME =========================
function toggleTheme(){
  document.body.classList.toggle("light");
  localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
}

// ========================= TAB =========================
function openTab(tab){
  // toggle textarea
  document.querySelectorAll('textarea').forEach(el => el.classList.remove('active'));
  document.getElementById(tab).classList.add('active');
  // toggle tombol
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  if (typeof event !== "undefined") event.target.classList.add('active');
  // toggle line number
  document.querySelectorAll('.line-numbers').forEach(el => el.style.display="none");
  const ln = document.getElementById(`lines-${tab}`);
  if (ln) ln.style.display = "block";
  // toggle highlight layer
  document.querySelectorAll('.code-highlight').forEach(el => el.style.display="none");
  const hl = document.getElementById(`hl-${tab}`);
  if (hl) hl.style.display = "block";

  // Perbaikan: panggil renderHighlight dan updateLineNumbers hanya untuk tab aktif
  renderHighlight(tab);
  updateLineNumbers(tab);

  if (tab === "html") checkHTMLTags();
}

// ========================= INIT =========================
function buildOverlay(lang){
  const ta = document.getElementById(lang);
  const ln = document.getElementById(`lines-${lang}`);
  if (!ta || !ln) return;

  // Bungkus jadi 1 baris (gutter + pane)
  const row = document.createElement("div");
  row.className = "editor-row";
  row.style.display = "flex";
  row.style.minHeight = "0";
  row.style.alignItems = "stretch";

  // sisipkan row sebelum ln (karena ln ada sebelum textarea di index.html)
  ta.parentNode.insertBefore(row, ln);
  // pindahkan ln & siapkan pane
  row.appendChild(ln);

  const pane = document.createElement("div");
  pane.className = "editor-pane";
  pane.style.position = "relative";
  pane.style.flex = "1";
  pane.style.minHeight = "0";

  // highlight layer
  const hl = document.createElement("pre");
  hl.id = `hl-${lang}`;
  hl.className = "code-highlight";
  const cs = getComputedStyle(ta);
  // samakan tipografi & spacing biar rata
  hl.style.position = "absolute";
  hl.style.inset = "0";
  hl.style.margin = "0";
  hl.style.padding = cs.padding || "10px";
  hl.style.overflow = "auto";
  hl.style.whiteSpace = "pre-wrap";
  hl.style.fontFamily = cs.fontFamily;
  hl.style.fontSize = cs.fontSize;
  hl.style.lineHeight = cs.lineHeight;
  hl.style.tabSize = "4";
  
  // Setel properti posisi dan overflow untuk textarea
  ta.style.position = "absolute";
  ta.style.inset = "0";
  ta.style.overflow = "auto";
  
  // textarea transparan, caret terlihat
  ta.style.background = "transparent";
  ta.style.zIndex = "1";
  ta.style.color = "transparent";
  ta.style.caretColor = getComputedStyle(document.body).color;
  ta.style.width = '100%';
  
  // Perbaikan: tambahkan overflow-y: hidden; pada hl agar tidak muncul teks sisa
  hl.style.overflowY = "hidden";

  // gabungkan
  row.appendChild(pane);
  pane.appendChild(hl);
  pane.appendChild(ta);

  // sinkron scroll
  ta.addEventListener("scroll", ()=> syncScroll(lang));
}

window.onload = () => {
  // isi default atau dari storage
  document.getElementById("html").value = fromStorageOrDefault("htmlCode",
`<h1>Hello World!</h1>
<p>This is my first HTML page.</p>`);
  document.getElementById("css").value  = fromStorageOrDefault("cssCode",
`body {
  font-family: Arial, sans-serif;
  background-color: #f0f0f0;
  color: #333;
}
h1 { color: #4CAF50; }`);
  document.getElementById("js").value   = fromStorageOrDefault("jsCode",
`console.log("Hello from JavaScript!");`);

  // tema
  if (localStorage.getItem("theme") === "light") document.body.classList.add("light");

  // siapkan overlay editor untuk tiap tab (pakai line-number yang SUDAH ada di index.html)
  ["html","css","js"].forEach(lang => {
    buildOverlay(lang);
    // renderHighlight dan updateLineNumbers di sini sudah tidak diperlukan
    // karena sudah dipanggil di openTab()
    
    // input listener
    const ta = document.getElementById(lang);
    ta.addEventListener("input", () => {
      renderHighlight(lang);
      updateLineNumbers(lang);
      runCode();
      if (lang === "html") checkHTMLTags();
    });
  });

  // tampilkan awal
  openTab("html");
  runCode();
  checkHTMLTags();
};
