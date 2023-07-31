<template>
	<v-dialog :model-value="modelValue" persistent @update:model-value="$emit('update:modelValue', $event)" @esc="cancel">
		<template #activator="slotBinding">
			<slot name="activator" v-bind="slotBinding" />
		</template>

		<v-card>
			<v-card-title>
				{{t('create_bookmark')}}
			</v-card-title>

			<v-card-text>

						<div class="fields">
							<interface-system-input-translated-string
								:value="bookmarkValue.name"
								class="full"
								autofocus
								trim
								:placeholder="t('bookmark_name')"
								@input="bookmarkValue.name = $event"
								@keyup.enter="$emit('save', bookmarkValue)"
							/>
							<interface-select-icon width="half" :value="bookmarkValue.icon" @input="setIcon" />
							<interface-select-color width="half" :value="bookmarkValue.color" @input="setColor" />
							<interface-system-scope class="full" :value="bookmarkValue.scope" @input="setScope"  />
							<small class="full">
								<p class="type-note">Create a personal, role, or global bookmark.</p>
							</small>
						</div>
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="cancel">
					{{ t('cancel') }}
				</v-button>
				<v-button :disabled="bookmarkValue.name === null" :loading="saving" @click="$emit('save', saveBookmarkValue)">
					{{ t('save') }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

import { User } from '@directus/types';

const currentUser = userStore.currentUser as User;

defineProps<{
	modelValue?: boolean;
	saving?: boolean;
}>();

const emit = defineEmits<{
	(e: 'save', value: { name: string | null; icon: string | null; color: string | null; user : string | null; role : string | null; }): void;
	(e: 'update:modelValue', value: boolean): void;
}>();

const { t } = useI18n();

const saveBookmarkValue = computed(() => {

	if (bookmarkValue?.scope?.startsWith('user_')){
		return {
			...bookmarkValue,
			user: bookmarkValue.scope.replace('user_', ''),
			role: null,
		}
	} else if (bookmarkValue?.scope?.startsWith('role_')){
		return {
			...bookmarkValue,
			user: null,
			role: bookmarkValue.scope.replace('role_', ''),
		}
	} else {
		return {
			...bookmarkValue,
			user: null,
			role: null,
		}
	}

});

const bookmarkValue = reactive({
	name: 'My Bookmark',
	icon: 'bookmark',
	color: null,
	scope: currentUser ? `user_${currentUser.id}` : 'all',
});

function setIcon(icon: any) {
	bookmarkValue.icon = icon;
}

function setColor(color: any) {
	bookmarkValue.color = color;
}

function setScope(scope: any) {
	bookmarkValue.scope = scope;
}

function cancel() {
	bookmarkValue.name = 'My Bookmark';
	bookmarkValue.icon = 'bookmark';
	bookmarkValue.color = null;
	bookmarkValue.scope = currentUser ? `user_${currentUser.id}` : 'all';
	emit('update:modelValue', false);
}
</script>

<style lang="scss" scoped>
.fields {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;

	.full {
		grid-column: 1 / span 2;
	}
}
</style>
