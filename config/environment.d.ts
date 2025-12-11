export default function (environment: string): {
  modulePrefix: string;
  environment: string;
  rootURL: string;
  locationType: string;
  SCHEMA_VERSION: number;
  APP: Record<string, unknown>;
  api: {
    host: string;
  };
  cognito: {
    poolId: string;
    clientId: string;
    identityPoolId: string;
    region: string;
  };
  supabase: {
    url: string;
    anonKey: string;
  };
  flashMessageDefaults: {
    injectionFactories: string[];
  };
  orbit: {
    skipValidatorService: boolean;
  };
  [key: string]: unknown;
};
