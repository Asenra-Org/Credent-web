# Credent: 2-Month (8-Week) Complete Linear Slack Commands Backlog
> **Asenra | Project: Credent — Production-Ready Production Underwriting Engine**  
> *Founder's Action: Copy and paste the slash commands below directly into Slack to create Linear issues instantly.*

---

## 📅 SPRINT 1: Environment & PDF Ingestion (Week 1)

### 📋 Frontend (Vite & UI Layout)
```text
/linear create "[FE-W1] Build Drag-and-Drop Ingestion UI" -d "### 🎯 Objective:
Create the upload area in the main workspace that supports drag-and-drop PDF ingestion and connects to the backend API.

### 🛠️ Key Deliverables:
1. Design a clean, high-density drag-and-drop panel in `EngineView.jsx`.
2. Integrate a progress spinner and state handlers for file uploads.
3. Build a scrollable 'Audit Logs' panel at the bottom to receive log states.
4. Apply the Asenra CSS style tokens (navy blue `#2c3540` and white backgrounds).

### 🧪 Acceptance Criteria:
- Dropping a PDF file calls `/api/v1/documents/ingest/pdf` via Axios.
- Logs display upload progress dynamically (e.g. 'Uploading...')."
```

### 📋 Backend (FastAPI Ingest)
```text
/linear create "[BE-W1] Setup FastAPI File Ingestion & Temporary Storage" -d "### 🎯 Objective:
Implement a robust FastAPI endpoint to handle PDF uploads, validate sizes, and manage temporary disk storage securely.

### 🛠️ Key Deliverables:
1. Create a `POST /api/v1/documents/ingest/pdf` endpoint in `documents.py`.
2. Restrict uploads to `.pdf` format and enforce a 20MB file size limit.
3. Save uploads temporarily to a secured `/temp_uploads` folder and ensure files are deleted post-processing.
4. Integrate clean error handling returning JSON payloads.

### 🧪 Acceptance Criteria:
- API rejects non-PDF files with a 400 Bad Request.
- `/temp_uploads` remains empty after file processing completes."
```

### 📋 AI/ML (PDF Parser Setup)
```text
/linear create "[AI-W1] Setup PDF Text Ingestion & Raw Data Extraction" -d "### 🎯 Objective:
Set up Python-based PDF text parsers (PyPDF2 with OCR fallback) to extract raw textual data from digital and scanned documents.

### 🛠️ Key Deliverables:
1. Setup text extraction using `PyPDF2` in `document_ingestion.py`.
2. Add a `Tesseract OCR` fallback function to read scanned/low-quality PDFs if text length is less than 100 characters.
3. Test extraction accuracy across 5 different sample balance sheets.

### 🧪 Acceptance Criteria:
- PDF parser returns complete raw text in JSON format.
- Works successfully on scanned (image-only) PDF files."
```

### 📋 QA/Testing (Ingestion Tests)
```text
/linear create "[QA-W1] Setup pytest Framework and Verify Ingestion API" -d "### 🎯 Objective:
Configure the testing framework and write automated tests for the file upload/ingestion endpoint.

### 🛠️ Key Deliverables:
1. Configure `pytest` and `httpx` in the backend root directory.
2. Write integration tests to check file size limits (testing a file > 20MB).
3. Test error boundaries for corrupted or password-protected PDF files.

### 🧪 Acceptance Criteria:
- `pytest` executes with zero errors.
- Test reports verify 100% boundary coverage for invalid file uploads."
```

---

## 📅 SPRINT 2: PDF Forensics & Tampering (Week 2)

### 📋 Frontend (Forensics Grid)
```text
/linear create "[FE-W2] Design PDF Forensics Alert Grid" -d "### 🎯 Objective:
Integrate a UI alert panel to display the digital forensics scan report and warn users of potential document modifications.

