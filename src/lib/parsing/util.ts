export function assertHeadingLevel(level: unknown): 1 | 2 | 3 | 4 | 5 | 6 {
  if (
    level === 1 ||
    level === 2 ||
    level === 3 ||
    level === 4 ||
    level === 5 ||
    level === 6
  ) {
    return level;
  }
  throw new Error(`Unknown heading level ${level}`);
}

export function nullthrows<T>(input: T | null | undefined | void): T {
  if (input != null) {
    return input;
  }
  throw new Error(`Unexpected null`);
}