<script setup lang="ts">
import SettingsNavigation from '../../components/navigation.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
	<private-view :title="t('extensions')">
		<template #headline><v-breadcrumb :items="[{ name: t('settings'), to: '/settings' }]" /></template>
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon exact disabled>
				<v-icon name="extension" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>
	</private-view>
</template>

<style lang="scss" scoped>
.header-icon {
	--v-button-background-color-disabled: var(--primary-10);
	--v-button-color-disabled: var(--primary);
	--v-button-background-color-hover-disabled: var(--primary-25);
	--v-button-color-hover-disabled: var(--primary);
}
</style>
