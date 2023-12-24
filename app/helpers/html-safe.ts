import { helper } from '@ember/component/helper';
import { htmlSafe as _htmlSafe } from '@ember/template';

import type { SafeString } from 'ember__template/-private/handlebars';

export function htmlSafe([string]: [string]): SafeString {
  return _htmlSafe(string);
}

export default helper(htmlSafe);
