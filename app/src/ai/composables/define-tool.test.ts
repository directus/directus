import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, computed, nextTick, defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { z } from 'zod';
import { defineTool, toStatic, type ToolDefinition } from './define-tool';

const registerLocalTool = vi.fn();
const replaceLocalTool = vi.fn();
const deregisterLocalTool = vi.fn();

vi.mock('../stores/use-ai', () => ({
	useAiStore: () => ({
		registerLocalTool,
		replaceLocalTool,
		deregisterLocalTool,
	}),
}));

const schema = z.object({ foo: z.string() });

describe('define-tool composable', () => {
	beforeEach(() => {
		registerLocalTool.mockClear();
		replaceLocalTool.mockClear();
		deregisterLocalTool.mockClear();
	});

	it('toStatic resolves MaybeRefOrGetter fields', () => {
		const execA = vi.fn();
		const name = ref('my-tool');
		const description = computed(() => `desc:${name.value}`);
		const execute = ref(execA);

		const tool: ToolDefinition<typeof schema> = {
			name,
			llmDescription: description,
			inputSchema: schema,
			execute,
		};

		const stat = toStatic(tool);

		expect(stat.name).toBe('my-tool');
		expect(stat.llmDescription).toBe('desc:my-tool');
		expect(stat.inputSchema).toBe(schema);
		// Unwrapped function reference
		expect(stat.execute).toBe(execA);
	});

	it('registers on mount and deregisters on unmount', async () => {
		const toolRef = ref<ToolDefinition<typeof schema>>({
			name: 'register-test',
			llmDescription: 'register test tool',
			inputSchema: schema,
			execute: () => undefined,
		});

		const Comp = defineComponent({
			name: 'HarnessRegister',
			setup() {
				defineTool(toolRef);
				return () => null;
			},
		});

		const wrapper = mount(Comp);
		await nextTick();

		expect(registerLocalTool).toHaveBeenCalledTimes(1);
		const firstRegisterCall = registerLocalTool.mock.calls.at(0)!;
		const registeredArg = firstRegisterCall[0];
		expect(registeredArg).toMatchObject({ name: 'register-test', description: 'register test tool' });

		wrapper.unmount();

		expect(deregisterLocalTool).toHaveBeenCalledTimes(1);
		expect(deregisterLocalTool).toHaveBeenCalledWith('register-test');
	});

	it('replaces tool when definition changes and deregisters latest name on unmount', async () => {
		const execA = vi.fn();
		const execB = vi.fn();

		const toolRef = ref<ToolDefinition<typeof schema>>({
			name: 'first-name',
			llmDescription: 'first desc',
			inputSchema: schema,
			execute: execA,
		});

		const Comp = defineComponent({
			name: 'HarnessReplace',
			setup() {
				defineTool(toolRef);
				return () => null;
			},
		});

		const wrapper = mount(Comp);
		await nextTick();

		// Update the whole definition to trigger the watcher
		toolRef.value = {
			name: 'second-name',
			llmDescription: 'second desc',
			inputSchema: schema,
			execute: execB,
		};

		await nextTick();

		// One replace call with old name and new static tool
		expect(replaceLocalTool).toHaveBeenCalledTimes(1);
		const firstReplaceCall = replaceLocalTool.mock.calls.at(0)!;
		const [oldName, newTool] = firstReplaceCall;
		expect(oldName).toBe('first-name');
		expect(newTool).toMatchObject({ name: 'second-name', description: 'second desc' });
		expect(newTool.execute).toBe(execB);

		wrapper.unmount();

		await nextTick();

		// Should deregister the current (latest) name according to implementation
		expect(deregisterLocalTool).toHaveBeenCalledWith('second-name');
	});
});
