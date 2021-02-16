import { helper } from '@ember/component/helper';
import { capitalize as _capitalize } from '@ember/string';

export function capitalize([string]: [string]): string {
  return _capitalize(string);
}

export default helper(capitalize);
