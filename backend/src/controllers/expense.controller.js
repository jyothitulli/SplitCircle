import * as expenseService from '../services/expense.service.js';
import {
  validateCircleIdFromParams,
  validateCreateExpenseInput,
  validateExpenseIdParam,
} from '../validators/expense.validator.js';

export async function create(req, res, next) {
  try {
    const circleId = validateCircleIdFromParams(req.params);
    const input = validateCreateExpenseInput(req.body);
    const expense = await expenseService.createExpense(req.user.id, circleId, input);

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: { expense },
    });
  } catch (error) {
    next(error);
  }
}

export async function listForCircle(req, res, next) {
  try {
    const circleId = validateCircleIdFromParams(req.params);
    const expenses = await expenseService.getExpensesForCircle(req.user.id, circleId);

    res.status(200).json({
      success: true,
      data: { expenses },
    });
  } catch (error) {
    next(error);
  }
}

export async function getById(req, res, next) {
  try {
    const circleId = validateCircleIdFromParams(req.params);
    const expenseId = validateExpenseIdParam(req.params);
    const expense = await expenseService.getExpenseById(req.user.id, circleId, expenseId);

    res.status(200).json({
      success: true,
      data: { expense },
    });
  } catch (error) {
    next(error);
  }
}
