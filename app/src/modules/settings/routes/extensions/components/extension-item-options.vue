<script setup lang="ts">
import { useI18n } from 'vue-i18n';

defineProps<{
	name: string;
	enabled: boolean;
}>();

defineEmits<{ toggleEnabled: [] }>();

const { t } = useI18n();
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
						{{ enabled ? t('disable') : t('enable') }}
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

.v-list-item.danger {
	--v-list-item-color: var(--theme--danger);
	--v-list-item-color-hover: var(--theme--danger);
	--v-list-item-icon-color: var(--theme--danger);
}

.v-list-item.warning {
	--v-list-item-color: var(--theme--warning);
	--v-list-item-color-hover: var(--theme--warning);
	--v-list-item-icon-color: var(--theme--warning);
}
</style>
