<template>
	<v-list-item
		v-context-menu="'contextMenu'"
		:to="`/content/${bookmark.collection}?bookmark=${bookmark.id}`"
		query
		class="bookmark"
		clickable
	>
		<v-list-item-icon><v-icon :name="bookmark.icon" :color="bookmark.color" /></v-list-item-icon>
		<v-list-item-content>
			<v-text-overflow :text="bookmark.bookmark" />
		</v-list-item-content>

		<v-menu ref="contextMenu" show-arrow placement="bottom-start">
			<v-list>
				<v-list-item clickable :disabled="isMine === false" @click="editActive = true">
					<v-list-item-icon>
						<v-icon name="edit" outline />
					</v-list-item-icon>
					<v-list-item-content>
						<v-text-overflow :text="t('edit_bookmark')" />
					</v-list-item-content>
				</v-list-item>
				<v-list-item clickable class="danger" :disabled="isMine === false" @click="deleteActive = true">
					<v-list-item-icon>
						<v-icon name="delete" outline />
					</v-list-item-icon>
					<v-list-item-content>
						<v-text-overflow :text="t('delete_bookmark')" />
					</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-menu>

		<v-dialog v-model="editActive" persistent @esc="editCancel">
			<v-card>
				<v-card-title>{{ t('edit_bookmark') }}</v-card-title>
				<v-card-text>
					<div class="fields">
						<v-input v-model="editValue.name" class="full" autofocus @keyup.enter="editSave" />
						<interface-select-icon width="half" :value="editValue.icon" @input="editValue.icon = $event" />
						<interface-select-color width="half" :value="editValue.color" @input="editValue.color = $event" />
					</div>
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="editCancel">{{ t('cancel') }}</v-button>
					<v-button :disabled="editValue.name === null" :loading="editSaving" @click="editSave">
						{{ t('save') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog v-model="deleteActive" persistent @esc="deleteActive = false">
			<v-card>
				<v-card-title>{{ t('delete_bookmark_copy', { bookmark: bookmark.bookmark }) }}</v-card-title>
				<v-card-actions>
					<v-button secondary @click="deleteActive = false">{{ t('cancel') }}</v-button>
					<v-button :loading="deleteSaving" kind="danger" @click="deleteSave">
						{{ t('delete_label') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</v-list-item>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, ref, computed, reactive } from 'vue';
import { Preset } from '@directus/shared/types';
import { useUserStore, usePresetsStore } from '@/stores';
import { unexpectedError } from '@/utils/unexpected-error';
import { useRoute, useRouter } from 'vue-router';

export default defineComponent({
	props: {
		bookmark: {
			type: Object as PropType<Preset>,
			required: true,
		},
	},
	setup(props) {
		const { t } = useI18n();

		const router = useRouter();
		const route = useRoute();

		const userStore = useUserStore();
		const presetsStore = usePresetsStore();

		const isMine = computed(() => props.bookmark.user === userStore.currentUser!.id);

		const { editActive, editValue, editSave, editSaving, editCancel } = useEditBookmark();
		const { deleteActive, deleteSave, deleteSaving } = useDeleteBookmark();

		return {
			t,
			isMine,
			editActive,
			editValue,
			editSave,
			editSaving,
			editCancel,
			deleteActive,
			deleteSave,
			deleteSaving,
		};

		function useEditBookmark() {
			const editActive = ref(false);
			const editValue = reactive({
				name: props.bookmark.bookmark,
				icon: props.bookmark?.icon ?? 'bookmark_outline',
				color: props.bookmark?.color ?? null,
			});
			const editSaving = ref(false);

			return { editActive, editValue, editSave, editSaving, editCancel };

			async function editSave() {
				editSaving.value = true;

				try {
					await presetsStore.savePreset({
						...props.bookmark,
						bookmark: editValue.name,
						icon: editValue.icon,
						color: editValue.color,
					});

					editActive.value = false;
				} catch (err: any) {
					unexpectedError(err);
				} finally {
					editSaving.value = false;
				}
			}

			function editCancel() {
				editActive.value = false;
				editValue.name = props.bookmark.bookmark;
				editValue.icon = props.bookmark?.icon ?? 'bookmark_outline';
				editValue.color = props.bookmark?.color ?? null;
			}
		}

		function useDeleteBookmark() {
			const deleteActive = ref(false);
			const deleteSaving = ref(false);

			return { deleteActive, deleteSave, deleteSaving };

			async function deleteSave() {
				deleteSaving.value = true;

				try {
					let navigateTo: string | null = null;

					if (route.query?.bookmark && +route.query.bookmark === props.bookmark.id) {
						navigateTo = `/content/${props.bookmark.collection}`;
					}

					await presetsStore.delete([props.bookmark.id!]);
					deleteActive.value = false;

					if (navigateTo) {
						router.replace(navigateTo);
					}
				} catch (err: any) {
					unexpectedError(err);
				} finally {
					deleteSaving.value = false;
				}
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.danger {
	--v-list-item-color: var(--danger);
	--v-list-item-icon-color: var(--danger);
}

.fields {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;

	.full {
		grid-column: 1 / span 2;
	}
}
</style>
