
with open('src/components/EngineView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_str = '''if (res1.data.status === 'error' || !res1.data.ai_analysis) {
        throw new Error(res1.data.detail || res1.data.message || 'PDF extraction failed');
      }'''

new_str = '''if (res1.data.status === 'paused') {
        throw new Error('Pipeline paused for Manager Approval (HITL). ' + (res1.data.message || ''));
      }
      if (res1.data.status === 'error' || !res1.data.ai_analysis || Object.keys(res1.data.ai_analysis).length === 0) {
        throw new Error(res1.data.detail || res1.data.message || 'PDF extraction failed');
      }'''

# Since indentation might differ, let's use regex
import re
content = re.sub(
    r'if\s*\(res1\.data\.status === \'error\' \|\|\s*!res1\.data\.ai_analysis\)\s*\{\s*throw new Error\(res1\.data\.detail \|\| res1\.data\.message \|\| \'PDF extraction failed\'\);\s*\}',
    '''if (res1.data.status === 'paused') {
          throw new Error('Pipeline paused for Manager Approval (HITL). ' + (res1.data.message || ''));
        }
        if (res1.data.status === 'error' || !res1.data.ai_analysis || Object.keys(res1.data.ai_analysis).length === 0) {
          throw new Error(res1.data.detail || res1.data.message || 'PDF extraction failed');
        }''',
    content
)

with open('src/components/EngineView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

