import React, { useState, useEffect, useCallback, memo } from 'react';
import axios from 'axios';
import { 
  FileText, 
  Download, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight,
  Calendar,
  Layers,
  Hash,
  User,
  MapPin,
  CheckCircle2,
  Trash2
} from 'lucide-react';

// --- Constants & Utilities ---

const MATERIAL_OPTIONS = [
  "140mm pvc pipes 6gage isi Sudhakar",
  "140mm pvc pipes 6gage non-isi Sudhakar",
  "225mm pvc pipes 4gage isi Sudhakar",
  "180mm pvc pipes 6gage isi Sudhakar",
  "180mm pvc pipes sdr 38 Sudhakar",
  "250mm pvc pipes 4gage isi Sudhakar"
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    num = Math.floor(num);
    if (num === 0) return 'Zero Only';
    if (num.toString().length > 9) return 'Overflow';
    
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return (str.trim() + ' Only');
};

const calculateReverseGST = (items, igst = 0, roundOff = 0) => {
    const grandTotalRaw = items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    const grandTotal = Math.round(grandTotalRaw);
    
    // Reverse GST Formula: Total * 18 / 118
    const gstAmount = (18 * grandTotal) / 118;
    const taxableValue = grandTotal - gstAmount;
    const sgst = gstAmount / 2;
    const cgst = gstAmount / 2;
    const reverseCharge = gstAmount;

    return {
      taxableValue: taxableValue.toFixed(2),
      sgst: sgst.toFixed(2),
      cgst: cgst.toFixed(2),
      reverseCharge: reverseCharge.toFixed(2),
      igst: igst,
      roundOff: roundOff,
      grandTotal: grandTotal,
      amountInWords: numberToWords(grandTotal)
    };
};

// --- Flat UI Components ---

const FlatInput = memo(({ label, value, onChange, type = "text", id, fullWidth = true }) => (
  <div className="space-y-1">
    <label htmlFor={id} className="text-lg font-bold text-slate-700 block">{label}</label>
    <input 
      id={id}
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={`${fullWidth ? 'w-full' : 'w-64'} h-12 px-4 text-lg bg-white border-2 border-slate-300 focus:border-blue-600 outline-none transition-all font-bold`}
    />
  </div>
));

