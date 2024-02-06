<script setup lang="ts">
import { ExtensionType } from '@directus/extensions';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ExtensionStatus } from '../types';

const props = defineProps<{
	status: ExtensionStatus;
	type?: ExtensionType;
	disableLocked?: boolean;
	uninstallLocked?: boolean;
	bundleEntry?: boolean;
}>();

defineEmits<{ toggleStatus: [enabled: boolean]; uninstall: [] }>();

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
					v-tooltip.left="disableLocked ? t('enabled_dev_tooltip') : null"
					:disabled="disableLocked"
					clickable
					@click="$emit('toggleStatus', action.enabled)"
				>
					<v-list-item-icon>
						<v-icon name="mode_off_on" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ action.text }}
					</v-list-item-content>
				</v-list-item>
				<template v-if="bundleEntry === false">
					<v-divider />
					<v-list-item
						v-tooltip.left="uninstallLocked ? t('uninstall_locked') : null"
						:disabled="uninstallLocked"
						class="uninstall"
						clickable
						@click="$emit('uninstall')"
					>
						<v-list-item-icon>
							<v-icon name="delete" />
						</v-list-item-icon>
						<v-list-item-content>
							{{ t('uninstall') }}
						</v-list-item-content>
					</v-list-item>
				</template>
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
