import { v4 as uuidv4 } from 'uuid';

export const generateId = (): string => uuidv4();

export const generateSku = (name: string, index: number): string => {
  const prefix = name.substring(0, 3).toUpperCase();
  return `${prefix}-${Date.now()}-${index}`;
};

export const generateSaleNumber = (): string => {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SALE-${y}${m}${d}-${rand}`;
};

export const generateInvoiceNumber = (): string => {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${y}${m}${d}-${rand}`;
};

export const generateOrderNumber = (): string => {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PO-${y}${m}${d}-${rand}`;
};

export const generateQuoteNumber = (): string => {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `QTE-${y}${m}${d}-${rand}`;
};

export const generateReturnNumber = (): string => {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RTN-${y}${m}${d}-${rand}`;
};

export const generateGRN = (): string => {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `GRN-${y}${m}${d}-${rand}`;
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const calculateTotals = (items: { quantity: number; unitPrice: number; discount?: number; vatRate?: number }[]) => {
  let subtotal = 0;
  let discountTotal = 0;
  let taxAmount = 0;

  for (const item of items) {
    const lineTotal = item.quantity * item.unitPrice;
    const lineDiscount = item.discount || 0;
    const lineAfterDiscount = lineTotal - lineDiscount;
    const vatRate = (item.vatRate || 16) / 100;
    const vatAmount = lineAfterDiscount * vatRate;

    subtotal += lineTotal;
    discountTotal += lineDiscount;
    taxAmount += vatAmount;
  }

  const total = subtotal - discountTotal + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discountTotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};

export const paginate = (page: number, limit: number) => {
  const p = Math.max(1, page);
  const l = Math.min(Math.max(1, limit), 100);
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
};

export const buildDateFilter = (startDate?: string, endDate?: string) => {
  const filter: Record<string, unknown> = {};
  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    filter.createdAt = dateFilter;
  }
  return filter;
};
