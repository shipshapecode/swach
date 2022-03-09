// config/content-security-policy.js

module.exports = function (environment) {
  return {
    delivery: ['meta'],
    enabled: environment !== 'test',
    failTests: true,
    policy: {
      'default-src': ["'none'"],
      'script-src': ['http://localhost:7020', "'self'", "'unsafe-inline'"],
      'font-src': ["'self'"],
      'frame-src': ["'self'"],
      'connect-src': [
        'https://cognito-idp.us-east-2.amazonaws.com/',
        'https://cognito-identity.us-east-2.amazonaws.com/',
        'https://jpuj8ukmx8.execute-api.us-east-2.amazonaws.com/dev/',
        'https://n3tygwauml.execute-api.us-east-2.amazonaws.com/prod/',
        'https://sentry.io/',
        'http://localhost:3000',
        "'self'"
      ],
      'img-src': ['data:', "'self'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'media-src': ["'self'"]
    },
    reportOnly: true
  };
};
