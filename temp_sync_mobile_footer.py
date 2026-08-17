from pathlib import Path

root = Path(r'C:\Users\Usere\Documents\GitHub\exmarkets')
index_path = root / 'index.html'
index_text = index_path.read_text(encoding='utf-8')
start = index_text.index('<div class="footer__mobile">')
end = index_text.index('</footer>', start)
canonical = index_text[start:end]

html_files = list(root.glob('*.html')) + [root / 'articles' / 'article-template.html']
for p in html_files:
    if not p.exists():
        continue
    text = p.read_text(encoding='utf-8')
    if '<div class="footer__mobile">' not in text:
        continue
    s = text.index('<div class="footer__mobile">')
    e = text.index('</footer>', s)
    text = text[:s] + canonical + text[e:]
    p.write_text(text, encoding='utf-8')
    print(f'UPDATED {p.name}')
