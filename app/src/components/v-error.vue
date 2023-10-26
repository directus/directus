<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import { isPlainObject } from 'lodash';
import { useClipboard } from '@/composables/use-clipboard';

interface Props {
	error: Record<string, any>;
}

const props = defineProps<Props>();

const { t } = useI18n();

const code = computed(() => {
	return props.error?.response?.data?.errors?.[0]?.extensions?.code || props.error?.extensions?.code || 'UNKNOWN';
});

const message = computed(() => {
	let message = props.error?.response?.data?.errors?.[0]?.message || props.error?.message;

	if (message.length > 200) {
		message = message.substring(0, 197) + '...';
	}

	return message;
});

const copied = ref(false);

const { isCopySupported, copyToClipboard } = useClipboard();

async function copyError() {
	const error = props.error?.response?.data || props.error;

	const isCopied = await copyToClipboard(
		JSON.stringify(error, isPlainObject(error) ? null : Object.getOwnPropertyNames(error), 2)
	);

	if (!isCopied) return;
	copied.value = true;
}
</script>

<template>
	<div class="v-error selectable">
		<output>[{{ code }}] {{ message }}</output>
		<v-icon
			v-if="isCopySupported"
			v-tooltip="t('copy_details')"
			small
			class="copy-error"
			:name="copied ? 'check' : 'content_copy'"
			clickable
			@click="copyError"
		/>
	</div>
</template>

<style lang="scss" scoped>
.v-error {
	max-height: 50vh;
	padding: 6px 12px;
	overflow: auto;
	color: var(--theme--danger);
	font-family: var(--theme--font-family-monospace);
	background-color: var(--danger-alt);
	border-radius: var(--border-radius);

	.copy-error {
		margin-left: 12px;
	}
}
</style>
