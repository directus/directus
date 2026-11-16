import { describe, expect, it } from 'vitest';
import { findPlaceholderMarker } from './prompt-markers.js';

describe('findPlaceholderMarker', () => {
	it('finds a marker left in the prompt', () => {
		expect(findPlaceholderMarker('Translate this into French:\n\n[your content]')).toBe('[your content]');
	});

	it('returns null once markers are replaced', () => {
		expect(findPlaceholderMarker('Summarize this:\n\n{{ $trigger.payload.body }}')).toBeNull();
	});

	it('ignores other bracketed text, like Markdown links', () => {
		expect(findPlaceholderMarker('Summarize this: [the docs](https://example.com) [draft]')).toBeNull();
	});
});
