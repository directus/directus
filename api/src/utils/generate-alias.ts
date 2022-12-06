/**
 * Generate Aliasses
 */
// @ts-ignore
import { customAlphabet } from 'nanoid/non-secure';
export const generateAlias = customAlphabet('abcdefghijklmnopqrstuvwxyz', 5);
export const generateCapitalAlias = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 5);
