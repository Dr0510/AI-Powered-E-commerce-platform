export function generateReceiptHTML(order) {
  const items = order.items || [];
  
  // Helper to safely convert price to rupees
  const formatPrice = (priceInPaise) => {
    const paise = Math.round(Number(priceInPaise) || 0);
    return (paise / 100).toFixed(2);
  };

  const itemsHTML = items
    .map(
      (item) => {
        const itemPrice = formatPrice(item.priceInPaise || item.price * 100);
        const itemTotal = formatPrice((Math.round(Number(item.priceInPaise || item.price * 100)) * item.quantity));
        return `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left;">${item.title}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${itemPrice}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${itemTotal}</td>
    </tr>
  `;
      }
    )
    .join('');

  const totalAmount = formatPrice(order.totalInPaise);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Receipt</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
</head>
<body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0;">
  <div id="element-to-print" style="max-width: 800px; margin: 0 auto; padding: 40px; background: white;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 20px;">
      <h1 style="color: #007bff; margin: 0; font-size: 28px;">ORDER RECEIPT</h1>
      <p style="margin: 10px 0; color: #666;">Thank you for your purchase!</p>
    </div>

    <!-- Order Info -->
    <div style="margin-bottom: 30px;">
      <h2 style="color: #333; font-size: 16px; margin-top: 0;">ORDER DETAILS</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; color: #666;">Order ID:</td>
          <td style="padding: 8px; font-weight: bold;">${order._id.toString().slice(-8).toUpperCase()}</td>
        </tr>
        <tr>
          <td style="padding: 8px; color: #666;">Order Date:</td>
          <td style="padding: 8px;">${new Date(order.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}</td>
        </tr>
        <tr>
          <td style="padding: 8px; color: #666;">Payment Status:</td>
          <td style="padding: 8px;"><span style="background-color: #d4edda; color: #155724; padding: 4px 8px; border-radius: 4px;">✓ PAID</span></td>
        </tr>
      </table>
    </div>

    <!-- Customer Info -->
    <div style="margin-bottom: 30px;">
      <h2 style="color: #333; font-size: 16px; margin-top: 0;">SHIPPING ADDRESS</h2>
      <p style="margin: 5px 0; line-height: 1.6;">
        <strong>${order.customer?.name || 'N/A'}</strong><br>
        ${order.shippingAddress?.line1 || ''}<br>
        ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.pincode || ''}<br>
        ${order.shippingAddress?.country || 'India'}<br>
        📱 ${order.shippingAddress?.phone || 'N/A'}
      </p>
    </div>

    <!-- Items -->
    <div style="margin-bottom: 30px;">
      <h2 style="color: #333; font-size: 16px; margin-top: 0;">ITEMS ORDERED</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 12px; text-align: left; color: #666; border-bottom: 2px solid #e5e7eb;">Item</th>
            <th style="padding: 12px; text-align: center; color: #666; border-bottom: 2px solid #e5e7eb;">Qty</th>
            <th style="padding: 12px; text-align: right; color: #666; border-bottom: 2px solid #e5e7eb;">Price</th>
            <th style="padding: 12px; text-align: right; color: #666; border-bottom: 2px solid #e5e7eb;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
    </div>

    <!-- Payment Summary -->
    <div style="margin-bottom: 30px; background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 0; color: #666;">Subtotal:</td>
          <td style="padding: 10px 0; text-align: right; font-weight: bold;">₹${totalAmount}</td>
        </tr>
        <tr style="font-weight: bold; font-size: 18px;">
          <td style="padding: 15px 0;">TOTAL AMOUNT:</td>
          <td style="padding: 15px 0; text-align: right; color: #007bff;">₹${totalAmount}</td>
        </tr>
      </table>
    </div>

    <!-- Payment Info -->
    <div style="margin-bottom: 30px; background-color: #e7f3ff; padding: 15px; border-left: 4px solid #007bff; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #007bff; font-size: 14px;">✓ PAYMENT CONFIRMED</h3>
      <p style="margin: 5px 0; color: #333; font-size: 13px;">
        <strong>Payment ID:</strong> ${order.payment?.razorpayPaymentId || 'N/A'}<br>
        <strong>Payment Method:</strong> Razorpay<br>
        <strong>Amount:</strong> ₹${totalAmount}
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; color: #666; font-size: 12px;">
      <p>
        If you have any questions about your order, please contact us at support@example.com<br>
        <strong>Thank you for shopping with us!</strong>
      </p>
      <p style="color: #999; font-size: 11px;">
        Generated on ${new Date(order.createdAt).toLocaleDateString('en-IN')}
      </p>
    </div>
  </div>

  <script>
    const element = document.getElementById('element-to-print');
    const opt = {
      margin: 10,
      filename: 'receipt-${order._id.toString().slice(-8)}.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    html2pdf().set(opt).from(element).save();
  </script>
</body>
</html>
  `;
}
