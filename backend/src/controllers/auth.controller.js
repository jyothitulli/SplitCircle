import * as authService from '../services/auth.service.js';
import {
  validateRegisterInput,
  validateLoginInput,
} from '../validators/auth.validator.js';

export async function register(req, res, next) {
  try {
    const input = validateRegisterInput(req.body);
    const result = await authService.registerUser(input);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const input = validateLoginInput(req.body);
    const result = await authService.loginUser(input);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    const user = await authService.getUserById(req.user.id);

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}