### 🛠️ Key Deliverables:
1. Create a 'Structure & Integrity Scan' panel in the sidebar of `EngineView.jsx`.
2. Render metadata properties (Creator, Producer) dynamically.
3. Display warning cards (Red/Yellow) if `is_suspicious` is true, listing all flagged items.

### 🧪 Acceptance Criteria:
- Uploading a PDF shows its metadata on the UI immediately.
- Suspicious flags are displayed in a clean, red alert list."
```

### 📋 Backend (Pipeline Integration)
```text
/linear create "[BE-W2] Integrate Forensics Scan into Ingestion Pipeline" -d "### 🎯 Objective:
Integrate the PDF metadata scanning function into the FastAPI documents router.

### 🛠️ Key Deliverables:
1. Implement the `run_pdf_forensics` method in `documents.py` using `pikepdf`.
2. Cross-reference the creation and modification timestamps to check for alterations.
3. Verify the file response payload includes the `forensics` dictionary.

### 🧪 Acceptance Criteria:
- Ingestion endpoint returns a complete `forensics` JSON object containing `is_suspicious` and `flags`."
```

### 📋 AI/ML (Tamper Logic Calibration)
```text
/linear create "[AI-W2] Calibrate Metadata & Tamper Detection Logic" -d "### 🎯 Objective:
Develop rules to identify if a financial PDF was generated or modified in consumer editing applications.

### 🛠️ Key Deliverables:
1. Build a lookup list of suspicious creators/producers (e.g. Canva, Illustrator, Gimp, Photoshop).
2. Write signature validation logic to detect mismatched font layers.
3. Test the detection logic using 3 intentionally modified balance sheets.

### 🧪 Acceptance Criteria:
- Detection rules successfully flag a PDF that has been modified after creation."
```

### 📋 QA/Testing (Forensics Tests)
```text
/linear create "[QA-W2] Write PDF Forensics Automation Tests" -d "### 🎯 Objective:
Create automated test scripts to validate metadata and timestamp checks.

### 🛠️ Key Deliverables:
1. Write `pytest` assertions verifying metadata extraction.
2. Build 3 test cases: a pristine PDF, a Canva-modified PDF, and a PDF with mismatched timestamps.
3. Assert that the forensics response contains correct risk flags.

### 🧪 Acceptance Criteria:
- Tests pass, demonstrating zero false-negatives on edited PDFs."
```

---

## 📅 SPRINT 3: Tax & Ledger Triangulation (Week 3)

### 📋 Frontend (Correlation UI)
```text
/linear create "[FE-W3] Design GSTR vs Bank Statement Integrity Grid" -d "### 🎯 Objective:
Design a side-by-side data table to represent bank statement credits compared against GSTR taxable turnover.

### 🛠️ Key Deliverables:
1. Create a 'Ledger Correlation' table in `EngineView.jsx`.
2. Format values as Indian Rupees (₹) using monospace fonts.
3. Display a correlation score badge (e.g., 98.4% Match).

### 🧪 Acceptance Criteria:
- Render GSTR monthly entries and bank credits clearly.
- Highlight discrepancies in red if the correlation falls below 95%."
```

### 📋 Backend (Integrity Endpoint)
```text
/linear create "[BE-W3] Build GST-to-Ledger Integrity API" -d "### 🎯 Objective:
Create the backend API to handle arrays of bank statement transactions and GSTR tax filings.

### 🛠️ Key Deliverables:
1. Create the `POST /api/v1/analysis/integrity-check` endpoint in `reports.py`.
2. Design database tables in SQLite to store tax validation records.
3. Ensure calculations run asynchronously to prevent gateway timeouts.

### 🧪 Acceptance Criteria:
- API successfully accepts GSTR and bank arrays, returning a finalized correlation percentage."
```

### 📋 AI/ML (Correlation Algorithms)
```text
/linear create "[AI-W3] Code Transaction Correlation & Filtering Logic" -d "### 🎯 Objective:
Build the mathematical algorithm to match monthly bank statement credits against monthly GSTR taxable sales.

