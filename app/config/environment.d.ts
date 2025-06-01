/**
 * Type declarations for
 *    import config from 'swach/config/environment'
 */
declare const config: {
  environment: string;
  modulePrefix: string;
  podModulePrefix: string;
  locationType: 'history' | 'hash' | 'none';
  rootURL: string;
  APP: Record<string, unknown>;
  SCHEMA_VERSION: number;
};

export default config;
