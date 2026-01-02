import { Input } from '@ember/component';
import { on } from '@ember/modifier';
import { action } from '@ember/object';
import type Router from '@ember/routing/router-service';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import { storageFor } from 'ember-local-storage';

import { isTesting } from '@embroider/macros';

import type Session from '../services/session.ts';
import type SupabaseService from '../services/supabase.ts';
import type { SettingsStorage } from '../storages/settings.ts';
import LoadingButton from './loading-button.gts';

type AuthStep = 'email' | 'otp';

export default class LoginComponent extends Component {
  <template>
    <div class="bg-menu p-4 rounded-sm w-full">
      <div class="flex justify-between pt-4 w-full">
        <h2 class="font-bold text-2xl">
          {{if this.isOtpStep "Enter Code" "Sign In"}}
        </h2>
        {{#if this.isOtpStep}}
          <button
            type="button"
            class="font-medium text-alt hover:text-alt-hover text-sm mt-2"
            {{on "click" this.backToEmail}}
          >
            Use different email
          </button>
        {{/if}}
      </div>

      {{#if this.successMessage}}
        <div class="bg-green-100 my-2 p-4 rounded-sm text-xs text-green-800">
          {{this.successMessage}}
        </div>
      {{/if}}

      {{#if this.errorMessage}}
        <div class="bg-red-400 my-2 p-4 rounded-sm text-xs text-red-800">
          {{this.errorMessage}}
        </div>
      {{/if}}

      <div class="mt-3">
        {{#if this.isOtpStep}}
          {{! OTP Verification Step }}
          <p class="text-menu-text text-sm mb-4">
            We sent a 6-digit code to
            <strong>{{this.email}}</strong>
          </p>

          <div class="mb-6">
            <label for="otp-code" class="sr-only">
              Verification code
            </label>

            <Input
              data-test-login-input-otp
              autocomplete="one-time-code"
              class="input py-2 rounded-sm text-sm w-full text-center tracking-widest"
              id="otp-code"
              inputmode="numeric"
              maxlength="6"
              name="otp"
              pattern="[0-9]*"
              placeholder="000000"
              required
              @type="text"
              @value={{this.otpCode}}
            />
          </div>

          <div>
            <LoadingButton
              data-test-login-submit
              class="btn btn-primary w-full"
              @loading={{this.loading}}
              @onClick={{this.verifyOtp}}
            >
              Verify Code
            </LoadingButton>
          </div>

          <div class="flex items-center justify-center mt-4">
            <button
              type="button"
              class="font-medium text-alt text-sm underline hover:text-alt-hover"
              disabled={{this.resendLoading}}
              {{on "click" this.resendCode}}
            >
              {{if this.resendLoading "Sending..." "Resend code"}}
            </button>
          </div>
        {{else}}
          {{! Email Entry Step }}
          <p class="text-menu-text text-sm mb-4">
            Enter your email and we'll send you a code to sign in. No password
            needed!
          </p>

          <div class="mb-6">
            <label for="email-address" class="sr-only">
              Email address
            </label>

            <Input
              data-test-login-input-user
              autocomplete="email"
              class="input py-2 rounded-sm text-sm w-full"
              id="email-address"
              name="email"
              placeholder="Email address"
              required
              @type="email"
              @value={{this.email}}
            />
          </div>

          <div>
            <LoadingButton
              data-test-login-submit
              class="btn btn-primary w-full"
              @loading={{this.loading}}
              @onClick={{this.sendOtp}}
            >
              Send Code
            </LoadingButton>
          </div>
        {{/if}}
      </div>
    </div>
  </template>

  @service declare router: Router;
  @service declare session: Session;
  @service declare supabase: SupabaseService;

  @storageFor('settings') settings!: SettingsStorage;

  @tracked email = '';
  @tracked otpCode = '';
  @tracked step: AuthStep = 'email';
  @tracked errorMessage?: string;
  @tracked successMessage?: string;
  @tracked loading = false;
  @tracked resendLoading = false;

  get isOtpStep(): boolean {
    return this.step === 'otp';
  }

  @action
  async sendOtp(): Promise<void> {
    if (!this.email) {
      this.errorMessage = 'Please enter your email address';
      return;
    }

    this.loading = true;
    this.errorMessage = undefined;
    this.successMessage = undefined;

    try {
      await this.supabase.signInWithOtp(this.email);
      this.step = 'otp';
      this.successMessage = 'Check your email for a verification code';
    } catch (error: unknown) {
      this.errorMessage = (error as Error).message || 'Failed to send code';
    } finally {
      this.loading = false;
    }
  }

  @action
  async verifyOtp(): Promise<void> {
    if (!this.otpCode || this.otpCode.length !== 6) {
      this.errorMessage = 'Please enter the 6-digit code';
      return;
    }

    this.loading = true;
    this.errorMessage = undefined;
    this.successMessage = undefined;

    try {
      await this.session.authenticate('authenticator:supabase', {
        email: this.email,
        token: this.otpCode,
      });

      // We want to skip this in tests, since once a user has logged in routes become inaccessible
      if (!isTesting()) {
        this.settings.set('userHasLoggedInBefore', true);
      }

      this.router.transitionTo('settings.cloud.profile');
    } catch (error: unknown) {
      this.errorMessage = (error as Error).message || 'Invalid or expired code';
    } finally {
      this.loading = false;
    }
  }

  @action
  async resendCode(): Promise<void> {
    this.resendLoading = true;
    this.errorMessage = undefined;

    try {
      await this.supabase.resendOtp(this.email);
      this.successMessage = 'A new code has been sent to your email';
    } catch (error: unknown) {
      this.errorMessage = (error as Error).message || 'Failed to resend code';
    } finally {
      this.resendLoading = false;
    }
  }

  @action
  backToEmail(): void {
    this.step = 'email';
    this.otpCode = '';
    this.errorMessage = undefined;
    this.successMessage = undefined;
  }
}
