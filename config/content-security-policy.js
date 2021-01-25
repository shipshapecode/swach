// config/content-security-policy.js

module.exports = function (/*environment*/) {
  return {
    delivery: ['meta'],
    enabled: false, // environment !== 'test',
    failTests: true,
    policy: {
      'default-src': ["'none'"],
      'script-src': ['http://localhost:7020', "'self'", "'unsafe-inline'"],
      'font-src': ["'self'"],
      'frame-src': ["'self'"],
      'connect-src': ["'self'"],
      'img-src': ['data:', "'self'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'media-src': ["'self'"]
    },
    reportOnly: true
  };
};
