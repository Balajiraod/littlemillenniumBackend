const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};

const authorizeBranch = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  if (req.user.role === 'super-admin') return next();

  const branchId = req.params.branchId || req.body.branch || req.query.branch;
  if (branchId && req.user.branch) {
    if (req.user.branch._id.toString() !== branchId.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied to this branch.' });
    }
  }
  next();
};

const authorizeChildAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  if (['super-admin', 'branch-admin', 'teacher'].includes(req.user.role)) return next();

  if (req.user.role === 'parent') {
    const Child = require('../models/Child');
    const childId = req.params.childId || req.params.id;
    if (childId) {
      const child = await Child.findById(childId);
      if (!child) {
        return res.status(404).json({ success: false, message: 'Child not found.' });
      }
      const isParent = child.parents.some(p => p.user?.toString() === req.user._id.toString());
      if (!isParent) {
        return res.status(403).json({ success: false, message: 'Access denied to this child record.' });
      }
    }
  }
  next();
};

module.exports = { authorize, authorizeBranch, authorizeChildAccess };
