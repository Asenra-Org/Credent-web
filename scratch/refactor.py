import re

def refactor_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Zero Gradients & Shadows
    content = re.sub(r'boxShadow:\s*[\'"][^\'"]*[\'"]', "boxShadow: 'none'", content)
    content = re.sub(r'box-shadow:\s*[^;]*;', "box-shadow: none;", content)
    
    # 2. Sharp Geometry
    content = re.sub(r'borderRadius:\s*[\'"]var\(--radius-[^\'"]*[\'"]', "borderRadius: '0px'", content)
    content = re.sub(r'borderRadius:\s*[\'"][0-9]+px[\'"]', "borderRadius: '0px'", content)
    content = re.sub(r'border-radius:\s*[^;]*;', "border-radius: 0px;", content)

    # 3. Color Palette (Stark contrast)
    content = re.sub(r'var\(--bg-secondary,.*?\)', '#f9fafb', content)
    content = re.sub(r'var\(--bg-primary,.*?\)', '#ffffff', content)
    content = re.sub(r'var\(--bg-tertiary,.*?\)', '#f4f4f5', content)
    
    # Change thematic colors to grayscale/zinc
    content = re.sub(r'var\(--teal(?:,.*?)?\)', '#18181b', content)
    content = re.sub(r'var\(--emerald(?:,.*?)?\)', '#18181b', content)
    content = re.sub(r'var\(--rose(?:,.*?)?\)', '#71717a', content)
    content = re.sub(r'var\(--amber(?:,.*?)?\)', '#71717a', content)
    content = re.sub(r'var\(--accent-blue(?:,.*?)?\)', '#18181b', content)
    
    content = re.sub(r'var\(--text-primary(?:,.*?)?\)', '#09090b', content)
    content = re.sub(r'var\(--text-secondary(?:,.*?)?\)', '#3f3f46', content)
    content = re.sub(r'var\(--text-tertiary(?:,.*?)?\)', '#71717a', content)
    
    content = re.sub(r'var\(--border-default(?:,.*?)?\)', '#e4e4e7', content)
    content = re.sub(r'var\(--border-subtle(?:,.*?)?\)', '#e4e4e7', content)

    # Replace transparent colored backgrounds with zinc scales
    content = re.sub(r'rgba\(16,\s*185,\s*129,\s*0\.1[0-9]*\)', '#f4f4f5', content) # emerald transparent
    content = re.sub(r'rgba\(239,\s*68,\s*68,\s*0\.1[0-9]*\)', '#f4f4f5', content) # rose transparent
    content = re.sub(r'rgba\(245,\s*158,\s*11,\s*0\.1[0-9]*\)', '#f4f4f5', content) # amber transparent
    content = re.sub(r'rgba\(14,\s*165,\s*233,\s*0\.1[0-9]*\)', '#f4f4f5', content) # teal transparent
    content = re.sub(r'rgba\(13,\s*33,\s*63,\s*0\.1[0-9]*\)', '#f4f4f5', content) # accent blue transparent
    content = re.sub(r'rgba\(244,\s*63,\s*94,\s*0\.1[0-9]*\)', '#f4f4f5', content) # rose light transparent
    content = re.sub(r'rgba\(245,\s*158,\s*11,\s*0\.15[0-9]*\)', '#f4f4f5', content)

    # 4 & 5 Typography modifications (where explicit)
    # Headings and labels
    content = re.sub(r'letterSpacing:\s*[\'"]0\.02em[\'"]', "letterSpacing: '0.05em'", content)
    
    # Add grayscale class to relevant icons or generic containers if easy, but sticking to colors is safer
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

refactor_file('src/components/ManagerDashboard.jsx')
refactor_file('src/components/HumanApprovalWorkflow.jsx')
print("Done")
