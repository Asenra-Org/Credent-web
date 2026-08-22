
import re

with open('src/components/EngineView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: setCamReport mapping in the queue runner
content = re.sub(
    r'camReport: \{\s*decision: camData\.decision.*?decision_rationale: camData\.decision_rationale.*?\}',
    r'camReport: camData',
    content,
    flags=re.DOTALL
)

# Fix 2: setCamReport mapping in the main runner
content = re.sub(
    r'setCamReport\(\{\s*decision: camData\.decision.*?decision_rationale: camData\.decision_rationale.*?\}\);',
    r'setCamReport(camData);',
    content,
    flags=re.DOTALL
)

# Fix 3: Rendering the five_cs table properly with the new schema (c.data.evidence)
# The current is Object.entries(camReport.five_cs).map
# We need to change how the table is rendered, or just map it better
def replace_five_cs(m):
    return '''{Object.entries(camReport.five_cs || {}).map(([key, val]) => (
                                <tr key={key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#27272a', fontFamily: 'var(--font-mono)', width: '150px' }}>{key}</td>
                                  <td style={{ padding: '0.6rem 0.75rem', color: '#71717a', lineHeight: '1.4' }}>
                                    {typeof val === 'string' ? val : (val.evidence || val.text || val.assessment || 'NOT PROVIDED')}
                                  </td>
                                </tr>
                              ))}'''

content = re.sub(r'\{Object\.entries\(camReport\.five_cs\)\.map.*?\}\)\}', replace_five_cs, content, flags=re.DOTALL)

with open('src/components/EngineView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

