<template>
	<sidebar-detail :icon="active ? 'sync' : 'sync_disabled'" :title="$t('auto_refresh')" :badge="active">
		<div class="fields">
			<div class="field full">
				<p class="type-label">{{ $t('refresh_interval') }}</p>
				<v-select :items="items" v-model="interval" />
			</div>
		</div>
	</sidebar-detail>
</template>

<script lang="ts">
import i18n from '@/lang';
import { computed, defineComponent, ref, watch } from '@vue/composition-api';

export default defineComponent({
	props: {
		value: {
			type: Number,
			default: null,
		},
	},
	setup(props, { emit }) {
		const interval = computed<number | null>({
			get() {
				return props.value;
			},
			set(newVal) {
				emit('input', newVal);
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
				if (seconds === null)
					return {
						text: i18n.t('no_refresh'),
						value: null,
					};

				return seconds >= 60 && seconds % 60 === 0
					? {
							text: i18n.tc('refresh_interval_minutes', seconds / 60, { minutes: seconds / 60 }),
							value: seconds,
					  }
					: {
							text: i18n.tc('refresh_interval_seconds', seconds, { seconds }),
							value: seconds,
					  };
			});
		});

		const active = computed(() => interval.value !== null);

		return { active, interval, items };
	},
});
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
