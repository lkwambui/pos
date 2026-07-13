import { config } from '../../config/app';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/errors';

interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

interface QueryResponse {
  ResponseCode?: string;
  ResultCode?: string;
  ResultDesc?: string;
}

function getTimestamp(): string {
  const now = new Date();
  const y = now.getFullYear().toString();
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  const h = now.getHours().toString().padStart(2, '0');
  const min = now.getMinutes().toString().padStart(2, '0');
  const s = now.getSeconds().toString().padStart(2, '0');
  return `${y}${m}${d}${h}${min}${s}`;
}

function getPassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(shortcode + passkey + timestamp).toString('base64');
}

function getBaseUrl(): string {
  return config.mpesa.env === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const auth = Buffer.from(`${config.mpesa.consumerKey}:${config.mpesa.consumerSecret}`).toString('base64');

  const res = await fetch(`${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error({ status: res.status, body: text }, 'M-Pesa auth failed');
    throw new AppError('Failed to authenticate with M-Pesa', 502);
  }

  const data: { access_token: string; expires_in: string } = await res.json() as { access_token: string; expires_in: string };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + 3500 * 1000,
  };
  return data.access_token;
}

export async function stkPush(phone: string, amount: number, accountRef: string): Promise<{
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseDescription: string;
}> {
  const token = await getAccessToken();
  const timestamp = getTimestamp();
  const password = getPassword(config.mpesa.shortcode, config.mpesa.passkey, timestamp);

  const formattedPhone = phone.replace(/^0+/, '254').replace(/^\+/, '');
  if (!formattedPhone.startsWith('254') || formattedPhone.length !== 12) {
    throw new AppError('Invalid phone number format. Use 254XXXXXXXXX', 400);
  }

  const res = await fetch(`${getBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: config.mpesa.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount).toString(),
      PartyA: formattedPhone,
      PartyB: config.mpesa.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: config.mpesa.callbackUrl,
      AccountReference: accountRef.substring(0, 12),
      TransactionDesc: `Payment to ${config.mpesa.appName}`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error({ status: res.status, body: text }, 'M-Pesa STK Push request failed');
    throw new AppError('Failed to initiate M-Pesa payment', 502);
  }

  const data: StkPushResponse = await res.json() as StkPushResponse;

  if (data.ResponseCode !== '0') {
    throw new AppError(`M-Pesa STK Push failed: ${data.ResponseDescription}`, 400);
  }

  logger.info({ CheckoutRequestID: data.CheckoutRequestID }, 'M-Pesa STK Push initiated');

  return {
    MerchantRequestID: data.MerchantRequestID,
    CheckoutRequestID: data.CheckoutRequestID,
    ResponseDescription: data.ResponseDescription,
  };
}

export async function queryStatus(checkoutRequestId: string): Promise<{
  resultCode: string;
  resultDesc: string;
}> {
  const token = await getAccessToken();
  const timestamp = getTimestamp();
  const password = getPassword(config.mpesa.shortcode, config.mpesa.passkey, timestamp);

  const res = await fetch(`${getBaseUrl()}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: config.mpesa.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error({ status: res.status, body: text }, 'M-Pesa query status failed');
    throw new AppError('Failed to query M-Pesa payment status', 502);
  }

  const data: QueryResponse = await res.json() as QueryResponse;

  return {
    resultCode: data.ResultCode || data.ResponseCode || '1',
    resultDesc: data.ResultDesc || 'Unknown',
  };
}
