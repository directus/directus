<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import VChip from '@/components/v-chip.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';

const props = withDefaults(
	defineProps<{
		modelValue?: 'Previous' | 'Latest';
		disablePrevious?: boolean;
	}>(),
	{
		modelValue: 'Previous',
		disablePrevious: false,
	},
);

const emit = defineEmits<{
	'update:modelValue': [value: 'Previous' | 'Latest'];
}>();

const { t } = useI18n();

function selectOption(option: 'Previous' | 'Latest') {
	if (option === 'Previous' && props.disablePrevious) return;
	emit('update:modelValue', option);
}

const toggleClass = computed(() => {
	return props.modelValue.toLowerCase();
});

const displayValue = computed(() => {
	return props.modelValue === 'Previous' ? t('previous') : t('latest');
});
</script>

<template>
	<VMenu placement="top-start" show-arrow>
		<template #activator="{ toggle, active }">
			<VChip small clickable class="toggle" :class="[toggleClass, { active }]" @click="toggle">
				{{ displayValue }}
				<VIcon name="sync_alt" right :style="{ '--v-icon-size': '16px' }" />
			</VChip>
		</template>

		<VList class="comparison-toggle-list">
			<VListItem clickable :active="props.modelValue === 'Latest'" @click="selectOption('Latest')">
				<VListItemIcon>
					<VIcon name="check_circle" />
				</VListItemIcon>
				<VListItemContent>{{ $t('latest_revision') }}</VListItemContent>
			</VListItem>

			<VListItem
				:clickable="!props.disablePrevious"
				:disabled="props.disablePrevious"
				:active="props.modelValue === 'Previous'"
				@click="selectOption('Previous')"
			>
				<VListItemIcon>
					<VIcon name="history" />
				</VListItemIcon>
				<VListItemContent>{{ $t('previous_revision') }}</VListItemContent>
			</VListItem>
		</VList>
	</VMenu>
</template>

<style lang="scss" scoped>
.comparison-toggle-list {
	display: flex;
	padding: 4px;
	flex-direction: column;
	align-items: flex-start;
	gap: 2px;
}

.toggle {
	--v-chip-padding: 0 8px;

	&.previous {
		--v-chip-color: var(--theme--background);
		--v-chip-color-hover: var(--theme--background);
		--v-chip-background-color: var(--theme--primary);
		--v-chip-background-color-hover: var(--theme--primary);
		--v-chip-border-color: transparent;
		--v-chip-border-color-hover: var(--theme--primary-subdued);

		&:hover {
			--v-chip-color: var(--theme--background);
			--v-chip-background-color: var(--theme--primary);
			--v-chip-border-color: var(--theme--primary-accent);
		}
	}

	&.latest {
		--v-chip-color: var(--theme--primary);
		--v-chip-color-hover: var(--theme--primary);
		--v-chip-background-color: var(--theme--primary-background);
		--v-chip-background-color-hover: var(--theme--primary-background);
		--v-chip-border-color: transparent;
		--v-chip-border-color-hover: var(--theme--primary);

		&:hover {
			--v-chip-color: var(--theme--primary);
			--v-chip-background-color: var(--theme--primary-background);
			--v-chip-border-color: var(--theme--primary);
		}
	}
}
</style>
