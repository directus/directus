<script setup lang="ts">
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { useCollectionPermissions } from '@/composables/use-permissions';
import { computed } from 'vue';
import type { MiniApp } from '../composables/use-minis';

const props = defineProps<{
	apps: MiniApp[];
	loading?: boolean;
}>();

defineEmits(['create']);

const { createAllowed } = useCollectionPermissions('directus_minis');

const navItems = computed(() =>
	props.apps.map((miniApp) => ({
		icon: miniApp.icon || 'apps',
		name: miniApp.name,
		to: `/minis/${miniApp.id}`,
		status: miniApp.status,
	})),
);
</script>

<template>
	<VList nav>
		<VButton
			v-if="!loading && navItems.length === 0 && createAllowed"
			full-width
			outlined
			dashed
			@click="$emit('create')"
		>
			{{ $t('minis.create_mini_app') }}
		</VButton>

		<VListItem v-for="navItem in navItems" v-else :key="navItem.to" :to="navItem.to">
			<VListItemIcon>
				<VIcon :name="navItem.icon" :class="{ draft: navItem.status === 'draft' }" />
			</VListItemIcon>
			<VListItemContent>
				<VTextOverflow :text="navItem.name" />
			</VListItemContent>
		</VListItem>
	</VList>
</template>

<style scoped>
.draft {
	opacity: 0.5;
}
</style>
