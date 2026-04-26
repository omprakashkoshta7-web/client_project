import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AddressModal from '../components/AddressModal';
import { useAuth } from '../context/AuthContext';
import orderService from '../services/order.service';
import walletService from '../services/wallet.service';
import userService from '../services/user.service';
import paymentService from '../services/payment.service';

type PaymentMethod = 'card' | 'upi' | 'wallet' | 'netbanking';
type PaymentRowProps = {
  id: PaymentMethod;
  title: string;
  desc: string;
  icon: React.ReactNode;
  method: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
};

const PaymentRow: React.FC<PaymentRowProps> = ({ id, title, desc, icon, method, onSelect }) => (
  <button
    onClick={() => onSelect(id)}
    className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition text-left"
    style={{
      border: method === id ? '2px solid #111111' : '1.5px solid #e5e7eb',
      backgroundColor: method === id ? '#fafafa' : '#ffffff',
      marginBottom: '10px',
    }}
  >
    <div className="flex items-center gap-4">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
        {icon}
      </div>
      <div>
        <p className="font-bold text-gray-900" style={{ fontSize: '14px' }}>{title}</p>
        <p className="text-xs" style={{ color: '#9ca3af' }}>{desc}</p>
      </div>
    </div>
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ border: method === id ? 'none' : '1.5px solid #d1d5db', backgroundColor: method === id ? '#111111' : 'transparent' }}
    >
      {method === id && (
        <div className="w-2 h-2 rounded-full bg-white" />
      )}
    </div>
  </button>
);

