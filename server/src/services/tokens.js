const jwt = require('jsonwebtoken');

function issueToken(user, expiresIn = '2h') {
  return jwt.sign({ sub: String(user._id), role: user.role }, process.env.JWT_SECRET, { expiresIn });
}

module.exports = { issueToken };
