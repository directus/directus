import type { Theme } from '../schemas/index.js';
import { directusDefault as darkDirectusDefault } from './dark/index.js';
import {
	directusColorMatch as lightDirectusColorMatch,
	directusDefault as lightDirectusDefault,
	directusMinimal as lightDirectusMinimal,
} from './light/index.js';

// We're using manually defined arrays here to guarantee the order
export const dark: Theme[] = [darkDirectusDefault];
export const light: Theme[] = [lightDirectusDefault, lightDirectusMinimal, lightDirectusColorMatch];
