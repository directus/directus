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

		<v-table :headers="tableHeaders" :items="navItems" @click:row="navigateToCollection">
			<template #item.icon="{ item }">
				<v-icon class="icon" :name="item.icon" />
			</template>
		</v-table>
	</private-view>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import CollectionsNavigation from '../../components/navigation/';
import { i18n } from '@/lang';
import useNavigation, { NavItem } from '../../compositions/use-navigation';
import router from '@/router';

export default defineComponent({
	name: 'collections-overview',
	components: {
		CollectionsNavigation,
	},
	props: {},
	setup() {
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
		return { tableHeaders, navItems, navigateToCollection };
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
