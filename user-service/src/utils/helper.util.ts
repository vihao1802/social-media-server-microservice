export function excludeFields<T, Key extends keyof T>(
  items: T[],
  keys: Key[],
): Omit<T, Key>[] {
  return items.map((item) => {
    const result = { ...item };
    keys.forEach((key) => {
      delete result[key];
    });
    return result;
  });
}
