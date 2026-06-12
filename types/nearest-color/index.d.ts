declare module 'nearest-color' {
  export interface RGB {
    r: number;
    g: number;
    b: number;
  }

  export interface ColorMatch {
    name: string;
    value: string;
    rgb: RGB;
    distance: number;
  }

  export function from(
    availableColors: Record<string, string>
  ): (color: string | RGB) => ColorMatch;
  export function from(
    availableColors: Array<string>
  ): (color: string | RGB) => string;
}
