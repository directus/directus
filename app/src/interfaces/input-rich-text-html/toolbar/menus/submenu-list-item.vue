<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';

defineProps<{
	/** i18n-resolved label shown on the activator row. */
	label: string;
	/** Optional leading icon name. */
	icon?: string;
	/** Disables the activator and prevents the flyout from opening. */
	disabled?: boolean;
}>();
</script>

<template>
	<VMenu placement="right-start" trigger="hover" :offset-y="0" :disabled="disabled" :close-on-content-click="false">
		<template #activator="{ active, toggle }">
			<!-- .stop keeps the parent menu open while this row toggles its own flyout -->
			<VListItem clickable :active="active" :disabled="disabled" @click.stop="toggle">
				<VListItemIcon v-if="icon"><VIcon :name="icon" /></VListItemIcon>
				<VListItemContent>{{ label }}</VListItemContent>
				<VListItemIcon class="chevron"><VIcon name="chevron_right" /></VListItemIcon>
			</VListItem>
		</template>
		<VList>
			<slot />
		</VList>
	</VMenu>
</template>

<style lang="scss" scoped>
.chevron {
	// Push the chevron to the trailing edge of the row.
	margin-inline-start: auto !important;
}
</style>
