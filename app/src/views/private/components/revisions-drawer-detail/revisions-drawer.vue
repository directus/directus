<template>
	<div>
		<v-drawer
			v-model="_active"
			:title="$t('item_revision')"
			@cancel="_active = false"
			:sidebar-label="$t(currentTab[0])"
		>
			<template #subtitle>
				<revisions-drawer-picker :revisions="revisions" :current.sync="_current" />
			</template>

			<template #sidebar>
				<v-tabs vertical v-model="currentTab">
					<v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value">
						{{ tab.text }}
					</v-tab>
				</v-tabs>
			</template>

			<div class="content">
				<revisions-drawer-preview v-if="currentTab[0] === 'revision_preview'" :revision="currentRevision" />
				<revisions-drawer-updates
					v-if="currentTab[0] === 'updates_made'"
					:revision="currentRevision"
					:revisions="revisions"
				/>
			</div>

			<template #actions>
				<v-button @click="revert" class="revert" icon rounded v-tooltip.bottom="$t('revert')">
					<v-icon name="restore" />
				</v-button>
				<v-button @click="_active = false" icon rounded v-tooltip.bottom="$t('done')">
					<v-icon name="check" />
				</v-button>
			</template>
		</v-drawer>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import useSync from '@/composables/use-sync';
import { Revision } from './types';
import i18n from '@/lang';
import RevisionsDrawerPicker from './revisions-drawer-picker.vue';
import RevisionsDrawerPreview from './revisions-drawer-preview.vue';
import RevisionsDrawerUpdates from './revisions-drawer-updates.vue';
import { isEqual } from 'lodash';

export default defineComponent({
	components: { RevisionsDrawerPicker, RevisionsDrawerPreview, RevisionsDrawerUpdates },
	props: {
		revisions: {
			type: Array as PropType<Revision[]>,
			required: true,
		},
		current: {
			type: [Number, String],
			default: null,
		},
		active: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const _active = useSync(props, 'active', emit);
		const _current = useSync(props, 'current', emit);

		const currentTab = ref(['revision_preview']);

		const currentRevision = computed(() => {
			return props.revisions.find((revision) => revision.id === props.current);
		});

		const previousRevision = computed(() => {
			const currentIndex = props.revisions.findIndex((revision) => revision.id === props.current);

			// This is assuming props.revisions is in chronological order from newest to oldest
			return props.revisions[currentIndex + 1];
		});

		const tabs = [
			{
				text: i18n.t('revision_preview'),
				value: 'revision_preview',
			},
			{
				text: i18n.t('updates_made'),
				value: 'updates_made',
			},
		];

		return {
			_active,
			_current,
			currentRevision,
			currentTab,
			tabs,
			revert,
		};

		function revert() {
			if (!currentRevision.value) return;

			const revertToValues: Record<string, any> = {};

			for (const [field, newValue] of Object.entries(currentRevision.value.delta)) {
				const previousValue = previousRevision.value.data[field];
				if (isEqual(newValue, previousValue)) continue;
				revertToValues[field] = previousValue;
			}

			emit('revert', revertToValues);

			_active.value = false;
		}
	},
});
</script>

<style lang="scss" scoped>
.revert {
	--v-button-background-color: var(--warning);
	--v-button-background-color-hover: var(--warning-125);
}

.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding);
}
</style>
