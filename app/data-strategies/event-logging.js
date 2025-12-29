import { EventLoggingStrategy } from '@orbit/coordinator';
import config from 'Swach/config/environment';

const factory = {
  create() {
    return new EventLoggingStrategy();
  },
};

export default config.environment === 'development' ? factory : null;
