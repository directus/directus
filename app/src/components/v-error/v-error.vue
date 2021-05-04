<template>
	<div class="v-error selectable">
		<output>[{{ code }}] {{ message }}</output>
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
import { isPlainObject } from 'lodash';

export default defineComponent({
	props: {
		error: {
			type: [Object, Error] as PropType<any>,
			required: true,
		},
	},
	setup(props) {
		const code = computed(() => {
			return props.error?.response?.data?.errors?.[0]?.extensions?.code || props.error?.extensions?.code || 'UNKNOWN';
		});

		const message = computed(() => {
			return props.error?.response?.data?.errors?.[0]?.message || props.error?.message;
		});

		const copied = ref(false);

		const showCopy = computed(() => !!navigator.clipboard?.writeText);

		return { code, copyError, showCopy, copied, message };

		async function copyError() {
			const error = props.error?.response?.data || props.error;
			await navigator.clipboard.writeText(
				JSON.stringify(error, isPlainObject(error) ? null : Object.getOwnPropertyNames(error), 2)
			);
			copied.value = true;
		}
	},
});
</script>

<style lang="scss" scoped>
.v-error {
	max-height: 50vh;
	padding: 6px 12px;
	overflow: auto;
	color: var(--danger);
	font-family: var(--family-monospace);
	background-color: var(--danger-alt);
	border-radius: var(--border-radius);

	.copy-error {
		margin-left: 12px;
	}
}
</style>
