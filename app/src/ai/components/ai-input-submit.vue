<script setup lang="ts">
import { computed } from 'vue';
import type { AiStatus } from './ai-message-list.vue';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

const props = defineProps<{
	status: AiStatus;
	canSubmit: boolean;
}>();

const emits = defineEmits<{
	stop: [];
	reload: [];
	submit: [];
}>();

const isProcessing = computed(() => props.status === 'streaming' || props.status === 'submitted');

const icon = computed(() => {
	if (isProcessing.value) return 'stop_circle';
	if (props.status === 'error') return 'replay';
	return 'arrow_upward';
});

const isDisabled = computed(() => {
	if (isProcessing.value || props.status === 'error') return false;
	return !props.canSubmit;
});

const handleClick = () => {
	if (isProcessing.value) {
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
