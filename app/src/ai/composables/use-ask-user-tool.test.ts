import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick, reactive, ref } from 'vue';
import { cancelPending, pendingAskUser, submitAnswers, useAskUserTool } from './use-ask-user-tool';

const registerLocalTool = vi.fn();
const replaceLocalTool = vi.fn();
const deregisterLocalTool = vi.fn();

vi.mock('../stores/use-ai-tools', () => ({
	useAiToolsStore: () => ({
		registerLocalTool,
		replaceLocalTool,
		deregisterLocalTool,
	}),
}));

// Reactive store mock — matches pinia store shape (auto-unwrapped refs)
const mockStore = reactive({
	messages: [] as unknown[],
	status: 'idle' as string,
});

vi.mock('../stores/use-ai', () => ({
	useAiStore: () => mockStore,
}));

function mountComposable() {
	const Comp = defineComponent({
		name: 'TestHarness',
		setup() {
			useAskUserTool();
			return () => null;
		},
	});

	return mount(Comp);
}

describe('use-ask-user-tool', () => {
	beforeEach(() => {
		pendingAskUser.value = null;
		mockStore.messages = [{ id: '1' }];
		mockStore.status = 'idle';
		registerLocalTool.mockClear();
		deregisterLocalTool.mockClear();
	});

	it('registers tool via defineTool on mount', async () => {
		const wrapper = mountComposable();
		await nextTick();

		expect(registerLocalTool).toHaveBeenCalledTimes(1);

		const registered = registerLocalTool.mock.calls[0]![0];
		expect(registered.name).toBe('ask_user');

		wrapper.unmount();
		expect(deregisterLocalTool).toHaveBeenCalledWith('ask_user');
	});

	it('submitAnswers resolves pending promise with provided answers', async () => {
		mountComposable();
		await nextTick();

		const tool = registerLocalTool.mock.calls[0]![0];
		const promise = tool.execute({ questions: [{ id: 'q1', question: 'Pick one' }] });

		expect(pendingAskUser.value).not.toBeNull();

		submitAnswers({ q1: 'Option A' });

		const result = await promise;
		expect(result).toEqual({ q1: 'Option A' });
		expect(pendingAskUser.value).toBeNull();
	});

	it('cancelPending resolves with _cancelled signal', async () => {
		mountComposable();
		await nextTick();

		const tool = registerLocalTool.mock.calls[0]![0];
		const promise = tool.execute({ questions: [{ id: 'q1', question: 'Pick one' }] });

		cancelPending();

		const result = await promise;
		expect(result).toEqual({ _cancelled: 'true' });
		expect(pendingAskUser.value).toBeNull();
	});

	it('second execute call cancels first', async () => {
		mountComposable();
		await nextTick();

		const tool = registerLocalTool.mock.calls[0]![0];
		const first = tool.execute({ questions: [{ id: 'q1', question: 'First' }] });
		const second = tool.execute({ questions: [{ id: 'q2', question: 'Second' }] });

		// First should resolve as cancelled
		const firstResult = await first;
		expect(firstResult).toEqual({ _cancelled: 'true' });

		// Second should still be pending
		expect(pendingAskUser.value).not.toBeNull();
		expect(pendingAskUser.value!.input.questions[0]!.id).toBe('q2');

		submitAnswers({ q2: 'Answer' });
		const secondResult = await second;
		expect(secondResult).toEqual({ q2: 'Answer' });
	});

	it('messages reset (length === 0) cancels pending', async () => {
		mountComposable();
		await nextTick();

		const tool = registerLocalTool.mock.calls[0]![0];
		const promise = tool.execute({ questions: [{ id: 'q1', question: 'Pick' }] });

		mockStore.messages.splice(0, mockStore.messages.length);
		await nextTick();

		const result = await promise;
		expect(result).toEqual({ _cancelled: 'true' });
	});

	it('status transition from streaming to idle cancels pending', async () => {
		mockStore.status = 'streaming';
		mountComposable();
		await nextTick();

		const tool = registerLocalTool.mock.calls[0]![0];
		const promise = tool.execute({ questions: [{ id: 'q1', question: 'Pick' }] });

		mockStore.status = 'idle';
		await nextTick();

		const result = await promise;
		expect(result).toEqual({ _cancelled: 'true' });
	});

	it('cancelPending is no-op when nothing is pending', () => {
		expect(pendingAskUser.value).toBeNull();
		cancelPending();
		expect(pendingAskUser.value).toBeNull();
	});
});
