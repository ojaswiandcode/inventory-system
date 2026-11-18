const AppError = require('../utils/AppError');

// Reject malformed MongoDB ObjectIds before hitting the database
exports.validateId = (req, res, next) => {
  if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
    return next(new AppError(`Invalid product ID: ${req.params.id}`, 400));
  }
  next();
};

// Body must exist and not be empty
exports.requireBody = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
    return next(new AppError('Request body cannot be empty', 400));
  }
  next();
};

// PATCH /:id/stock expects { "change": <non-zero integer> }
exports.validateStockChange = (req, res, next) => {
  const { change } = req.body || {};
  if (typeof change !== 'number' || !Number.isInteger(change) || change === 0) {
    return next(
      new AppError(
        "'change' must be a non-zero integer (positive = restock, negative = sale)",
        400
      )
    );
  }
  next();
};
