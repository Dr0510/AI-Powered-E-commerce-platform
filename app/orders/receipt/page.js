'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { moneyFromPaise, priceInPaise } from '@/lib/format';

export default function ReceiptPage() {
  return (
    <Suspense fallback={<ReceiptLoading />}>
      <ReceiptContent />
    </Suspense>
  );
}

function ReceiptLoading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Loading receipt...</p>
    </div>
  );
}

function ReceiptContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await api(`/orders?orderId=${orderId}`);
        const orders = response.orders || [];
        const foundOrder = orders.find((o) => o._id === orderId);
        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          setError('Order not found');
        }
      } catch (err) {
        setError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const response = await fetch(`/api/orders/receipt?orderId=${orderId}`);

      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${orderId.slice(-8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Error downloading PDF: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  if (!orderId || error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center', color: '#d32f2f' }}>
          <h2>Error</h2>
          <p>{error || 'Order ID not provided'}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <ReceiptLoading />;
  }

  if (!order) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Order not found</p>
      </div>
    );
  }

  const totalInRupees = order.totalInPaise / 100;

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header with download button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#007bff', margin: 0 }}>Receipt</h1>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: downloading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              opacity: downloading ? 0.6 : 1,
            }}
          >
            {downloading ? 'Downloading...' : '⬇ Download PDF'}
          </button>
        </div>

        {/* Receipt Container */}
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {/* Receipt Title */}
          <div style={{ textAlign: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid #007bff' }}>
            <h2 style={{ color: '#007bff', fontSize: '24px', margin: '0 0 10px 0' }}>RECEIPT</h2>
            <p style={{ color: '#666', margin: 0 }}>Thank you for your purchase!</p>
          </div>

          {/* Order Details */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid #e0e0e0', paddingBottom: '8px' }}>
              ORDER DETAILS
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '14px' }}>
              <div>
                <p style={{ color: '#666', margin: '5px 0' }}>Order ID:</p>
                <p style={{ fontWeight: 'bold', margin: '5px 0' }}>{order._id.toString().slice(-8).toUpperCase()}</p>
              </div>
              <div>
                <p style={{ color: '#666', margin: '5px 0' }}>Order Date:</p>
                <p style={{ fontWeight: 'bold', margin: '5px 0' }} suppressHydrationWarning>
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p style={{ color: '#666', margin: '5px 0' }}>Status:</p>
                <p style={{ color: '#28a745', fontWeight: 'bold', margin: '5px 0' }}>✓ PAID</p>
              </div>
              <div>
                <p style={{ color: '#666', margin: '5px 0' }}>Payment Method:</p>
                <p style={{ fontWeight: 'bold', margin: '5px 0' }}>Razorpay</p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid #e0e0e0', paddingBottom: '8px' }}>
              SHIPPING ADDRESS
            </h3>
            <p style={{ margin: '5px 0', fontSize: '14px' }}>
              {order.customer?.name || 'N/A'}
              <br />
              {order.shippingAddress?.line1 || ''}
              <br />
              {order.shippingAddress?.city || ''}, {order.shippingAddress?.pincode || ''}
              <br />
              {order.shippingAddress?.country || 'India'}
              <br />
              📱 {order.shippingAddress?.phone || 'N/A'}
            </p>
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid #e0e0e0', paddingBottom: '8px' }}>
              ITEMS ORDERED
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '10px', textAlign: 'left', color: '#666', borderBottom: '1px solid #e0e0e0' }}>Item</th>
                  <th style={{ padding: '10px', textAlign: 'center', color: '#666', borderBottom: '1px solid #e0e0e0' }}>Qty</th>
                  <th style={{ padding: '10px', textAlign: 'right', color: '#666', borderBottom: '1px solid #e0e0e0' }}>Price</th>
                  <th style={{ padding: '10px', textAlign: 'right', color: '#666', borderBottom: '1px solid #e0e0e0' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '10px', textAlign: 'left' }}>{item.title}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{moneyFromPaise(priceInPaise(item))}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{moneyFromPaise(priceInPaise(item) * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment Summary */}
          <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '4px', marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
              <span style={{ color: '#666' }}>Subtotal:</span>
              <span style={{ fontWeight: 'bold' }}>₹{totalInRupees.toFixed(2)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#007bff',
                borderTop: '1px solid #e0e0e0',
                paddingTop: '10px',
              }}
            >
              <span>TOTAL AMOUNT:</span>
              <span>₹{totalInRupees.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Info Box */}
          <div style={{ border: '2px solid #007bff', borderRadius: '4px', padding: '15px', marginBottom: '30px', backgroundColor: '#f0f7ff' }}>
            <h3 style={{ color: '#007bff', margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>✓ PAYMENT CONFIRMED</h3>
            <p style={{ margin: '5px 0', fontSize: '13px' }}>
              <strong>Payment ID:</strong> {order.payment?.razorpayPaymentId || 'N/A'}
            </p>
            <p style={{ margin: '5px 0', fontSize: '13px' }}>
              <strong>Amount:</strong> ₹{totalInRupees.toFixed(2)}
            </p>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', borderTop: '1px solid #e0e0e0', paddingTop: '20px', color: '#666', fontSize: '12px' }}>
            <p>If you have any questions about your order, please contact us at support@example.com</p>
            <p style={{ fontWeight: 'bold' }}>Thank you for shopping with us!</p>
            <p style={{ color: '#999', fontSize: '11px' }} suppressHydrationWarning>
              Generated on {new Date(order.createdAt).toLocaleDateString('en-IN')} 
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
