
import re

file_path = "src/components/EngineView.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix sidebar colors
content = content.replace("color: \x27#506070\x27", "color: \x27#71717a\x27")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("EngineView sidebar colors fixed!")

