<template>
	<v-list large>
		<v-list-item to="/organisms">
			<v-list-item-icon><v-icon name="folder_shared" outline /></v-list-item-icon>
			<v-list-item-content>{{ t('all_organisms') }}</v-list-item-content>
		</v-list-item>
	</v-list>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent } from 'vue';

export default defineComponent({
	setup() {
		const { t } = useI18n();

		return { t };
	},
});
</script>

<style lang="scss" scoped>
.v-skeleton-loader {
	--v-skeleton-loader-background-color: var(--background-normal-alt);
}

.v-divider {
	--v-divider-color: var(--background-normal-alt);
}
</style>
