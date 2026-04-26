const logger = require('../utils/logger');

let razorpay = null;
let stripe = null;

try {
  if (process.env.RAZORPAY_KEY_ID) {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    logger.info('Razorpay initialized');
  }
} catch (err) {
  logger.warn('Razorpay not initialized:', err.message);
}

try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    logger.info('Stripe initialized');
  }
} catch (err) {
  logger.warn('Stripe not initialized:', err.message);
}

const createRazorpayOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  if (!razorpay) {
    return {
      id: `mock_order_${Date.now()}`,
      amount: amount * 100,
      currency,
      receipt,
      status: 'created',
      mock: true,
    };
  }

  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency,
    receipt,
    notes,
  });
  logger.info(`Razorpay order created: ${order.id}`);
  return order;
};

const verifyRazorpayPayment = (orderId, paymentId, signature) => {
  const crypto = require('crypto');
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'test')
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
};

const createStripePaymentIntent = async ({ amount, currency = 'inr', metadata = {} }) => {
  if (!stripe) {
    return {
      client_secret: `mock_pi_${Date.now()}_secret`,
      id: `mock_pi_${Date.now()}`,
      amount: amount * 100,
      currency,
      mock: true,
    };
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100,
    currency,
    metadata,
    automatic_payment_methods: { enabled: true },
  });
  logger.info(`Stripe PaymentIntent created: ${paymentIntent.id}`);
  return paymentIntent;
};

const createFeePaymentOrder = async (invoice, gateway = 'razorpay') => {
  const receipt = `INV-${invoice.invoiceNumber}-${Date.now()}`;
  const notes = {
    invoiceId: invoice._id.toString(),
    invoiceNumber: invoice.invoiceNumber,
    childId: invoice.child.toString(),
  };

  if (gateway === 'stripe') {
    return createStripePaymentIntent({ amount: invoice.balance, metadata: notes });
  }
  return createRazorpayOrder({ amount: invoice.balance, receipt, notes });
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createStripePaymentIntent,
  createFeePaymentOrder,
};
