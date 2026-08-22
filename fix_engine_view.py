import re

docs_path = r"D:\coding\Credent-web\src\components\EngineView.jsx"
with open(docs_path, 'r', encoding='utf-8') as f:
    docs = f.read()

# Replace if (appStatus === 'idle') with if (appStatus !== 'processing')
docs = docs.replace("if (appStatus === 'idle') {", "if (appStatus !== 'processing') {")
docs = docs.replace("{appStatus === 'idle' && (", "{appStatus !== 'processing' && (")

with open(docs_path, 'w', encoding='utf-8') as f:
    f.write(docs)
