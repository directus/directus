import type { Theme } from '../index.js';

export const defineTheme = <T extends Theme>(theme: T) => theme;
