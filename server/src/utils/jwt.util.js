const jwt = require('jsonwebtoken');

const getSecret = (key) => {
    const secret = process.env[key];
    if (!secret || secret.length < 32) {
        throw Object.assign(new Error(`${key} must be configured with at least 32 characters.`), { statusCode: 503 });
    }
    return secret;
};

const generateAccessToken = (payload) => jwt.sign(payload, getSecret('JWT_ACCESS_SECRET'), { expiresIn: '1d' });

const generateTokens = (payload) => {
    const accessToken = generateAccessToken(payload);
    const refreshToken = jwt.sign(payload, getSecret('JWT_REFRESH_SECRET'), { expiresIn: '30d' });
    return { accessToken, refreshToken };
};
const verifyAccessToken = (token) => {
    const secret = getSecret('JWT_ACCESS_SECRET');
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        throw new Error('Invalid or expired access token');
    }
}

const verifyRefreshToken = (token) => {
    const secret = getSecret('JWT_REFRESH_SECRET');
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};


module.exports = {
    generateAccessToken,
    generateTokens,
    verifyAccessToken,
    verifyRefreshToken
}