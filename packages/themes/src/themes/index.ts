import type { Theme } from '../schemas/index.js';
import * as darkThemes from './dark/index.js';
import * as lightThemes from './light/index.js';

export const dark: Theme[] = Object.values(darkThemes);
export const light: Theme[] = Object.values(lightThemes);
