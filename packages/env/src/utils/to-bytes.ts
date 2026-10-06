import bytes from 'bytes';

/**
 * Parse a human readable size (eg `10mb`) or a plain number of bytes into bytes. Returns `undefined`
 * for empty or unparsable values
 */
export const toBytes = (value: unknown): number | undefined => {
	if ((typeof value !== 'string' && typeof value !== 'number') || value === '') return undefined;

	return bytes.parse(value) ?? undefined;
};
