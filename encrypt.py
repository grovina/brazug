"""
Encrypts the report HTML and generates a password-protected wrapper.
Uses AES-256-GCM with PBKDF2 key derivation — same primitives available
in the browser via Web Crypto API.
"""
import os, json, base64, hashlib, struct
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

PASSWORD = "RatoSemPelo"
ITERATIONS = 100_000

import pathlib

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"

with open(SRC / "index.html") as f:
    html = f.read()
with open(SRC / "styles.css") as f:
    css = f.read()
with open(SRC / "data.js") as f:
    data_js = f.read()
with open(SRC / "charts.js") as f:
    charts_js = f.read()

# Build the standalone HTML (inline everything)
standalone = html
standalone = standalone.replace(
    '<link rel="stylesheet" href="styles.css">',
    f'<style>\n{css}\n</style>'
)
standalone = standalone.replace(
    '<script src="data.js"></script>',
    f'<script>\n{data_js}\n</script>'
)
standalone = standalone.replace(
    '<script src="charts.js"></script>',
    f'<script>\n{charts_js}\n</script>'
)

payload = standalone.encode("utf-8")

# Encrypt
salt = os.urandom(16)
iv = os.urandom(12)

kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITERATIONS)
key = kdf.derive(PASSWORD.encode("utf-8"))

aesgcm = AESGCM(key)
ciphertext = aesgcm.encrypt(iv, payload, None)

# Pack: salt(16) + iv(12) + ciphertext
blob = salt + iv + ciphertext
blob_b64 = base64.b64encode(blob).decode("ascii")

print(f"Plaintext:  {len(payload):,} bytes")
print(f"Encrypted:  {len(blob):,} bytes")
print(f"Base64:     {len(blob_b64):,} chars")

# Generate wrapper
wrapper = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Brazug-ug e Degredados</title>
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{
  font-family: -apple-system, 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}}
.lock-container {{
  text-align: center;
  max-width: 420px;
  padding: 2rem;
}}
.lock-icon {{
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.8;
}}
h1 {{
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}}
.subtitle {{
  font-size: 0.85rem;
  opacity: 0.5;
  margin-bottom: 2rem;
  font-style: italic;
}}
.input-group {{
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}}
input[type="password"] {{
  flex: 1;
  padding: 0.8rem 1rem;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 8px;
  background: rgba(255,255,255,0.08);
  color: #fff;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}}
input[type="password"]:focus {{
  border-color: #ffd700;
}}
button {{
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: #ffd700;
  color: #1a1a2e;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.1s, opacity 0.2s;
}}
button:hover {{ opacity: 0.9; }}
button:active {{ transform: scale(0.97); }}
.error {{
  color: #ff6b6b;
  font-size: 0.85rem;
  min-height: 1.2rem;
}}
.loading {{
  display: none;
  margin-top: 1rem;
  font-size: 0.85rem;
  opacity: 0.6;
}}
.spinner {{
  display: inline-block;
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #ffd700;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  vertical-align: middle;
  margin-right: 0.5rem;
}}
@keyframes spin {{ to {{ transform: rotate(360deg); }} }}
</style>
</head>
<body>
<div class="lock-container">
  <div class="lock-icon">🔐</div>
  <h1>Brazug-ug e Degredados</h1>
  <p class="subtitle">A Socio-Anthropological Field Study</p>
  <form id="form">
    <div class="input-group">
      <input type="password" id="pwd" placeholder="Enter password" autofocus>
      <button type="submit">Unlock</button>
    </div>
    <div class="error" id="error"></div>
  </form>
  <div class="loading" id="loading"><span class="spinner"></span>Decrypting report...</div>
</div>

<script>
const ENCRYPTED = "{blob_b64}";
const ITERATIONS = {ITERATIONS};

document.getElementById("form").addEventListener("submit", async (e) => {{
  e.preventDefault();
  const pwd = document.getElementById("pwd").value;
  const errEl = document.getElementById("error");
  const loadEl = document.getElementById("loading");
  errEl.textContent = "";
  loadEl.style.display = "block";

  try {{
    const raw = Uint8Array.from(atob(ENCRYPTED), c => c.charCodeAt(0));
    const salt = raw.slice(0, 16);
    const iv = raw.slice(16, 28);
    const ct = raw.slice(28);

    const keyMaterial = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(pwd), "PBKDF2", false, ["deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
      {{ name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" }},
      keyMaterial,
      {{ name: "AES-GCM", length: 256 }},
      false,
      ["decrypt"]
    );
    const decrypted = await crypto.subtle.decrypt({{ name: "AES-GCM", iv }}, key, ct);
    const html = new TextDecoder().decode(decrypted);

    document.open();
    document.write(html);
    document.close();
  }} catch (err) {{
    loadEl.style.display = "none";
    errEl.textContent = "Wrong password";
    document.getElementById("pwd").select();
  }}
}});
</script>
</body>
</html>'''

import shutil

out_dir = ROOT / "public"
out_dir.mkdir(exist_ok=True)

with open(out_dir / "index.html", "w") as f:
    f.write(wrapper)

for asset in SRC.iterdir():
    if asset.suffix in ('.ico', '.png', '.svg', '.webmanifest'):
        shutil.copy2(asset, out_dir / asset.name)
        print(f"Copied {asset.name}")

print(f"\\nWrapper written to {out_dir / 'index.html'} ({len(wrapper):,} chars)")
print("Password:", PASSWORD)
