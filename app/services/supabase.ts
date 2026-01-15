import { getOwner } from '@ember/owner';
import Service from '@ember/service';

import type {
  AuthChangeEvent,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

import type { EnvironmentConfig } from '../config/environment.ts';

interface Owner {
  resolveRegistration(name: string): EnvironmentConfig;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export default class SupabaseService extends Service {
  private _client: SupabaseClient | null = null;

  get client(): SupabaseClient {
    if (!this._client) {
      this._initializeClient();
    }

    return this._client!;
  }

  private _initializeClient(): void {
    const owner = getOwner(this) as Owner | undefined;
    const config = owner?.resolveRegistration('config:environment');
    const supabaseConfig = config?.supabase;

    if (!supabaseConfig?.url || !supabaseConfig?.anonKey) {
      throw new Error(
        'Supabase configuration is missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY.'
      );
    }

    this._client = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Electron app, no URL detection needed
      },
    });
  }

  get auth() {
    return this.client.auth;
  }

  /**
   * Send an OTP code to the user's email address.
   * This works for both new and existing users.
   */
  async signInWithOtp(email: string): Promise<void> {
    const { error } = await this.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true, // Auto-create user if they don't exist
      },
    });

    if (error) {
      throw error;
    }
  }

  /**
   * Verify the OTP code entered by the user.
   * Returns the session if successful.
   */
  async verifyOtp(
    email: string,
    token: string
  ): Promise<{ user: User; session: Session }> {
    const { data, error } = await this.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      throw error;
    }

    if (!data.user || !data.session) {
      throw new Error('Verification failed: No user or session returned');
    }

    return { user: data.user, session: data.session };
  }

  /**
   * Get the current session, if any.
   */
  async getSession(): Promise<Session | null> {
    const { data, error } = await this.auth.getSession();

    if (error) {
      throw error;
    }

    return data.session;
  }

  /**
   * Get the current user, if authenticated.
   */
  async getUser(): Promise<User | null> {
    const {
      data: { user },
      error,
    } = await this.auth.getUser();

    if (error) {
      // Don't throw on "not authenticated" errors
      if (error.message?.includes('not authenticated')) {
        return null;
      }
      throw error;
    }

    return user;
  }

  /**
   * Sign out the current user.
   */
  async signOut(): Promise<void> {
    const { error } = await this.auth.signOut();

    if (error) {
      // Log but don't throw - we want to clear local state regardless
      console.error('Error during sign out:', error);
    }
  }

  /**
   * Subscribe to auth state changes.
   * Returns an unsubscribe function.
   */
  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ): { unsubscribe: () => void } {
    const {
      data: { subscription },
    } = this.auth.onAuthStateChange(callback);

    return { unsubscribe: () => subscription.unsubscribe() };
  }

  /**
   * Resend the OTP code to the user's email.
   */
  async resendOtp(email: string): Promise<void> {
    await this.signInWithOtp(email);
  }
}

declare module '@ember/service' {
  interface Registry {
    supabase: SupabaseService;
  }
}
