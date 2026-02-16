<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import SidebarDetail from './sidebar-detail.vue';
import VSelect from '@/components/v-select/v-select.vue';

const model = defineModel<number | null>({ required: true });

const emit = defineEmits<{
	refresh: [];
}>();

const { t } = useI18n();

const active = computed(() => model.value && model.value > 0);

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
	<SidebarDetail id="refresh" :icon="active ? 'sync' : 'sync_disabled'" :title="$t('auto_refresh')" :badge="active">
		<div class="fields">
			<div class="field full">
				<p class="type-label">{{ $t('refresh_interval') }}</p>
				<VSelect v-model="model" :items="items" />
			</div>
		</div>
	</SidebarDetail>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.fields {
	--theme--form--row-gap: 24px;

	@include mixins.form-grid;

	.type-label {
		font-size: 1rem;
	}
}

.v-checkbox {
	margin-block-start: 8px;
}
</style>
