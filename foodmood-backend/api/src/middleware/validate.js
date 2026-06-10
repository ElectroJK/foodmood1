// Zod-based validation middleware. Pass a schema with { body, query, params } shape.
export function validate(schema) {
  return (req, res, next) => {
    try {
      if (schema.body) req.body = schema.body.parse(req.body);
      if (schema.query) req.query = schema.query.parse(req.query);
      if (schema.params) req.params = schema.params.parse(req.params);
      next();
    } catch (err) {
      return res.status(400).json({
        error: 'Validation failed',
        issues: err.issues || err.errors || [{ message: err.message }],
      });
    }
  };
}
