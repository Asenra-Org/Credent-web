
import re

file_path = "src/components/EngineView.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix text color in the processing terminal
content = content.replace("background: \x27#1f262d\x27,\n                            color: \x27#18181b\x27,", "background: \x27#18181b\x27,\n                            color: \x27#a1a1aa\x27,")
content = content.replace("? \n\x27#ef4444\x27 : \x27#18181b\x27 }}>{log}</div>", "? \x27#ef4444\x27 : \x27#a1a1aa\x27 }}>{log}</div>")
content = content.replace("? \x27#ef4444\x27 : \x27#18181b\x27 }}>{log}</div>", "? \x27#ef4444\x27 : \x27#a1a1aa\x27 }}>{log}</div>")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Logs colors fixed!")

