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
</template>

<style lang="scss" scoped>
.ctx-toggle {
	--v-icon-color: var(--foreground-subdued);

	&:hover {
		--v-icon-color: var(--foreground-normal);
	}
}

.v-list-item.danger {
	--v-list-item-color: var(--danger);
	--v-list-item-color-hover: var(--danger);
	--v-list-item-icon-color: var(--danger);
}

.v-list-item.warning {
	--v-list-item-color: var(--warning);
	--v-list-item-color-hover: var(--warning);
	--v-list-item-icon-color: var(--warning);
}
</style>
