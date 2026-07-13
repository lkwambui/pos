import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess, sendCreated } from '../../utils/response';
import { NotFoundError, AppError } from '../../utils/errors';
import * as mpesaService from './mpesa.service';
import { logger } from '../../utils/logger';

export const initiateStkPush = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paymentId, phone } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { sale: true },
    });

    if (!payment) throw new NotFoundError('Payment');
    if (payment.method !== 'MPESA') throw new AppError('Payment method is not M-Pesa', 400);
    if (payment.status !== 'PENDING') throw new AppError('Payment is not in PENDING status', 400);

    const accountRef = payment.sale?.saleNumber || payment.id.substring(0, 8);

    const result = await mpesaService.stkPush(phone, Number(payment.amount), accountRef);

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        mpesaCheckoutRequestId: result.CheckoutRequestID,
        mpesaMerchantRequestId: result.MerchantRequestID,
        mpesaPhone: phone,
      },
    });

    sendSuccess(res, {
      checkoutRequestId: result.CheckoutRequestID,
      merchantRequestId: result.MerchantRequestID,
      responseDescription: result.ResponseDescription,
    }, 'STK Push sent to customer phone');
  } catch (error) {
    next(error);
  }
};

export const mpesaCallback = async (req: Request, res: Response) => {
  try {
    const { Body } = req.body;

    if (!Body?.stkCallback) {
      logger.warn({ body: req.body }, 'Invalid M-Pesa callback body');
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;

    logger.info({ CheckoutRequestID, ResultCode, ResultDesc }, 'M-Pesa callback received');

    const payment = await prisma.payment.findFirst({
      where: { mpesaCheckoutRequestId: CheckoutRequestID },
      include: { sale: true },
    });

    if (!payment) {
      logger.warn({ CheckoutRequestID }, 'No payment found for M-Pesa callback');
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    if (ResultCode === 0) {
      const metadata = CallbackMetadata?.Item || [];
      const mpesaReceipt = metadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value || '';
      const phone = metadata.find((item: any) => item.Name === 'PhoneNumber')?.Value?.toString() || '';
      const amount = parseFloat(metadata.find((item: any) => item.Name === 'Amount')?.Value || '0');

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'PAID',
            reference: mpesaReceipt || payment.reference,
            mpesaPhone: phone || payment.mpesaPhone,
            notes: `M-Pesa: ${mpesaReceipt}`,
          },
        });

        if (payment.saleId) {
          const sale = await tx.sale.findUnique({ where: { id: payment.saleId } });
          if (sale) {
            const totalPaid = parseFloat(sale.amountPaid.toString()) + amount;
            const totalVal = parseFloat(sale.total.toString());

            await tx.sale.update({
              where: { id: payment.saleId },
              data: {
                amountPaid: totalPaid,
                changeAmount: totalPaid > totalVal ? totalPaid - totalVal : 0,
                paymentStatus: totalPaid >= totalVal ? 'PAID' : 'PARTIALLY_PAID',
              },
            });
          }
        }

        if (payment.invoiceId) {
          const invoice = await tx.invoice.findUnique({ where: { id: payment.invoiceId } });
          if (invoice) {
            const totalPaid = parseFloat(invoice.amountPaid.toString()) + amount;
            const totalVal = parseFloat(invoice.total.toString());

            await tx.invoice.update({
              where: { id: payment.invoiceId },
              data: {
                amountPaid: totalPaid,
                status: totalPaid >= totalVal ? 'PAID' : 'PARTIALLY_PAID',
              },
            });
          }
        }
      });

      logger.info({ CheckoutRequestID, mpesaReceipt }, 'M-Pesa payment completed');
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'REFUNDED', notes: `M-Pesa failed: ${ResultDesc}` },
      });

      logger.warn({ CheckoutRequestID, ResultCode, ResultDesc }, 'M-Pesa payment failed');
    }

    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error: any) {
    logger.error({ error: error.message }, 'M-Pesa callback error');
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
};

export const queryPaymentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const checkoutRequestId = req.params.checkoutRequestId as string;

    const payment = await prisma.payment.findFirst({
      where: { mpesaCheckoutRequestId: checkoutRequestId },
    });

    if (!payment) throw new NotFoundError('Payment');

    if (payment.status !== 'PENDING') {
      return sendSuccess(res, {
        status: payment.status,
        reference: payment.reference,
        method: payment.method,
      });
    }

    const result = await mpesaService.queryStatus(checkoutRequestId);

    return sendSuccess(res, {
      status: payment.status,
      resultCode: result.resultCode,
      resultDesc: result.resultDesc,
      checkoutRequestId,
    });
  } catch (error) {
    next(error);
  }
};
