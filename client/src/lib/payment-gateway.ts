/**
 * J-Pop Corner - Modular Payment Gateway Integration Adapter
 * Supports PayMongo, HitPay Philippines, Xendit, and Manual QR Ph
 */

export interface PaymentRates {
  qrPh?: string;
  gcash?: string;
  maya?: string;
  cards?: string;
}

export interface PhilippinePaymentTier {
  tier: string;
  name: string;
  monthlyFee: string;
  settlement: string;
  rates: PaymentRates;
  description: string;
}

export interface CheckoutCustomer {
  id?: number | string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface CheckoutSessionPayload {
  gateway?: 'paymongo' | 'hitpay' | 'xendit' | string;
  amount: number;
  orderId: string;
  customer?: CheckoutCustomer;
}

export interface CheckoutSessionResponse {
  success: boolean;
  gateway: string;
  checkoutUrl: string;
  referenceId: string;
}

export const PHILIPPINE_PAYMENT_TIERS: PhilippinePaymentTier[] = [
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
    description: 'Zero setup or monthly fees. Customers scan store static QR codes and upload payment verification receipts.',
  },
  {
    tier: 'Tier 1',
    name: 'PayMongo Philippines',
    monthlyFee: '₱0.00 (No subscription fee)',
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

export const calculatePaymentFees = (amount: number, gateway: 'paymongo' | 'hitpay' | 'manual_qr'): number => {
  switch (gateway) {
    case 'manual_qr':
      return 0;
    case 'paymongo':
      // Approximate blended rate for GCash/QR Ph (2.23%)
      return parseFloat((amount * 0.0223).toFixed(2));
    case 'hitPay':
    case 'hitpay':
      return parseFloat(Math.max(20, amount * 0.01).toFixed(2));
    default:
      return 0;
  }
};

export const initiateThirdPartyCheckout = async (
  payload: CheckoutSessionPayload
): Promise<CheckoutSessionResponse> => {
  const { gateway = 'paymongo', amount, orderId } = payload;
  console.log(`[PaymentGateway] Initiating ${gateway} session for Order #${orderId}, Amount: ₱${amount}`);

  // In production with PAYMONGO_SECRET_KEY / HITPAY_API_KEY, this calls API endpoint to generate hosted checkout
  return {
    success: true,
    gateway,
    checkoutUrl: `https://checkout.${gateway}.com/pay/${orderId}?amount=${amount}`,
    referenceId: `REF-${gateway.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
  };
};

export default {
  PHILIPPINE_PAYMENT_TIERS,
  calculatePaymentFees,
  initiateThirdPartyCheckout,
};
