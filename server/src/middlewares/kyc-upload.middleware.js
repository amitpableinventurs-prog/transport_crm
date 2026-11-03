const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_request, file, callback) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.mimetype)) {
            return callback(Object.assign(new Error('Only PDF, JPEG or PNG KYC files are allowed.'), { statusCode: 415 }));
        }
        return callback(null, true);
    }
});

exports.uploadKycDocument = (request, response, next) => {
    upload.single('file')(request, response, (error) => {
        if (!error) return next();
        const statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : error.statusCode || 400;
        return response.status(statusCode).json({ success: false, message: error.message });
    });
};