/**
 * J-Pop Corner - Modular Payment Gateway Integration
 * Supports PayMongo, HitPay Philippines, Xendit, and Manual QR Ph
 */

export const PHILIPPINE_PAYMENT_TIERS = [
  {
    tier: 'Tier 0',
    name: 'Manual QR Ph / E-Wallet Upload',
    monthlyFee: '₱0.00 (Free)',
    settlement: 'Instant Direct Transfer',
    rates: {
      qrPh: '0%',
      gcash: '0%',
      maya: '0%',
      cards: 'N/A',
    },
    description: 'Zero setup or transaction fees. Customers scan store static QR codes and upload payment verification receipts.',
  },
  {
    tier: 'Tier 1',
    name: 'PayMongo Philippines',
    monthlyFee: '₱0.00 (No subscription)',
    settlement: 'Weekly payout to linked PH bank account',
    rates: {
      qrPh: '~1.34%',
      gcash: '~2.23%',
      maya: '~1.79%',
      cards: '3.125% + ₱13.39 (plus 12% VAT on fee)',
    },
    description: 'Automated hosted checkout supporting GCash, Maya, QR Ph, and Visa/Mastercard.',
  },
  {
    tier: 'Tier 2',
    name: 'HitPay Philippines',
    monthlyFee: '₱0.00 (No platform fee)',
    settlement: 'T+1 for E-Wallets, T+7 for Online Cards',
    rates: {
      qrPh: '1.0% (min ₱20.00)',
      gcash: '2.3%',
      cards: '3.0% + ₱15.00',
    },
    description: 'Fast payout settlement gateway supporting unified QR Ph, e-wallets, and cards.',
  },
];

export const initiateThirdPartyCheckout = async ({ gateway = 'paymongo', amount, orderId, customer }) => {
  // Simulates or initiates third-party checkout session
  console.log(`[PaymentGateway] Initiating ${gateway} session for Order #${orderId}, Amount: ₱${amount}`);

  // In production with PAYMONGO_SECRET_KEY / HITPAY_API_KEY, this calls backend to generate hosted payment URL
  return {
    success: true,
    gateway,
    checkoutUrl: `https://checkout.${gateway}.com/pay/${orderId}?amount=${amount}`,
    referenceId: `REF-${gateway.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
  };
};
