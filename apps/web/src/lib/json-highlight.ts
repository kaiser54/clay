const JSON_TOKEN =
  /("(?:\\u[0-9a-fA-F]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;

export function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function highlightJson(json: string): string {
  return escapeHtml(json).replace(JSON_TOKEN, (m) => {
    if (m.startsWith('"')) {
      return m.endsWith(":")
        ? `<span class="jk">${m}</span>`
        : `<span class="js">${m}</span>`;
    }
    if (m === "true" || m === "false") return `<span class="jb">${m}</span>`;
    if (m === "null") return `<span class="jn">${m}</span>`;
    return `<span class="jnum">${m}</span>`;
  });
}
