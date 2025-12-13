import { validationResult } from 'express-validator';

/**
 * Middleware de validation des requêtes
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Erreur de validation',
      details: errors.array()
    });
  }
  
  next();
};

