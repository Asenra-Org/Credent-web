
import re

file_path = "src/components/EngineView.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix button colors: if background is #18181b, make text #ffffff
content = content.replace("background: \x27#18181b\x27,\n                                      color: \x27#18181b\x27,", "background: \x27#18181b\x27,\n                                      color: \x27#ffffff\x27,")
content = content.replace("background: isProcessingQueue ? \x27#64748b\x27 : \x27#18181b\x27,\n                                    color: \x27#18181b\x27,", "background: isProcessingQueue ? \x27#64748b\x27 : \x27#18181b\x27,\n                                    color: \x27#ffffff\x27,")
content = content.replace("style={{ background: \x27#18181b\x27, color: \x27#18181b\x27", "style={{ background: \x27#18181b\x27, color: \x27#ffffff\x27")
content = content.replace("style={{ background: \x27#27272a\x27, color: \x27#18181b\x27", "style={{ background: \x27#27272a\x27, color: \x27#ffffff\x27")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("EngineView buttons fixed!")

