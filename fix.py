import re

with open('src/components/ReportDashboard.jsx', 'r') as f:
    content = f.read()

content = re.sub(r"const tabs = \['Executive Summary'.*?\];\n", "", content)
content = re.sub(r"const \[activeTab, setActiveTab\] = useState\('Executive Summary'\);\n", "", content)

return_start = content.find("return (")
content_area_start = content.find("{/* Content Area */}")

if return_start != -1 and content_area_start != -1:
    prefix = content[:return_start]
    suffix = content[content_area_start:]
    suffix = suffix.replace("{activeTab === 'Executive Summary' && (", "")
    
    other_tabs = suffix.find("{/* Other Tabs placeholder */}")
    if other_tabs != -1:
        before_other = suffix[:other_tabs]
        last_bracket = before_other.rfind(")}")
        if last_bracket != -1:
            suffix = suffix[:last_bracket] + suffix[last_bracket+2:]
    
    suffix = re.sub(r"\{/\* Other Tabs placeholder \*/\}.*?</div>\s*\)\}\s*", "", suffix, flags=re.DOTALL)
    
    content = prefix + "return (\n    <div className=\"flex flex-col gap-6\">\n" + suffix

with open('src/components/ReportDashboard.jsx', 'w') as f:
    f.write(content)
