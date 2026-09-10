import React, { useState } from 'react';
import { CreditCard, Smartphone, Building, Wallet, Banknote, X, Check, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentMethod: string) => void;
  amount: number;
  serviceTitle: string;
  workerName: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  amount,
  serviceTitle,
  workerName,
}) => {
  const { t } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking' | 'wallet' | 'cash'>('upi');
  const [upiId, setUpiId] = useState('user@upi');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess(selectedMethod.toUpperCase());
    }, 1200);
  };

  const coopFee = Math.round(amount * 0.10);
  const welfareFee = Math.round(amount * 0.05);
  const workerPayout = amount - coopFee - welfareFee;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-6 text-stone-100 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white p-2 rounded-lg hover:bg-stone-800 transition-colors"
          aria-label="Close Payment Modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-100">Coop Connect Payment Escrow</h3>
            <p className="text-xs text-stone-400">100% Secure & Escrow Protection</p>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="bg-stone-800/60 p-4 rounded-xl border border-stone-800 mb-6 space-y-2 text-xs">
          <div className="flex justify-between items-center text-stone-300">
            <span>Service:</span>
            <span className="font-semibold text-white">{serviceTitle}</span>
          </div>
          <div className="flex justify-between items-center text-stone-300">
            <span>Assigned Partner:</span>
            <span className="font-semibold text-emerald-400">{workerName}</span>
          </div>
          <div className="pt-2 border-t border-stone-700/50 flex justify-between items-center text-sm font-bold">
            <span>Total Payable:</span>
            <span className="text-emerald-400 text-base">₹{amount}</span>
          </div>
          <div className="text-[10px] text-stone-400 flex items-center justify-between pt-1">
            <span>Worker: ₹{workerPayout} (85%)</span>
            <span>Coop: ₹{coopFee} (10%)</span>
            <span>Welfare: ₹{welfareFee} (5%)</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-2 mb-6">
          <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
            Select Payment Option:
          </label>

          <button
            type="button"
            onClick={() => setSelectedMethod('upi')}
            className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
              selectedMethod === 'upi'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                : 'border-stone-800 bg-stone-800/40 text-stone-300 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <div className="text-left">
                <div className="text-xs">UPI Instant (GPay / PhonePe / Paytm / BHIM)</div>
                <div className="text-[10px] text-stone-400">Zero transaction fee</div>
              </div>
            </div>
            {selectedMethod === 'upi' && <Check className="w-4 h-4 text-emerald-400" />}
          </button>

          {selectedMethod === 'upi' && (
            <div className="pl-9 pr-2 py-2 bg-stone-800/50 rounded-lg border border-stone-700 mb-2">
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="enter vpa (e.g. mobile@upi)"
                className="w-full text-xs bg-transparent border-none focus:outline-none text-stone-200"
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => setSelectedMethod('card')}
            className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
              selectedMethod === 'card'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                : 'border-stone-800 bg-stone-800/40 text-stone-300 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <CreditCard className="w-4 h-4 text-sky-400" />
              <div className="text-left">
                <div className="text-xs">Credit / Debit Card</div>
                <div className="text-[10px] text-stone-400">Visa, Mastercard, RuPay</div>
              </div>
            </div>
            {selectedMethod === 'card' && <Check className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => setSelectedMethod('netbanking')}
            className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
              selectedMethod === 'netbanking'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                : 'border-stone-800 bg-stone-800/40 text-stone-300 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Building className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <div className="text-xs">Net Banking</div>
                <div className="text-[10px] text-stone-400">SBI, HDFC, ICICI, Axis</div>
              </div>
            </div>
            {selectedMethod === 'netbanking' && <Check className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => setSelectedMethod('cash')}
            className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
              selectedMethod === 'cash'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                : 'border-stone-800 bg-stone-800/40 text-stone-300 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Banknote className="w-4 h-4 text-emerald-400" />
              <div className="text-left">
                <div className="text-xs">Cash on Service Completion</div>
                <div className="text-[10px] text-stone-400">Pay directly to worker partner</div>
              </div>
            </div>
            {selectedMethod === 'cash' && <Check className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>

        <button
          onClick={handlePay}
          disabled={isProcessing}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isProcessing ? (
            <span>Processing Gateway Escrow...</span>
          ) : (
            <>
              <span>{t('payNow')} (₹{amount})</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
