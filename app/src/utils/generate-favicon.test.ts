import { expect, test, vi } from 'vitest';
import { generateFavicon } from '@/utils/generate-favicon';

vi.mock('@directus/utils/browser', () => ({
	cssVar: () => '#6644ff',
}));

const decode = (dataUrl: string) => {
	const base64 = dataUrl.replace('data:image/svg+xml;base64,', '');
	return window.atob(base64);
};

test('Generates a base64-encoded SVG data URL', () => {
	const result = generateFavicon('#6644ff');

	expect(result).toMatch(/^data:image\/svg\+xml;base64,/);

	const svg = decode(result);
	expect(svg).toContain('<svg');
	expect(svg).toContain('<circle');
	expect(svg).toContain('fill="#6644ff"');
});

test('Includes the Directus logo by default and omits it when disabled', () => {
	expect(decode(generateFavicon('#6644ff'))).toContain('<path');
	expect(decode(generateFavicon('#6644ff', false))).not.toContain('<path');
});

test('Does not allow the color to break out of the SVG and inject markup (XSS)', () => {
	const payload = 'red;}</style></svg><img src onerror=alert(document.domain)>';

	const svg = decode(generateFavicon(payload));

	// The payload must be confined to an (escaped) attribute value; no raw <img> or
	// </style> breakout tags may appear, and the angle brackets must be entity-encoded.
	expect(svg).not.toContain('<img');
	expect(svg).not.toContain('</style>');
	expect(svg).toContain('&lt;img');
	// Only a single closing </svg> belonging to our own element may exist.
	expect(svg.match(/<\/svg>/g)?.length ?? 0).toBe(1);
});
