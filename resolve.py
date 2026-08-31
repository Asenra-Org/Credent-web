import re
file_path = r'D:\coding\Credent-web\src\components\EngineView.jsx'
content = open(file_path, encoding='utf-8').read()

conflict = '''<<<<<<< HEAD
import useEngineStore from '../stores/engineStore';
=======
import { isTransientApiError } from '../lib/apiError';
>>>>>>> c05c49946c1806275393092befc3128e4c618bd7'''

resolution = '''import useEngineStore from '../stores/engineStore';
import { isTransientApiError } from '../lib/apiError';'''

if conflict in content:
    content = content.replace(conflict, resolution)
    open(file_path, 'w', encoding='utf-8').write(content)
    print("Resolved import conflict.")
else:
    print("Conflict not found exactly as expected.")
