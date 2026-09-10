import React, { useState, useEffect } from 'react';
import { X, Download, ShieldCheck, Heart, Sparkles, CheckCircle2, FileText } from 'lucide-react';

interface InvoiceModalProps {
  bookingId: string;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ bookingId, onClose }) => {
  const [invoice, setInvoice] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/v1/bookings/${bookingId}/invoice`);
        if (res.ok) {
          const data = await res.json();
          setInvoice(data.invoice);
        }
      } catch (err) {
        console.error('Failed to load invoice:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [bookingId]);

  if (!bookingId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-stone-900 border border-stone-800 rounded-2xl max-w-lg w-full p-6 text-stone-100 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white p-2 rounded-lg hover:bg-stone-800 transition-colors"
          aria-label="Close Invoice"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-stone-400">Generating Cooperative Tax & Welfare Invoice...</p>
          </div>
        ) : invoice ? (
          <div className="space-y-5">
            {/* Header */}
            <div className="border-b border-stone-800 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-black text-white text-sm">
                    CC
                  </div>
                  <div>
                    <h3 className="font-extrabold text-stone-100 text-sm">{invoice.cooperativeFederation}</h3>
                    <p className="text-[10px] text-stone-400">Official Worker-Owned Service Receipt</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                    {invoice.invoiceNumber}
                  </span>
                  <div className="text-[10px] text-stone-400 mt-1">{invoice.invoiceDate}</div>
                </div>
              </div>
            </div>

            {/* Service & Customer Meta */}
            <div className="grid grid-cols-2 gap-4 bg-stone-800/40 p-3 rounded-xl border border-stone-800 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400">Customer Details</span>
                <div className="font-bold text-stone-200 mt-0.5">{invoice.customer.name}</div>
                <div className="text-[10px] text-stone-400 truncate">{invoice.serviceAddress}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400">Dispatched Worker</span>
                <div className="font-bold text-emerald-400 mt-0.5">{invoice.worker.name}</div>
                <div className="text-[10px] text-stone-400">{invoice.worker.profession} (Badge #{invoice.worker.id})</div>
              </div>
            </div>

            {/* Itemized Line Items */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-stone-300 uppercase tracking-wider">Line Item Summary</div>
              <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 text-xs space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-stone-800 font-semibold">
                  <span>{invoice.serviceTitle}</span>
                  <span>₹{invoice.baseAmount}</span>
                </div>
                <div className="flex justify-between text-[11px] text-stone-400">
                  <span>GST Breakdown (18% inclusive/exempt):</span>
                  <span>₹{invoice.gstAmount}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-extrabold text-stone-100 pt-1">
                  <span>Total Amount Paid:</span>
                  <span className="text-emerald-400">₹{invoice.totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Transparent 85/10/5 Social Impact Allocation */}
            <div className="bg-stone-800/50 border border-stone-800 p-4 rounded-xl space-y-2.5">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Worker Co-op Financial Split Transparency</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-center">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg">
                  <div className="font-extrabold text-emerald-400">85% (₹{invoice.breakdown.directWorkerPayout})</div>
                  <div className="text-[9px] text-stone-400">Direct Worker Take-Home</div>
                </div>
                <div className="bg-sky-500/10 border border-sky-500/20 p-2 rounded-lg">
                  <div className="font-extrabold text-sky-400">10% (₹{invoice.breakdown.platformReinvestment})</div>
                  <div className="text-[9px] text-stone-400">Tech & Ops Reinvestment</div>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg">
                  <div className="font-extrabold text-rose-400">5% (₹{invoice.breakdown.welfareFundAllocation})</div>
                  <div className="text-[9px] text-stone-400">Worker Medical Vault</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Print / Download Tax Receipt</span>
              </button>
              <button
                onClick={onClose}
                className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-rose-400">
            Invoice generation failed. Please try again.
          </div>
        )}
      </div>
    </div>
  );
};
