const crypto = require('crypto');
const Transaction = require('../models/Transaction');

/**
 * Create a Mock Razorpay order and a pending Transaction
 */
const createOrder = async ({ amount, currency = 'INR', type, userId, companyId, metadata = {} }) => {
  const orderId = `demo_order_${crypto.randomBytes(4).toString('hex')}`;
  const order = {
    id: orderId,
    amount: amount * 100, // paise
    currency,
    receipt: `rcpt_${Date.now()}`,
  };

  const transaction = await Transaction.create({
    user: userId,
    company: companyId,
    type,
    amount,
    currency,
    razorpayOrderId: order.id,
    status: 'PENDING',
    metadata,
  });

  return { order, transactionId: transaction._id };
};

/**
 * Verify Mock payment signature and update Transaction
 */
const verifyPayment = async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  // In demo mode, we'll accept the payment as valid if the razorpayOrderId exists
  const transaction = await Transaction.findOneAndUpdate(
    { razorpayOrderId },
    { razorpayPaymentId: razorpayPaymentId || `demo_pay_${crypto.randomBytes(6).toString('hex')}`, razorpaySignature: 'demo_sig', status: 'SUCCESS' },
    { new: true }
  );

  if (!transaction) throw new Error('Transaction not found');
  return transaction;
};

module.exports = { createOrder, verifyPayment };
