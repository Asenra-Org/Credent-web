
import re

file_path = "src/components/EngineView.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Font replacements
content = content.replace("fontFamily: \x27-apple-system, BlinkMacSystemFont, \x22Segoe UI\x22, Roboto, sans-serif\x27", "fontFamily: \x27var(--font-family)\x27")
content = content.replace("fontFamily: \x27monospace\x27", "fontFamily: \x27var(--font-mono)\x27")

# Header and Text colors to match the others
content = content.replace("fontWeight: 700", "fontWeight: 600") # Softer than 700 for B2B
content = content.replace("background: \x27#27272a\x27", "background: \x27#ffffff\x27") # Topbar to white
content = content.replace("background: \x27#222a33\x27", "background: \x27#ffffff\x27") # Topbar brand to white
content = content.replace("color: \x27#ffffff\x27", "color: \x27#18181b\x27") # Topbar text to dark

# Sidebar styling
content = content.replace("background: \x27#fafafa\x27, \n          width: \x27230px\x27,", "background: \x27#fafafa\x27, \n          width: \x27230px\x27,\n          borderRight: \x271px solid var(--border-light)\x27,")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("EngineView fonts and layout colors refined!")

