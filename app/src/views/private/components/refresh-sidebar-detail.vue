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

const active = computed(() => interval.value !== null);
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

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { computed, defineComponent, ref, watch } from 'vue';
import { idleTracker } from '@/idle';
import { useAppStore } from '@/stores/app';
import emitter from '@/events';
export default defineComponent({
	props: {
		modelValue: {
			type: Number,
			default: null,
		},
	},
	emits: ['update:modelValue', 'refresh'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const appStore = useAppStore();

		const interval = computed<number | null>({
			get() {
				return props.modelValue;
			},
			set(newVal) {
				emit('update:modelValue', newVal);
			},
		});

		const activeInterval = ref<NodeJS.Timeout | null>(null);

		const setRefreshInterval = (interval: number) => {
			activeInterval.value = setInterval(() => {
				emit('refresh');
			}, interval * 1000);
		};

		idleTracker.on('hide', () => {
			emitter.off('token-refreshed');
			if (activeInterval.value) clearInterval(activeInterval.value);
		});

		idleTracker.on('idle', () => {
			if (activeInterval.value) clearInterval(activeInterval.value);
		});

		idleTracker.on('active', () => {
			if (interval.value) setRefreshInterval(interval.value);
		});

		idleTracker.on('show', () => {
			if (appStore.isTokenExpired) {
				// If access token is expired , then refresh token and then refresh collection
				emitter.on('token-refreshed', () => {
					emit('refresh');
				});
			} else {
				// Check for access token expiry and if token is still fresh, then emit refresh
				emit('refresh');
			}
			if (interval.value) setRefreshInterval(interval.value);
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
			{ immediate: true }
		);

		const items = computed(() => {
			const intervals = [null, 10, 30, 60, 300];

			return intervals.map((seconds) => {
				if (seconds === null)
					return {
						text: t('no_refresh'),
						value: null,
					};

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

		return { t, active, interval, items };
	},
});
</script>

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
