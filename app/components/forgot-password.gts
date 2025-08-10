import { Input } from '@ember/component';
import { action } from '@ember/object';
import { LinkTo } from '@ember/routing';
import type Router from '@ember/routing/router-service';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import type CognitoService from 'ember-cognito/services/cognito';

import LoadingButton from './loading-button.ts';
import type Session from 'swach/services/session';

export default class ForgotPasswordComponent extends Component {
  <template>
    <div class="bg-menu p-4 rounded w-full">
      <div class="flex justify-between pt-4 w-full">
        <h2 class="font-bold text-2xl">
          {{if this.isConfirming "Reset Password" "Forgot Password"}}
        </h2>
        <p class="mt-2 text-menu-text text-sm">
          <LinkTo
            @route="settings.cloud.login"
            class="font-medium text-alt hover:text-alt-hover"
          >
            cancel
          </LinkTo>
        </p>
      </div>

      {{#if this.errorMessage}}
        <div class="bg-red-400 my-2 p-4 rounded text-xs text-red-800">
          {{this.errorMessage}}
        </div>
      {{/if}}

      <p class="my-2 text-sm">
        Enter your email address to reset your password.
      </p>

      <div class="mt-3">
        <div class="mb-4">
          <div>
            <label for="email-address" class="sr-only">
              Email address
            </label>
            <Input
              data-test-forgot-password-input-user
              autocomplete="email"
              class="input py-2 rounded-sm text-sm w-full"
              id="email-address"
              name="email"
              placeholder="Email address"
              required
              @type="email"
              @value={{this.username}}
            />
          </div>

          {{#if this.isConfirming}}
            <div>
              <label for="confirmation-code" class="sr-only">
                Confirmation code
              </label>

              <Input
                data-test-forgot-password-input-code
                autocomplete="current-password"
                class="input py-2 rounded-sm text-sm w-full"
                id="confirmation-code"
                name="confirmation-code"
                placeholder="Confirmation code"
                required
                @type="text"
                @value={{this.code}}
              />
            </div>

            <div>
              <label for="password" class="sr-only">
                Password
              </label>

              <Input
                data-test-forgot-password-input-password
                autocomplete="current-password"
                class="input py-2 rounded-sm text-sm w-full"
                id="password"
                name="password"
                placeholder="Password"
                required
                @type="password"
                @value={{this.password}}
              />
            </div>

            <div class="mt-6">
              <LoadingButton
                class="btn btn-primary w-full"
                @loading={{this.loading}}
                @onClick={{this.forgotPasswordSubmit}}
              >
                Reset Password
              </LoadingButton>
            </div>
          {{else}}
            <div class="mt-6">
              <LoadingButton
                class="btn btn-primary w-full"
                @loading={{this.loading}}
                @onClick={{this.forgotPassword}}
              >
                Send Code
              </LoadingButton>
            </div>
          {{/if}}
        </div>
      </div>
    </div>
  </template>
  @service declare cognito: CognitoService;
  @service declare router: Router;
  @service declare session: Session;

  @tracked code?: string;
  @tracked errorMessage?: string;
  @tracked isConfirming = false;
  @tracked loading = false;
  @tracked password?: string;
  @tracked username?: string;

  @action
  async forgotPassword(): Promise<void> {
    if (this.username) {
      this.loading = true;

      try {
        await this.cognito.forgotPassword(this.username);

        this.isConfirming = true;
      } catch (err: unknown) {
        this.errorMessage = (err as Error)?.message;
      } finally {
        this.loading = false;
      }
    }
  }

  @action
  async forgotPasswordSubmit(): Promise<void> {
    const { username, code, password } = this;

    if (username && code && password) {
      this.loading = true;

      try {
        await this.cognito.forgotPasswordSubmit(username, code, password);

        this.router.transitionTo('settings.cloud');
      } catch (err: unknown) {
        this.errorMessage = (err as Error)?.message;
      } finally {
        this.loading = false;
      }
    }
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    ForgotPassword: typeof ForgotPasswordComponent;
  }
}
