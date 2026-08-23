import re

with open('src/components/EngineView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'const stopProcessingRef = useRef(false);' not in content:
    content = content.replace(
        'const [progress, setProgress] = useState(0);',
        'const [progress, setProgress] = useState(0);\n  const stopProcessingRef = useRef(false);'
    )

beforeunload_code = '''
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isProcessingQueue || appStatus === 'processing') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isProcessingQueue, appStatus]);
'''
if 'window.addEventListener(\'beforeunload\'' not in content:
    content = content.replace(
        'const stopProcessingRef = useRef(false);',
        'const stopProcessingRef = useRef(false);\n' + beforeunload_code
    )

if 'stopProcessingRef.current = false;' not in content:
    content = content.replace(
        'const runAllQueueTasks = async (targetItems = null) => {',
        'const runAllQueueTasks = async (targetItems = null) => {\n    stopProcessingRef.current = false;'
    )
    content = content.replace(
        'for (let i = 0; i < itemsToProcess.length; i++) {',
        'for (let i = 0; i < itemsToProcess.length; i++) {\n      if (stopProcessingRef.current) {\n        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] SYSTEM: Queue processing stopped by user.`]);\n        break;\n      }'
    )

stop_queue_code = '''
  const stopQueue = () => {
    stopProcessingRef.current = true;
    setIsProcessingQueue(false);
    setAppStatus('idle');
  };
'''
if 'const stopQueue = () =>' not in content:
    content = content.replace(
        'const runAllQueueTasks = async (targetItems = null) => {',
        stop_queue_code + '\n  const runAllQueueTasks = async (targetItems = null) => {'
    )

stop_btn_code = '''
                              {isProcessingQueue && (
                                <button
                                  type="button"
                                  onClick={stopQueue}
                                  style={{
                                    background: '#ef4444',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '0.4rem 0.85rem',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    borderRadius: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                  }}>
                                  <span>STOP</span>
                                </button>
                              )}
'''
if '>STOP</span>' not in content:
    content = content.replace(
        '{/* Run Appraisal Queue */}',
        stop_btn_code + '\n                                {/* Run Appraisal Queue */}'
    )

with open('src/components/EngineView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("EngineView.jsx patched successfully!")
