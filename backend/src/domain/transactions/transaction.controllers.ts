import { type Response } from 'express';
import { type AuthRequest } from '@core/middleware';
import { TransactionStore } from '@stores/transaction.store';
import { UserStore } from '@stores/user.store';
import type { CreateTransactionDTO, TransactionStatus, TransactionType } from '../../types/database.types';

// ============ TRANSACTIONS ============

export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Only admins can create transactions manually
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'ADMIN') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only admins can create transactions',
      });
      return;
    }

    const transactionData: CreateTransactionDTO = req.body;

    // Validation
    if (!transactionData.type || !transactionData.amount) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'type and amount are required',
      });
      return;
    }

    const transaction = await TransactionStore.createTransaction(transactionData);

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction,
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create transaction',
      details: errorMessage,
    });
  }
};

export const getMyTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const transactions = await TransactionStore.getTransactionsByUserId(req.user.id);

    res.status(200).json({
      transactions,
      count: transactions.length,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get transactions',
    });
  }
};

export const getTransactionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { transactionId } = req.params;
    if (!transactionId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Transaction ID is required',
      });
      return;
    }

    const transaction = await TransactionStore.getTransactionById(transactionId);
    if (!transaction) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Transaction not found',
      });
      return;
    }

    // Check access - user must be from_user_id or to_user_id, or admin
    const user = await UserStore.getUserById(req.user.id);
    const isAdmin = user?.role === 'ADMIN';
    const hasAccess =
      transaction.from_user_id === req.user.id ||
      transaction.to_user_id === req.user.id ||
      isAdmin;

    if (!hasAccess) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this transaction',
      });
      return;
    }

    res.status(200).json({
      transaction,
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get transaction',
    });
  }
};

export const getAllTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Only admins can view all transactions
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'ADMIN') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only admins can view all transactions',
      });
      return;
    }

    const { status, type } = req.query;
    const transactions = await TransactionStore.getAllTransactions(
      status ? (status as TransactionStatus) : undefined,
      type ? (type as TransactionType) : undefined
    );

    res.status(200).json({
      transactions,
      count: transactions.length,
    });
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get transactions',
    });
  }
};

export const updateTransactionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Only admins can update transaction status
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'ADMIN') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only admins can update transaction status',
      });
      return;
    }

    const { transactionId } = req.params;
    if (!transactionId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Transaction ID is required',
      });
      return;
    }

    const { status, failure_reason } = req.body;
    if (!status) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'status is required',
      });
      return;
    }

    const transaction = await TransactionStore.updateTransactionStatus(
      transactionId,
      status,
      failure_reason
    );

    res.status(200).json({
      message: 'Transaction status updated successfully',
      transaction,
    });
  } catch (error) {
    console.error('Update transaction status error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update transaction status',
      details: errorMessage,
    });
  }
};

