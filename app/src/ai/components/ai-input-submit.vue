<script setup lang="ts">
import { computed } from 'vue';
import { useAiStore } from '../stores/use-ai';

const aiStore = useAiStore();

const props = defineProps<{
	disabled?: boolean;
	canSubmit: boolean;
}>();

const emits = defineEmits<{
	stop: [];
	reload: [];
	submit: [];
}>();

const icon = computed(() => {
	if (aiStore.status === 'streaming' || aiStore.status === 'submitted') {
		return 'stop_circle';
	}

	if (aiStore.status === 'error') {
		return 'replay';
	}

	return 'arrow_upward';
});

const isDisabled = computed(() => {
	// Always allow stopping during streaming/submitted
	if (aiStore.status === 'streaming' || aiStore.status === 'submitted') {
		return false;
	}

	// Always allow retry on error
	if (aiStore.status === 'error') {
		return false;
	}

	// Only disable submit when no content
	return !props.canSubmit;
});

const handleClick = () => {
	switch (aiStore.status) {
		case 'streaming':
			emits('stop');
			break;
		case 'submitted':
			emits('reload');
			break;
		case 'error':
			emits('reload');
			break;
		default:
			emits('submit');
			break;
	}
};
</script>

<template>
	<v-button :disabled="isDisabled" class="submit-button" x-small :danger="aiStore.status === 'error'" icon @click="handleClick">
		<v-icon :name="icon" />
	</v-button>
</template>
