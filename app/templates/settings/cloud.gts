import RouteTemplate from 'ember-route-template'
import svgJar from "ember-svg-jar/helpers/svg-jar";
export default RouteTemplate<{ Args: { model: unknown, controller: unknown } }>(<template><div class="p-4">
  {{svgJar "cloud"}}

  <h6 class="font-semibold mb-2 mt-6 text-heading text-sm">
    Cloud Sync
  </h6>

  <p class="mb-4 text-sm">
    Use cloud sync to keep all your palettes and colors up to date across all
    your devices.
  </p>
</div>

{{outlet}}</template>)