import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

vi.mock('@/api', () => ({
	default: {
		get: vi.fn(),
	},
}));

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

import api from '@/api';
import { merge } from 'lodash';
import { useComparison } from './use-comparison';
import type { Revision } from '@/types/revisions';

function createVersion(overrides: Partial<any> = {}) {
	const defaults = {
		id: '71934735-b9bc-438b-a96c-9ed23853848a',
		key: 'first-version',
		name: 'First Version',
		collection: 'posts',
		item: 'dfecb69d-2c09-42f1-9781-7de562085d73',
		hash: '9d6daae12ba6161e84698d775bd4dfab08f7bf1d',
		date_created: '2025-09-11T13:59:05.875Z',
		date_updated: '2025-09-11T14:02:05.464Z',
		user_created: '4833caa4-b94b-42c0-936f-9fe0d017c1e4',
		user_updated: null,
		delta: {
			title: 'Original item title - Version 1 - Revision 2',
			content: '<p>This is the second revision of the the first version.</p>',
		},
	};

	return merge({}, defaults, overrides);
}

function createRevision(overrides: any = {}): Revision {
	const defaults: any = {
		id: 859,
		collection: 'posts',
		item: 'dfecb69d-2c09-42f1-9781-7de562085d73',
		data: {
			title: 'Original item title - Version 1 - Revision 1',
			content: '<p>This is the first revision content.</p>',
		},
		delta: {
			title: 'Original item title - Version 1 - Revision 1',
			content: '<p>This is the first revision content.</p>',
		},
		activity: {
			action: 'version_save',
			timestamp: '2025-09-11T14:01:27.452Z',
			ip: '172.21.0.1',
			user_agent:
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
			origin: 'http://localhost:8057',
			user: {
				id: '4833caa4-b94b-42c0-936f-9fe0d017c1e4',
				email: 'admin@example.com',
				first_name: 'Admin',
				last_name: 'User',
			},
		},
		timestampFormatted: 'Sep 11, 2025, 14:01',
		timeRelative: 'a minute ago',
		status: 'resolve' as const,
	};

	return merge({}, defaults, overrides);
}

function createVersionCompareApiPayload(overrides: Partial<any> = {}) {
	const defaults = {
		main: {
			content: '<p>This is the original content of the item.</p>',
			id: 'dfecb69d-2c09-42f1-9781-7de562085d73',
			image: null,
			slug: 'original-item-title',
			sort: null,
			status: 'draft',
			title: 'Original item title',
			description: 'This is the original item description',
			author: null,
			published_at: '2025-09-11T17:00:00.000Z',
			seo: null,
			date_created: '2025-09-11T13:57:52.398Z',
			user_created: '4833caa4-b94b-42c0-936f-9fe0d017c1e4',
			date_updated: null,
			user_updated: null,
		},
		current: {
			title: 'Original item title - Version 1 - Revision 2',
			content: '<p>This is the second revision of the the first version.</p>',
		},
		outdated: false,
		mainHash: 'hash-of-main-item',
	};

	return merge({}, defaults, overrides);
}

describe('normalizeComparisonData', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('normalizes revision comparison using provided revisions list (no API calls)', async () => {
		const currentVersion = createVersion();

		const versions = [currentVersion];

		const revisions: Revision[] = [
			createRevision(),
			createRevision({
				id: 860,
				data: {
					title: 'Original item title - Version 1 - Revision 2',
					content: '<p>This is the second revision of the the first version.</p>',
				},
				delta: {
					title: 'Original item title - Version 1 - Revision 2',
					content: '<p>This is the second revision of the the first version.</p>',
				},
				activity: {
					timestamp: '2025-09-11T14:02:05.445Z',
				},
				timestampFormatted: 'Sep 11, 2025, 14:02',
				timeRelative: 'just now',
			}),
		];

		// Mock the version comparison API call
		const mockVersionComparison = createVersionCompareApiPayload({
			current: currentVersion.delta,
		});

		(api.get as any).mockResolvedValueOnce({
			data: { data: mockVersionComparison },
		});

		const comparisonData = ref(null);
		const { normalizeComparisonData } = useComparison({ comparisonData });

		const currentVersionRef = ref(currentVersion);
		const versionsRef = ref(versions);
		const revisionsRef = ref(revisions);

		const result = await normalizeComparisonData('860', 'revision', currentVersionRef, versionsRef, revisionsRef);

		// Main should be main item + version delta + current revision data, with date_updated from current activity timestamp
		expect(result.current).toEqual({
			author: null,
			content: '<p>This is the second revision of the the first version.</p>',
			date_created: '2025-09-11T13:57:52.398Z',
			date_updated: '2025-09-11T14:02:05.445Z',
			description: 'This is the original item description',
			id: 'dfecb69d-2c09-42f1-9781-7de562085d73',
			image: null,
			published_at: '2025-09-11T17:00:00.000Z',
			seo: null,
			slug: 'original-item-title',
			sort: null,
			status: 'draft',
			title: 'Original item title - Version 1 - Revision 2',
			user_created: '4833caa4-b94b-42c0-936f-9fe0d017c1e4',
			user_updated: null,
		});

		// Current should be main item + version delta + previous revision data, with date_updated from previous activity timestamp
		expect(result.main).toEqual({
			author: null,
			content: '<p>This is the first revision content.</p>',
			date_created: '2025-09-11T13:57:52.398Z',
			date_updated: '2025-09-11T14:01:27.452Z',
			description: 'This is the original item description',
			id: 'dfecb69d-2c09-42f1-9781-7de562085d73',
			image: null,
			published_at: '2025-09-11T17:00:00.000Z',
			seo: null,
			slug: 'original-item-title',
			sort: null,
			status: 'draft',
			title: 'Original item title - Version 1 - Revision 1',
			user_created: '4833caa4-b94b-42c0-936f-9fe0d017c1e4',
			user_updated: null,
		});
	});

	it('normalizes version comparison using provided versions list', async () => {
		const currentVersion = createVersion({
			id: '11111111-2222-3333-4444-555555555555',
			delta: { title: 'Version 1 Changes', content: '<p>Changes in version 1.</p>' },
		});

		const versions = [currentVersion];

		const mockVersionComparison = createVersionCompareApiPayload({
			current: { title: 'Version 1 Changes', content: '<p>Changes in version 1.</p>' },
		});

		(api.get as any).mockResolvedValueOnce({
			data: { data: mockVersionComparison },
		});

		const comparisonData = ref(null);
		const { normalizeComparisonData } = useComparison({ comparisonData });

		const currentVersionRef = ref(currentVersion);
		const versionsRef = ref(versions);

		const result = await normalizeComparisonData(currentVersion.id, 'version', currentVersionRef, versionsRef);

		expect(result.main).toEqual(mockVersionComparison.main);
		expect(result.current).toEqual(mockVersionComparison.current);
	});
});
