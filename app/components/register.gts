import { LinkTo } from '@ember/routing';

/**
 * With OTP authentication, there's no separate registration flow.
 * New users are automatically created when they verify their email.
 * This component just redirects users to the login flow.
 */
<template>
  <div class="bg-menu p-4 rounded-md w-full">
    <div class="pt-4 w-full">
      <h2 class="font-bold text-2xl">
        Sign Up
      </h2>
    </div>

    <div class="mt-4">
      <p class="text-menu-text text-sm mb-4">
        Getting started is easy! Just enter your email address and we'll send
        you a code to sign in. No password required.
      </p>

      <p class="text-menu-text text-sm mb-6">
        If you're a new user, your account will be created automatically.
      </p>

      <LinkTo
        @route="settings.cloud.login"
        class="btn btn-primary w-full inline-block text-center"
        data-test-register-continue
      >
        Continue with Email
      </LinkTo>

      <p class="mt-4 text-center text-menu-text text-sm">
        Already have an account?
        <LinkTo
          @route="settings.cloud.login"
          class="font-medium text-alt hover:text-alt-hover"
        >
          Sign in
        </LinkTo>
      </p>
    </div>
  </div>
</template>
