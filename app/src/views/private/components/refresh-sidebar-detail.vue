<script setup lang="ts">
import { Events, emitter } from '@/events';
import { computed, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	modelValue: number | null;
}>();

const emit = defineEmits<{
	'update:modelValue': [value: number | null];
	refresh: [];
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

const active = computed(() => interval.value !== null);

const activeInterval = ref<NodeJS.Timeout>();

const setRefreshInterval = (interval: number) => {
	activeInterval.value = setInterval(() => {
		emit('refresh');
	}, interval * 1000);
};

const onIdle = () => {
	if (activeInterval.value) clearInterval(activeInterval.value);
};

const onActive = () => {
	if (interval.value) setRefreshInterval(interval.value);
};

emitter.on(Events.tabIdle, onIdle);
emitter.on(Events.tabActive, onActive);

onUnmounted(() => {
	emitter.off(Events.tabIdle, onIdle);
	emitter.off(Events.tabActive, onActive);
});

watch(
	interval,
	(newInterval) => {
		if (activeInterval.value !== null) {
			clearInterval(activeInterval.value);
		}

		if (newInterval !== null && newInterval > 0) {
			setRefreshInterval(newInterval);
		}
	},
	{ immediate: true },
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
</script>

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

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.fields {
	--theme--form--row-gap: 24px;

	@include form-grid;

	.type-label {
		font-size: 1rem;
	}
}

.v-checkbox {
	margin-top: 8px;
}
</style>
