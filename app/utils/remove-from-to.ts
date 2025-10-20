export default function removeFromTo(
  array: unknown[],
  from: number,
  to: number
): number {
  array.splice(
    from,

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    !to ||
      // @ts-expect-error: We need to refactor this function
      1 +
        to -
        from +
        // @ts-expect-error: We need to refactor this function
        (!((to < 0) ^ (from >= 0)) && (to < 0 || -1) * array.length)
  );

  return array.length;
}
