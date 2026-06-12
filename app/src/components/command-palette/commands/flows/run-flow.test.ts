import type { FlowRaw } from '@directus/types';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, type PropType } from 'vue';
import RunFlow from './run-flow.vue';

const mocks = vi.hoisted(() => ({
	apiPost: vi.fn(),
	close: vi.fn(),
	pop: vi.fn(),
	refreshUnreadCount: vi.fn(),
}));

vi.mock('@directus/composables', () => ({
	useApi: () => ({
		post: mocks.apiPost,
	}),
}));

vi.mock('vue-i18n', () => ({
	useI18n: () => ({
		t: (key: string) => key,
	}),
	createI18n: vi.fn(() => ({})),
}));

vi.mock('vue-router', () => ({
	useRoute: () => ({
		params: {
			collection: 'posts',
			primaryKey: '1',
		},
	}),
}));

vi.mock('../../composables/use-command-palette', () => ({
	useCommandPalette: () => ({
		close: mocks.close,
	}),
}));

vi.mock('../../composables/use-command-router', () => ({
	useCommandRouter: () => ({
		pop: mocks.pop,
	}),
}));

vi.mock('@/stores/notifications', () => ({
	useNotificationsStore: () => ({
		refreshUnreadCount: mocks.refreshUnreadCount,
	}),
}));

vi.mock('@/utils/notify', () => ({
	notify: vi.fn(),
}));

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

vi.mock('@/views/private/components/flow-dialogs.vue', () => ({
	default: defineComponent({
		name: 'FlowDialogs',
		props: {
			confirmButtonCTA: { type: String, required: true },
			confirmDialogDetails: { type: Object, required: false, default: null },
			confirmUnsavedChanges: { type: Function as PropType<(flowId: string) => void>, required: true },
			confirmCustomDialog: { type: Function as PropType<(flowId: string) => void>, required: true },
			confirmValues: { type: Object, required: false, default: null },
			currentFlowId: { type: String, required: false, default: null },
			displayCustomConfirmDialog: { type: Boolean, required: true },
			displayUnsavedChangesDialog: { type: Boolean, required: true },
			isConfirmButtonDisabled: { type: Boolean, required: true },
			resetConfirm: { type: Function as PropType<() => void>, required: true },
			updateFieldValues: { type: Function as PropType<(values: Record<string, any>) => void>, required: true },
			keepBehind: { type: Boolean, required: true },
		},
		template: '<div />',
	}),
}));

describe('command palette run flow', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('does not run when applying a confirmation dialog with missing required fields', async () => {
		const flow: FlowRaw = {
			id: 'flow-1',
			name: 'Publish',
			icon: null,
			color: null,
			description: null,
			trigger: 'manual',
			status: 'active',
			options: {
				requireConfirmation: true,
				fields: [{ field: 'reason', meta: { required: true } }],
			},
			operation: null,
			operations: [],
			date_created: '2026-01-01T00:00:00.000Z',
			user_created: 'user-1',
			accountability: null,
		};

		const wrapper = mount(RunFlow, {
			props: {
				location: 'item',
				flow,
			},
		});

		const flowDialogs = wrapper.findComponent({ name: 'FlowDialogs' });

		expect(flowDialogs.props('isConfirmButtonDisabled')).toBe(true);

		await flowDialogs.props('confirmCustomDialog')('flow-1');

		expect(mocks.apiPost).not.toHaveBeenCalled();
	});
});
