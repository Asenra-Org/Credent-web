import re

with open('src/components/EngineView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all occurrences of background: '#18181b' followed by color: '#18181b'
# Using regex to handle variable whitespace/newlines

content = re.sub(
    r"(background:\s*'#18181b',\s*color:\s*)'#18181b'",
    r"\1'#ffffff'",
    content
)

content = re.sub(
    r"(background:\s*isProcessingQueue \? '#71717a' : '#18181b',\s*color:\s*)'#18181b'",
    r"\1'#ffffff'",
    content
)

with open('src/components/EngineView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
