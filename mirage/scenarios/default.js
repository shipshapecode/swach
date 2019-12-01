import sharedScenario from './shared';

export default function(server) {
  /*
    Seed your development database using your factories.
    This data will not be loaded in your tests.
  */

  // server.createList('post', 10);

  sharedScenario(server);
}
