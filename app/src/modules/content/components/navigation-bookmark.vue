<script setup lang="ts">
import { usePresetsStore } from '@/stores/presets';
import { useUserStore } from '@/stores/user';
import { getCollectionRoute } from '@/utils/get-route';
import { translate } from '@/utils/translate-literal';
import { unexpectedError } from '@/utils/unexpected-error';
import { Preset } from '@directus/types';
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

interface Props {
	bookmark: Preset;
}

const props = defineProps<Props>();

const router = useRouter();
const route = useRoute();

const userStore = useUserStore();
const presetsStore = usePresetsStore();

const isMine = computed(() => props.bookmark.user === userStore.currentUser!.id);

const hasPermission = computed(() => isMine.value || userStore.isAdmin);

const scope = computed(() => {
	if (props.bookmark.user && !props.bookmark.role) return 'personal';
	if (!props.bookmark.user && props.bookmark.role) return 'role';
	return 'global';
});

const { editActive, editValue, editSave, editSaving, editCancel, isEditDisabled } = useEditBookmark();
const { deleteActive, deleteSave, deleteSaving } = useDeleteBookmark();

const name = computed(() => translate(props.bookmark.bookmark));

function useEditBookmark() {
	const editActive = ref(false);

	const editValue = reactive({
		name: props.bookmark.bookmark,
		icon: props.bookmark?.icon ?? 'bookmark',
		color: props.bookmark?.color ?? null,
	});

	const editSaving = ref(false);

	const isEditDisabled = computed(() => editValue.name === null);

	return { editActive, editValue, editSave, editSaving, editCancel, isEditDisabled };

	async function editSave() {
		if (isEditDisabled.value || editSaving.value) return;

		editSaving.value = true;

		try {
			await presetsStore.savePreset({
				...props.bookmark,
				bookmark: editValue.name,
				icon: editValue.icon,
				color: editValue.color,
			});

			editActive.value = false;
		} catch (error) {
			unexpectedError(error);
		} finally {
			editSaving.value = false;
		}
	}

	function editCancel() {
		editActive.value = false;
		editValue.name = props.bookmark.bookmark;
		editValue.icon = props.bookmark?.icon ?? 'bookmark';
		editValue.color = props.bookmark?.color ?? null;
	}
}

function useDeleteBookmark() {
	const deleteActive = ref(false);
	const deleteSaving = ref(false);

	return { deleteActive, deleteSave, deleteSaving };

	async function deleteSave() {
		if (deleteSaving.value) return;

		deleteSaving.value = true;

		try {
			let navigateTo: string | null = null;

			if (route.query?.bookmark && +route.query.bookmark === props.bookmark.id) {
				navigateTo = getCollectionRoute(props.bookmark.collection);
			}

			await presetsStore.delete([props.bookmark.id!]);
			deleteActive.value = false;

			if (navigateTo) {
				router.replace(navigateTo);
			}
		} catch (error) {
			unexpectedError(error);
		} finally {
			deleteSaving.value = false;
		}
	}
}
</script>

<template>
	<v-list-item
		:to="`${getCollectionRoute(bookmark.collection)}?bookmark=${bookmark.id}`"
		query
		class="bookmark"
		clickable
		@contextmenu.stop=""
	>
		<v-list-item-icon><v-icon :name="bookmark.icon" :color="bookmark.color" /></v-list-item-icon>
		<v-list-item-content>
			<v-text-overflow :text="name" />
		</v-list-item-content>

		<v-menu placement="bottom-start" show-arrow>
			<template #activator="{ toggle, active }">
				<v-icon
					v-tooltip.bottom="!hasPermission && $t(`cannot_edit_${scope}_bookmarks`)"
					:name="hasPermission ? 'more_vert' : 'lock'"
					:clickable="hasPermission"
					small
					class="ctx-toggle"
					:class="{ active }"
					@click.prevent="hasPermission ? toggle() : null"
				/>
			</template>
			<v-list>
				<v-list-item
					clickable
					:to="scope !== 'personal' ? `/settings/presets/${bookmark.id}` : undefined"
					@click="scope === 'personal' ? (editActive = true) : undefined"
				>
					<v-list-item-icon>
						<v-icon name="edit" outline />
					</v-list-item-icon>
					<v-list-item-content>
						<v-text-overflow :text="$t(`edit_${scope}_bookmark`)" />
					</v-list-item-content>
				</v-list-item>
				<v-list-item clickable class="danger" @click="deleteActive = true">
					<v-list-item-icon>
						<v-icon name="delete" outline />
					</v-list-item-icon>
					<v-list-item-content>
						<v-text-overflow :text="$t(`delete_${scope}_bookmark`)" />
					</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-menu>

		<v-dialog v-model="editActive" persistent @esc="editCancel" @apply="editSave">
			<v-card>
				<v-card-title>{{ $t('edit_personal_bookmark') }}</v-card-title>
				<v-card-text>
					<div class="fields">
						<interface-system-input-translated-string
							:value="editValue.name"
							class="full"
							autofocus
							@input="editValue.name = $event"
						/>
						<interface-select-icon width="half" :value="editValue.icon" @input="editValue.icon = $event" />
						<interface-select-color width="half" :value="editValue.color" @input="editValue.color = $event" />
					</div>
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="editCancel">{{ $t('cancel') }}</v-button>
					<v-button :disabled="isEditDisabled" :loading="editSaving" @click="editSave">
						{{ $t('save') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog v-model="deleteActive" persistent @esc="deleteActive = false" @apply="deleteSave">
			<v-card>
				<v-card-title>{{ $t('delete_bookmark_copy', { bookmark: bookmark.bookmark }) }}</v-card-title>
				<v-card-actions>
					<v-button secondary @click="deleteActive = false">{{ $t('cancel') }}</v-button>
					<v-button :loading="deleteSaving" kind="danger" @click="deleteSave">
						{{ $t('delete_label') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</v-list-item>
</template>

<style lang="scss" scoped>
.danger {
	--v-list-item-color: var(--theme--danger);
	--v-list-item-icon-color: var(--theme--danger);
}

.v-list-item {
	.ctx-toggle {
		--v-icon-color: var(--theme--foreground-subdued);

		opacity: 0;
		transition: opacity var(--fast) var(--transition);
	}

	.ctx-toggle.active,
	.ctx-toggle:focus-visible,
	&:focus-visible .ctx-toggle,
	&:hover .ctx-toggle {
		opacity: 1;
	}
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
