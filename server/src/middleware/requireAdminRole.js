function requireAdminRole(req, res, next) {
  const role = String(req.get('x-user-role') || '').trim().toUpperCase();
  if (role === 'CFO' || role === 'ADMIN') {
    return next();
  }

  return res.status(403).json({
    error: 'Forbidden',
    message: 'CFO or ADMIN role required.'
  });
}

module.exports = requireAdminRole;