const CheckoutPage: React.FC = () => {
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [upiId, setUpiId] = useState('');
  const [selectedUpi, setSelectedUpi] = useState('');
  const [orderSummary, setOrderSummary] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchCheckoutData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCheckoutData = async () => {
    try {
      setLoading(true);
      // Check if address was passed from AddressPage via "Deliver Here"
      const passedAddress = (location.state as any)?.selectedAddress;
      if (passedAddress) {
        setSelectedAddress(passedAddress);
        setAddresses([passedAddress]);
      }
      if (isAuthenticated) {
        const [cartRes, walletRes, addressRes] = await Promise.all([
          orderService.getCart(),
          walletService.getBalance(),
          userService.getAddresses()
        ]);

        // Filter cart items by flow if passed from CartPage
        const flowFilter = (location.state as any)?.flow || '';
        const rawCart = cartRes.data || cartRes || {};
        const allItems = rawCart.items || [];
        const filteredItems = flowFilter
          ? allItems.filter((item: any) => item.flowType === flowFilter)
          : allItems;
        const filteredSubtotal = filteredItems.reduce(
          (sum: number, item: any) => sum + ((item.unitPrice || item.price || 0) * (item.quantity || 1)), 0
        );

        setOrderSummary({
          ...rawCart,
          items: filteredItems,
          subtotal: filteredSubtotal,
          deliveryFee: rawCart.deliveryFee || 0,
          discount: rawCart.discount || 0,
        });
        setWallet(walletRes.data);
        const addressesData = addressRes?.data || [];
        const parsedAddresses = Array.isArray(addressesData) ? addressesData : [];
        setAddresses(parsedAddresses);
        // Only auto-select if no address was passed via state
        if (!passedAddress && parsedAddresses.length > 0) {
          setSelectedAddress(parsedAddresses[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch checkout data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async (addressData: any) => {
    setSavingAddress(true);
    const formatted = {
      label: addressData.type || 'Home',
      fullName: addressData.name,
      phone: addressData.phone,
      houseNo: addressData.house || '',
      area: addressData.area || '',
      landmark: addressData.landmark || '',
      line1: `${addressData.house || ''}, ${addressData.area || ''}`.trim().replace(/^,\s*/, '').replace(/,\s*$/, ''),
      line2: addressData.landmark || '',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: addressData.pincode,
      country: 'India',
      isDefault: addressData.isDefault || false,
    };
    try {
      if (editingAddress) {
        // Update existing address
        const response = await userService.updateAddress(editingAddress._id, formatted);
        const updatedAddress = response.data;
        setAddresses(addresses.map(a => a._id === editingAddress._id ? updatedAddress : a));
        if (selectedAddress?._id === editingAddress._id) {
          setSelectedAddress(updatedAddress);
        }
      } else {
        // Create new address
        const response = await userService.addAddress(formatted);
        const newAddress = response.data;
        setAddresses([...addresses, newAddress]);
        setSelectedAddress(newAddress);
      }
    } catch (err) {
      console.error('Failed to save address:', err);
      // save locally if backend down
      const localAddress = { ...formatted, _id: editingAddress?._id || `local-${Date.now()}` };
      if (editingAddress) {
        setAddresses(addresses.map(a => a._id === editingAddress._id ? localAddress : a));
        if (selectedAddress?._id === editingAddress._id) {
          setSelectedAddress(localAddress);
        }
      } else {
        setAddresses([...addresses, localAddress]);
        setSelectedAddress(localAddress);
      }
    }
    setShowAddressModal(false);
    setEditingAddress(null);
    setSavingAddress(false);
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    
    try {
      setDeletingAddressId(addressId);
      await userService.deleteAddress(addressId);
      const updated = addresses.filter(a => a._id !== addressId);
      setAddresses(updated);
      
      // If deleted address was selected, select the first available
      if (selectedAddress?._id === addressId) {
        setSelectedAddress(updated.length > 0 ? updated[0] : null);
      }
    } catch (err) {
      console.error('Failed to delete address:', err);
      // Still remove locally if backend fails
      const updated = addresses.filter(a => a._id !== addressId);
      setAddresses(updated);
      if (selectedAddress?._id === addressId) {
        setSelectedAddress(updated.length > 0 ? updated[0] : null);
      }
    } finally {
      setDeletingAddressId(null);
    }
  };

  const handleEditAddress = (address: any) => {
    setEditingAddress(address);
    setShowAddressModal(true);
  };

  const handlePayment = async () => {
    try {
      setProcessing(true);
      const cartItems = orderSummary?.items || [];

      if (!selectedAddress) {
        alert('Please select a delivery address');
        setProcessing(false);
        return;
      }

      if (cartItems.length === 0) {
        alert('Your cart is empty');
        setProcessing(false);
        return;
      }

      // Check wallet balance if payment method is wallet
      const subtotal = cartItems.reduce((sum: number, item: any) => sum + ((item.unitPrice || item.price || 0) * (item.quantity || 1)), 0);
      const deliveryCharge = orderSummary?.deliveryFee || 0;
      const discount = orderSummary?.discount || 0;
      const totalAmount = subtotal + deliveryCharge - discount;

      if (method === 'wallet') {
        const walletBalance = wallet?.balance || 0;
        if (walletBalance < totalAmount) {
          alert(`Insufficient wallet balance. You have ₹${walletBalance.toFixed(2)} but need ₹${totalAmount.toFixed(2)}. Please add funds to your wallet or choose another payment method.`);
          setProcessing(false);
          return;
        }
      }

      if (isAuthenticated) {
        const items = cartItems.map((item: any) => ({
          productId: item.productId || item.id || 'unknown',
          productName: item.productName || item.name || 'Product',
          flowType: item.flowType || 'shopping',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || item.price || 0,
          totalPrice: (item.unitPrice || item.price || 0) * (item.quantity || 1),
        }));

        const orderData = {
          items,
          shippingAddress: {
            fullName: selectedAddress.fullName || selectedAddress.label || 'Customer',
            phone: selectedAddress.phone || '',
            line1: selectedAddress.line1 || '',
            line2: selectedAddress.line2 || '',
            city: selectedAddress.city || 'Mumbai',
            state: selectedAddress.state || 'Maharashtra',
            pincode: selectedAddress.pincode || '',
          },
          subtotal,
          discount,
          deliveryCharge,
          total: totalAmount,
          paymentMethod: method,
        };

        if (method === 'wallet') {
          // Wallet payment - direct order creation
          const response = await orderService.createOrder(orderData);
          const createdOrderId = response.data?._id;
          
          if (createdOrderId) {
            navigate(`/payment-success?orderId=${createdOrderId}`);
          } else {
            throw new Error('Order creation failed');
          }
        } else {
          // Razorpay payment for card, UPI, netbanking
          await handleRazorpayPayment(orderData, totalAmount);
        }
      } else {
        alert('Please login to place an order');
        navigate('/');
      }
    } catch (err: any) {
      console.error('Payment failed:', err);
      const errData = err?.response?.data;
      const detail = errData?.errors?.join(', ') || errData?.error?.message || errData?.message || err.message || 'Unknown error';
      console.error('Order creation error:', errData);
      alert(`Order creation failed: ${detail}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleRazorpayPayment = async (orderData: any, totalAmount: number) => {
    try {
      // Create Razorpay payment order
      const paymentResponse = await paymentService.createPayment({
        orderId: `order_${Date.now()}`,
        amount: totalAmount,
        currency: 'INR'
      });

      // Open Razorpay checkout
      const checkoutResult = await paymentService.openCheckout({
        keyId: paymentResponse.keyId,
        amount: paymentResponse.amount,
        currency: paymentResponse.currency,
        orderId: paymentResponse.razorpayOrderId,
        name: 'SpeedCopy',
        description: `Shopping Order - ${orderData.items.length} item(s)`,
      });

      // Verify payment
      await paymentService.verifyPayment(checkoutResult, totalAmount);

      // Create order with payment details
      const finalOrderData = {
        ...orderData,
        razorpayOrderId: checkoutResult.razorpayOrderId,
        razorpayPaymentId: checkoutResult.razorpayPaymentId,
        razorpaySignature: checkoutResult.razorpaySignature,
        paymentStatus: 'completed'
      };

      const response = await orderService.createOrder(finalOrderData);
      const createdOrderId = response.data?._id;
      
      if (createdOrderId) {
        navigate(`/payment-success?orderId=${createdOrderId}&paymentId=${checkoutResult.razorpayPaymentId}`);
      } else {
        throw new Error('Order creation failed after payment');
      }

    } catch (error: any) {
      console.error('Razorpay payment failed:', error);
      if (error.message === 'Payment cancelled by user') {
        alert('Payment was cancelled. You can try again.');
      } else {
        alert(`Payment failed: ${error.message}`);
      }
      throw error;
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="animate-pulse">
            <div className="bg-white rounded-2xl h-96" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div style={{ backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left - Payment Methods & Address */}
          <div className="w-full lg:w-1/2">
            {/* Delivery Address Section */}
            <div className="mb-8">
              <h2 className="font-bold text-gray-900 mb-1" style={{ fontSize: '20px' }}>Delivery Address</h2>
              <p className="text-sm mb-4" style={{ color: '#9ca3af' }}>Select where you'd like your order delivered.</p>
              
              {addresses.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {addresses.map((address, i) => (
                    <button
                      key={address._id || i}
                      onClick={() => setSelectedAddress(address)}
                      className="w-full text-left p-4 rounded-2xl transition"
                      style={{
                        border: selectedAddress?._id === address._id ? '2px solid #111111' : '1.5px solid #e5e7eb',
                        backgroundColor: selectedAddress?._id === address._id ? '#fafafa' : '#ffffff',
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 mb-1">{address.label || address.fullName}</p>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {address.line1}
                            {address.line2 && <>, {address.line2}</>}
                            <br />
                            {address.city}, {address.state} {address.pincode}
                          </p>
                        </div>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-3"
                          style={{ border: selectedAddress?._id === address._id ? 'none' : '1.5px solid #d1d5db', backgroundColor: selectedAddress?._id === address._id ? '#111111' : 'transparent' }}>
                          {selectedAddress?._id === address._id && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      
                      {/* Edit and Delete buttons */}
                      <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #e5e7eb' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAddress(address);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition"
                          style={{ backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAddress(address._id);
                          }}
                          disabled={deletingAddressId === address._id}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition disabled:opacity-50"
                          style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4 rounded-2xl border-2 border-dashed border-gray-300 mb-4">
                  <p className="text-gray-500 mb-3">No addresses found</p>
                  <button onClick={() => setShowAddressModal(true)}
                    className="px-4 py-2 bg-black text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition">
                    Add Address
                  </button>
                </div>
              )}

              <button onClick={() => setShowAddressModal(true)}
                className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Address
              </button>
            </div>

            <h1 className="font-bold text-gray-900 mb-1" style={{ fontSize: '24px' }}>Payment Method</h1>
            <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>Select how you'd like to pay for your order.</p>

            {/* Credit/Debit Card */}
            <PaymentRow id="card" title="Credit / Debit Card" desc="Visa, Mastercard, RuPay" method={method} onSelect={setMethod}
              icon={<svg className="w-5 h-5" style={{ color: '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
            />

            {/* UPI - expanded */}
            <div className="rounded-2xl mb-3" style={{ border: method === 'upi' ? '2px solid #111111' : '1.5px solid #e5e7eb', backgroundColor: method === 'upi' ? '#fafafa' : '#ffffff' }}>
              <button onClick={() => setMethod('upi')} className="w-full flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
                    <svg className="w-5 h-5" style={{ color: '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900" style={{ fontSize: '14px' }}>UPI Options</p>
                    <p className="text-xs" style={{ color: '#9ca3af' }}>Pay directly from your bank account</p>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: method === 'upi' ? '#111111' : 'transparent', border: method === 'upi' ? 'none' : '1.5px solid #d1d5db' }}>
                  {method === 'upi' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>

              {method === 'upi' && (
                <div className="px-5 pb-5">
                  {/* Popular UPI Apps */}
                  <div className="mb-5">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Choose UPI App</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { 
                          id: 'gpay', 
                          label: 'Google Pay', 
                          logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTAFyk2Hu-hbJkgcF7nkVkuxTwwYZztsPc_wQ&s',
                          bgColor: '#4285F4',
                          textColor: '#ffffff'
                        },
                        { 
                          id: 'phonepe', 
                          label: 'PhonePe', 
                          logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTo4x8kSTmPUq4PFzl4HNT0gObFuEhivHOFYg&s',
                          bgColor: '#5F259F',
                          textColor: '#ffffff'
                        },
                        { 
                          id: 'paytm', 
                          label: 'Paytm', 
                          logo: 'https://play-lh.googleusercontent.com/WDGsMRuVENnZPEpV4DEaXw12qtMY3em85xpmZqcXzeh0iT_eXFtAU9VUj-Z7xNQQd5DMqrkKSs9D0qbI1rlt',
                          bgColor: '#00BAF2',
                          textColor: '#ffffff'
                        },
                        { 
                          id: 'bhim', 
                          label: 'BHIM UPI', 
                          logo: 'https://play-lh.googleusercontent.com/B5cNBA15IxjCT-8UTXEWgiPcGkJ1C07iHKwm2Hbs8xR3PnJvZ0swTag3abdC_Fj5OfnP',
                          bgColor: '#FF6900',
                          textColor: '#ffffff'
                        }
                      ].map(app => (
                        <button 
                          key={app.id} 
                          onClick={() => setSelectedUpi(app.id)}
                          className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 hover:scale-105"
                          style={{ 
                            border: selectedUpi === app.id ? '2px solid #111111' : '2px solid #e5e7eb', 
                            backgroundColor: selectedUpi === app.id ? '#f8fafc' : '#ffffff',
                            boxShadow: selectedUpi === app.id ? '0 4px 12px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)'
                          }}
                        >
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: app.bgColor }}
                          >
                            <img 
                              src={app.logo} 
                              alt={app.label} 
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                // Fallback to text if image fails
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<span style="color: ${app.textColor}; font-weight: bold; font-size: 12px;">${app.label.charAt(0)}</span>`;
                                }
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 text-center leading-tight">
                            {app.label}
                          </span>
                          {selectedUpi === app.id && (
                            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs font-semibold text-gray-400 px-2">OR ENTER UPI ID</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* UPI ID Input */}
                  <div className="mb-4">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">UPI ID</label>
                    <div className="relative">
                      <input 
                        value={upiId} 
                        onChange={e => setUpiId(e.target.value)} 
                        placeholder="yourname@paytm / yourname@gpay"
                        className="w-full px-4 py-3 pr-20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        style={{ 
                          border: '2px solid #e5e7eb', 
                          backgroundColor: '#ffffff',
                          color: '#374151'
                        }}
                      />
                      <button 
                        className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-bold rounded-lg transition hover:bg-gray-100"
                        style={{ color: '#111111' }}
                      >
                        Verify
                      </button>
                    </div>
                    <p className="text-xs mt-2 flex items-center gap-1" style={{ color: '#9ca3af' }}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Your UPI ID is encrypted and secure
                    </p>
                  </div>

                  {/* Payment Info */}
                  <div className="flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: '#f0f9ff', border: '1px solid #e0f2fe' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#0ea5e9' }}>
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">Quick & Secure Payment</p>
                      <p className="text-xs" style={{ color: '#0369a1' }}>
                        • Complete payment on your mobile app within 5 minutes<br/>
                        • No need to enter card details or OTP<br/>
                        • Instant payment confirmation
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SpeedWallet */}
            <PaymentRow id="wallet" title="SpeedWallet" desc={`Available Balance: ₹${wallet?.balance || 0}`} method={method} onSelect={setMethod}
              icon={<svg className="w-5 h-5" style={{ color: '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
            />

            {/* Net Banking */}
            <PaymentRow id="netbanking" title="Net Banking" desc="View all banks" method={method} onSelect={setMethod}
              icon={<svg className="w-5 h-5" style={{ color: '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>}
            />
          </div>

          {/* Right - Order Summary */}
          <div className="w-full lg:w-1/2 lg:flex-shrink-0">
            <div className="bg-white rounded-3xl p-6 mb-4" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
              <h2 className="font-bold text-gray-900 mb-5" style={{ fontSize: '17px' }}>Order Summary</h2>
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#9ca3af' }}>Item Total</span>
                  <span className="text-sm font-semibold text-gray-900">₹{(orderSummary?.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#9ca3af' }}>Delivery Fee</span>
                  <span className="text-sm font-semibold text-gray-900">₹{(orderSummary?.deliveryFee || 0).toFixed(2)}</span>
                </div>
                {(orderSummary?.discount || 0) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#9ca3af' }}>🏷 Discount</span>
                    <span className="text-sm font-semibold" style={{ color: '#16a34a' }}>-₹{(orderSummary?.discount || 0).toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-4 mb-5" style={{ borderTop: '1px solid #f3f4f6' }}>
                <span className="font-bold text-gray-900">Total Payable</span>
                <div className="text-right">
                  <span className="font-bold text-gray-900" style={{ fontSize: '20px' }}>₹{((orderSummary?.subtotal || 0) + (orderSummary?.deliveryFee || 0) - (orderSummary?.discount || 0)).toFixed(2)}</span>
                </div>
              </div>
              <button 
                className="w-full flex items-center justify-center gap-2 py-3.5 text-white font-bold rounded-full hover:bg-gray-700 transition disabled:opacity-50"
                style={{ backgroundColor: '#111111', fontSize: '14px' }}
                onClick={handlePayment}
                disabled={processing}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {processing ? 'Processing Payment...' : `Pay ₹${((orderSummary?.subtotal || 0) + (orderSummary?.deliveryFee || 0) - (orderSummary?.discount || 0)).toFixed(2)} Securely`}
              </button>
              <p className="text-center text-xs mt-3 font-bold tracking-widest" style={{ color: '#9ca3af' }}>GUARANTEED SAFE CHECKOUT</p>
              <div className="flex items-center justify-center gap-3 mt-2">
                {['SSL SECURE', 'PCI COMPLIANT', '256-BIT'].map(t => (
                  <span key={t} className="text-xs" style={{ color: '#9ca3af' }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Free cancellation */}
            <div className="rounded-2xl p-4 flex items-start gap-3" style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-bold text-gray-900 text-sm">Free cancellation policy</p>
                <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>You can cancel your order within 10 minutes of placing it for a full refund.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {showAddressModal && (
      <AddressModal
        onClose={() => {
          setShowAddressModal(false);
          setEditingAddress(null);
        }}
        onSave={handleSaveAddress}
        loading={savingAddress}
        editingAddress={editingAddress}
      />
    )}

    {/* Payment Processing Modal */}
    {processing && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl p-8 max-w-sm mx-4 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2" style={{ fontSize: '18px' }}>Processing Payment</h3>
            <p className="text-sm" style={{ color: '#9ca3af' }}>Please wait while we process your payment...</p>
          </div>
          
          <div className="space-y-3 mb-6 p-4 rounded-2xl" style={{ backgroundColor: '#f9fafb' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#9ca3af' }}>Amount</span>
              <span className="font-bold text-gray-900">₹{((orderSummary?.subtotal || 0) + (orderSummary?.deliveryFee || 0) - (orderSummary?.discount || 0)).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#9ca3af' }}>Payment Method</span>
              <span className="font-bold text-gray-900 capitalize">{method}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
    )}
  </>
  );
};

export default CheckoutPage;
