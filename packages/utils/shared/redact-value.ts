export const redactValue = (key?: string) => `--redacted${key ? `:${key}` : ''}--`;
