/* ------------------ TAB HANDLING (pakai wrapper) ------------------ */
function openTab(tab) {
  document.querySelectorAll('.editor-wrapper').forEach(w => w.classList.remove('active'));
  const target = document.querySelector(`.editor-wrapper[data-lang="${tab}"]`);
  if (target) target.classList.add('active');

  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  if (typeof event !== 'undefined') event.target.classList.add('active');
}

/* ------------------ SYNTAX HIGHLIGHT ------------------ */
function highlightHTML(content){
  return content
    .replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/(&lt;\/?)([a-zA-Z0-9\-]+)([^&]*?)(&gt;)/g,(m,o,tag,attrs,c)=>{
      attrs = attrs.replace(/([a-zA-Z-:]+)(="[^"]*")/g,(mm,name,val)=>
        `<span class="attr">${name}</span><span class="value">${val}</span>`);
      return `${o}<span class="tag">${tag}</span>${attrs}${c}`;
    });
}
function highlightCSS(content){
  return content
    .replace(/([^{]+)\{/g,'<span class="css-selector">$1</span>{')
    .replace(/([a-z-]+):/g,'<span class="css-property">$1</span>:')
    .replace(/:([^;]+);/g,':<span class="css-value">$1</span>;');
}
function highlightJS(content){
  return content
    .replace(/\b(var|let|const|function|if|else|return|for|while|switch|case|break|true|false|null|undefined|class|new|try|catch|finally|throw)\b/g,'<span class="js-keyword">$1</span>')
    .replace(/("[^"]*"|'[^']*'|`[^`]*`)/g,'<span class="js-string">$1</span>')
    .replace(/\b(\d+)\b/g,'<span class="js-number">$1</span>');
}

/* ------------------ CARET PRESERVATION ------------------ */
function isSelectionInside(el){
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  let node = sel.anchorNode;
  while (node){ if (node === el) return true; node = node.parentNode; }
  return false;
}
function getCaretCharacterOffsetWithin(el){
  if (!isSelectionInside(el)) return el.innerText.length; // kalau caret bukan di el, letakkan di akhir
  const sel = window.getSelection();
  const range = sel.getRangeAt(0);
  const pre = range.cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.endContainer, range.endOffset);
  return pre.toString().length;
}
function setCaretPosition(el, offset){
  const range = document.createRange();
  const sel = window.getSelection();
  let cur = 0, found = false;

  function walk(node){
    if (found) return;
    if (node.nodeType === Node.TEXT_NODE){
      const next = cur + node.length;
      if (offset <= next){
        range.setStart(node, Math.max(0, offset - cur));
        range.collapse(true);
        found = true; return;
      }
      cur = next;
    } else {
      for (let i=0;i<node.childNodes.length;i++){ walk(node.childNodes[i]); if(found) return; }
    }
  }
  walk(el);
  if (!found){ range.selectNodeContents(el); range.collapse(false); }
  sel.removeAllRanges(); sel.addRange(range);
}

/* ------------------ RENDER HIGHLIGHT ------------------ */
function renderHighlight(lang){
  const el = document.getElementById(lang);
  const text = el.innerText;
  const caret = getCaretCharacterOffsetWithin(el);

  if (lang==="html") el.innerHTML = highlightHTML(text);
  else if (lang==="css") el.innerHTML = highlightCSS(text);
  else if (lang==="js") el.innerHTML = highlightJS(text);

  setCaretPosition(el, Math.min(caret, el.innerText.length));

  runCode();
  if (lang==="html") checkHTMLTags();
  updateLineNumbers(lang);
}

/* ------------------ RUN & SAVE ------------------ */
function runCode(){
  const html = document.getElementById("html").innerText;
  const css  = `<style>${document.getElementById("css").innerText}</style>`;
  const js   = `<script>${document.getElementById("js").innerText}<\/script>`;
  const doc = document.getElementById("preview").contentDocument || document.getElementById("preview").contentWindow.document;
  doc.open(); doc.write(html + css + js); doc.close();

  localStorage.setItem("htmlCode", html);
  localStorage.setItem("cssCode",  document.getElementById("css").innerText);
  localStorage.setItem("jsCode",   document.getElementById("js").innerText);
}
function saveAsFile(){
  const html = document.getElementById("html").innerText;
  const css  = document.getElementById("css").innerText;
  const js   = document.getElementById("js").innerText;
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

/* ------------------ LINE NUMBERS ------------------ */
function attachLineNumber(lang){
  const area = document.getElementById(lang);
  const wrapper = document.createElement("div");
  const gutter  = document.createElement("div");

  wrapper.className = "editor-wrapper";
  wrapper.dataset.lang = lang;
  gutter.className = "line-numbers";

  if (area.classList.contains("active")){
    wrapper.classList.add("active");
    area.classList.remove("active");
  }

  area.parentNode.insertBefore(wrapper, area);
  wrapper.appendChild(gutter);
  wrapper.appendChild(area);

  area.addEventListener("scroll", ()=> gutter.scrollTop = area.scrollTop);
  area.addEventListener("input", ()=> updateLineNumbers(lang));
  updateLineNumbers(lang);
}
function updateLineNumbers(lang){
  const area = document.getElementById(lang);
  const gutter = document.querySelector(`.editor-wrapper[data-lang="${lang}"] .line-numbers`);
  if (!gutter) return;
  const lines = (area.innerText.match(/\n/g) || []).length + 1;
  let h = "";
  for (let i=1;i<=lines;i++) h += i + "<br>";
  gutter.innerHTML = h;
}

/* ------------------ HTML TAG CHECKER ------------------ */
const VOID_TAGS = new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);
function checkHTMLTags(){
  const src = document.getElementById("html").innerText;
  const errors = [];
  const stack = [];

  // '<' tanpa '>'
  const lt = (src.match(/</g)||[]).length;
  const gt = (src.match(/>/g)||[]).length;
  if (gt < lt) errors.push('Ada tanda "<" yang tidak ditutup ">".');

  // parse tag
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
      if (stack.length===0){ errors.push(`Tidak ada pembuka untuk </${name}>.`); }
      else if (stack[stack.length-1] === name){ stack.pop(); }
      else {
        const open = stack[stack.length-1];
        errors.push(`Tag penutup </${name}> tidak sesuai dengan pembuka <${open}>.`);
        break;
      }
    }
  }
  if (errors.length===0 && stack.length>0){
    stack.reverse().forEach(n => errors.push(`Tag <${n}> tidak memiliki penutup </${n}>.`
