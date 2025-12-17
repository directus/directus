<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemHint from '@/components/v-list-item-hint.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import { translateShortcut } from '@/utils/translate-shortcut';

defineProps<{
	disabledOptions?: string[];
}>();

defineEmits<{
	(e: 'save-and-stay'): void;
	(e: 'save-and-add-new'): void;
	(e: 'save-as-copy'): void;
	(e: 'discard-and-stay'): void;
}>();
</script>

<template>
	<VMenu show-arrow>
		<template #activator="{ toggle }">
			<VIcon name="more_vert" clickable @click="toggle" />
		</template>

		<VList>
			<VListItem v-if="!disabledOptions?.includes('save-and-stay')" clickable @click="$emit('save-and-stay')">
				<VListItemIcon><VIcon name="check" /></VListItemIcon>
				<VListItemContent>{{ $t('save_and_stay') }}</VListItemContent>
				<VListItemHint>{{ translateShortcut(['meta', 's']) }}</VListItemHint>
			</VListItem>
			<VListItem v-if="!disabledOptions?.includes('save-and-add-new')" clickable @click="$emit('save-and-add-new')">
				<VListItemIcon><VIcon name="add" /></VListItemIcon>
				<VListItemContent>{{ $t('save_and_create_new') }}</VListItemContent>
				<VListItemHint>{{ translateShortcut(['meta', 'shift', 's']) }}</VListItemHint>
			</VListItem>
			<VListItem v-if="!disabledOptions?.includes('save-as-copy')" clickable @click="$emit('save-as-copy')">
				<VListItemIcon><VIcon name="done_all" /></VListItemIcon>
				<VListItemContent>{{ $t('save_as_copy') }}</VListItemContent>
			</VListItem>
			<VListItem v-if="!disabledOptions?.includes('discard-and-stay')" clickable @click="$emit('discard-and-stay')">
				<VListItemIcon><VIcon name="undo" /></VListItemIcon>
				<VListItemContent>{{ $t('discard_all_changes') }}</VListItemContent>
			</VListItem>
		</VList>
	</VMenu>
</template>

<style scoped>
.v-icon {
	--focus-ring-offset: var(--focus-ring-offset-invert);

	color: var(--theme--foreground-subdued) !important;

	&:hover:not(.disabled) {
		color: var(--theme--foreground) !important;
	}

	&.disabled {
		cursor: not-allowed;
	}
}

.v-list-item {
	white-space: nowrap;
}
</style>
