import { LinkTo } from '@ember/routing';

import RouteTemplate from 'ember-route-template';
import svgJar from 'ember-svg-jar/helpers/svg-jar';

import ColorsList from '../components/colors-list.ts';

export default RouteTemplate<{ Args: { model: unknown; controller: unknown } }>(
  <template>
    <LinkTo
      class="flex grow items-center mb-1 pb-2 pt-2 w-full text-alt hover:text-alt-hover"
      @route="palettes"
    >
      {{svgJar "chevron-left" class="stroke-icon mr-2" height="15" width="15"}}
      Palettes
    </LinkTo>

    <div class="font-bold py-2 text-main-text text-xl">
      {{if @model.isColorHistory "Color History" @model.name}}
    </div>

    <ColorsList
      @palette={{@model}}
      @toggleColorPickerIsShown={{@controller.application.toggleColorPickerIsShown}}
    />
  </template>,
);
