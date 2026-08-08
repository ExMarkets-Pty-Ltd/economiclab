import re
import sys
from pathlib import Path

root = Path(r'c:/Users/Usere/Documents/GitHub/exmarkets').resolve()
html_files = [p for p in root.rglob('*.html') if p.is_file()]
link_re = re.compile(r'href=["\']([^"\']+)["\']', re.I)
missing = []

for html in html_files:
    text = html.read_text(encoding='utf-8')
    for href in link_re.findall(text):
        if not href:
            continue
        if href.startswith('#'):
            target_id = href[1:]
            if target_id and f'id="{target_id}"' not in text and f"id='{target_id}'" not in text:
                missing.append((str(html.relative_to(root)), href, 'missing anchor'))
            continue
        if re.match(r'^(?:[a-z]+:|//)', href, re.I):
            continue
        path_part = href.split('#', 1)[0].split('?', 1)[0]
        if not path_part:
            continue
        target = (html.parent / path_part).resolve()
        if not target.exists():
            missing.append((str(html.relative_to(root)), href, 'missing file'))

if missing:
    print('Broken targets found:')
    for item in missing:
        print(f'- {item[0]} -> {item[1]} ({item[2]})')
    sys.exit(1)

print(f'Checked {len(html_files)} HTML files; all local page targets resolved successfully.')
