
const runValidation = (validator, payload, options) => {
    if (typeof validator === 'function') {
        return validator(payload);
    }

    if (!validator || typeof validator.validate !== 'function') {
        throw new TypeError('Validator must be a Joi schema or validation function.');
    }

    return validator.validate(payload, options);
};

const validate = (validatorSchema) => {
    return (req, res, next) => {
        const { error, value } = runValidation(validatorSchema, req.body, {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: false
        });

        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        req.body = value;
        next();
    };
};

const validateQuery = (validatorSchema) => (req, res, next) => {
    const { error, value } = runValidation(validatorSchema, req.query, {
        abortEarly: false,
        convert: true,
        allowUnknown: false,
        stripUnknown: false
    });

    if (error) {
        const errors = error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message
        }));

        return res.status(400).json({
            success: false,
            message: 'Query validation failed',
            errors
        });
    }

    req.validatedQuery = value;
    return next();
};

module.exports = { validate, validateQuery };
