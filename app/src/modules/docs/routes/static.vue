<template>
	<private-view :title="title">
		<template #title-outer:prepend>
			<v-button rounded disabled icon>
				<v-icon name="info" />
			</v-button>
		</template>

		<template #title>
			<h1 class="type-title">{{ title }}</h1>
			<v-chip v-if="modularExtension" disabled small>Modular Extension</v-chip>
		</template>

		<template #navigation>
			<docs-navigation :path="route.path" />
		</template>

		<div class="docs-content selectable">
			<router-view @update:title="title = $event" @update:modular-extension="modularExtension = $event" />
		</div>

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="t('information')" close>
				<div v-md="t('page_help_docs_global')" class="page-description" />
			</sidebar-detail>
		</template>
	</private-view>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref } from 'vue';
import { useRoute } from 'vue-router';
import DocsNavigation from '../components/navigation.vue';

export default defineComponent({
	name: 'StaticDocs',
	components: { DocsNavigation },
	setup() {
		const { t } = useI18n();

		const route = useRoute();

		const title = ref('Test');
		const modularExtension = ref(false);

		return { t, route, title, modularExtension };
	},
});
</script>

<style lang="scss" scoped>
.docs-content {
	padding: 0 var(--content-padding) var(--content-padding-bottom);
}

.v-chip {
	--v-chip-background-color: var(--v-chip-background-color-hover);
	--v-chip-color: var(--v-chip-color-hover);

	margin-left: 12px;
	cursor: default !important;
}
</style>
