declare module 'throttle-debounce' {
  export function debounce(
    delay: number,
    atBegin?: boolean,
    callback?: Function
  );
  export function debounce(delay: number, callback?: Function);
}
