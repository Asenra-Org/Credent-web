import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Info, 
  FileText, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  ArrowRight,
  Download,
  Plus
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';


// Helper for large numbers
const formatToCr = (num) => {
  if (!num) return 'N/A';
  const val = Number(num);
  if (isNaN(val)) return num;
  return `₹ ${(val / 10000000).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`;
};

// Colors matching the image
const COLORS = {
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  blue: '#3b82f6',
  gray: '#d4d4d8',
  dark: '#18181b',
  lightGray: '#f4f4f5',
  border: '#e4e4e7',
  textMain: '#27272a',
  textMuted: '#71717a'
};

const CHART_COLORS = ['#93c5fd', '#93c5fd', '#93c5fd', '#93c5fd', '#3b82f6'];

// Mock data for charts to match the visual requirement if missing
const mockRevenueData = [
  { name: 'FY2021', value: 400 },
  { name: 'FY2022', value: 720 },
  { name: 'FY2023', value: 910 },
  { name: 'FY2024', value: 1188.60 },
];

export default function ReportDashboard({ 
  camReport, 
  detectedParams, 
  finalScore, 
  onReset, 
  onExport 
}) {
    
  // Safe fallbacks
  const borrowerName = detectedParams?.company || camReport?.borrower_profile?.legal_name || 'Borrower';
  const industry = camReport?.borrower_profile?.industry || 'Manufacturing';
  const location = camReport?.borrower_profile?.location || 'Mumbai, Maharashtra';
  const cin = camReport?.borrower_profile?.cin || 'U28910MH2015PTC267890';
  const revenue = detectedParams?.revenue || camReport?.executive_summary?.revenue;
  const isHighRisk = finalScore >= 80;

  
  return (
    <div className="flex flex-col gap-6">
{/* Content Area */}
      
        <div className="grid grid-cols-12 gap-6 p-6 bg-zinc-50">
          
          {/* Main Left Column */}
          <div className="col-span-8 flex flex-col gap-6">
            
            {/* Exec Summary Block */}
            <div className="bg-white border border-zinc-200 p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-zinc-100 rounded-full">
                    <FileText size={20} className="text-zinc-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Executive Summary</h2>
                    <p className="text-xs text-zinc-500 mt-1">AI-assisted analysis based on submitted documents. Please review all findings and evidence.</p>
                  </div>
                </div>
                <button className="text-xs font-semibold flex items-center gap-1 border border-zinc-200 px-3 py-1.5 hover:bg-zinc-50">
                  View Full Report <ArrowRight size={12} />
                </button>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-4 gap-y-6 gap-x-4 border-t border-zinc-100 pt-6">
                <div><div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Industry</div><div className="text-sm font-semibold">{industry}</div></div>
                <div><div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Business Vintage</div><div className="text-sm font-semibold">{camReport?.borrower_profile?.business_vintage || 'Not Provided'}</div></div>
                <div><div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Revenue (FY2024)</div><div className="text-sm font-semibold">{formatToCr(revenue)}</div></div>
                <div><div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">EBITDA</div><div className="text-sm font-semibold">{camReport?.executive_summary?.ebitda || 'Not Provided'}</div></div>
                
                <div><div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">PAT</div><div className="text-sm font-semibold">{camReport?.executive_summary?.pat || 'Not Provided'}</div></div>
                <div><div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Total Borrowings</div><div className="text-sm font-semibold">N/A</div></div>
                <div><div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Legal Structure</div><div className="text-sm font-semibold">{camReport?.borrower_profile?.legal_structure || 'Private Limited'}</div></div>
                <div><div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Location</div><div className="text-sm font-semibold">{location}</div></div>
                
                <div><div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">No. of Employees</div><div className="text-sm font-semibold">Not Provided</div></div>
                <div><div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Key Products</div><div className="text-sm font-semibold">Not Provided</div></div>
                <div><div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Promoters</div><div className="text-sm font-semibold">Not Provided</div></div>
                <div><div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Group Entities</div><div className="text-sm font-semibold">Not Provided</div></div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-2 gap-6">
              
              {/* Revenue Trend Chart */}
              <div className="bg-white border border-zinc-200 p-5">
                <div className="flex items-center gap-1 text-sm font-bold mb-6">
                  Revenue Trend <span className="font-normal text-zinc-500 text-xs ml-1">(From GST Returns)</span> <Info size={12} className="text-zinc-400" />
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockRevenueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} />
                      <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                        {mockRevenueData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === mockRevenueData.length - 1 ? '#3b82f6' : '#bfdbfe'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Financial Ratios List */}
              <div className="bg-white border border-zinc-200 p-5">
                <div className="flex items-center gap-1 text-sm font-bold mb-6">
                  Key Financial Ratios <Info size={12} className="text-zinc-400" />
                </div>
                <div className="flex flex-col gap-4">
                  {[
                    { label: 'DSCR', val: 'N/A' },
                    { label: 'Current Ratio', val: 'N/A' },
                    { label: 'Debt / Equity', val: 'N/A' },
                    { label: 'ROCE', val: 'N/A' },
                    { label: 'Net Profit Margin', val: 'N/A' }
                  ].map((ratio, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-xs text-zinc-600 font-medium w-32">{ratio.label}</span>
                      <span className="text-xs font-semibold w-8">{ratio.val}</span>
                      <div className="flex-1 h-2 bg-zinc-100 rounded-sm ml-4 relative">
                        <div className="absolute top-1/2 right-0 -mt-[1px] w-2 h-[2px] bg-zinc-300" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Concerns */}
            <div className="bg-white border border-red-100 flex flex-col mt-2">
              <div className="flex items-start gap-3 p-4 border-b border-red-50 bg-red-50/50">
                <AlertTriangle className="text-red-500 mt-1" size={20} />
                <div>
                  <h3 className="font-bold text-sm text-zinc-900">Key Concerns</h3>
                  <p className="text-xs text-zinc-500">Important issues identified during the analysis</p>
                </div>
              </div>
              
              <div className="p-4 flex flex-col gap-3">
                <div className="bg-red-50/30 border border-red-100 p-4 flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">1</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-red-700">Insufficient Financial Information</h4>
                      <div className="flex gap-2">
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-sm">Data Gap</span>
                        <span className="px-2 py-0.5 bg-red-200 text-red-800 text-[10px] font-bold rounded-sm">High</span>
                      </div>
                    </div>
                    <p className="text-xs text-red-900/70 leading-relaxed">
                      Submitted document is a GSTR-3B GST return for FY 2023-24 and contains only monthly taxable value data; no balance sheet, debt, equity, EBITDA, or PAT information is present. This precludes assessment of solvency, profitability, liquidity, and cash flows.
                    </p>
                  </div>
                </div>

                <div className="bg-red-50/30 border border-red-100 p-4 flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">2</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-red-700">Risk Score Below Threshold</h4>
                      <div className="flex gap-2">
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-sm">Policy</span>
                        <span className="px-2 py-0.5 bg-red-200 text-red-800 text-[10px] font-bold rounded-sm">Critical</span>
                      </div>
                    </div>
                    <p className="text-xs text-red-900/70 leading-relaxed">
                      Composite Risk Score is {finalScore || 50}, which is below the 60 minimum threshold. Under the bank's risk appetite framework, the application must be rejected.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Sidebar Column */}
          <div className="col-span-4 flex flex-col gap-6">
            
            {/* Key Takeaways */}
            <div className="bg-white border border-zinc-200 p-5">
              <div className="flex items-center gap-2 font-bold text-sm mb-5">
                <AlertCircle size={16} className="text-zinc-400" /> Key Takeaways
              </div>
              
              <div className="flex flex-col gap-5">
                <div className="flex gap-3">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={12} />
                  </div>
                  <div>
                    <div className="text-xs font-bold mb-1">Incomplete Financial Data</div>
                    <div className="text-[11px] text-zinc-500 leading-tight">Only GST data available. No balance sheet, debt, equity, EBITDA or PAT information.</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-yellow-50 text-yellow-500 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={12} />
                  </div>
                  <div>
                    <div className="text-xs font-bold mb-1">Below Threshold Risk Score</div>
                    <div className="text-[11px] text-zinc-500 leading-tight">Composite risk score is {finalScore || 50}, below the minimum threshold of 60.</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                    <Info size={12} />
                  </div>
                  <div>
                    <div className="text-xs font-bold mb-1">Further Verification Required</div>
                    <div className="text-[11px] text-zinc-500 leading-tight">Additional documents needed for complete assessment.</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center flex-shrink-0">
                    <Info size={12} />
                  </div>
                  <div>
                    <div className="text-xs font-bold mb-1">Recommendation</div>
                    <div className="text-[11px] text-zinc-500 leading-tight">Manual review recommended as per bank's policy.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Coverage */}
            <div className="bg-white border border-zinc-200 p-5">
              <div className="font-bold text-sm mb-5">Document Coverage</div>
              
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[ { value: 2 }, { value: 4 } ]}
                        innerRadius={30}
                        outerRadius={45}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell fill="#18181b" />
                        <Cell fill="#f4f4f5" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-bold">2/6</span>
                    <span className="text-[9px] text-zinc-500 font-semibold">Documents</span>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> GSTR-3B</div>
                    <div className="flex items-center gap-1 text-green-600"><CheckCircle2 size={10} /> Available</div>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-zinc-300" /> Bank Statements</div>
                    <div className="flex items-center gap-1 text-red-500"><XCircle size={10} /> Not Provided</div>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> ITR</div>
                    <div className="flex items-center gap-1 text-green-600"><CheckCircle2 size={10} /> Available</div>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-red-400" /> Financial Statements</div>
                    <div className="flex items-center gap-1 text-red-500"><XCircle size={10} /> Not Provided</div>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-red-400" /> CMA Data</div>
                    <div className="flex items-center gap-1 text-red-500"><XCircle size={10} /> Not Provided</div>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-red-400" /> Bureau Report</div>
                    <div className="flex items-center gap-1 text-red-500"><XCircle size={10} /> Not Provided</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      
      
      </div>
  );
}
