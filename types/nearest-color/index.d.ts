declare module 'nearest-color' {
  interface ColorMatch {
    name: string;
    value: string;
    rgb: { r: number; g: number; b: number };
    distance: number;
  }

  export function from(
    availableColors: Array<string> | Record<string, string>
  ): (color: string) => ColorMatch | string;
}
