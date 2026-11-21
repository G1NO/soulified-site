"""Build the Soulified site: fills shared pieces into *.src.html -> *.html."""
import re, sys, pathlib
ROOT = pathlib.Path(__file__).parent
FORM_EMAIL = sys.argv[1] if len(sys.argv) > 1 else "YOUR_EMAIL_HERE"

LOGO = '<img src="emblem-nav.png" alt="" width="83" height="30">'
GENRES = ["Rock", "Indie", "Pop", "Soul & R&B", "Funk", "Blues", "Country", "Folk & Acoustic",
          "Singer-songwriter", "Reggae", "Latin", "Gospel", "Jazz", "Hip-hop (live band)", "Metal", "Worship"]
SERVICES = ["Lead vocal", "Backing vocals & harmonies", "Electric guitar", "Acoustic guitar", "Bass", "Drums",
            "Keys & piano", "Strings or horns", "Full band", "My own vocal (I'll record it)", "Mix & master only", "Not sure yet"]
INSTRUMENTS = ["Lead vocals", "Backing vocals", "Electric guitar", "Acoustic guitar", "Bass", "Drums",
               "Keys & piano", "Strings", "Horns", "Production & mixing", "Other"]
SOCIAL = (
    '<a href="https://www.instagram.com/besoulified/" target="_blank" rel="noopener">Instagram</a>'
    '<a href="https://www.tiktok.com/@besoulified" target="_blank" rel="noopener">TikTok</a>'
    '<a href="https://x.com/beSoulified" target="_blank" rel="noopener">X</a>'
)

HEAD = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="https://besoulified.com/og-image.jpg">
<link rel="icon" href="favicon.png" type="image/png">
<link rel="apple-touch-icon" href="icon-256.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>'''

HEADER = '''<header class="nav">
  <div class="wrap">
    <a class="brand" href="index.html" aria-label="Soulified home">{{LOGO}}<span>SOULIFIED</span></a>
    <ul>
      <li><a href="index.html#how">How it works</a></li>
      <li><a href="index.html#pricing">Pricing</a></li>
      <li><a href="index.html#faq">FAQ</a></li>
      <li><a href="join.html">For musicians</a></li>
      <li><a class="btn gold small" href="start.html">Start a project</a></li>
    </ul>
  </div>
</header>'''

FOOTER = '''<footer>
  <div class="wrap">
    <a class="brand" href="index.html">{{LOGO}}<span>SOULIFIED</span></a>
    <nav>
      <a href="start.html">Start a project</a>
      <a href="join.html">For musicians</a>
      <a href="record.html">Recording guide</a>
      <a href="privacy.html">Privacy</a>
      {{SOCIAL}}
    </nav>
    <span>© 2026 Soulified</span>
  </div>
</footer>'''

def checks(name, values):
    return "\n          ".join(
        f'<label class="opt"><input type="checkbox" name="{name}" value="{v}"><span>{v}</span></label>' for v in values)

def build(src: pathlib.Path):
    s = src.read_text()
    m = re.search(r"\{\{HEAD:([^:]+):([^}]+)\}\}", s)
    if m:
        s = s.replace(m.group(0), HEAD.format(title=m.group(1), desc=m.group(2)))
    s = s.replace("{{HEADER}}", HEADER).replace("{{FOOTER}}", FOOTER)
    s = (s.replace("{{LOGO}}", LOGO).replace("{{SOCIAL}}", SOCIAL)
          .replace("{{GENRES}}", "".join(f"<span>{g}</span>" for g in GENRES))
          .replace("{{GENRE_OPTIONS}}", "".join(f"<option>{g}</option>" for g in GENRES))
          .replace("{{SERVICE_OPTIONS}}", checks("Make human", SERVICES))
          .replace("{{INSTRUMENT_OPTIONS}}", checks("Instruments", INSTRUMENTS))
          .replace("{{GENRE_CHECKS}}", checks("Genres", GENRES)))
    # index header/footer are inline: normalize them to the shared versions
    s = re.sub(r'<header class="nav">.*?</header>', HEADER.replace("{{LOGO}}", LOGO), s, flags=re.S)
    s = re.sub(r'<footer>.*?</footer>', FOOTER.replace("{{LOGO}}", LOGO).replace("{{SOCIAL}}", SOCIAL), s, flags=re.S)
    left = re.findall(r"\{\{[A-Z_]+\}\}", s)
    assert not left, f"{src.name}: unfilled {left}"
    out = src.with_name(src.name.replace(".src", ""))
    out.write_text(s)
    return out.name

for src in sorted(ROOT.glob("*.src.html")):
    print("built", build(src))
js = (ROOT / "form.src.js") if (ROOT / "form.src.js").exists() else None
if js:
    (ROOT / "form.js").write_text(js.read_text().replace("{{FORM_EMAIL}}", FORM_EMAIL))
    print("built form.js ->", FORM_EMAIL)
