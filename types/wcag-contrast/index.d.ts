declare module 'wcag-contrast' {
  export function hex(
    backgroundColorHex: string,
    foregroundColorHex?: string,
  ): number;
  /**
   * Takes a score value like 2.0 and returns the score like AAA
   */
  export function score(hexScoreNumberString: string): string;
}
