<script setup lang="ts">
import { computed } from 'vue';
import type { AiStatus } from './ai-message-list.vue';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

const props = defineProps<{
	status: AiStatus;
	canSubmit: boolean;
	isProcessing?: boolean;
	canStop?: boolean;
}>();

const emits = defineEmits<{
	stop: [];
	reload: [];
	submit: [];
}>();

const isBusy = computed(() => props.isProcessing || props.status === 'streaming' || props.status === 'submitted');
const isStopAllowed = computed(() => props.canStop ?? true);

const icon = computed(() => {
	if (isBusy.value) return 'stop_circle';
	if (props.status === 'error') return 'replay';
	return 'arrow_upward';
});

const isDisabled = computed(() => {
	if (props.status === 'error') return false;
	if (isBusy.value) return !isStopAllowed.value;
	return !props.canSubmit;
});

const handleClick = () => {
	if (isBusy.value && isStopAllowed.value) {
		emits('stop');
	} else if (props.status === 'error') {
		emits('reload');
	} else {
		emits('submit');
	}
};
</script>

<template>
	<VButton
		:disabled="isDisabled"
		class="submit-button"
		x-small
		:danger="props.status === 'error'"
		icon
		@click="handleClick"
	>
		<VIcon :name="icon" />
	</VButton>
</template>
