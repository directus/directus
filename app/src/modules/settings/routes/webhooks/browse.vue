<template>
	<private-view :title="$t('webhooks')">
		<template #headline>{{ $t('settings') }}</template>

		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="anchor" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<div class="content">
			<v-notice>Pre-Release: Feature not yet available</v-notice>
		</div>

		<template #drawer>
			<drawer-detail icon="info_outline" :title="$t('information')" close>
				<div class="page-description" v-html="marked($t('page_help_settings_webhooks_browse'))" />
			</drawer-detail>
			<layout-drawer-detail />
			<portal-target name="drawer" />
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import SettingsNavigation from '../../components/navigation.vue';

import LayoutDrawerDetail from '@/views/private/components/layout-drawer-detail';

type Item = {
	[field: string]: any;
};

export default defineComponent({
	name: 'webhooks-browse',
	components: { SettingsNavigation, LayoutDrawerDetail },
});
</script>

<style lang="scss" scoped>
.header-icon {
	--v-button-color-disabled: var(--warning);
	--v-button-background-color-disabled: var(--warning-25);
}

.content {
	padding: var(--content-padding);
}
</style>
