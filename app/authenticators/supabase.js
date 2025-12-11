import { service } from '@ember/service';
import BaseAuthenticator from 'ember-simple-auth/authenticators/base';

export default class SupabaseAuthenticator extends BaseAuthenticator {
  @service supabase;

  async authenticate(credentials) {
    const { email, password, isSignUp } = credentials;

    try {
      let response;

      if (isSignUp) {
        response = await this.supabase.signUp(email, password);
      } else {
        response = await this.supabase.signIn(email, password);
      }

      return {
        user: response.user,
        session: response.session,
        access_token: response.session?.access_token,
        refresh_token: response.session?.refresh_token,
        expires_at: response.session?.expires_at,
      };
    } catch (error) {
      throw error;
    }
  }

  async restore(data) {
    try {
      // Check if we have a valid session
      const session = await this.supabase.getSession();

      if (session?.user) {
        return {
          user: session.user,
          session: session,
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async invalidate() {
    try {
      await this.supabase.signOut();
    } catch (error) {
      // Even if sign out fails, we want to invalidate the session locally
      console.error('Error during sign out:', error);
    }
  }
}
