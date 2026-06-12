import type { TemplateOnlyComponent } from '@ember/component/template-only';
import { LinkTo } from '@ember/routing';

import ColorsList from '../components/colors-list.gts';
import type ColorsController from '../controllers/colors.ts';
import type PaletteModel from '../data-models/palette.ts';
import ChevronLeft from '../icons/chevron-left.svg?unsafe-inline';

export default <template>
  <LinkTo
    class="flex grow items-center mb-1 pb-2 pt-2 w-full text-alt hover:text-alt-hover"
    @route="palettes"
  >
    <ChevronLeft class="stroke-icon mr-2" height="15" width="15" />
    Palettes
  </LinkTo>

  <div class="font-bold py-2 text-main-text text-xl">
    {{if @model.isColorHistory "Color History" @model.name}}
  </div>

  <ColorsList
    @palette={{@model}}
    @toggleColorPickerIsShown={{@controller.application.toggleColorPickerIsShown}}
  />
</template> satisfies TemplateOnlyComponent<{
  Args: { model: PaletteModel; controller: ColorsController };
}>;
