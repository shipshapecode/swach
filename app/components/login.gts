<div class="bg-menu p-4 rounded w-full">
  <div class="flex justify-between pt-4 w-full">
    <h2 class="font-bold text-2xl">
      Sign in
    </h2>
    <p class="mt-2 text-menu-text text-sm">
      or
      <LinkTo
        @route="settings.cloud.register"
        class="font-medium text-alt hover:text-alt-hover"
      >
        sign up free
      </LinkTo>
    </p>
  </div>

  {{#if this.errorMessage}}
    <div class="bg-red-400 my-2 p-4 rounded text-xs text-red-800">
      {{this.errorMessage}}
    </div>
  {{/if}}

  <div class="mt-3">
    <div class="mb-6">
      <div class="mb-2">
        <label for="email-address" class="sr-only">
          Email address
        </label>

        <Input
          data-test-login-input-user
          autocomplete="email"
          class="input py-2 rounded-t text-sm w-full"
          id="email-address"
          name="email"
          placeholder="Email address"
          required
          @type="email"
          @value={{this.username}}
        />
      </div>
      <div>
        <label for="password" class="sr-only">
          Password
        </label>

        <Input
          data-test-login-input-password
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
      <LoadingButton
        data-test-login-submit
        class="btn btn-primary w-full"
        @loading={{this.loading}}
        @onClick={{this.authenticate}}
      >
        Sign in
      </LoadingButton>
    </div>

    <div class="flex items-center justify-center mt-2">
      <div class="text-sm">
        <LinkTo
          class="font-medium text-alt underline hover:text-alt-hover"
          @route="settings.cloud.forgot-password"
        >
          Forgot your password?
        </LinkTo>
      </div>
    </div>
  </div>
</div>