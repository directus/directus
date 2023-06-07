<template>
	<sidebar-detail :icon="active ? 'sync' : 'sync_disabled'" :title="t('auto_refresh')" :badge="active">
		<div class="fields">
			<div class="field full">
				<p class="type-label">{{ t('refresh_interval') }}</p>
				<v-select v-model="interval" :items="items" />
			</div>
		</div>
	</sidebar-detail>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
	modelValue: number | null;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: number | null): void;
	(e: 'refresh'): void;
}>();

const { t } = useI18n();

const interval = computed<number | null>({
	get() {
		return props.modelValue;
	},
	set(newVal) {
		emit('update:modelValue', newVal);
	},
});

const activeInterval = ref<NodeJS.Timeout | null>(null);

watch(
	interval,
	(newInterval) => {
		if (activeInterval.value !== null) {
			clearInterval(activeInterval.value);
		}

		if (newInterval !== null && newInterval > 0) {
			activeInterval.value = setInterval(() => {
				emit('refresh');
			}, newInterval * 1000);
		}
	},
	{ immediate: true }
);

const items = computed(() => {
	const intervals = [null, 10, 30, 60, 300];

	return intervals.map((seconds) => {
		if (seconds === null) {
			return {
				text: t('no_refresh'),
				value: null,
			};
		}

		return seconds >= 60 && seconds % 60 === 0
			? {
					text: t('refresh_interval_minutes', { minutes: seconds / 60 }, seconds / 60),
					value: seconds,
			  }
			: {
					text: t('refresh_interval_seconds', { seconds }, seconds),
					value: seconds,
			  };
	});
});

const active = computed(() => interval.value !== null);
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.fields {
	--form-vertical-gap: 24px;

	@include form-grid;

	.type-label {
		font-size: 1rem;
	}
}

.v-checkbox {
	margin-top: 8px;
}
</style>
