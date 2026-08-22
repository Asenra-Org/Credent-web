import re

file_path = "src/components/EngineView.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace colors
replacements = {
    "#0d213f": "#18181b",  # Zinc 900
    "#0a192f": "#09090b",  # Zinc 950
    "#2c3540": "#27272a",  # Zinc 800
    "#f4f6f8": "#fafafa",  # Zinc 50
    "#f8fafc": "#fafafa",  # Zinc 50
    "#e2e8f0": "#e4e4e7",  # Zinc 200
    "#8a99a8": "#71717a",  # Zinc 500
    "#10b981": "#18181b",  # Remove emerald green -> Zinc 900 (sharp B2B)
    "#059669": "#18181b",  # Remove green hover
    "#047857": "#18181b",
    "#ecfdf5": "#f4f4f5",  # Green bg -> Zinc 100
    "#6ee7b7": "#e4e4e7",  # Green border -> Zinc 200
    "#fef3c7": "#f4f4f5",
    "#d97706": "#18181b",
    "#fcd34d": "#e4e4e7",
    "#fff1f2": "#f4f4f5",
    "#b91c1c": "#18181b",
    "#fca5a5": "#e4e4e7"
}

for old_color, new_color in replacements.items():
    content = content.replace(old_color, new_color)

# Replace border radius
content = re.sub(r"borderRadius:\s*['\"].*?['\"]", "borderRadius: 0", content)
content = re.sub(r"borderRadius:\s*\d+", "borderRadius: 0", content)

# Check Box Shadow
content = re.sub(r"boxShadow:\s*['\"].*?['\"]", "boxShadow: 'none'", content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("EngineView styles refactored to Zinc Monochrome!")
