/**
 * Express.js middleware, check is user logged in.
 * If the user is logged in then continue the request, otherwise response the request with a message.
 * @param {string} [message] - message sends back via api
 */
const authMiddleware = (message) => (req, res, next) => {
  // Only logged-in user has this property
  if (req.session.email) {
    next();
  } else {
    res.status(403).json({error: true, message: message || 'Authentication required.'});
  }
};

const authSuperuserMiddleware = (message) => (req, res, next) => {
  // Only logged-in user has this property
  if (req.session.userTypes.includes('superuser')) {
    next();
  } else {
    res.status(403).json({error: true, message: message || 'Wrong Authentication.'});
  }
};

// A user can only handle its own affairs
const authGeneralMiddleware = (message) => (req, res, next) => {
  const {id} = req.params;
  if (!id)
    return res.status(400).json({success: false, message: 'Id is needed'});

  if (id && req.session._id !== id) {
    res.status(403).json({error: true, message: message || 'Wrong Authentication.'});
  } else {
    next();
  }
};

const authGroupAdminMiddleware = (message) => (req, res, next) => {
  if (req.session.userTypes.includes('groupAdmin')) {
    next();
  } else {
    res.status(403).json({error: true, message: message || 'Wrong Authentication.'});
  }
};

const authAdminMiddleware = (message) => (req, res, next) => {
  if (req.session.userTypes.includes('admin')) {
    next();
  } else {
    res.status(403).json({error: true, message: message || 'Wrong Authentication.'});
  }
};

module.exports = {
  authMiddleware,
  authSuperuserMiddleware,
  authGeneralMiddleware,
  authGroupAdminMiddleware,
  authAdminMiddleware
};
