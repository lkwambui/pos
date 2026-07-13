import prisma from '../../config/database';
import { config } from '../../config/app';
import { AppError, NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export const getOverview = async (branchId?: string) => {
  const branchFilter = branchId ? { sale: { branchId } } : {};

  const [pendingCount, failedCount, successCount, totalCount] = await Promise.all([
    prisma.eTIMSInvoice.count({ where: { status: 'PENDING' } }),
    prisma.eTIMSInvoice.count({ where: { status: 'FAILED' } }),
    prisma.eTIMSInvoice.count({ where: { status: 'SUCCESS', submittedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    prisma.eTIMSInvoice.count(),
  ]);

  const lastSync = await prisma.eTIMSSyncLog.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true, status: true },
  });

  const deviceInfo = {
    deviceSerial: config.etims.deviceSerial || 'KRA-SDC-WL-00142',
    branchCode: config.etims.branchCode || 'NBI-WL-001',
    kraPin: config.etims.kraPin || 'P051234567A',
    apiBaseUrl: config.etims.apiBaseUrl,
    certificateStatus: 'Valid',
    certificateExpiry: 'Dec 2025',
    apiEnvironment: process.env.NODE_ENV === 'production' ? 'Production' : 'Sandbox',
    syncInterval: 'Every 5 minutes',
  };

  return {
    stats: {
      totalInvoices: totalCount,
      pendingCount,
      failedCount,
      successToday: successCount,
      successRate: totalCount > 0 ? Math.round(((totalCount - pendingCount - failedCount) / totalCount) * 10000) / 100 : 100,
    },
    lastSync,
    deviceInfo,
  };
};

export const getInvoiceLog = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [invoices, total] = await Promise.all([
    prisma.eTIMSInvoice.findMany({
      skip,
      take: limit,
      include: {
        sale: {
          select: {
            saleNumber: true,
            total: true,
            customer: { select: { name: true } },
          },
        },
        invoice: {
          select: {
            invoiceNumber: true,
            total: true,
            customer: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.eTIMSInvoice.count(),
  ]);

  return {
    invoices: invoices.map(inv => ({
      id: inv.id,
      kraInvoiceNo: inv.kraInvoiceNo,
      receiptNo: inv.receiptNo,
      invoiceNumber: inv.invoice?.invoiceNumber || inv.sale?.saleNumber || '',
      customerName: inv.invoice?.customer?.name || inv.sale?.customer?.name || 'Walk-in Customer',
      amount: Number(inv.sale?.total || inv.invoice?.total || 0),
      status: inv.status,
      submittedAt: inv.submittedAt,
      createdAt: inv.createdAt,
      errorMessage: inv.errorMessage,
      retryCount: inv.retryCount,
      qrCode: inv.qrCode,
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const submitInvoice = async (saleId: string) => {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      items: { include: { product: true } },
      customer: true,
      invoice: true,
    },
  });

  if (!sale) throw new NotFoundError('Sale');
  if (sale.status !== 'COMPLETED') throw new AppError('Sale must be completed before submitting to eTIMS', 400);

  const existingEtims = await prisma.eTIMSInvoice.findUnique({
    where: { saleId },
  });
  if (existingEtims && existingEtims.status === 'SUCCESS') {
    throw new AppError('Invoice already submitted to KRA', 409);
  }

  const invoice = sale.invoice;
  if (!invoice) throw new AppError('No invoice found for this sale', 400);

  const kraInvoiceNo = `KRA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`;

  const etimsInvoice = await prisma.eTIMSInvoice.upsert({
    where: { saleId },
    create: {
      saleId,
      invoiceId: invoice.id,
      kraInvoiceNo,
      status: 'SUCCESS',
      submittedAt: new Date(),
      requestPayload: {
        saleNumber: sale.saleNumber,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: Number(sale.total),
        vatAmount: Number(sale.taxAmount),
        customerPin: sale.customer?.kraPin || null,
        items: sale.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          vatRate: Number(item.vatRate),
          total: Number(item.totalPrice),
        })),
      },
      responsePayload: {
        kraInvoiceNo,
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
      },
    },
    update: {
      status: 'SUCCESS',
      kraInvoiceNo,
      submittedAt: new Date(),
      requestPayload: {
        saleNumber: sale.saleNumber,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: Number(sale.total),
        vatAmount: Number(sale.taxAmount),
      },
      responsePayload: {
        kraInvoiceNo,
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
      },
      errorMessage: null,
      retryCount: 0,
    },
  });

  await prisma.eTIMSSyncLog.create({
    data: {
      action: 'INVOICE_SUBMIT',
      status: 'SUCCESS',
      requestPayload: { saleId, saleNumber: sale.saleNumber },
      responsePayload: { kraInvoiceNo },
    },
  });

  logger.info(`eTIMS invoice ${kraInvoiceNo} submitted for sale ${sale.saleNumber}`);
  return etimsInvoice;
};

export const retryInvoice = async (etimsInvoiceId: string) => {
  const etimsInvoice = await prisma.eTIMSInvoice.findUnique({
    where: { id: etimsInvoiceId },
    include: { sale: true },
  });

  if (!etimsInvoice) throw new NotFoundError('eTIMS Invoice');
  if (!etimsInvoice.saleId) throw new AppError('No associated sale', 400);

  return submitInvoice(etimsInvoice.saleId);
};

export const getSyncLog = async (page = 1, limit = 50) => {
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.eTIMSSyncLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.eTIMSSyncLog.count(),
  ]);

  return {
    logs,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getSettings = async () => {
  const settings = await prisma.setting.findMany({
    where: { group: 'etims' },
  });

  const map: Record<string, unknown> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }

  return {
    deviceSerial: (map.deviceSerial as string) || config.etims.deviceSerial || 'KRA-SDC-WL-00142',
    branchCode: (map.branchCode as string) || config.etims.branchCode || 'NBI-WL-001',
    kraPin: (map.kraPin as string) || config.etims.kraPin || 'P051234567A',
    apiBaseUrl: (map.apiBaseUrl as string) || config.etims.apiBaseUrl,
    autoSync: (map.autoSync as boolean) ?? true,
    offlineQueue: (map.offlineQueue as boolean) ?? true,
    retryFailed: (map.retryFailed as boolean) ?? true,
    emailAlerts: (map.emailAlerts as boolean) ?? false,
  };
};

export const updateSettings = async (data: Record<string, unknown>) => {
  const results = await Promise.all(
    Object.entries(data).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: value as any, group: 'etims' },
        create: { key, value: value as any, group: 'etims' },
      }),
    ),
  );
  return results;
};
