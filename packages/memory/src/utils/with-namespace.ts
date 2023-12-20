/**
 * Prepend given namespace to given key, separated by a `:`
 *
 * @param key Key to prefix
 * @param namespace Namespace to prefix key with
 * @returns Namespace prefixed key
 */
export const withNamespace = (key: string, namespace: string) => `${namespace}:${key}`;
