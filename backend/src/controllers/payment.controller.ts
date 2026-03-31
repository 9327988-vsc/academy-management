import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as paymentService from '../services/payment.service';

export async function listPayments(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status, month } = req.query;
    const payments = await paymentService.listPayments({
      status: status as string | undefined,
      month: month as string | undefined,
    });
    res.json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
}

export async function createPayment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { studentId, amount, month, description, dueDate, method } = req.body;
    const payment = await paymentService.createPayment({
      studentId: parseInt(studentId),
      amount,
      month,
      dueDate: dueDate ? new Date(dueDate) : new Date(),
      description,
      method,
    });
    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
}

export async function updatePaymentStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!['PAID', 'PENDING', 'OVERDUE', 'CANCELLED'].includes(status)) {
      res.status(400).json({ success: false, message: '유효하지 않은 결제 상태입니다.' });
      return;
    }
    const payment = await paymentService.updatePaymentStatus(id, status);
    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
}

export async function deletePayment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    await paymentService.deletePayment(id);
    res.json({ success: true, message: '결제 내역이 삭제되었습니다.' });
  } catch (err) {
    next(err);
  }
}

export async function getPaymentStats(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const stats = await paymentService.getPaymentStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}