const App = () => {
  const [step, setStep] = useState(1); 
  const [config, setConfig] = useState({
    month: 'December',
    year: '2025',
    numBills: 1,
    startInvNum: 181
  });

  const [invoices, setInvoices] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleStartSetup = () => {
    const newInvoices = Array.from({ length: config.numBills }, (_, i) => ({
      id: crypto.randomUUID(),
      invoiceNumber: (parseInt(config.startInvNum) + i).toString(),
      date: new Date().toISOString().split('T')[0],
      customerName: '',
      customerAddress: '',
      items: Array.from({ length: 6 }, () => ({
        id: crypto.randomUUID(),
        description: '',
        hsn: '',
        quantity: 0,
        unitRate: 0,
        total: 0
      })),
      taxSection: calculateReverseGST([])
    }));
    setInvoices(newInvoices);
    setStep(2);
    setActiveIdx(0);
  };

  const updateInvoice = useCallback((idx, field, value) => {
    setInvoices(prev => {
        const next = [...prev];
        next[idx] = { ...next[idx], [field]: value };
        return next;
    });
  }, []);

  const updateItem = useCallback((invIdx, itemIdx, field, value) => {
    setInvoices(prev => {
        const next = [...prev];
        const inv = { ...next[invIdx] };
        const items = [...inv.items];
        const item = { ...items[itemIdx], [field]: value };
        
        if (field === 'quantity' || field === 'unitRate') {
            const q = parseFloat(item.quantity) || 0;
            const r = parseFloat(item.unitRate) || 0;
            item.total = (q * r).toFixed(2);
        }
        
        items[itemIdx] = item;
        inv.items = items;
        inv.taxSection = calculateReverseGST(items, inv.taxSection.igst, inv.taxSection.roundOff);
        next[invIdx] = inv;
        return next;
    });
  }, []);

  const generatePDF = async () => {
    setLoading(true);
    try {
      const preparedInvoices = invoices.map(inv => ({
        ...inv,
        monthYear: `${config.month} ${config.year}`,
        ...inv.taxSection,
        items: inv.items.map((it, i) => ({ ...it, sno: i + 1 }))
      }));

      const response = await axios.post('http://localhost:5000/api/generate-pdf', {
        invoices: preparedInvoices
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Batch_${config.month}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      alert("Error generating PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-10 px-6 font-sans text-slate-900 text-left">
      <div className="max-w-6xl mx-auto">
        
        {/* Flat Header */}
        <header className="border-b-2 border-slate-900 pb-6 mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">SRI DURGA DEVI BORE WELLS</h1>
            <p className="text-slate-600 font-bold mt-1 uppercase tracking-wider">BOBBILI, VIZIANAGARAM DIST. | GSTIN: 37AMEPV3389H1ZG</p>
        </header>

        {step === 1 ? (
          /* --- SETUP STEP --- */
          <div className="space-y-10">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">New Billing Session</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                    <div className="space-y-1">
                        <label className="text-lg font-bold text-slate-700 block">Which month?</label>
                        <select 
                            value={config.month}
                            onChange={(e) => setConfig({...config, month: e.target.value})}
                            className="w-full h-12 px-4 bg-white border-2 border-slate-300 focus:border-blue-600 outline-none font-bold"
                        >
                            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <FlatInput label="Select year" value={config.year} onChange={(v) => setConfig({...config, year: v})} type="number" id="cfg-year" />
                    <FlatInput label="How many bills?" value={config.numBills} onChange={(v) => setConfig({...config, numBills: v})} type="number" id="cfg-count" />
                    <FlatInput label="Starting bill number" value={config.startInvNum} onChange={(v) => setConfig({...config, startInvNum: v})} type="number" id="cfg-start" />
                </div>
            </div>

            <button 
                onClick={handleStartSetup}
                className="h-16 px-10 bg-blue-600 text-white font-bold text-xl hover:bg-blue-700 transition-all flex items-center gap-4"
            >
                Start Filling Details <ArrowRight size={24} />
            </button>
          </div>
        ) : (
          /* --- WIZARD STEPS --- */
          <div className="space-y-12">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <h3 className="text-2xl font-bold">Filling Bill {activeIdx + 1} of {invoices.length}</h3>
                <span className="text-xl font-bold text-blue-600 tracking-wider">INVOICE #{invoices[activeIdx].invoiceNumber}</span>
            </div>

            {/* Form Section */}
            <div className="space-y-6 max-w-4xl">
                <FlatInput 
                    label="Customer Name" 
                    value={invoices[activeIdx].customerName}
                    onChange={(v) => updateInvoice(activeIdx, 'customerName', v)}
                    id={`name-${activeIdx}`}
                />
                <div className="space-y-1">
                    <label className="text-lg font-bold text-slate-700 block">Address</label>
                    <textarea 
                        value={invoices[activeIdx].customerAddress}
                        onChange={(e) => updateInvoice(activeIdx, 'customerAddress', e.target.value)}
                        className="w-full min-h-[100px] p-4 text-lg bg-white border-2 border-slate-300 focus:border-blue-600 outline-none font-bold"
                    />
                </div>
                <FlatInput 
                    label="Date" 
                    type="date"
                    value={invoices[activeIdx].date}
                    onChange={(v) => updateInvoice(activeIdx, 'date', v)}
                    id={`date-${activeIdx}`}
                />
            </div>

            {/* Items Table Grid */}
            <div className="space-y-4">
                <h4 className="text-2xl font-bold border-l-4 border-slate-900 pl-3">Items Entry</h4>
                <div className="overflow-x-auto border-2 border-slate-900">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 border-b-2 border-slate-900 font-bold uppercase text-sm">
                            <tr>
                                <th className="p-3 border-r border-slate-300 w-16 text-center">S.No</th>
                                <th className="p-3 border-r border-slate-300">Description</th>
                                <th className="p-3 border-r border-slate-300 w-24 text-center">HSN</th>
                                <th className="p-3 border-r border-slate-300 w-32 text-center">Qty</th>
                                <th className="p-3 border-r border-slate-300 w-32 text-center">Rate</th>
                                <th className="p-3 text-right w-32">Amt</th>
                            </tr>
                        </thead>
                        <tbody className="font-bold">
                            {invoices[activeIdx].items.map((item, i) => (
                                <tr key={item.id} className="border-b border-slate-300">
                                    <td className="p-2 border-r border-slate-300 text-center">{i + 1}</td>
                                    <td className="p-2 border-r border-slate-300">
                                        <select 
                                            value={item.description}
                                            onChange={(e) => updateItem(activeIdx, i, 'description', e.target.value)}
                                            className="w-full h-10 px-2 bg-transparent outline-none"
                                        >
                                            <option value="">Select pipe type...</option>
                                            {MATERIAL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-2 border-r border-slate-300 text-center text-slate-500"></td>
                                    <td className="p-2 border-r border-slate-300 text-center">
                                        <input 
                                            type="number" 
                                            value={item.quantity || ''}
                                            onChange={(e) => updateItem(activeIdx, i, 'quantity', e.target.value)}
                                            className="w-full h-10 text-center bg-transparent outline-none"
                                        />
                                    </td>
                                    <td className="p-2 border-r border-slate-300 text-center">
                                        <input 
                                            type="number" 
                                            value={item.unitRate || ''}
                                            onChange={(e) => updateItem(activeIdx, i, 'unitRate', e.target.value)}
                                            className="w-full h-10 text-center bg-transparent outline-none"
                                        />
                                    </td>
                                    <td className="p-2 text-right">{item.total > 0 ? item.total : '0.00'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Split Summary View */}
            <div className="flex flex-col md:flex-row justify-between gap-10 py-8 border-t-2 border-slate-900">
                <div className="md:w-1/2 space-y-2">
                    <h5 className="text-lg font-bold text-slate-500 uppercase tracking-widest">Amount in Words:</h5>
                    <p className="text-2xl font-bold italic text-slate-800 leading-tight">
                        {invoices[activeIdx].taxSection.amountInWords}
                    </p>
                </div>
                
                <div className="md:w-1/2 border-2 border-slate-900 p-6 bg-slate-50">
                    <div className="space-y-4 font-bold">
                        <div className="flex justify-between text-xl border-b border-slate-300 pb-2">
                            <span>TOTAL</span>
                            <span>₹ {invoices[activeIdx].taxSection.grandTotal}</span>
                        </div>
                        <div className="space-y-2 text-lg">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Taxable Value</span>
                                <span>{invoices[activeIdx].taxSection.taxableValue}</span>
                            </div>
                            <div className="flex justify-between text-blue-700">
                                <span>Reverse Charge @ GST (18%)</span>
                                <span>₹ {invoices[activeIdx].taxSection.reverseCharge}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">SGST @ 9%</span>
                                <span>{invoices[activeIdx].taxSection.sgst}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">CGST @ 9%</span>
                                <span>{invoices[activeIdx].taxSection.cgst}</span>
                            </div>
                        </div>
                        <div className="flex justify-between text-2xl border-t-2 border-slate-900 pt-4 font-black">
                            <span>FINAL TOTAL</span>
                            <span>₹ {invoices[activeIdx].taxSection.grandTotal}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="flex flex-col md:flex-row gap-6 justify-end">
                {activeIdx > 0 && (
                    <button 
                        onClick={() => setActiveIdx(activeIdx - 1)}
                        className="h-14 px-8 border-2 border-slate-900 font-bold hover:bg-slate-100 transition-all flex items-center gap-2"
                    >
                        <ChevronLeft size={20} /> Previous
                    </button>
                )}
                
                {activeIdx < invoices.length - 1 ? (
                    <button 
                        onClick={() => setActiveIdx(activeIdx + 1)}
                        className="h-14 px-10 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                        Next Bill <ChevronRight size={20} />
                    </button>
                ) : (
                    <button 
                        onClick={generatePDF}
                        disabled={loading}
                        className="h-14 px-12 bg-green-600 text-white font-bold hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} />}
                        GENERATE FINAL PDF
                    </button>
                )}
                <button 
                    onClick={() => setStep(1)} 
                    className="h-14 px-6 text-red-600 font-bold hover:bg-red-50 flex items-center gap-1"
                >
                    <Trash2 size={16} /> Cancel
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
