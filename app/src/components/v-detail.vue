<script setup lang="ts">
import { computed, ref } from 'vue';
import TransitionExpand from '@/components/transition/expand.vue';
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

interface Props {
	modelValue?: boolean;
	label?: string;
	startOpen?: boolean;
	disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: undefined,
	startOpen: false,
	disabled: false,
});

const emit = defineEmits(['update:modelValue']);

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

function enable() {
	internalActive.value = true;
}

function disable() {
	internalActive.value = false;
}

function toggle() {
	internalActive.value = !internalActive.value;
}
</script>

<template>
	<div class="v-detail" :class="{ disabled }">
		<slot name="activator" v-bind="{ active: internalActive, enable, disable, toggle }">
			<button type="button" class="activator" :disabled @click="internalActive = !internalActive">
				<VDivider>
					<VIcon :name="internalActive ? 'expand_more' : 'chevron_right'" :disabled small />
					<slot name="title">{{ label || $t('toggle') }}</slot>
				</VDivider>
			</button>
		</slot>
		<TransitionExpand>
			<div v-if="internalActive" class="content">
				<slot />
			</div>
		</TransitionExpand>
	</div>
</template>

<style lang="scss" scoped>
.activator {
	display: block;
	inline-size: 100%;
	text-align: start;
}

.v-detail {
	--v-divider-label-color: var(--theme--foreground-subdued);

	&.disabled .v-divider {
		cursor: not-allowed;
	}

	&:not(.disabled) .v-divider:hover {
		--v-divider-label-color: var(--theme--foreground);
	}
}

.v-icon {
	margin-inline-end: 4px;
}

.content {
	margin-block-start: 12px;
}
</style>
