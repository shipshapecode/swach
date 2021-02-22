declare module 'nearest-color' {
  export function from(
    availableColors: Array<string> | Object
  ): (string) => ColorMatch | string;
}
