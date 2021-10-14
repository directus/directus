<template>
	<private-view class="collections-overview" :title="t('collections')">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="box" />
			</v-button>
		</template>

		<template #navigation>
			<collections-navigation-search />
			<collections-navigation />
		</template>

		<v-table
			v-if="navItems.length > 0"
			v-model:headers="tableHeaders"
			:items="navItems"
			show-resize
			fixed-header
			@click:row="navigateToCollection"
		>
			<template #[`item.icon`]="{ item }">
				<v-icon class="icon" :name="item.icon" :color="item.color" />
			</template>
		</v-table>

		<v-info v-else icon="box" :title="t('no_collections')" center>
			<template v-if="isAdmin">
				{{ t('no_collections_copy_admin') }}
			</template>
			<template v-else>
				{{ t('no_collections_copy') }}
			</template>
			<template v-if="isAdmin" #append>
				<v-button to="/settings/data-model/+">{{ t('create_collection') }}</v-button>
			</template>
		</v-info>

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="t('information')" close>
				<div v-md="t('page_help_collections_overview')" class="page-description" />
			</sidebar-detail>
		</template>
	</private-view>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed, ref } from 'vue';
import { HeaderRaw } from '@/components/v-table/types';
import CollectionsNavigation from '../components/navigation.vue';
import CollectionsNavigationSearch from '../components/navigation-search.vue';
import useNavigation, { NavItem } from '../composables/use-navigation';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores';

export default defineComponent({
	name: 'CollectionsOverview',
	components: {
		CollectionsNavigation,
		CollectionsNavigationSearch,
	},
	props: {},
	setup() {
		const { t } = useI18n();

		const router = useRouter();

		const userStore = useUserStore();

		const tableHeaders = ref<HeaderRaw[]>([
			{
				text: '',
				value: 'icon',
				width: 42,
				sortable: false,
			},
			{
				text: t('name'),
				value: 'name',
				width: 240,
			},
			{
				text: t('note'),
				value: 'note',
				width: 360,
			},
		]);

		const { navItems } = useNavigation();

		const isAdmin = computed(() => userStore.currentUser?.role.admin_access === true);

		return { t, tableHeaders, navItems, navigateToCollection, isAdmin };

		function navigateToCollection(navItem: NavItem) {
			router.push(navItem.to);
		}
	},
});
</script>

<style lang="scss" scoped>
.icon {
	--v-icon-color: var(--foreground-subdued);

	:deep(i) {
		vertical-align: unset;
	}
}

.header-icon {
	--v-button-color-disabled: var(--foreground-normal);
}

.v-table {
	padding: var(--content-padding);
	padding-top: 0;
}
</style>
