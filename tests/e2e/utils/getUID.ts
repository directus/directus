import { join } from 'path';
import { getCallSites } from 'util';

/**
 * Returns an identifier that is unique to the file in which it was called.
 * @example 'fields_primitive_boolean'
 * @param offset Apply an offset to which parent caller to get.
 * E.g. an offset of 1 will get you the file that called the current function in which you called getUID(1)
 */
export function getUID(offset = 0) {
	const parent = getCallSites()[1 + offset]!.scriptName;

	const parentParts = parent.split(/[/\\]/g);
	const currentParts = [...import.meta.dirname.split(/[/\\]/g).slice(0, -1), 'tests'];

	const uid = [...parentParts.slice(currentParts.length, -1), parentParts.at(-1)?.slice(0, -8)].join('_');

	return uid;
}

/**
 * Returns the tests folder, used mainly for finding the snapshot file of a test.
 */
export function getCallerFolder(offset = 0) {
	const parent = getCallSites()[1 + offset]!.scriptName;

	const parentParts = parent.split(/[/\\]/g);
	const currentParts = [...import.meta.dirname.split(/[/\\]/g).slice(0, -1)];

	const folder = join(...parentParts.slice(currentParts.length, -1));

	return folder;
}
