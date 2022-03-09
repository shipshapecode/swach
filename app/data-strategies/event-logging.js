import { EventLoggingStrategy } from '@orbit/coordinator';

import config from 'swach/config/environment';

export default {
  create() {
    if (config.environment === 'development') {
      return new EventLoggingStrategy();
    }

    return null;
  }
};
