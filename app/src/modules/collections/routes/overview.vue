<template>
	<private-view class="collections-overview" :title="$tc('collection', 2)">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="box" />
			</v-button>
		</template>

		<template #navigation>
			<collections-navigation />
		</template>

		<v-table v-if="navItems.length > 0" :headers="tableHeaders" :items="navItems" @click:row="navigateToCollection">
			<template #item.icon="{ item }">
				<v-icon class="icon" :name="item.icon" />
			</template>
		</v-table>

		<v-info icon="box" :title="$t('no_collections')" v-else center>
			<template v-if="isAdmin">
				{{ $t('no_collections_copy_admin') }}
			</template>
			<template #append v-if="isAdmin">
				<v-button to="/settings/data-model/+">{{ $t('create_collection') }}</v-button>
			</template>
			<template v-else>
				{{ $t('no_collections_copy') }}
			</template>
		</v-info>

		<template #drawer>
			<drawer-detail icon="info_outline" :title="$t('information')" close>
				<div class="page-description" v-html="marked($t('page_help_collections_overview'))" />
			</drawer-detail>
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import CollectionsNavigation from '../components/navigation.vue';
import { i18n } from '@/lang';
import useNavigation, { NavItem } from '../composables/use-navigation';
import router from '@/router';
import { useUserStore } from '@/stores';

import marked from 'marked';

export default defineComponent({
	name: 'collections-overview',
	components: {
		CollectionsNavigation,
	},
	props: {},
	setup() {
		const userStore = useUserStore();

		const tableHeaders = [
			{
				text: '',
				value: 'icon',
				width: 42,
				sortable: false,
			},
			{
				text: i18n.tc('collection', 1),
				value: 'name',
				width: 300,
			},
			{
				text: i18n.t('note'),
				value: 'note',
			},
		];

		const { navItems } = useNavigation();

		const isAdmin = computed(() => userStore.state.currentUser?.role.admin_access === true);

		return {
			tableHeaders,
			navItems,
			navigateToCollection,
			isAdmin,
			marked,
		};

		function navigateToCollection(navItem: NavItem) {
			router.push(navItem.to);
		}
	},
});
</script>

<style lang="scss" scoped>
.icon {
	--v-icon-color: var(--foreground-subdued);

	::v-deep i {
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
