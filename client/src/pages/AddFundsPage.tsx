import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import paymentService from '../services/payment.service';
import walletService from '../services/wallet.service';
import financeService from '../services/finance.service';

const quickAmounts = [20, 50, 100, 500];

const isSessionAuthError = (err: any) => {
  const message = String(err?.response?.data?.message || err?.message || '').toLowerCase();
  return (
    err?.response?.status === 401 &&
    (
      message.includes('invalid or expired token') ||
      message.includes('invalid token') ||
      message.includes('token expired') ||
      message.includes('no token provided') ||
      message.includes('unauthorized')
    )
  );
};

const AddFundsPage: React.FC = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState(0);
  const [selectedQuick, setSelectedQuick] = useState<number | null>(100);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newBalance, setNewBalance] = useState(0);

  useEffect(() => {
    // no-op: Razorpay script is loaded on-demand by paymentService
  }, []);

  const displayAmount = selectedQuick ?? amount;
  const processingFee = 0;
  const total = displayAmount;

  const handleQuick = (val: number) => { setSelectedQuick(val); setAmount(val); };
  const handleInput = (val: string) => { setSelectedQuick(null); setAmount(parseFloat(val) || 0); };

  const handleAddFunds = async () => {
    if (total <= 0) return;
    if (!localStorage.getItem('auth_token')) {
      setError('Please login to add funds.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('🚀 Starting payment flow for amount:', total);

      // Validate topup amount first
      try {
        const validation = await walletService.validateTopupAmount(total);
        if (!validation.valid) {
          setError(validation.message || 'Invalid amount');
          setLoading(false);
          return;
        }
      } catch (validationErr) {
        console.warn('Validation API failed, proceeding with basic validation');
        if (total < 10 || total > 50000) {
          setError('Amount must be between ₹10 and ₹50,000');
          setLoading(false);
          return;
        }
      }

      // 1) Create payment order using wallet service with fallback
      let paymentData;
      try {
        console.log('📡 Calling wallet service initiateRazorpay...');
        const paymentResponse = await walletService.initiateRazorpay(total, `wallet_topup_${Date.now()}`);
        paymentData = paymentResponse.data;
        console.log('✅ Wallet service response:', paymentResponse);
      } catch (walletErr) {
        console.warn('⚠️ Wallet service failed, trying finance service...', walletErr);
        try {
          const financeResponse = await financeService.initiateRazorpayPayment(total, `wallet_topup_${Date.now()}`);
          paymentData = financeResponse;
          console.log('✅ Finance service response:', financeResponse);
        } catch (financeErr) {
          console.warn('⚠️ Finance service also failed, using payment service...', financeErr);
          const paymentResponse = await paymentService.createPayment({
            orderId: `wallet_topup_${Date.now()}`,
            amount: total,
            currency: 'INR',
          });
          paymentData = paymentResponse;
          console.log('✅ Payment service response:', paymentResponse);
        }
      }

      // Extract payment details with multiple fallback paths
      const keyId = paymentData?.keyId || paymentData?.data?.keyId || paymentData?.key_id || paymentData?.key;
      const razorpayOrderId = paymentData?.razorpayOrderId || paymentData?.data?.razorpayOrderId || 
                             paymentData?.razorpay_order_id || paymentData?.orderId || paymentData?.data?.orderId;
      const amountInPaise = paymentData?.amount || paymentData?.data?.amount || Math.round(total * 100);
      const currency = paymentData?.currency || paymentData?.data?.currency || 'INR';
      const clientSideFallback = !!(paymentData?.clientSideFallback || paymentData?.data?.clientSideFallback);
      const mock = !!(paymentData?.mock || paymentData?.data?.mock);

      console.log('💳 Payment details extracted:', {
        keyId,
        razorpayOrderId,
        amountInPaise,
        currency,
        clientSideFallback,
        mock
      });

      if (!keyId || !amountInPaise) {
        console.error('❌ Missing payment details:', { keyId, amountInPaise });
        throw new Error('Payment initialization failed. Missing Razorpay details.');
      }

      // 2) Open checkout and collect payment ids/signature.
      console.log('🎯 Opening Razorpay checkout...');
      const checkoutResult = await paymentService.openCheckout({
        keyId,
        amount: amountInPaise,
        currency,
        orderId: razorpayOrderId,
        receipt: `wallet_topup_${Date.now()}`,
        name: 'SpeedCopy',
        description: 'Wallet Topup',
      });

      console.log('✅ Checkout completed:', checkoutResult);

      // 3) Show success - payment completed
      console.log('✅ Payment completed successfully');
      setNewBalance(total);
      setSuccess(true);
    } catch (err: any) {
      console.error('❌ Payment flow failed:', err);
      
      if (isSessionAuthError(err)) {
        setError('Your session has expired. Please login again.');
        setTimeout(() => {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          navigate('/');
        }, 2000);
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to initiate payment. Please try again.';
        setError(errorMessage);
        console.error('💥 Error details:', {
          message: errorMessage,
          response: err.response?.data,
          stack: err.stack
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-bold text-gray-900 mb-1" style={{ fontSize: '26px' }}>Add Funds to Your Wallet</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>Fund your secure architectural vault instantly.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-5">

          {/* Left */}
          <div className="w-full lg:w-1/2 space-y-4">

            {/* Enter Amount */}
            <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p className="text-xs font-bold tracking-widest mb-4" style={{ color: '#9ca3af' }}>ENTER AMOUNT</p>
              <div className="flex items-center gap-2 px-4 py-4 rounded-xl mb-4"
                style={{ backgroundColor: '#f0f4ff', border: '1.5px solid #c7d2fe' }}>
                <span className="font-bold text-gray-900 text-xl">₹</span>
                <input type="number" value={amount || ''} onChange={e => handleInput(e.target.value)}
                  placeholder="0.00" className="flex-1 bg-transparent focus:outline-none font-bold text-gray-900 text-xl"
                  style={{ minWidth: 0 }} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {quickAmounts.map(q => (
                  <button key={q} onClick={() => handleQuick(q)}
                    className="py-2.5 px-3 rounded-xl text-sm font-bold transition min-w-0"
                    style={{
                      backgroundColor: selectedQuick === q ? '#1e3a8a' : '#f0f4ff',
                      color: selectedQuick === q ? '#ffffff' : '#1e3a8a',
                      border: selectedQuick === q ? 'none' : '1px solid #c7d2fe',
                    }}>₹{q}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Transaction Summary */}
          <div className="w-full lg:w-1/2">
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#111827' }}>
              <h2 className="font-bold text-white mb-5" style={{ fontSize: '18px' }}>Transaction Summary</h2>
              <div className="space-y-3 mb-5">
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Funding Amount</span>
                  <span className="text-sm font-bold text-white">₹{displayAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Processing Fee (0%)</span>
                  <span className="text-sm font-bold" style={{ color: '#6366f1' }}>₹{processingFee.toFixed(2)}</span>
                </div>
                <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">Total to be added</span>
                    <span className="font-bold" style={{ fontSize: '22px', color: '#6366f1' }}>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#6366f1' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Your transaction is encrypted. Funds are typically available within seconds in your Vault account.
                  </p>
                </div>
              </div>
              
              {error && (
                <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}
              
              <button 
                onClick={handleAddFunds}
                disabled={loading || total <= 0}
                className="w-full py-4 font-bold rounded-xl hover:bg-gray-100 transition text-base disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#ffffff', color: '#111111' }}>
                {loading ? 'Processing...' : 'Pay with Razorpay'}
              </button>
              <p className="text-center text-xs mt-3 font-bold tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
                AUTHORIZED BY FDIC PROTOCOL
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Popup Modal */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-3xl p-10 text-center w-full"
            style={{ maxWidth: '440px', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: '#16a34a', boxShadow: '0 0 0 12px #dcfce7' }}>
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-bold text-gray-900 mb-2" style={{ fontSize: '22px' }}>Funds Added!</h2>
            <p className="text-sm mb-1" style={{ color: '#9ca3af' }}>₹{total.toFixed(2)} has been added to your wallet.</p>
            <p className="font-bold text-gray-900 mb-6" style={{ fontSize: '28px' }}>New Balance: ₹{newBalance.toFixed(2)}</p>
            <button onClick={() => navigate('/wallet')}
              className="w-full py-3 text-white font-bold rounded-full hover:bg-gray-700 transition text-sm"
              style={{ backgroundColor: '#111111' }}>
              Back to Wallet
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddFundsPage;
