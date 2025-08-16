import { on } from '@ember/modifier';
import RouteTemplate from 'ember-route-template';
import svgJar from 'ember-svg-jar/helpers/svg-jar';
import Kuler from '../components/kuler.gts';
import type KulerController from 'swach/controllers/kuler';

export default RouteTemplate<{
  Args: { model: unknown; controller: KulerController };
}>(
  <template>
    <button
      class="flex grow items-center mb-1 pb-2 pt-2 w-full"
      type="button"
      {{on "click" @controller.goBack}}
    >
      {{svgJar "chevron-left" class="stroke-icon mr-2" height="15" width="15"}}
    </button>

    <Kuler @baseColor={{@controller.model}} />
  </template>,
);
