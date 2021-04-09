<template>
	<v-list-item exact :to="bookmark.to" class="bookmark" @contextmenu.native.prevent.stop="$refs.contextMenu.activate">
		<v-list-item-icon><v-icon name="bookmark" /></v-list-item-icon>
		<v-list-item-content>
			<v-text-overflow :text="bookmark.bookmark" />
		</v-list-item-content>
		<v-list-item-icon v-if="bookmark.scope !== 'user'" class="bookmark-scope">
			<v-icon :name="bookmark.scope === 'role' ? 'people' : 'public'" />
		</v-list-item-icon>

		<v-menu ref="contextMenu" show-arrow placement="bottom-start">
			<v-list>
				<v-list-item @click="renameActive = true" :disabled="isMine === false">
					<v-list-item-icon>
						<v-icon name="edit" outline />
					</v-list-item-icon>
					<v-list-item-content>
						<v-text-overflow :text="$t('rename_bookmark')" />
					</v-list-item-content>
				</v-list-item>
				<v-list-item @click="deleteActive = true" class="danger" :disabled="isMine === false">
					<v-list-item-icon>
						<v-icon name="delete" outline />
					</v-list-item-icon>
					<v-list-item-content>
						<v-text-overflow :text="$t('delete_bookmark')" />
					</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-menu>

		<v-dialog v-model="renameActive" persistent @esc="renameActive = false">
			<v-card>
				<v-card-title>{{ $t('rename_bookmark') }}</v-card-title>
				<v-card-text>
					<v-input v-model="renameValue" autofocus @keyup.enter="renameSave" />
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="renameActive = false">{{ $t('cancel') }}</v-button>
					<v-button @click="renameSave" :disabled="renameValue === null" :loading="renameSaving">
						{{ $t('save') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog v-model="deleteActive" persistent @esc="deleteActive = false">
			<v-card>
				<v-card-title>{{ $t('delete_bookmark_copy', { bookmark: bookmark.bookmark }) }}</v-card-title>
				<v-card-actions>
					<v-button secondary @click="deleteActive = false">{{ $t('cancel') }}</v-button>
					<v-button @click="deleteSave" :loading="deleteSaving" class="action-delete">
						{{ $t('delete') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</v-list-item>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed } from '@vue/composition-api';
import { Preset } from '@/types';
import { useUserStore, usePresetsStore } from '@/stores';
import { unexpectedError } from '@/utils/unexpected-error';
import router from '@/router';

export default defineComponent({
	props: {
		bookmark: {
			type: Object as PropType<Preset>,
			required: true,
		},
	},
	setup(props) {
		const contextMenu = ref();
		const userStore = useUserStore();
		const presetsStore = usePresetsStore();

		const isMine = computed(() => props.bookmark.user === userStore.state.currentUser!.id);

		const { renameActive, renameValue, renameSave, renameSaving } = useRenameBookmark();
		const { deleteActive, deleteValue, deleteSave, deleteSaving } = useDeleteBookmark();

		return {
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
				} catch (err) {
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

					if (+router.currentRoute.query?.bookmark === props.bookmark.id) {
						navigateTo = `/collections/${props.bookmark.collection}`;
					}

					await presetsStore.delete(props.bookmark.id);
					deleteActive.value = false;

					if (navigateTo) {
						router.push(navigateTo);
					}
				} catch (err) {
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
.bookmark-scope {
	--v-icon-color: var(--foreground-subdued);

	opacity: 0;
	transition: opacity var(--fast) var(--transition);
}

.bookmark:hover .bookmark-scope {
	opacity: 1;
}

.danger {
	--v-list-item-color: var(--danger);
	--v-list-item-icon-color: var(--danger);
}

.action-delete {
	--v-button-background-color: var(--danger-25);
	--v-button-color: var(--danger);
	--v-button-background-color-hover: var(--danger-50);
	--v-button-color-hover: var(--danger);
}
</style>
