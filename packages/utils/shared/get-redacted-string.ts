export const getRedactedString = (key?: string) => `--redacted${key ? `:${key}` : ''}--`;

export const REDACTED_TEXT = getRedactedString();
