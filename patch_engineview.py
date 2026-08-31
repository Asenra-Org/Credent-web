import re

file_path = r'D:\coding\Credent-web\src\components\EngineView.jsx'
content = open(file_path, encoding='utf-8').read()

# Add import
if "import useEngineStore from '../stores/engineStore';" not in content:
    content = content.replace("import { downloadPDF } from '../utils/generatePdf';", "import { downloadPDF } from '../utils/generatePdf';\nimport useEngineStore from '../stores/engineStore';")

# Remove useState declarations for store variables
state_vars = [
    'appStatus', 'file', 'isDragging', 'detectedParams', 'forensicsReport', 
    'camReport', 'osintData', 'finalScore', 'errorMessage', 'activeTab', 
    'logs', 'progress', 'queueItems', 'activeQueueItemId', 'isProcessingQueue'
]

for var in state_vars:
    # Match const [var, setVar] = useState(...);
    # Handling possible multi-line or single-line
    pattern = r"^\s*const\s+\[" + var + r",\s*set" + var[0].upper() + var[1:] + r"\]\s*=\s*useState\(.*?\);\s*?\n"
    content = re.sub(pattern, "", content, flags=re.MULTILINE)

# Inject zustand hook extraction at the top of EngineView
hook_injection = """  const {
    appStatus, setAppStatus,
    file, setFile,
    isDragging, setIsDragging,
    detectedParams, setDetectedParams,
    forensicsReport, setForensicsReport,
    camReport, setCamReport,
    osintData, setOsintData,
    finalScore, setFinalScore,
    errorMessage, setErrorMessage,
    activeTab, setActiveTab,
    logs, setLogs,
    progress, setProgress,
    queueItems, setQueueItems,
    activeQueueItemId, setActiveQueueItemId,
    isProcessingQueue, setIsProcessingQueue
  } = useEngineStore();"""

if "useEngineStore();" not in content:
    content = content.replace("export default function EngineView() {", "export default function EngineView() {\n" + hook_injection)

open(file_path, 'w', encoding='utf-8').write(content)
print("Patched EngineView.jsx")
