import { Input } from '@ember/component';
import { on } from '@ember/modifier';
import { action } from '@ember/object';
import { LinkTo } from '@ember/routing';
import type Router from '@ember/routing/router-service';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import type CognitoService from 'ember-cognito/services/cognito';

export default class RegisterComponent extends Component {
  <template>
    <div class="bg-menu p-4 rounded-md w-full">
      <div class="flex justify-between pt-4 w-full">
        <h2 class="font-bold text-2xl">
          Sign up
        </h2>
        <p class="mt-2 text-menu-text text-sm">
          or
          <LinkTo
            @route="settings.cloud.login"
            class="font-medium text-alt hover:text-alt-hover"
          >
            sign in
          </LinkTo>
        </p>
      </div>

      {{#if this.errorMessage}}
        <div class="bg-red-400 my-2 p-4 rounded text-xs text-red-800">
          {{this.errorMessage}}
        </div>
      {{/if}}

      <div class="mt-3">
        <input type="hidden" name="remember" value="true" />
        <div class="mb-6">
          <div class="mb-2">
            <label for="email-address" class="sr-only">
              Email address
            </label>

            <Input
              data-test-register-input-user
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
          <div class="mb-3">
            <label for="password" class="sr-only">
              Password
            </label>

            <Input
              data-test-register-input-password
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
        </div>

        <div>
          <button
            data-test-register-submit
            class="btn btn-primary w-full"
            type="button"
            {{on "click" this.register}}
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  </template>
  @service declare cognito: CognitoService;
  @service declare router: Router;

  @tracked errorMessage?: string;
  @tracked password?: string;
  @tracked username?: string;

  @action
  async register(): Promise<void> {
    const { username, password } = this;

    if (username && password) {
      const attributes = {
        email: username,
      };

      try {
        await this.cognito.signUp(username, password, attributes);

        this.router.transitionTo('settings.cloud.register.confirm');
      } catch (err: unknown) {
        this.errorMessage = (err as Error)?.message;
      }
    }
  }
}
