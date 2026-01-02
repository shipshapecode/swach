import { getOwner } from '@ember/owner';

import BaseAuthenticator from 'ember-simple-auth/authenticators/base';

import type SupabaseService from '../services/supabase.ts';

export interface SupabaseAuthData {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface OtpCredentials {
  email: string;
  token: string;
}

export default class SupabaseAuthenticator extends BaseAuthenticator {
  get supabase(): SupabaseService {
    return getOwner(this)?.lookup('service:supabase') as SupabaseService;
  }

  /**
   * Authenticate with OTP code.
   * Called when user submits the verification code.
   */
  async authenticate(credentials: OtpCredentials): Promise<SupabaseAuthData> {
    const { email, token } = credentials;

    const { user, session } = await this.supabase.verifyOtp(email, token);

    return {
      userId: user.id,
      email: user.email ?? email,
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at ?? 0,
    };
  }

  /**
   * Restore session from Supabase's persisted storage.
   * Called on app startup to check if user is still logged in.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async restore(_data: SupabaseAuthData): Promise<SupabaseAuthData> {
    const session = await this.supabase.getSession();

    if (!session) {
      throw new Error('No active session');
    }

    const user = await this.supabase.getUser();

    if (!user) {
      throw new Error('No authenticated user');
    }

    return {
      userId: user.id,
      email: user.email ?? '',
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at ?? 0,
    };
  }

  /**
   * Invalidate session (logout).
   */
  async invalidate(): Promise<void> {
    await this.supabase.signOut();
  }
}
