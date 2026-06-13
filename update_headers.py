from pathlib import Path

base = Path('.')
files = ['index.html','form.html','select.html','otp.html','otp2.html','otp3.html','total.html','total2.html','visa.html']

old_top = '''  <div class="top-bar">
    <img src="https://bcare.com.sa/assets/images/Bcare-logo.svg" alt="Bcare Logo">
    <span></span>
        <span>EN</span>
  </div>'''
new_top = '''  <div class="top-bar">
    <button class="menu-btn" type="button" aria-label="القائمة">
      <span></span><span></span><span></span>
    </button>
    <div class="brand-wrap">
      <img src="https://bcare.com.sa/assets/images/Bcare-logo.svg" alt="Bcare Logo">
    </div>
    <div class="top-actions">
      <span class="lang-chip">EN</span>
      <span class="user-chip">👤</span>
    </div>
  </div>'''

old_logo = '''  <div class="logo">
    <img src="https://bcare.com.sa/assets/images/Bcare-logo.svg" alt="Care Logo" />
  </div>'''
new_logo = '''  <div class="top-bar">
    <button class="menu-btn" type="button" aria-label="القائمة">
      <span></span><span></span><span></span>
    </button>
    <div class="brand-wrap">
      <img src="https://bcare.com.sa/assets/images/Bcare-logo.svg" alt="Care Logo" />
    </div>
    <div class="top-actions">
      <span class="lang-chip">EN</span>
      <span class="user-chip">👤</span>
    </div>
  </div>'''

old_logo2 = '''  <div class="logo" id="logo">
    <img src="https://akhbarna.net/assets/2022-04-10/images/151119_1_1649582947.jpg" alt="Care Logo" />
    <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" alt="visa" />
  </div>'''
new_logo2 = '''  <div class="top-bar logo" id="logo">
    <button class="menu-btn" type="button" aria-label="القائمة">
      <span></span><span></span><span></span>
    </button>
    <div class="brand-wrap">
      <img src="https://akhbarna.net/assets/2022-04-10/images/151119_1_1649582947.jpg" alt="Care Logo" />
      <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" alt="visa" />
    </div>
    <div class="top-actions">
      <span class="lang-chip">EN</span>
      <span class="user-chip">👤</span>
    </div>
  </div>'''

css = '''
    /* Full-width modern header */
    .top-bar { width: 100%; max-width: none; margin: 0 0 10px; padding: 10px 12px; border-radius: 0 0 18px 18px; background: linear-gradient(135deg, #ffffff, #eff6ff); border: 1px solid #dbe7f7; box-shadow: 0 12px 24px rgba(10, 41, 82, 0.12); box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .top-bar .menu-btn { display: flex; flex-direction: column; gap: 4px; padding: 6px; border: 0; border-radius: 10px; background: transparent; cursor: pointer; }
    .top-bar .menu-btn span { display: block; width: 22px; height: 3px; border-radius: 999px; background: #0a4b8f; }
    .top-bar .brand-wrap { flex: 1; display: flex; justify-content: center; align-items: center; }
    .top-bar .brand-wrap img { height: 34px; width: auto; }
    .top-bar .top-actions { display: flex; align-items: center; gap: 8px; }
    .top-bar .lang-chip, .top-bar .user-chip { display: inline-flex; align-items: center; justify-content: center; min-width: 36px; height: 34px; border-radius: 999px; background: #0a4b8f; color: #fff; font-size: 12px; font-weight: 700; box-shadow: 0 10px 18px rgba(14, 74, 138, 0.22); }
    .top-bar .user-chip { background: linear-gradient(135deg, #f4b942, #ffcf54); color: #0b2f56; }
'''

for name in files:
    path = base / name
    text = path.read_text(encoding='utf-8')
    if old_top in text:
        text = text.replace(old_top, new_top)
    if old_logo in text:
        text = text.replace(old_logo, new_logo)
    if old_logo2 in text:
        text = text.replace(old_logo2, new_logo2)
    if '</style>' in text and 'Full-width modern header' not in text:
        text = text.replace('</style>', css + '\n  </style>', 1)
    path.write_text(text, encoding='utf-8')

print('Updated files')
