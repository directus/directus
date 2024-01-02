<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ExtensionType } from '@directus/extensions';

const props = defineProps<{
	type?: ExtensionType;
	enabled: boolean;
}>();

defineEmits<{ toggleEnabled: [] }>();

const { t } = useI18n();

const status = computed(() => {
	if (props.type === 'bundle') {
		return props.enabled ? t('disable_all') : t('enable_all');
	}

	return props.enabled ? t('disable') : t('enable');
});
</script>

<template>
	<div class="options">
		<v-menu placement="bottom-start" show-arrow>
			<template #activator="{ toggle }">
				<v-icon name="more_vert" clickable class="ctx-toggle" @click.prevent="toggle" />
			</template>
			<v-list>
				<v-list-item clickable @click="$emit('toggleEnabled')">
					<v-list-item-icon>
						<v-icon name="mode_off_on" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ status }}
					</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-menu>
	</div>
</template>

<style lang="scss" scoped>
.ctx-toggle {
	--v-icon-color: var(--theme--foreground-subdued);

	&:hover {
		--v-icon-color: var(--theme--foreground);
	}
}
</style>
