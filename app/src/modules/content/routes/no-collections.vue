<script setup lang="ts">
import VButton from '@/components/v-button.vue';
import VInfo from '@/components/v-info.vue';
import { useUserStore } from '@/stores/user';
import { PrivateView } from '@/views/private';
import ContentNavigation from '../components/navigation.vue';

const userStore = useUserStore();
</script>

<template>
	<PrivateView class="content-overview" :title="$t('content')" icon="box">
		<template #navigation>
			<ContentNavigation />
		</template>

		<VInfo icon="box" :title="$t('no_collections')" center>
			<template v-if="userStore.isAdmin">
				{{ $t('no_collections_copy_admin') }}
			</template>

			<template v-else>
				{{ $t('no_collections_copy') }}
			</template>

			<template v-if="userStore.isAdmin" #append>
				<VButton to="/settings/data-model/+">{{ $t('create_collection') }}</VButton>
			</template>
		</VInfo>
	</PrivateView>
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
