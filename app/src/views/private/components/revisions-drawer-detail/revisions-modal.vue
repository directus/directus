<template>
	<div>
		<v-modal v-model="_active" :title="$t('item_revision')">
			<template #subtitle>
				<revisions-modal-picker :revisions="revisions" :current.sync="_current" />
			</template>

			<template #sidebar>
				<v-tabs vertical v-model="currentTab">
					<v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value">
						{{ tab.text }}
					</v-tab>
				</v-tabs>
			</template>

			<div class="content">
				<revisions-modal-preview v-if="currentTab[0] === 'preview'" :revision="currentRevision" />
				<revisions-modal-updates
					v-if="currentTab[0] === 'updates'"
					:revision="currentRevision"
					:revisions="revisions"
				/>
			</div>

			<template #footer="{ close }">
				<v-button @click="confirmRevert = true" class="revert">
					{{ $t('revert') }}
				</v-button>
				<v-button @click="close">{{ $t('done') }}</v-button>
			</template>
		</v-modal>

		<v-dialog v-model="confirmRevert" :persistent="reverting">
			<v-card>
				<v-card-title>{{ $t('confirm_revert') }}</v-card-title>
				<v-card-text>{{ $t('confirm_revert_body') }}</v-card-text>
				<v-card-actions>
					<v-button secondary @click="confirmRevert = false" :disabled="reverting">
						{{ $t('cancel') }}
					</v-button>
					<v-button class="revert" @click="revert" :loading="reverting">
						{{ $t('revert') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import useSync from '@/composables/use-sync';
import { Revision } from './types';
import i18n from '@/lang';
import RevisionsModalPicker from './revisions-modal-picker.vue';
import RevisionsModalPreview from './revisions-modal-preview.vue';
import RevisionsModalUpdates from './revisions-modal-updates.vue';
import api from '@/api';

export default defineComponent({
	components: { RevisionsModalPicker, RevisionsModalPreview, RevisionsModalUpdates },
	props: {
		revisions: {
			type: Array as PropType<Revision[]>,
			required: true,
		},
		current: {
			type: Number,
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

		const currentTab = ref(['preview']);

		const currentRevision = computed(() => {
			return props.revisions.find((revision) => revision.id === props.current);
		});

		const tabs = [
			{
				text: i18n.t('revision_preview'),
				value: 'preview',
			},
			{
				text: i18n.t('updates_made'),
				value: 'updates',
			},
		];

		const { confirmRevert, reverting, revert } = useRevert();

		return {
			_active,
			_current,
			currentRevision,
			currentTab,
			tabs,
			confirmRevert,
			reverting,
			revert,
		};

		function useRevert() {
			const confirmRevert = ref(false);
			const reverting = ref(false);

			return { reverting, revert, confirmRevert };

			async function revert() {
				reverting.value = true;
				if (!currentRevision.value) return;

				try {
					const endpoint = currentRevision.value.collection.startsWith('directus_')
						? `/${currentRevision.value.collection.substring(9)}/${currentRevision.value.item}/revert/${
								currentRevision.value.id
						  }`
						: `/items/${currentRevision.value.collection}/${currentRevision.value.item}/revert/${currentRevision.value.id}`;
					await api.patch(endpoint);
					confirmRevert.value = false;
					_active.value = false;
					emit('revert');
				} catch (err) {
					console.error(err);
				} finally {
					reverting.value = false;
				}
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.revert {
	--v-button-background-color: var(--warning);
	--v-button-background-color-hover: var(--warning-125);
}
</style>
