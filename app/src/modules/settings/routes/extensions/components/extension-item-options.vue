<script setup lang="ts">
import { ApiOutput } from '@directus/types';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ExtensionState, ExtensionType } from '../types';
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';

const props = defineProps<{
	extension: ApiOutput;
	type: ExtensionType;
	state: ExtensionState;
	stateLocked: boolean;
}>();

defineEmits<{ toggleState: [enabled: boolean]; uninstall: []; reinstall: []; remove: [] }>();

const { t } = useI18n();

const uninstallLocked = computed(() => props.extension.meta.source !== 'registry');

const stateActions = computed(() => {
	const enabled = props.state === 'enabled';

	if (props.type !== 'bundle') return [{ text: enabled ? t('disable') : t('enable'), enabled }];

	if (props.state !== 'partial') return [{ text: enabled ? t('disable_all') : t('enable_all'), enabled }];

	return [
		{ text: t('enable_all'), enabled: false },
		{ text: t('disable_all'), enabled: true },
	];
});
</script>

<template>
	<VMenu placement="bottom-start" show-arrow>
		<template #activator="{ toggle }">
			<VIcon name="more_vert" clickable class="menu-toggle" @click.prevent="toggle" />
		</template>
		<VList>
			<template v-if="type !== 'missing'">
				<VListItem
					v-for="(action, index) in stateActions"
					:key="index"
					v-tooltip.left="stateLocked ? $t('enabled_dev_tooltip') : null"
					:disabled="stateLocked"
					clickable
					@click="$emit('toggleState', action.enabled)"
				>
					<VListItemIcon>
						<VIcon name="mode_off_on" />
					</VListItemIcon>
					<VListItemContent>
						{{ action.text }}
					</VListItemContent>
				</VListItem>
				<template v-if="!extension.bundle">
					<VDivider />
					<VListItem
						v-tooltip.left="uninstallLocked ? $t('uninstall_locked') : null"
						:disabled="uninstallLocked"
						class="uninstall"
						clickable
						@click="$emit('uninstall')"
					>
						<VListItemIcon>
							<VIcon name="delete" />
						</VListItemIcon>
						<VListItemContent>
							{{ $t('uninstall') }}
						</VListItemContent>
					</VListItem>
				</template>
			</template>

			<template v-else>
				<template v-if="props.extension.meta.source === 'registry'">
					<VListItem clickable @click="$emit('reinstall')">
						<VListItemIcon>
							<VIcon name="download" />
						</VListItemIcon>
						<VListItemContent>
							{{ $t('reinstall') }}
						</VListItemContent>
					</VListItem>
					<VDivider />
				</template>
				<VListItem clickable @click="$emit('remove')">
					<VListItemIcon>
						<VIcon name="delete" />
					</VListItemIcon>
					<VListItemContent>
						{{ $t('remove') }}
					</VListItemContent>
				</VListItem>
			</template>
		</VList>
	</VMenu>
</template>

<style lang="scss" scoped>
.menu-toggle {
	--v-icon-color: var(--theme--foreground-subdued);

	&:hover {
		--v-icon-color: var(--theme--foreground);
	}
}
</style>
