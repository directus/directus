<template>
	<div class="v-error">
		<output>{{ code }}</output>
		<v-icon
			v-tooltip="$t('copy_details')"
			v-if="showCopy"
			small
			class="copy-error"
			:name="copied ? 'check' : 'content_copy'"
			@click="copyError"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, ref } from '@vue/composition-api';

export default defineComponent({
	props: {
		error: {
			type: [Object, Error] as PropType<any>,
			required: true,
		},
	},
	setup(props) {
		const code = computed(() => {
			return props.error?.response?.data?.error?.code || 'UNKNOWN';
		});

		const copied = ref(false);

		const showCopy = computed(() => !!navigator.clipboard?.writeText);

		return { code, copyError, showCopy, copied };

		async function copyError() {
			await navigator.clipboard.writeText(JSON.stringify(props.error, null, 2));
			copied.value = true;
		}
	},
});
</script>

<style lang="scss" scoped>
.v-error {
	padding: 6px 12px;
	color: var(--danger);
	font-family: var(--family-monospace);
	background-color: var(--danger-alt);
	border-radius: var(--border-radius);

	.copy-error {
		margin-left: 12px;
	}
}
</style>