### 🛠️ Key Deliverables:
1. Write matching logic that groups bank credits by month.
2. Filter out non-sales credits (e.g. director loans, internal transfers).
3. Compute the variance percentage between bank revenue and tax declarations.

### 🧪 Acceptance Criteria:
- The algorithm ignores non-revenue credits.
- Correctly identifies revenue discrepancies of more than 5%."
```

### 📋 QA/Testing (Triangulation Scenarios)
```text
/linear create "[QA-W3] Write Triangulation Validation Scenarios" -d "### 🎯 Objective:
Validate the integrity engine using test transactions and edge-case tax returns.

### 🛠️ Key Deliverables:
1. Prepare mock datasets simulating revenue-inflation scenarios.
2. Verify the API returns correct matching rates for mismatched months.
3. Assert that no floating-point errors occur during aggregate summation.

### 🧪 Acceptance Criteria:
- Automated tests pass with 100% math accuracy."
```

---

## 📅 SPRINT 4: OSINT Web Crawler (Week 4)

### 📋 Frontend (Litigation View)
```text
/linear create "[FE-W4] Build litigation Logs Viewer" -d "### 🎯 Objective:
Integrate a grid component on the dashboard to present litigations, court orders, and default history.

### 🛠️ Key Deliverables:
1. Add a 'Litigation Search Logs' card to the dashboard.
2. Format case details (court name, case number, filing date) as list items.
3. Add a manual verification checkbox to let underwriters override false-positives.

### 🧪 Acceptance Criteria:
- Litigation details are displayed in a clean, list format.
- Toggling the manual override updates the frontend UI state."
```

### 📋 Backend (OSINT Endpoint)
```text
/linear create "[BE-W4] Build OSINT web-research API Endpoint" -d "### 🎯 Objective:
Create the backend route that initiates corporate litigation crawls across public indices.

### 🛠️ Key Deliverables:
1. Create the `POST /api/v1/research/web-research` endpoint in `research.py`.
2. Connect the route to the `realtime_intelligence.py` scraping service.
3. Save litigation search results to the SQLite and Supabase tables.

### 🧪 Acceptance Criteria:
- The API completes litigation checks and returns court indices in JSON format."
```

### 📋 AI/ML (OSINT Scraper)
```text
/linear create "[AI-W4] Code Litigation Scraper & Entity Filter" -d "### 🎯 Objective:
Develop the search query generator and entity extraction filters to identify legal filings against a company.

### 🛠️ Key Deliverables:
1. Build a search query parser using `duckduckgo_search` to target judicial sites.
2. Implement NLP-based name-matching filters to verify cases are against the target company.
3. Structure the output into a clean list of active/resolved cases.

### 🧪 Acceptance Criteria:
- Scraper returns only verified legal filings.
- Filters out false-positives for companies with similar names."
```

### 📋 QA/Testing (OSINT Audits)
```text
/linear create "[QA-W4] Test Litigation Crawler under Scraper Limits" -d "### 🎯 Objective:
Test the crawler under heavy rate-limiting and verify error boundaries.

### 🛠️ Key Deliverables:
1. Write tests simulating search engine blocks (429 Too Many Requests).
2. Verify that the API falls back to a clean empty state instead of raising a 500 error.
3. Check memory usage of the scraping thread.

### 🧪 Acceptance Criteria:
- API remains stable even when search engine blocks requests."
```

---

## 📅 SPRINT 5: Multi-Agent 5-Cs (Week 5)

### 📋 Frontend (5-Cs UI)
```text
/linear create "[FE-W5] Design 5-Cs Risk Analysis Dashboard" -d "### 🎯 Objective:
Integrate the 5-Cs (Character, Capacity, Capital, Collateral, Conditions) report layout on the main dashboard view.

### 🛠️ Key Deliverables:
1. Create a tabbed interface or scrollable view for the 5-Cs in `EngineView.jsx`.
2. Display the overall Credit Rating Score out of 100 on a circular progress indicator.
3. Design a Decision Card representing: APPROVED (Green), REJECTED (Red), or MANUAL REVIEW (Yellow) with complete rationale.

