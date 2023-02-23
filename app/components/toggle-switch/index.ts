import templateOnlyComponent from '@ember/component/template-only';

interface ToggleSwitchSignature {
  Element: HTMLButtonElement;
  Args: { checked: boolean; onClick: () => unknown };
}

const ToggleSwitch = templateOnlyComponent<ToggleSwitchSignature>();

export default ToggleSwitch;

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    ToggleSwitch: typeof ToggleSwitch;
  }
}
