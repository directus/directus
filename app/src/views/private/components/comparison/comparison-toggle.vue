<script setup lang="ts">
import { computed } from 'vue';
import VChip from '@/components/v-chip.vue';
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';

const props = withDefaults(
	defineProps<{
		modelValue?: 'Previous' | 'Latest';
	}>(),
	{
		modelValue: 'Previous',
	},
);

const emit = defineEmits<{
	'update:modelValue': [value: 'Previous' | 'Latest'];
}>();

function selectOption(option: 'Previous' | 'Latest') {
	emit('update:modelValue', option);
}

const toggleClass = computed(() => {
	return props.modelValue.toLowerCase();
});
</script>

<template>
	<VMenu placement="top-start" show-arrow>
		<template #activator="{ toggle, active }">
			<VChip small clickable class="toggle" :class="[toggleClass, { active }]" @click="toggle">
				{{ props.modelValue }}
				<VIcon name="sync_alt" right :style="{ '--v-icon-size': '16px' }" />
			</VChip>
		</template>

		<VList>
			<VListItem clickable @click="selectOption('Latest')">
				<VListItemIcon>
					<VIcon name="check_circle" />
				</VListItemIcon>
				<VListItemContent>Latest</VListItemContent>
			</VListItem>

			<VDivider />

			<VListItem clickable @click="selectOption('Previous')">
				<VListItemIcon>
					<VIcon name="history" />
				</VListItemIcon>
				<VListItemContent>Previous</VListItemContent>
			</VListItem>
		</VList>
	</VMenu>
</template>

<style lang="scss" scoped>
.toggle {
	--v-chip-font-family: var(--theme--fonts--monospace--font-family);

	&.previous {
		--v-chip-color: var(--theme--background);
		--v-chip-color-hover: var(--theme--background);
		--v-chip-background-color: var(--theme--primary);
		--v-chip-background-color-hover: var(--theme--primary);
		--v-chip-border-color: transparent;
		--v-chip-border-color-hover: var(--theme--primary-subdued);

		&.active {
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

		&.active {
			--v-chip-color: var(--theme--primary);
			--v-chip-background-color: var(--theme--primary-background);
			--v-chip-border-color: var(--theme--primary);
		}
	}
}
</style>
