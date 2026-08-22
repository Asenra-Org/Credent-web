import re
import os

files = ["src/components/ManagerDashboard.jsx", "src/components/HumanApprovalWorkflow.jsx"]

replacements = {
    "#0d213f": "#18181b",
    "#0a192f": "#09090b",
    "#2c3540": "#27272a",
    "#f4f6f8": "#fafafa",
    "#f8fafc": "#fafafa",
    "#e2e8f0": "#e4e4e7",
    "#8a99a8": "#71717a",
    "#10b981": "#18181b",
}

for file_path in files:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        for old_color, new_color in replacements.items():
            content = content.replace(old_color, new_color)
        
        content = re.sub(r"borderRadius:\s*['\"].*?['\"]", "borderRadius: 0", content)
        content = re.sub(r"borderRadius:\s*\d+", "borderRadius: 0", content)
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Refactored {file_path}")
    except Exception as e:
        print(f"Skipped {file_path}: {e}")
