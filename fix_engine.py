import re

with open('src/components/EngineView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'import ReportDashboard' not in content:
    content = content.replace("import { isTransientApiError } from '../lib/apiError';", "import { isTransientApiError } from '../lib/apiError';\nimport ReportDashboard from './ReportDashboard';")

start_str = "{activeTab === 'EXECUTIVE SUMMARY' && ("
start_idx = content.find(start_str)

if start_idx != -1:
    end_str = "{/* Tab 1: Credit Appraisal Ledger */}"
    end_idx = content.find(end_str)
    
    replacement = "\n                          <ReportDashboard \n                            camReport={camReport} \n                            detectedParams={detectedParams} \n                            finalScore={finalScore} \n                          />\n                        )}\n\n                        "
    
    content = content[:start_idx + len(start_str)] + replacement + content[end_idx:]

with open('src/components/EngineView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
