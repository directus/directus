<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ExtensionType } from '@directus/extensions';
import { ExtensionStatus } from '../types';

const props = defineProps<{
	status: ExtensionStatus;
	type?: ExtensionType;
}>();

defineEmits<{ toggleStatus: [enabled: boolean] }>();

const { t } = useI18n();

const actions = computed(() => {
	const enabled = props.status === 'enabled';

	if (props.type !== 'bundle') {
		return [{ text: enabled ? t('disable') : t('enable'), enabled }];
	}

	if (props.status !== 'partial') {
		return [{ text: enabled ? t('disable_all') : t('enable_all'), enabled }];
	}

	return [
		{ text: t('enable_all'), enabled: false },
		{ text: t('disable_all'), enabled: true },
	];
});
</script>

<template>
	<div class="options">
		<v-menu placement="bottom-start" show-arrow>
			<template #activator="{ toggle }">
				<v-icon name="more_vert" clickable class="ctx-toggle" @click.prevent="toggle" />
			</template>
			<v-list>
				<v-list-item
					v-for="(action, index) in actions"
					:key="index"
					clickable
					@click="$emit('toggleStatus', action.enabled)"
				>
					<v-list-item-icon>
						<v-icon name="mode_off_on" :color="action.enabled ? 'var(--theme--danger)' : 'var(--theme--success)'" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ action.text }}
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
