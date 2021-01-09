import 'ember-cli-flash';

// Types for compiled templates
declare module 'swach/templates/*' {
  import { TemplateFactory } from 'htmlbars-inline-precompile';
  const tmpl: TemplateFactory;
  export default tmpl;
}

declare global {
  declare function requireNode(name: string): any;
}
