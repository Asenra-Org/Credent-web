
import re

file_path = "src/components/EngineView.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix remaining slate colors
content = content.replace("\x27#64748b\x27", "\x27#71717a\x27") # Slate 500 -> Zinc 500
content = content.replace("\x27#1e293b\x27", "\x27#27272a\x27") # Slate 800 -> Zinc 800
content = content.replace("\x27#f1f5f9\x27", "\x27#f4f4f5\x27") # Slate 100 -> Zinc 100
content = content.replace("\x27#cbd5e1\x27", "\x27var(--border-light)\x27") # Slate 300 border -> Border Light

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("EngineView slate colors purged!")

