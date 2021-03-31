<template>
	<sidebar-detail :icon="active ? 'sync' : 'sync_disabled'" :title="$t('auto_refresh')">
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
			default: 0,
		},
	},
	setup(props, { emit }) {
		const interval = computed<number>({
			get() {
				return props.value;
			},
			set(newVal) {
				emit('input', newVal);
			},
		});

		const activeInterval = ref<NodeJS.Timeout | null>(null);

		watch(interval, (newInterval) => {
			if (activeInterval.value !== null) {
				clearInterval(activeInterval.value);
			}
			if (newInterval !== 0) {
				activeInterval.value = setInterval(() => {
					emit('refresh');
				}, newInterval * 1000);
			}
		});

		const items = computed(() => {
			const intervals = [0, 1, 10, 60];
			return intervals.map((seconds) => {
				return {
					text: i18n.tc('refresh_interval_seconds', seconds, { seconds }),
					value: seconds,
				};
			});
		});
		const active = computed(() => interval.value !== 0);

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
