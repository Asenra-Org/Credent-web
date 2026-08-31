import re

content = open('src/components/LandingPage.jsx', encoding='utf-8').read()

new_section = '''
        {/* --- ROI Case Study Section --- */}
        <section className="w-full bg-white border-y border-gray-200 mt-24 relative z-10">
          <div className="max-w-7xl mx-auto divide-y divide-gray-200">
            {/* Header */}
            <div className="p-12 md:p-16 flex flex-col items-center text-center">
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-4">
                ROI CASE STUDY: SME UNDERWRITING
              </span>
              <h2 className="text-3xl md:text-5xl font-light tracking-tight text-zinc-900 mb-6">
                Redefining the Velocity of Credit
              </h2>
              <p className="text-zinc-600 max-w-2xl text-sm leading-relaxed">
                Traditional manual underwriting for SME loans is highly labor-intensive, fragmented, and prone to bottlenecks. Credent condenses the entire end-to-end process into minutes, eliminating human fatigue and subjectivity.
              </p>
            </div>

            {/* TAT Comparison Table */}
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200 bg-gray-50">
              <div className="p-8 flex flex-col justify-center">
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Public Sector Banks</span>
                <span className="text-xl text-zinc-900 font-medium">8 to 45 Days</span>
              </div>
              <div className="p-8 flex flex-col justify-center">
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Private Sector Banks</span>
                <span className="text-xl text-zinc-900 font-medium">5 to 10 Days</span>
              </div>
              <div className="p-8 flex flex-col justify-center">
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Digital NBFCs</span>
                <span className="text-xl text-zinc-900 font-medium">24 to 72 Hours</span>
              </div>
              <div className="p-8 flex flex-col justify-center bg-zinc-900 text-white">
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-2">Credent AI Engine</span>
                <span className="text-2xl text-white font-semibold">20-25 Minutes</span>
              </div>
            </div>

            {/* Deep Dive Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
              
              {/* Manual Process */}
              <div className="p-10 md:p-16">
                <h3 className="text-lg font-medium text-zinc-900 mb-8 flex items-center justify-between">
                  <span>Traditional Manual Underwriting</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 border border-gray-200 px-2 py-1 bg-white">24-40 Hrs Active Work</span>
                </h3>
                <ul className="space-y-6">
                  {[
                    { title: "Data Entry & Spreading (1-2 Days)", desc: "Manually re-keying balance sheets, P&L, and tax data into internal software." },
                    { title: "Ratio & Trend Analysis (1 Day)", desc: "Calculating current ratios, DSCR, and analyzing YoY trends manually." },
                    { title: "Qualitative Research (1 Day)", desc: "Checking MCA, GST, market position, and management background." },
                    { title: "Drafting CAM Report (1 Day)", desc: "Synthesizing findings into a subjective, manually formatted memo." }
                  ].map((item, i) => (
                    <li key={i} className="flex flex-col">
                      <span className="text-sm font-semibold text-zinc-900">{item.title}</span>
                      <span className="text-sm text-zinc-500 mt-1">{item.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Credent Advantage */}
              <div className="p-10 md:p-16 bg-white">
                <h3 className="text-lg font-medium text-zinc-900 mb-8 flex items-center justify-between">
                  <span>The Credent Advantage</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-700 border border-emerald-200 bg-emerald-50 px-2 py-1">99.5% TAT Reduction</span>
                </h3>
                <div className="space-y-8">
                  <div className="border-l-2 border-zinc-900 pl-4">
                    <h4 className="text-sm font-semibold text-zinc-900">Massive Cost Reduction (OpEx)</h4>
                    <p className="text-sm text-zinc-600 mt-2">Elevate highly skilled credit managers from data-entry clerks to strategic reviewers. Process 100x more loan applications without hiring 100x more underwriters.</p>
                  </div>
                  <div className="border-l-2 border-zinc-900 pl-4">
                    <h4 className="text-sm font-semibold text-zinc-900">Faster Time-to-Yes</h4>
                    <p className="text-sm text-zinc-600 mt-2">In SME lending, the first institution to issue a sanction letter wins the business. Reducing turnaround from 10 days to 25 minutes fundamentally increases conversion rates.</p>
                  </div>
                  <div className="border-l-2 border-zinc-900 pl-4">
                    <h4 className="text-sm font-semibold text-zinc-900">Standardized Risk Assessment</h4>
                    <p className="text-sm text-zinc-600 mt-2">Manual appraisals suffer from human fatigue. Credent applies the exact same rigorous analytical standard to file #1 and file #10,000.</p>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </section>

'''

target = "        <div style={{ height: '6rem' }} />\n      </div>\n    </div>\n  );\n}"
content = content.replace(target, new_section + target)

open('src/components/LandingPage.jsx', 'w', encoding='utf-8').write(content)
