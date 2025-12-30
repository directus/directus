import { messageConstructor } from './unsupported-media-type.js';
import { expect, test } from 'vitest';

test('Constructs message from extensions', () => {
	const mediaType = 'application/json';
	const where = 'Content-Type header';

	const message = messageConstructor({ mediaType, where });

	expect(message).toMatchInlineSnapshot(`"Unsupported media type "application/json" in Content-Type header."`);
});
