// src/modules/auth/auth.routes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { Users } = require('../../db/repository');
const { signToken } = require('../../middleware/auth');
const { validate, registerSchema, loginSchema } = require('../../utils/validation');
const { ApiError } = require('../../middleware/errorHandler');

const router = express.Router();

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (Users.findByEmail(email)) {
      throw new ApiError(409, 'email_taken', 'An account with this email already exists');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = Users.create({ email, passwordHash });
    const token = signToken(user);
    res.status(201).json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    next(err);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = Users.findByEmail(email);
    if (!user) throw new ApiError(401, 'invalid_credentials', 'Email or password is incorrect');

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) throw new ApiError(401, 'invalid_credentials', 'Email or password is incorrect');

    const token = signToken(user);
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
