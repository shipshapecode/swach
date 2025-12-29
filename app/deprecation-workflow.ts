import setupDeprecationWorkflow from 'ember-cli-deprecation-workflow';

/**
 * Docs: https://github.com/ember-cli/ember-cli-deprecation-workflow
 */
setupDeprecationWorkflow({
  /**
    false by default, but if a developer / team wants to be more aggressive about being proactive with
    handling their deprecations, this should be set to "true"
  */
  throwOnUnhandled: false,
  workflow: [
    { handler: 'silence', matchId: 'deprecate-import-testing-from-ember' },
    { handler: 'silence', matchId: 'ember-simple-auth.events.session-service' },
    { handler: 'silence', matchId: 'ember-polyfills.deprecate-assign' },
    { handler: 'silence', matchId: 'ember-string.htmlsafe-ishtmlsafe' },
  ],
});
