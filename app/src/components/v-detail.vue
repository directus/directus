<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Props {
	modelValue?: boolean;
	label?: string;
	startOpen?: boolean;
	disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: undefined,
	label: t('toggle'),
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
				<v-divider>
					<v-icon v-if="!disabled" :name="internalActive ? 'expand_more' : 'chevron_right'" small />
					<slot name="title">{{ label }}</slot>
				</v-divider>
			</button>
		</slot>
		<transition-expand>
			<div v-if="internalActive" class="content">
				<slot />
			</div>
		</transition-expand>
	</div>
</template>

<style lang="scss" scoped>
.activator {
	display: block;
	inline-size: 100%;
	text-align: start;
}

.v-detail:not(.disabled) .v-divider {
	--v-divider-label-color: var(--theme--foreground-subdued);

	&:hover {
		--v-divider-label-color: var(--theme--foreground-accent);
	}
}

.v-icon {
	margin-inline-end: 4px;
}

.content {
	margin-block-start: 12px;
}
</style>
