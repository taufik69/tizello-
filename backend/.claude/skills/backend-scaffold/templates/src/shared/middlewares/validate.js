// Joi schema-validation middleware. Formats Joi's error details into
// { field, message } pairs and throws AppError so the centralized error
// middleware sends the response — this file never calls ApiResponse itself.

import AppError from '../utils/AppError.js';
import httpStatus from '../constants/httpStatus.js';

// `target` selects which part of the request to validate — 'body' by
// default, or 'query' / 'params' for endpoints that validate those instead,
// e.g. `validate(listQuerySchema, 'query')`.
const validate =
  (schema, target = 'body') =>
  (req, res, next) => {
    const { error, value } = schema.validate(req[target], { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return next(new AppError(httpStatus.BAD_REQUEST, 'Validation failed', errors));
    }

    // Write the validated (Joi-coerced and defaulted) value back so
    // downstream layers receive normalized data — string "20" becomes 20.
    req[target] = value;

    next();
  };

export { validate };
export default validate;
