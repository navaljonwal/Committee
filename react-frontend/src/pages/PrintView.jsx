import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import api from '../api/client';

export default function PrintView() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await api.get(`/committees/${id}`);
        if (res.data.success) {
          setData(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Preparing print view...</div>;
  }

  if (!data || !data.committee) {
    return <div className="p-8 text-center text-rose-400">Committee not found.</div>;
  }

  const { committee, schedules, totals } = data;

  return (
    <div className="bg-white text-black min-h-screen p-8 print:p-0">
      
      {/* Print Trigger Floating Toolbar */}
      <div className="no-print max-w-4xl mx-auto mb-6 flex items-center justify-between bg-white border border-slate-200 shadow-sm text-slate-900 p-4 rounded-2xl">
        <Link to={`/committees/${id}`} className="text-xs font-semibold text-slate-500 hover:text-orange-600 flex items-center gap-1 transition">
          <ArrowLeft className="w-4 h-4" /> Return to Committee
        </Link>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-600/20 active:scale-[0.98] transition"
        >
          <Printer className="w-4 h-4" /> Print Document (A4)
        </button>
      </div>

      {/* Printable Sheet */}
      <div className="max-w-4xl mx-auto bg-white p-6 border print:border-none">
        
        {/* Document Header */}
        <div className="border-b-2 border-black pb-4 mb-4 text-center">
          <h1 className="text-2xl font-black uppercase tracking-wider">
            {committee.name}
          </h1>
          <p className="text-xs font-medium text-gray-600 mt-1">
            OFFICIAL CHITFUND / KAMETI REPAYMENT & PAYOUT MATRIX
          </p>
        </div>

        {/* Scheme Parameters Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mb-6 border p-3 rounded bg-gray-50">
          <div>
            <span className="text-gray-500 block">Total Pool Value (V):</span>
            <strong className="font-mono text-sm">₹{parseFloat(committee.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </div>
          <div>
            <span className="text-gray-500 block">Total Rounds (M):</span>
            <strong className="text-sm">{committee.total_members} Months</strong>
          </div>
          <div>
            <span className="text-gray-500 block">Deduction Rate (R):</span>
            <strong className="text-sm">{committee.deduction_rate}%</strong>
          </div>
          <div>
            <span className="text-gray-500 block">Start Date:</span>
            <strong className="text-sm">
              {committee.start_date ? new Date(committee.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
            </strong>
          </div>
        </div>

        {/* Schedule Matrix */}
        <table className="w-full text-left text-xs border-collapse border border-gray-400">
          <thead>
            <tr className="bg-gray-200 border-b border-gray-400 font-bold">
              <th className="p-2 border-r border-gray-400">Month</th>
              <th className="p-2 border-r border-gray-400 text-right">Deduction (INR)</th>
              <th className="p-2 border-r border-gray-400 text-right">Winner Payout (INR)</th>
              <th className="p-2 border-r border-gray-400 text-right">Monthly Kist (INR)</th>
              <th className="p-2 border-r border-gray-400">Winner</th>
              <th className="p-2 text-center">Draw Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300 font-mono">
            {schedules.map((s) => (
              <tr key={s.id}>
                <td className="p-2 border-r border-gray-400 font-sans font-bold">Month {s.month_no}</td>
                <td className="p-2 border-r border-gray-400 text-right">₹{parseFloat(s.deduction_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className="p-2 border-r border-gray-400 text-right font-bold">₹{parseFloat(s.net_payout).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className="p-2 border-r border-gray-400 text-right">₹{parseFloat(s.installment_per_member).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className="p-2 border-r border-gray-400 font-sans">{s.winner_name || '-'}</td>
                <td className="p-2 text-center font-sans">
                  {s.draw_date ? new Date(s.draw_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-200 border-t-2 border-black font-bold font-mono">
              <td className="p-2 border-r border-gray-400 font-sans">TOTALS</td>
              <td className="p-2 border-r border-gray-400 text-right">₹{totals.grand_total_deductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className="p-2 border-r border-gray-400 text-right">₹{totals.grand_total_net_payout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className="p-2 border-r border-gray-400 text-right">₹{totals.grand_total_kist_per_member.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td colSpan="2" className="p-2 text-center font-sans text-[10px]">VERIFIED & OFFICIAL RECORD</td>
            </tr>
          </tfoot>
        </table>

        {/* Signatures Footer */}
        <div className="grid grid-cols-2 gap-12 mt-16 text-center text-xs border-t pt-8">
          <div>
            <div className="border-t border-black w-48 mx-auto mb-1" />
            <span>Organizer Signature</span>
          </div>
          <div>
            <div className="border-t border-black w-48 mx-auto mb-1" />
            <span>Member Acknowledgement</span>
          </div>
        </div>

      </div>
    </div>
  );
}
