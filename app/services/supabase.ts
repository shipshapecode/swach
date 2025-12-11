import { inject as service } from '@ember/service';
import Service from '@ember/service';

import { createClient } from '@supabase/supabase-js';
import ENV from '../config/environment';
import SessionService from 'ember-simple-auth/services/session';

export default class SupabaseService extends Service {
  @service declare session: SessionService;

  supabase = createClient(
    (ENV as any).supabase.url,
    (ENV as any).supabase.anonKey
  );

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }

  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser();

    if (error) {
      throw error;
    }

    return user;
  }

  async getSession() {
    const {
      data: { session },
      error,
    } = await this.supabase.auth.getSession();

    if (error) {
      throw error;
    }

    return session;
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  get auth() {
    return this.supabase.auth;
  }

  get client() {
    return this.supabase;
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your services.
declare module '@ember/service' {
  interface Registry {
    supabase: SupabaseService;
  }
}