### 🧪 Acceptance Criteria:
- Dashboard renders the 5-Cs paragraphs and the final score dynamically."
```

### 📋 Backend (CAM Router)
```text
/linear create "[BE-W5] Build CAM Compilation API Router" -d "### 🎯 Objective:
Implement the central endpoint to generate and save Credit Appraisal Memos (CAM).

### 🛠️ Key Deliverables:
1. Create the `POST /api/v1/reports/generate-cam` endpoint in `reports.py`.
2. Integrate the CAM compiler with the SQLite and Supabase database handlers.
3. Implement `PUT /api/v1/reports/status` to allow credit officers to manually approve or reject applications.

### 🧪 Acceptance Criteria:
- API successfully logs final decision state changes to the database."
```

### 📋 AI/ML (CAM Synthesis Prompts)
```text
/linear create "[AI-W5] Code Multi-Agent 5-Cs Synthesis Prompt" -d "### 🎯 Objective:
Develop the LLM prompt templates and structured JSON parser in `cam_generator.py` to compile the final credit report.

### 🛠️ Key Deliverables:
1. Implement the `CreditAppraisalMemo` Pydantic model.
2. Structure system prompts to evaluate the 5-Cs based on the extracted PDF metrics, GSTR correlation, and litigation history.
3. Code the final underwriting decision rules (Approve/Reject/Review thresholds).

### 🧪 Acceptance Criteria:
- LLM outputs clean, validated JSON with no markdown formatting.
- Automatically rejects or flags the application if severe default/forgery is found."
```

### 📋 QA/Testing (CAM Boundaries)
```text
/linear create "[QA-W5] Write Underwriting Decision Boundary Tests" -d "### 🎯 Objective:
Write automated tests verifying that the underwriting logic correctly applies the score thresholds.

### 🛠️ Key Deliverables:
1. Write tests with border scores (e.g. 59, 60, 74, 75).
2. Verify that Current Ratio < 1.0 triggers a 'MANUAL REVIEW' decision.
3. Validate that missing financial fields force a review fallback.

### 🧪 Acceptance Criteria:
- All logic checks pass."
```

---

## 📅 SPRINT 6: Reports & History (Week 6)

### 📋 Frontend (History & PDF)
```text
/linear create "[FE-W6] Integrate PDF Report Generator and History View" -d "### 🎯 Objective:
Enable underwriters to download the final CAM PDF and browse previous applications in a search grid.

### 🛠️ Key Deliverables:
1. Connect `generatePdf.js` to the final CAM state.
2. Build the 'Appraisal History' view showing previous evaluations fetched from the backend.
3. Implement search-by-company-name on the History grid.

### 🧪 Acceptance Criteria:
- Clicking 'Download PDF' prints a clean, print-formatted memo.
- Navigating to History displays correct database entries."
```

### 📋 Backend (History Endpoint)
```text
/linear create "[BE-W6] Build History Retrieval API" -d "### 🎯 Objective:
Create endpoints to query, search, and page through previous appraisal records.

### 🛠️ Key Deliverables:
1. Create `GET /api/v1/history/recent` with pagination parameters (limit, offset).
2. Set up SQLite and Supabase queries to retrieve details.
3. Optimize query retrieval speeds.

### 🧪 Acceptance Criteria:
- API successfully returns paginated appraisal history records."
```

### 📋 AI/ML (Sector Classification)
```text
/linear create "[AI-W6] Code Sector Classification Classifier" -d "### 🎯 Objective:
Add an NLP classification helper to categorize the company's sector based on raw document texts.

### 🛠️ Key Deliverables:
1. Write a prompt to classify raw text into 1 of 12 standard sectors (e.g., Manufacturing, Renewable Energy, Tech).
2. Validate output classifications against 10 test documents.

