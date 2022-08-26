<template>
	<private-view :title="title">
		<template v-if="breadcrumb" #headline>
			<v-breadcrumb :items="breadcrumb" />
		</template>

		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="people_alt" />
			</v-button>
		</template>

		<template #actions:prepend>
			
		</template>

		<template #actions>
			
		</template>

		<template #navigation>
			<navigation />
		</template>

		<template #sidebar>
			
		</template>
	</private-view>
</template>

<script lang="ts" setup>
import Navigation from '../components/navigation.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
	role: string | null;
}

const props = withDefaults(defineProps<Props>(), {
	role: null,
});

const { t } = useI18n();

const { breadcrumb, title } = useBreadcrumb();

function useBreadcrumb() {
	const breadcrumb = computed(() => {
		if (!props.role) return null;

		return [
			{
				name: t('user_directory'),
				to: `/noclip`,
			},
		];
	});

	const title = computed(() => {
		return t('user_directory');
	});

	return { breadcrumb, title };
}

</script>

<style lang="scss" scoped>
.action-delete {
	--v-button-background-color-hover: var(--danger) !important;
	--v-button-color-hover: var(--white) !important;
}

.header-icon {
	--v-button-color-disabled: var(--foreground-normal);
}

.layout {
	--layout-offset-top: 64px;
}
</style>
