<script setup lang="ts">
import { ref, watch } from 'vue';
import VNotice from '@/components/v-notice.vue';
import { checkLinkScheme, type LinkSchemeProblem } from '@/interfaces/input-rich-text-html/extensions/link-scheme';
import InterfaceTags from '@/interfaces/tags/tags.vue';

const props = defineProps<{
	value: string[] | null;
	disabled?: boolean;
	nonEditable?: boolean;
	placeholder?: string;
}>();

const emit = defineEmits<{ input: [value: string[]] }>();

const REJECTION_MESSAGES: Record<LinkSchemeProblem, string> = {
	blocked: 'interfaces.input-rich-text-html.link_protocols_blocked',
	invalid: 'interfaces.input-rich-text-html.link_protocols_invalid',
};

// tags.vue drops a rejected chip only when `value` gets a new array, so every input assigns one
const schemes = ref<string[]>(props.value ?? []);

watch(
	() => props.value,
	(value) => (schemes.value = value ?? []),
);

const rejected = ref<{ entry: string; problem: LinkSchemeProblem }[]>([]);

function onInput(entries: string[] | null) {
	const accepted: string[] = [];
	rejected.value = [];

	for (const entry of entries ?? []) {
		const { scheme, problem } = checkLinkScheme(entry);

		if (problem) rejected.value.push({ entry: entry.trim(), problem });
		else if (!accepted.includes(scheme)) accepted.push(scheme);
	}

	schemes.value = accepted;
	emit('input', accepted);
}
</script>

<template>
	<div class="system-link-protocols">
		<InterfaceTags :value="schemes" :disabled :non-editable :placeholder @input="onInput" />
		<VNotice v-for="{ entry, problem } in rejected" :key="entry" type="warning" class="rejected">
			{{ $t(REJECTION_MESSAGES[problem], { scheme: entry }) }}
		</VNotice>
	</div>
</template>

<style scoped>
.rejected {
	margin-block-start: 0.5rem;
}
</style>
