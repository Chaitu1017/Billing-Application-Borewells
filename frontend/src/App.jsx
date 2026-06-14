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
  Trash2,
  Droplets,
  Shield,
  Zap,
  BarChart3,
  Receipt,
  ChevronDown
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

// --- Landing Page Sub-Components ---

const WaterDropDecoration = () => (
  <>
    <div className="water-drop w-72 h-72 -top-20 -right-20 opacity-60 animate-float" style={{ animationDelay: '0s' }} />
    <div className="water-drop w-48 h-48 top-40 -left-10 opacity-40 animate-float" style={{ animationDelay: '2s' }} />
    <div className="water-drop w-32 h-32 bottom-20 right-20 opacity-30 animate-float" style={{ animationDelay: '4s' }} />
    <div className="water-drop w-24 h-24 top-60 right-1/3 opacity-20 animate-float" style={{ animationDelay: '1s' }} />
  </>
);

const getCurrentFinancialYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (month >= 3) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  }
  return `${year - 1}-${year.toString().slice(-2)}`;
};

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <div className={`stat-card glass-card rounded-2xl p-6 ${delay}`}>
    <div className="flex items-start justify-between mb-3">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-lg`}>
        <Icon size={22} className="text-white" />
      </div>
    </div>
    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-2xl font-extrabold text-slate-800">{value}</p>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
  <div className={`feature-card glass-card rounded-2xl p-6 text-center group cursor-default ${delay}`}>
    <div className="feature-icon w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg transition-transform duration-500">
      <Icon size={24} className="text-white" />
    </div>
    <h3 className="font-bold text-slate-800 text-base mb-2">{title}</h3>
    <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
  </div>
);

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

  const scrollToForm = () => {
    document.getElementById('billing-form-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 text-left">

      {step === 1 ? (
        /* ===================== REDESIGNED LANDING PAGE ===================== */
        <div className="min-h-screen">

          {/* ===== HERO SECTION ===== */}
          <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 animate-gradient">
            {/* Water drop decorations */}
            <WaterDropDecoration />
            
            {/* Subtle grid overlay */}
            <div className="absolute inset-0 water-bg opacity-30" />
            
            {/* Gradient accent orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-28">
              <div className="text-center">
                {/* GSTIN Badge */}
                <div className="animate-fade-in-up inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8">
                  <Shield size={14} className="text-emerald-400" />
                  <span className="text-sm font-semibold text-indigo-200 tracking-wider">GSTIN: 37AMEPV3389H1ZG</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-400/15 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    ACTIVE
                  </span>
                </div>
                
                {/* Company Name */}
                <h1 className="animate-fade-in-up-delay-1 text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight mb-6">
                  SRI DURGA DEVI
                  <span className="block bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    BORE WELLS
                  </span>
                </h1>
                
                {/* Location */}
                <p className="animate-fade-in-up-delay-2 flex items-center justify-center gap-2 text-indigo-300/70 font-medium text-sm mb-6">
                  <MapPin size={14} />
                  BOBBILI, VIZIANAGARAM DIST.
                </p>
                
                {/* Tagline */}
                <p className="animate-fade-in-up-delay-2 text-lg md:text-xl text-indigo-200/80 font-medium max-w-2xl mx-auto leading-relaxed mb-10">
                  Generate GST-compliant borewell invoices in seconds.
                  <span className="block text-indigo-300/50 text-base mt-1">Professional billing management for your business.</span>
                </p>
                
                {/* Hero CTA */}
                <div className="animate-fade-in-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button 
                    onClick={scrollToForm} 
                    className="cta-button text-lg"
                    id="hero-cta-button"
                  >
                    <Receipt size={22} />
                    Start Billing Now
                    <ArrowRight size={20} className="ml-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom wave divider */}
            <div className="absolute bottom-0 left-0 right-0">
              <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                <path d="M0,64L48,58.7C96,53,192,43,288,48C384,53,480,75,576,80C672,85,768,75,864,64C960,53,1056,43,1152,42.7C1248,43,1344,53,1392,58.7L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="#f8fafc"/>
              </svg>
            </div>
          </section>

          {/* ===== STATS SECTION ===== */}
          <section className="relative bg-slate-50 py-16">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  icon={FileText}
                  label="Total Bills Generated"
                  value={config.startInvNum > 1 ? (parseInt(config.startInvNum) - 1).toString() : '0'}
                  color="bg-gradient-to-br from-indigo-500 to-indigo-700"
                  delay="animate-fade-in-up-delay-1"
                />
                <StatCard 
                  icon={Calendar}
                  label="Financial Year"
                  value={getCurrentFinancialYear()}
                  color="bg-gradient-to-br from-blue-500 to-blue-700"
                  delay="animate-fade-in-up-delay-2"
                />
                <StatCard 
                  icon={Hash}
                  label="Last Bill Number"
                  value={`#${parseInt(config.startInvNum) > 1 ? parseInt(config.startInvNum) - 1 : '—'}`}
                  color="bg-gradient-to-br from-violet-500 to-violet-700"
                  delay="animate-fade-in-up-delay-3"
                />
                <StatCard 
                  icon={Shield}
                  label="GST Registered"
                  value={
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-emerald-600">Active</span>
                    </span>
                  }
                  color="bg-gradient-to-br from-emerald-500 to-emerald-700"
                  delay="animate-fade-in-up-delay-4"
                />
              </div>
            </div>
          </section>

          {/* ===== PRIMARY CTA + BILLING FORM SECTION ===== */}
          <section id="billing-form-section" className="relative bg-slate-50 pb-20 pt-4">
            <div className="max-w-7xl mx-auto px-6">
              
              {/* CTA Card */}
              <div className="animate-fade-in-up-delay-3 max-w-3xl mx-auto mb-16">
                <div className="animate-pulse-glow relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 p-10 md:p-14 text-center shadow-2xl">
                  {/* Decorative circles */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                  
                  <div className="relative z-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm mb-6">
                      <Zap size={32} className="text-yellow-300" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                      Start New Billing Session
                    </h2>
                    <p className="text-indigo-200/80 text-lg max-w-lg mx-auto mb-8 leading-relaxed">
                      Generate monthly GST invoices and export professional PDFs — ready for filing and distribution.
                    </p>
                    <button
                      onClick={scrollToForm}
                      className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:bg-indigo-50 transition-all duration-300 transform hover:-translate-y-0.5"
                      id="cta-start-billing"
                    >
                      <ChevronDown size={20} className="animate-bounce" />
                      Start Filling Bills
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Billing Form */}
              <div className="max-w-4xl mx-auto">
                <div className="glass-card rounded-3xl p-8 md:p-12 shadow-xl border border-indigo-100/50 animate-fade-in-up-delay-4">
                  {/* Form Header */}
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
                      <Layers size={22} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-extrabold text-slate-800">Configure Billing Session</h3>
                      <p className="text-slate-500 text-sm font-medium">Set up your monthly invoice batch details</p>
                    </div>
                  </div>

                  {/* Form Fields - 2 column responsive grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    {/* Month Select */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                        <Calendar size={14} className="text-indigo-500" />
                        Select Month
                      </label>
                      <select 
                        value={config.month}
                        onChange={(e) => setConfig({...config, month: e.target.value})}
                        className="landing-select"
                        id="landing-month-select"
                      >
                        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>

                    {/* Year */}
                    <div className="space-y-2">
                      <label htmlFor="landing-year" className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                        <Calendar size={14} className="text-indigo-500" />
                        Select Year
                      </label>
                      <input
                        id="landing-year"
                        type="number"
                        value={config.year}
                        onChange={(e) => setConfig({...config, year: e.target.value})}
                        className="landing-input"
                      />
                    </div>

                    {/* Number of Bills */}
                    <div className="space-y-2">
                      <label htmlFor="landing-num-bills" className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                        <Layers size={14} className="text-indigo-500" />
                        How Many Bills?
                      </label>
                      <input
                        id="landing-num-bills"
                        type="number"
                        value={config.numBills}
                        onChange={(e) => setConfig({...config, numBills: e.target.value})}
                        className="landing-input"
                      />
                    </div>

                    {/* Starting Bill Number */}
                    <div className="space-y-2">
                      <label htmlFor="landing-start-inv" className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                        <Hash size={14} className="text-indigo-500" />
                        Starting Bill Number
                      </label>
                      <input
                        id="landing-start-inv"
                        type="number"
                        value={config.startInvNum}
                        onChange={(e) => setConfig({...config, startInvNum: e.target.value})}
                        className="landing-input"
                      />
                    </div>
                  </div>

                  {/* Start Button */}
                  <div className="flex justify-center">
                    <button 
                      onClick={handleStartSetup}
                      className="cta-button"
                      id="start-filling-details-btn"
                    >
                      Start Filling Details 
                      <ArrowRight size={22} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===== FEATURES SECTION ===== */}
          <section className="bg-white py-20 water-bg">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-14 animate-fade-in-up">
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-4">
                  Everything You Need for
                  <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent"> GST Billing</span>
                </h2>
                <p className="text-slate-500 text-lg max-w-xl mx-auto">
                  Powerful features designed for borewell business invoicing
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <FeatureCard
                  icon={Receipt}
                  title="GST Invoice Generation"
                  description="Create GST-compliant invoices with automatic tax calculations and reverse charge support."
                  delay="animate-fade-in-up-delay-1"
                />
                <FeatureCard
                  icon={Download}
                  title="Instant PDF Export"
                  description="Export professional PDF invoices in one click — ready for printing and sharing."
                  delay="animate-fade-in-up-delay-2"
                />
                <FeatureCard
                  icon={Calendar}
                  title="Monthly Billing Management"
                  description="Organize invoices by month and year with batch processing capabilities."
                  delay="animate-fade-in-up-delay-3"
                />
                <FeatureCard
                  icon={BarChart3}
                  title="Sequential Bill Tracking"
                  description="Automatic sequential numbering ensures every invoice is tracked and accounted for."
                  delay="animate-fade-in-up-delay-4"
                />
              </div>
            </div>
          </section>

          {/* ===== FOOTER ===== */}
          <footer className="bg-slate-900 py-12">
            <div className="max-w-7xl mx-auto px-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                  <Droplets size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">SRI DURGA DEVI BORE WELLS</h3>
              </div>
              <p className="text-slate-400 text-sm font-medium mb-6">GST Invoice Management System</p>
              <div className="w-16 h-0.5 bg-indigo-500/40 mx-auto mb-6 rounded-full" />
              <p className="text-slate-500 text-xs">
                © {new Date().getFullYear()} Sri Durga Devi Bore Wells. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      ) : (
        /* ===================== STEP 2 — WIZARD (UNTOUCHED) ===================== */
        <div className="py-10 px-6">
          <div className="max-w-6xl mx-auto">

            {/* Flat Header */}
            <header className="border-b-2 border-slate-900 pb-6 mb-10">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900">SRI DURGA DEVI BORE WELLS</h1>
                <p className="text-slate-600 font-bold mt-1 uppercase tracking-wider">BOBBILI, VIZIANAGARAM DIST. | GSTIN: 37AMEPV3389H1ZG</p>
            </header>

            <div className="space-y-12">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <h3 className="text-2xl font-bold">Filling Bill {activeIdx + 1} of {invoices.length}</h3>
                <span className="text-xl font-bold text-blue-600 tracking-wider">INVOICE #{invoices[activeIdx]?.invoiceNumber}</span>
            </div>

            {/* Form Section */}
            <div className="space-y-6 max-w-4xl">
                <FlatInput 
                    label="Customer Name" 
                    value={invoices[activeIdx]?.customerName}
                    onChange={(v) => updateInvoice(activeIdx, 'customerName', v)}
                    id={`name-${activeIdx}`}
                />
                <div className="space-y-1">
                    <label className="text-lg font-bold text-slate-700 block">Address</label>
                    <textarea 
                        value={invoices[activeIdx]?.customerAddress}
                        onChange={(e) => updateInvoice(activeIdx, 'customerAddress', e.target.value)}
                        className="w-full min-h-[100px] p-4 text-lg bg-white border-2 border-slate-300 focus:border-blue-600 outline-none font-bold"
                    />
                </div>
                <FlatInput 
                    label="Date" 
                    type="date"
                    value={invoices[activeIdx]?.date}
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
                            {invoices[activeIdx]?.items.map((item, i) => (
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
                        {invoices[activeIdx]?.taxSection.amountInWords}
                    </p>
                </div>
                
                <div className="md:w-1/2 border-2 border-slate-900 p-6 bg-slate-50">
                    <div className="space-y-4 font-bold">
                        <div className="flex justify-between text-xl border-b border-slate-300 pb-2">
                            <span>TOTAL</span>
                            <span>₹ {invoices[activeIdx]?.taxSection.grandTotal}</span>
                        </div>
                        <div className="space-y-2 text-lg">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Taxable Value</span>
                                <span>{invoices[activeIdx]?.taxSection.taxableValue}</span>
                            </div>
                            <div className="flex justify-between text-blue-700">
                                <span>Reverse Charge @ GST (18%)</span>
                                <span>₹ {invoices[activeIdx]?.taxSection.reverseCharge}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">SGST @ 9%</span>
                                <span>{invoices[activeIdx]?.taxSection.sgst}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">CGST @ 9%</span>
                                <span>{invoices[activeIdx]?.taxSection.cgst}</span>
                            </div>
                        </div>
                        <div className="flex justify-between text-2xl border-t-2 border-slate-900 pt-4 font-black">
                            <span>FINAL TOTAL</span>
                            <span>₹ {invoices[activeIdx]?.taxSection.grandTotal}</span>
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
        </div>
      </div>
      )}
    </div>
  );
};

export default App;
