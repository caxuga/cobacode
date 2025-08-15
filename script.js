// ==================== SYNTAX HIGHLIGHT ====================

// Highlight HTML
function highlightHTML(content) {
    content = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return content.replace(
        /(&lt;\/?)([a-zA-Z0-9\-]+)([^&]*?)(&gt;)/g,
        (match, open, tagName, attrs, close) => {
            attrs = attrs.replace(
                /([a-zA-Z-:]+)(="[^"]*")/g,
                (m, attrName, attrValue) =>
                    `<span class="attr">${attrName}</span><span class="value">${attrValue}</span>`
            );
            return `${open}<span class="tag">${tagName}</span>${attrs}${close}`;
        }
    );
}

// Highlight CSS
function highlightCSS(content) {
    return content
        .replace(/([a-z-]+)(?=\s*:)/gi, '<span class="attr">$1</span>')
        .replace(/(:\s*)([^;]+)(;?)/g, '$1<span class="value">$2</span>$3');
}

// Highlight JavaScript
function highlightJS(content) {
    return content
        .replace(/\b(function|let|var|const|if|else|for|while|return|class|new)\b/g, '<span class="tag">$1</span>')
        .replace(/("[^"]*"|'[^']*')/g, '<span class="value">$1</span>');
}

// ==================== RENDER & CARET FIX ====================

function renderHighlight(lang) {
    const el = document.getElementById(lang);
    let text = el.innerText;

    // Simpan posisi caret
    const preCaretOffset = getCaretCharacterOffsetWithin(el);

    // Highlight sesuai bahasa
    if (lang === "html") el.innerHTML = highlightHTML(text);
    else if (lang === "css") el.innerHTML = highlightCSS(text);
    else if (lang === "js") el.innerHTML = highlightJS(text);

    // Balikkan posisi caret
    setCaretPosition(el, preCaretOffset);

    runCode();
    if (lang === "html") checkHTMLTags();
}

function getCaretCharacterOffsetWithin(element) {
    const sel = window.getSelection();
    let caretOffset = 0;
    if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        caretOffset = preCaretRange.toString().length;
    }
    return caretOffset;
}

function setCaretPosition(element, offset) {
    const range = document.createRange();
    const sel = window.getSelection();

    let currentOffset = 0;
    let found = false;

    function traverse(node) {
        if (found) return;
        if (node.nodeType === Node.TEXT_NODE) {
            const nextOffset = currentOffset + node.length;
            if (offset >= currentOffset && offset <= nextOffset) {
                range.setStart(node, offset - currentOffset);
                range.collapse(true);
                found = true;
                return;
            }
            currentOffset = nextOffset;
        } else {
            for (let i = 0; i < node.childNodes.length; i++) {
                traverse(node.childNodes[i]);
                if (found) return;
            }
        }
    }

    traverse(element);
    if (!found) range.selectNodeContents(element);

    sel.removeAllRanges();
    sel.addRange(range);
}

// ==================== TAG CHECK ====================

function checkHTMLTags() {
    const code = document.getElementById("html").innerText;
    const tagPattern = /<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>|<\/([a-zA-Z][a-zA-Z0-9]*)>/g;
    const stack = [];
    let match;
    let errors = [];

    while ((match = tagPattern.exec(code)) !== null) {
        if (match[1]) {
            stack.push(match[1]);
        } else if (match[2]) {
            if (stack.length === 0 || stack[stack.length - 1] !== match[2]) {
                errors.push(`Tag penutup </${match[2]}> tidak sesuai atau tidak memiliki pembuka.`);
            } else {
                stack.pop();
            }
        }
    }

    stack.forEach(tag => {
        errors.push(`Tag <${tag}> tidak memiliki penutup </${tag}>.`);
    });

    const errorBox = document.getElementById("html-error");
    if (errorBox) {
        errorBox.innerHTML = errors.length ? errors.join("<br>") : "";
    }
}

// ==================== LINE NUMBERS ====================

function updateLineNumbers(lang) {
    const editor = document.getElementById(lang);
    const lineNumbers = document.getElementById(lang + "-lines");
    const lines = editor.innerText.split("\n").length;
    lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join("\n");
}

// ==================== INIT ====================

document.querySelectorAll(".code-editor").forEach(editor => {
    const lang = editor.dataset.lang;
    editor.addEventListener("input", () => {
        renderHighlight(lang);
        updateLineNumbers(lang);
    });
});

// First load
["html", "css", "js"].forEach(lang => {
    renderHighlight(lang);
    updateLineNumbers(lang);
});
