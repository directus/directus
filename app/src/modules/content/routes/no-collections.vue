<script setup lang="ts">
import { useUserStore } from '@/stores/user';
import ContentNavigation from '../components/navigation.vue';

const userStore = useUserStore();
</script>

<template>
	<private-view class="content-overview" :title="$t('content')">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="box" />
			</v-button>
		</template>

		<template #navigation>
			<content-navigation />
		</template>

		<v-info icon="box" :title="$t('no_collections')" center>
			<template v-if="userStore.isAdmin">
				{{ $t('no_collections_copy_admin') }}
			</template>

			<template v-else>
				{{ $t('no_collections_copy') }}
			</template>

			<template v-if="userStore.isAdmin" #append>
				<v-button to="/settings/data-model/+">{{ $t('create_collection') }}</v-button>
			</template>
		</v-info>

		<template #sidebar>
			<sidebar-detail icon="info" :title="$t('information')" close>
				<div v-md="$t('page_help_collections_overview')" class="page-description" />
			</sidebar-detail>
		</template>
	</private-view>
</template>

<style lang="scss" scoped>
.icon {
	--v-icon-color: var(--theme--foreground-subdued);

	:deep(i) {
		vertical-align: unset;
	}
}

.header-icon {
	--v-button-color-disabled: var(--theme--foreground);
}

.v-table {
	padding: var(--content-padding);
	padding-block-start: 0;
}
</style>
