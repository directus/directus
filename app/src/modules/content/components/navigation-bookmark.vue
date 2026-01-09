<script setup lang="ts">
import { Preset } from '@directus/types';
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import InterfaceSystemInputTranslatedString from '@/interfaces/_system/system-input-translated-string/input-translated-string.vue';
import InterfaceSelectColor from '@/interfaces/select-color/select-color.vue';
import InterfaceSelectIcon from '@/interfaces/select-icon/select-icon.vue';
import { usePresetsStore } from '@/stores/presets';
import { useUserStore } from '@/stores/user';
import { getCollectionRoute } from '@/utils/get-route';
import { translate } from '@/utils/translate-literal';
import { unexpectedError } from '@/utils/unexpected-error';

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
	<VListItem
		:to="`${getCollectionRoute(bookmark.collection)}?bookmark=${bookmark.id}`"
		query
		class="bookmark"
		clickable
		@contextmenu.stop=""
	>
		<VListItemIcon><VIcon :name="bookmark.icon" :color="bookmark.color" /></VListItemIcon>
		<VListItemContent>
			<VTextOverflow :text="name" />
		</VListItemContent>

		<VMenu placement="bottom-start" show-arrow>
			<template #activator="{ toggle, active }">
				<VIcon
					v-tooltip.bottom="!hasPermission && $t(`cannot_edit_${scope}_bookmarks`)"
					:name="hasPermission ? 'more_vert' : 'lock'"
					:clickable="hasPermission"
					small
					class="ctx-toggle"
					:class="{ active }"
					@click.prevent="hasPermission ? toggle() : null"
				/>
			</template>
			<VList>
				<VListItem
					clickable
					:to="scope !== 'personal' ? `/settings/presets/${bookmark.id}` : undefined"
					@click="scope === 'personal' ? (editActive = true) : undefined"
				>
					<VListItemIcon>
						<VIcon name="edit" outline />
					</VListItemIcon>
					<VListItemContent>
						<VTextOverflow :text="$t(`edit_${scope}_bookmark`)" />
					</VListItemContent>
				</VListItem>
				<VListItem clickable class="danger" @click="deleteActive = true">
					<VListItemIcon>
						<VIcon name="delete" outline />
					</VListItemIcon>
					<VListItemContent>
						<VTextOverflow :text="$t(`delete_${scope}_bookmark`)" />
					</VListItemContent>
				</VListItem>
			</VList>
		</VMenu>

		<VDialog v-model="editActive" persistent @esc="editCancel" @apply="editSave">
			<VCard>
				<VCardTitle>{{ $t('edit_personal_bookmark') }}</VCardTitle>
				<VCardText>
					<div class="fields">
						<InterfaceSystemInputTranslatedString
							:value="editValue.name"
							class="full"
							autofocus
							@input="editValue.name = $event"
						/>
						<InterfaceSelectIcon width="half" :value="editValue.icon" @input="editValue.icon = $event" />
						<InterfaceSelectColor width="half" :value="editValue.color" @input="editValue.color = $event" />
					</div>
				</VCardText>
				<VCardActions>
					<VButton secondary @click="editCancel">{{ $t('cancel') }}</VButton>
					<VButton :disabled="isEditDisabled" :loading="editSaving" @click="editSave">
						{{ $t('save') }}
					</VButton>
				</VCardActions>
			</VCard>
		</VDialog>

		<VDialog v-model="deleteActive" persistent @esc="deleteActive = false" @apply="deleteSave">
			<VCard>
				<VCardTitle>{{ $t('delete_bookmark_copy', { bookmark: bookmark.bookmark }) }}</VCardTitle>
				<VCardActions>
					<VButton secondary @click="deleteActive = false">{{ $t('cancel') }}</VButton>
					<VButton :loading="deleteSaving" kind="danger" @click="deleteSave">
						{{ $t('delete_label') }}
					</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
	</VListItem>
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
