<template>
	<v-list-item
		:to="`/collections/${bookmark.collection}?bookmark=${bookmark.id}`"
		query
		class="bookmark"
		clickable
		@contextmenu.prevent.stop="activateContextMenu"
	>
		<v-list-item-icon><v-icon name="bookmark_outline" /></v-list-item-icon>
		<v-list-item-content>
			<v-text-overflow :text="bookmark.bookmark" />
		</v-list-item-content>

		<v-menu ref="contextMenu" show-arrow placement="bottom-start">
			<v-list>
				<v-list-item clickable :disabled="isMine === false" @click="renameActive = true">
					<v-list-item-icon>
						<v-icon name="edit" outline />
					</v-list-item-icon>
					<v-list-item-content>
						<v-text-overflow :text="t('rename_bookmark')" />
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

		<v-dialog v-model="renameActive" persistent @esc="renameActive = false">
			<v-card>
				<v-card-title>{{ t('rename_bookmark') }}</v-card-title>
				<v-card-text>
					<v-input v-model="renameValue" autofocus @keyup.enter="renameSave" />
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="renameActive = false">{{ t('cancel') }}</v-button>
					<v-button :disabled="renameValue === null" :loading="renameSaving" @click="renameSave">
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
import { defineComponent, PropType, ref, computed } from 'vue';
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

		const contextMenu = ref();
		const userStore = useUserStore();
		const presetsStore = usePresetsStore();

		const isMine = computed(() => props.bookmark.user === userStore.currentUser!.id);

		const { renameActive, renameValue, renameSave, renameSaving } = useRenameBookmark();
		const { deleteActive, deleteValue, deleteSave, deleteSaving } = useDeleteBookmark();

		return {
			t,
			contextMenu,
			isMine,
			renameActive,
			renameValue,
			renameSave,
			renameSaving,
			deleteActive,
			deleteValue,
			deleteSave,
			deleteSaving,
			activateContextMenu,
		};

		function useRenameBookmark() {
			const renameActive = ref(false);
			const renameValue = ref(props.bookmark.bookmark);
			const renameSaving = ref(false);

			return { renameActive, renameValue, renameSave, renameSaving };

			async function renameSave() {
				renameSaving.value = true;

				try {
					await presetsStore.savePreset({
						...props.bookmark,
						bookmark: renameValue.value,
					});

					renameActive.value = false;
				} catch (err: any) {
					unexpectedError(err);
				} finally {
					renameSaving.value = false;
				}
			}
		}

		function useDeleteBookmark() {
			const deleteActive = ref(false);
			const deleteValue = ref(props.bookmark.bookmark);
			const deleteSaving = ref(false);

			return { deleteActive, deleteValue, deleteSave, deleteSaving };

			async function deleteSave() {
				deleteSaving.value = true;

				try {
					let navigateTo: string | null = null;

					if (+route.query?.bookmark === props.bookmark.id) {
						navigateTo = `/collections/${props.bookmark.collection}`;
					}

					await presetsStore.delete(props.bookmark.id);
					deleteActive.value = false;

					if (navigateTo) {
						router.push(navigateTo);
					}
				} catch (err: any) {
					unexpectedError(err);
				} finally {
					deleteSaving.value = false;
				}
			}
		}

		function activateContextMenu(event: PointerEvent) {
			contextMenu.value.activate(event);
		}
	},
});
</script>

<style lang="scss" scoped>
.danger {
	--v-list-item-color: var(--danger);
	--v-list-item-icon-color: var(--danger);
}
</style>