### 🧪 Acceptance Criteria:
- Sector classification is accurate and returned in the ingestion response."
```

### 📋 QA/Testing (PDF Audits)
```text
/linear create "[QA-W6] Test PDF Generation Formatting and Data Invariance" -d "### 🎯 Objective:
Verify that the downloaded PDF matches the data displayed on the dashboard.

### 🧪 Acceptance Criteria:
- Assert that there is zero difference between PDF fields and database records."
```

---

## 📅 SPRINT 7: Analytics Dashboard (Week 7)

### 📋 Frontend (Recharts Trends)
```text
/linear create "[FE-W7] Integrate Recharts Revenue & Debt Trends" -d "### 🎯 Objective:
Embed line charts and heatmaps to visualize the borrower's financial trends.

### 🛠️ Key Deliverables:
1. Install Recharts inside the frontend module.
2. Build line charts representing 3-year revenue and debt trends from `detectedParams`.
3. Ensure calculations are derived dynamically.

### 🧪 Acceptance Criteria:
- Displays 3-year revenue and debt trends on line charts.
- Resizes responsively on window resize."
```

### 📋 Backend (Financial Ratios)
```text
/linear create "[BE-W7] Build Financial Ratios Calculations Router" -d "### 🎯 Objective:
Create backend helpers to compute key financial ratios (DSCR, Quick Ratio, Debt-to-Equity).

### 🛠️ Key Deliverables:
1. Add financial ratios logic to `analysis.py`.
2. Compute DSCR using operating income and debt service parameters.

### 🧪 Acceptance Criteria:
- API outputs ratios with correct decimal rounding."
```

### 📋 AI/ML (Risk Benchmarks)
```text
/linear create "[AI-W7] Refine Sector-Risk Benchmark prompts" -d "### 🎯 Objective:
Optimize prompts to evaluate macroeconomic risk factors based on the classified sector.

### 🧪 Acceptance Criteria:
- Returns sector risk context (high/medium/low headwinds) dynamically."
```

### 📋 QA/Testing (Ratios Audits)
```text
/linear create "[QA-W7] Audit Calculation Logic for Financial Ratios" -d "### 🎯 Objective:
Verify calculations against manually audited balance sheet examples.

### 🧪 Acceptance Criteria:
- Outputs match human calculations."
```

---

## 📅 SPRINT 8: Production Deployment (Week 8)

### 📋 Frontend (Production Deploy)
```text
/linear create "[FE-W8] Setup Production Build & Netlify Configuration" -d "### 🎯 Objective:
Configure environment variables and deploy the frontend production build.

### 🛠️ Key Deliverables:
1. Run `npm run build` and resolve all TypeScript/React warnings.
2. Bind Netlify environment parameters (`VITE_API_URL`) to staging.

### 🧪 Acceptance Criteria:
- Build completes with no warnings or errors.
- Netlify deploys successfully."
```

### 📋 Backend (Staging Server)
```text
/linear create "[BE-W8] Setup Staging Deployment & DB Sync Job" -d "### 🎯 Objective:
Deploy the FastAPI backend to a hosting provider and configure database syncing.

### 🛠️ Key Deliverables:
1. Package backend in Docker and deploy to staging.
2. Setup environment variables (`GROQ_API_KEY`, `SUPABASE_URL`).

### 🧪 Acceptance Criteria:
- Backend connects to Supabase database."
```

### 📋 AI/ML (Rate Limit Calibrations)
```text
/linear create "[AI-W8] Calibrate Prompt Cache & Rate Limits" -d "### 🎯 Objective:
Optimize API token consumption and request caching.

### 🧪 Acceptance Criteria:
- Prompt latency drops by more than 20%."
```

### 📋 QA/Testing (Load Tests)
```text
/linear create "[QA-W8] Run Locust Load & Stress Tests" -d "### 🎯 Objective:
Perform load testing to check API behavior under concurrent file uploads.

### 🧪 Acceptance Criteria:
- No requests fail at 10 concurrent uploads."
```
