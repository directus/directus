<script setup lang="ts">
import { computed, ref } from 'vue';
import { i18n } from '@/lang';

interface Props {
	modelValue?: boolean;
	label?: string;
	startOpen?: boolean;
	disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: undefined,
	label: i18n.global.t('toggle'),
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
			<v-divider @click="internalActive = !internalActive">
				<v-icon v-if="!disabled" :name="internalActive ? 'expand_more' : 'chevron_right'" small />
				<slot name="title">{{ label }}</slot>
			</v-divider>
		</slot>
		<transition-expand>
			<div v-if="internalActive" class="content">
				<slot />
			</div>
		</transition-expand>
	</div>
</template>

<style lang="scss" scoped>
.v-divider {
	cursor: pointer;
}

.v-detail:not(.disabled) .v-divider {
	--v-divider-label-color: var(--theme--foreground-subdued);

	&:hover {
		--v-divider-label-color: var(--theme--foreground-accent);

		cursor: pointer;
	}
}

.v-icon {
	margin-right: 4px;
}

.content {
	margin-top: 12px;
}
</style>
