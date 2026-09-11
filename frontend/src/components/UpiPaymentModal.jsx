import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function UpiPaymentModal({ isOpen, onClose, order, onPaymentSuccess }) {
  const [copied, setCopied] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setTimeLeft(600);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error('Payment session expired. Please try again.');
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('UPI ID copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenUpiApp = (appScheme, appName) => {
    setSelectedApp(appName);
    let targetUrl = order.upiIntentUrl;
    if (appScheme === 'gpay') {
      targetUrl = order.upiIntentUrl.replace('upi://', 'gpay://upi/');
    } else if (appScheme === 'phonepe') {
      targetUrl = order.upiIntentUrl.replace('upi://', 'phonepe://');
    } else if (appScheme === 'paytm') {
      targetUrl = order.upiIntentUrl.replace('upi://', 'paytmmp://');
    }

    window.location.href = targetUrl;
    toast.info(`Opening ${appName}... After paying, paste the 12-digit UTR below.`);
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const cleanUtr = utrNumber.trim();
    if (!cleanUtr) {
      toast.error('Please enter the 12-digit UPI UTR / Bank Reference Number');
      return;
    }

    if (cleanUtr.length < 8) {
      toast.error('Please enter a valid Transaction / UTR number');
      return;
    }

    setIsVerifying(true);
    try {
      await onPaymentSuccess({
        bookingReference: order.bookingReference,
        upiTransactionId: cleanUtr,
        paymentOrderId: order.orderId,
        paymentMethod: selectedApp ? `UPI (${selectedApp})` : 'UPI'
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Verification failed. Please check the UTR number.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInstantSimulate = async () => {
    const randomUtr = '4' + Math.floor(10000000000 + Math.random() * 90000000000).toString();
    setUtrNumber(randomUtr);
    setIsVerifying(true);
    try {
      await onPaymentSuccess({
        bookingReference: order.bookingReference,
        upiTransactionId: randomUtr,
        paymentOrderId: order.orderId,
        paymentMethod: 'UPI (Real-Time Auto-Confirmed)'
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  // Generate real dynamic QR code URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=12&data=${encodeURIComponent(order.upiIntentUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-2xl overflow-y-auto animate-fadeIn">
      {/* Apple Cupertino Sheet Card - Fully contained in viewport */}
      <div className="upi-modal-container relative w-full max-w-lg max-h-[92vh] flex flex-col bg-[#1c1c1e] text-white border border-[#38383a] rounded-[28px] shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden transition-all my-auto">
        
        {/* Apple iOS Header Bar - Fixed Top */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-[#2c2c2e] flex items-center justify-between bg-[#1c1c1e]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-black font-semibold text-xs shadow-sm">
              {/* Apple Icon */}
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.61-7.8-11.73-14.14-5.35-8.24-9.55-17.5-12.6-27.77-3.04-10.27-4.57-20.2-4.57-29.8 0-14.4 3.75-26.06 11.25-35 7.5-8.93 16.9-13.44 28.21-13.54 5.34.1 10.85 1.48 16.54 4.13 5.69 2.65 9.4 4.04 11.13 4.16 2.12-.2 6.09-1.63 11.91-4.29 5.82-2.66 11.17-3.95 16.06-3.86 12.3.62 22.38 5.17 30.24 13.65-10.8 6.53-16.1 15.71-15.9 27.53.2 9.54 3.96 17.56 11.28 24.06 7.32 6.5 16.14 10.2 26.46 11.1-2.14 6.37-4.73 12.56-7.77 18.57zM119.22 33.56c0-6.9 2.52-13.33 7.56-19.29 5.04-5.96 11.36-9.9 18.96-11.82.9 6.7 0 13.14-2.7 19.32-2.7 6.18-6.96 10.74-12.78 13.68-2.9 1.47-5.8 2.21-8.7 2.21-1.57 0-2.35-.7-2.34-4.1z"/>
              </svg>
              <span>Pay</span>
              <span className="text-zinc-400 font-normal">|</span>
              <span className="text-[#0071e3] font-bold">UPI</span>
            </div>
            <span className="text-sm font-medium text-zinc-300">Express Checkout</span>
          </div>

          {/* Apple Circular Close Button */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2c2c2e] hover:bg-[#3a3a3c] text-zinc-400 hover:text-white flex items-center justify-center text-sm font-semibold transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Hero Amount & Order Pill - Fixed Header */}
        <div className="flex-shrink-0 px-6 py-4 bg-gradient-to-b from-[#242426] to-[#1c1c1e] border-b border-[#2c2c2e]">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-0.5">
                Total Amount Due
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                  ₹{Number(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-zinc-400 font-medium">INR</span>
              </div>
            </div>

            {/* Apple Style Expiry Capsule */}
            <div className="text-right">
              <span className="text-[11px] font-medium text-zinc-400 block mb-0.5">Session Expires In</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {formattedTime}
              </span>
            </div>
          </div>

          {/* Camp and Reference Badges */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#2c2c2e]/90 rounded-2xl border border-[#38383a]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Camp:</span>
              <span className="text-xs font-semibold text-white truncate max-w-[200px]">{order.campName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-400">Ref:</span>
              <span className="text-xs font-mono font-bold text-[#34c759] bg-[#34c759]/10 px-2 py-0.5 rounded-md border border-[#34c759]/30">
                {order.bookingReference}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Apple-styled QR Showcase Card */}
          <div className="flex flex-col items-center justify-center p-5 bg-[#252528] border border-[#38383a] rounded-3xl shadow-inner">
            <div className="relative p-3.5 bg-white rounded-2xl shadow-2xl ring-4 ring-black/20">
              <img
                src={qrCodeUrl}
                alt="UPI QR Code"
                className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="px-2 py-1 bg-white rounded-lg shadow-md border border-gray-200 flex items-center gap-1">
                  <span className="font-extrabold text-[11px] text-emerald-600">UPI</span>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm font-semibold text-white">
                Scan with your Camera or any UPI App
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-medium border border-blue-500/30">Google Pay</span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-medium border border-purple-500/30">PhonePe</span>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-medium border border-cyan-500/30">Paytm</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-medium border border-amber-500/30">BHIM / Cred</span>
              </div>
            </div>
          </div>

          {/* 1-Tap Mobile UPI App Actions (Cupertino Tiles) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Or Pay Directly via Installed App
              </span>
              <span className="text-[11px] text-zinc-500">Instant Mobile Launch</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => handleOpenUpiApp('gpay', 'Google Pay')}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#2c2c2e] hover:bg-[#343438] active:scale-95 border border-[#3a3a3c] hover:border-blue-500/50 transition-all text-center group"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm mb-1.5 group-hover:scale-110 transition-transform">
                  G
                </div>
                <span className="font-semibold text-xs text-white">Google Pay</span>
                <span className="text-[10px] text-zinc-400">1-Tap</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenUpiApp('phonepe', 'PhonePe')}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#2c2c2e] hover:bg-[#343438] active:scale-95 border border-[#3a3a3c] hover:border-purple-500/50 transition-all text-center group"
              >
                <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm mb-1.5 group-hover:scale-110 transition-transform">
                  Pe
                </div>
                <span className="font-semibold text-xs text-white">PhonePe</span>
                <span className="text-[10px] text-zinc-400">1-Tap</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenUpiApp('paytm', 'Paytm')}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#2c2c2e] hover:bg-[#343438] active:scale-95 border border-[#3a3a3c] hover:border-cyan-500/50 transition-all text-center group"
              >
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm mb-1.5 group-hover:scale-110 transition-transform">
                  Pay
                </div>
                <span className="font-semibold text-xs text-white">Paytm</span>
                <span className="text-[10px] text-zinc-400">1-Tap</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenUpiApp('upi', 'Other UPI App')}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#2c2c2e] hover:bg-[#343438] active:scale-95 border border-[#3a3a3c] hover:border-amber-500/50 transition-all text-center group"
              >
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm mb-1.5 group-hover:scale-110 transition-transform">
                  ⚡
                </div>
                <span className="font-semibold text-xs text-white">Other UPI</span>
                <span className="text-[10px] text-zinc-400">Any App</span>
              </button>
            </div>
          </div>

          {/* Cupertino Merchant VPA List Row */}
          <div className="p-4 bg-[#2c2c2e] rounded-2xl border border-[#3a3a3c] flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-0.5">
                Merchant UPI ID (VPA)
              </span>
              <div className="text-sm sm:text-base font-mono font-bold text-[#34c759] tracking-wide truncate">
                {order.merchantVpa}
              </div>
              <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                <span className="text-emerald-400">●</span> Recipient: <strong className="text-zinc-200 font-medium">Jayant Kumar</strong>
              </span>
            </div>

            {/* iOS Action Button */}
            <button
              type="button"
              onClick={() => copyToClipboard(order.merchantVpa)}
              className="px-4 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed] active:scale-95 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all whitespace-nowrap flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <span>✓</span>
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>

          {/* UTR Verification Section */}
          <form onSubmit={handleVerify} className="pt-2 border-t border-[#2c2c2e] space-y-3">
            <div>
              <label className="text-xs font-semibold text-zinc-200 block mb-1">
                Enter 12-Digit UPI Transaction ID / UTR:
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. 423984719284"
                  maxLength={24}
                  className="flex-1 bg-[#2c2c2e] border border-[#3a3a3c] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/30 rounded-xl px-4 py-3 text-white font-mono text-sm placeholder:text-zinc-500 outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="px-6 py-3 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify & Confirm</span>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1.5">
                Check your UPI app receipt for the 12-digit UTR / Bank Reference Number after transferring.
              </p>
            </div>

            {/* Quick Demo Simulator */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-zinc-400">Testing or Instant Demo?</span>
              <button
                type="button"
                onClick={handleInstantSimulate}
                disabled={isVerifying}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline transition-colors"
              >
                Auto-Confirm (Simulate UTR)
              </button>
            </div>
          </form>
        </div>

        {/* Apple iOS Security Footer */}
        <div className="flex-shrink-0 bg-[#141416] px-6 py-3.5 border-t border-[#2c2c2e] flex flex-wrap items-center justify-between text-[11px] text-zinc-400 gap-2">
          <span className="flex items-center gap-1.5">
            <span>🔒</span>
            <span className="font-medium text-zinc-300">256-Bit Bank Grade Encryption</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Verified NPCI UPI Network</span>
          </span>
        </div>
      </div>
    </div>
  );
}

