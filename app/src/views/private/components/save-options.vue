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
	<v-menu show-arrow>
		<template #activator="{ toggle }">
			<v-icon name="more_vert" clickable @click="toggle" />
		</template>

		<v-list>
			<v-list-item v-if="!disabledOptions?.includes('save-and-stay')" clickable @click="$emit('save-and-stay')">
				<v-list-item-icon><v-icon name="check" /></v-list-item-icon>
				<v-list-item-content>{{ $t('save_and_stay') }}</v-list-item-content>
				<v-list-item-hint>{{ translateShortcut(['meta', 's']) }}</v-list-item-hint>
			</v-list-item>
			<v-list-item v-if="!disabledOptions?.includes('save-and-add-new')" clickable @click="$emit('save-and-add-new')">
				<v-list-item-icon><v-icon name="add" /></v-list-item-icon>
				<v-list-item-content>{{ $t('save_and_create_new') }}</v-list-item-content>
				<v-list-item-hint>{{ translateShortcut(['meta', 'shift', 's']) }}</v-list-item-hint>
			</v-list-item>
			<v-list-item v-if="!disabledOptions?.includes('save-as-copy')" clickable @click="$emit('save-as-copy')">
				<v-list-item-icon><v-icon name="done_all" /></v-list-item-icon>
				<v-list-item-content>{{ $t('save_as_copy') }}</v-list-item-content>
			</v-list-item>
			<v-list-item v-if="!disabledOptions?.includes('discard-and-stay')" clickable @click="$emit('discard-and-stay')">
				<v-list-item-icon><v-icon name="undo" /></v-list-item-icon>
				<v-list-item-content>{{ $t('discard_all_changes') }}</v-list-item-content>
			</v-list-item>
		</v-list>
	</v-menu>
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
