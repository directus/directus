<template>
	<v-button
		v-tooltip.bottom="t('layouts.graph.toggle_simulation')"
		icon
		rounded
		secondary
		@click="modelRunning = !modelRunning"
	>
		<v-icon v-if="props.running" name="pause" />
		<v-icon v-else name="play_arrow" />
	</v-button>
</template>

<script setup lang="ts">
import { useSync } from '@directus/shared/composables';
import { useI18n } from 'vue-i18n';

interface Props {
	running: boolean;
}

const props = defineProps<Props>();
const { t } = useI18n();

const emit = defineEmits(['update:running']);

const modelRunning = useSync(props, 'running', emit);
</script>

<style lang="scss" scoped>
.v-button {
	margin-right: 8px;
}
</style>
