<template>
	<div class="v-detail" :class="{ disabled }">
		<v-divider @click="internalActive = !internalActive">
			<v-icon v-if="!disabled" :name="internalActive ? 'unfold_less' : 'unfold_more'" small />
			<slot name="title">{{ label }}</slot>
		</v-divider>
		<transition-expand>
			<div v-if="internalActive">
				<slot />
			</div>
		</transition-expand>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import { i18n } from '@/lang';

export default defineComponent({
	emits: ['update:modelValue'],
	props: {
		modelValue: {
			type: Boolean,
			default: undefined,
		},
		label: {
			type: String,
			default: i18n.global.t('toggle'),
		},
		startOpen: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},

	setup(props, { emit }) {
		const localActive = ref(props.startOpen);
		const internalActive = computed({
			get() {
				if (props.modelValue !== undefined) {
					return props.modelValue;
				}
				return localActive.value;
			},
			set(newActive: boolean) {
				localActive.value = newActive;
				emit('update:modelValue', newActive);
			},
		});

		return { internalActive };
	},
});
</script>

<style lang="scss" scoped>
.v-divider {
	margin-bottom: 12px;
	cursor: pointer;
}

.v-detail:not(.disabled) .v-divider {
	--v-divider-label-color: var(--foreground-subdued);
	&:hover {
		--v-divider-label-color: var(--foreground-normal-alt);

		cursor: pointer;
	}
}

.v-icon {
	margin-right: 4px;
}
</style>
