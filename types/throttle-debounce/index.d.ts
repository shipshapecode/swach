/* eslint-disable @typescript-eslint/no-unsafe-function-type */
declare module 'throttle-debounce' {
  export function debounce(
    delay: number,
    atBegin?: boolean,
    callback?: Function
  );
  export function debounce(delay: number, callback?: Function);
}
