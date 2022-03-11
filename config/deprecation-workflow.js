/* eslint-disable */
self.deprecationWorkflow = self.deprecationWorkflow || {};
self.deprecationWorkflow.config = {
  workflow: [
    { handler: 'silence', matchId: 'ember-simple-auth.events.session-service' },
    { handler: 'silence', matchId: 'ember-polyfills.deprecate-assign' },
    { handler: 'silence', matchId: 'ember-string.htmlsafe-ishtmlsafe' },
  ]
};
