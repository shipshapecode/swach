declare module 'nearest-color' {
  export function from(
    availableColors: Array<string> | object
  ): (string) => ColorMatch | string;
}
