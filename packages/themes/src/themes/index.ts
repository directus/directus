import { directusDefault as darkDirectusDefault } from './dark/index.js';
import {
	directusColorMatch as lightDirectusColorMatch,
	directusDefault as lightDirectusDefault,
	directusMinimal as lightDirectusMinimal,
} from './light/index.js';
import type { Theme } from '@directus/types';

// We're using manually defined arrays here to guarantee the order
export const dark: Theme[] = [darkDirectusDefault];
export const light: Theme[] = [lightDirectusDefault, lightDirectusMinimal, lightDirectusColorMatch];
