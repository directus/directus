<template>
	<v-dialog :model-value="modelValue" persistent @update:model-value="$emit('update:modelValue', $event)" @esc="cancel">
		<template #activator="slotBinding">
			<slot name="activator" v-bind="slotBinding" />
		</template>

		<v-card>
			<v-card-title>
				{{t('create_default')}}
			</v-card-title>

			<v-card-text>

						<div class="fields">

							<interface-system-scope class="full" :value="bookmarkValue.scope" @input="setScope"  />

							<v-divider   class="full">
								Delete Existing Presets
							</v-divider>

							<interface-select-multiple-checkbox
								class="full"
								:choices="availablePurgeOptions"
								:value="bookmarkValue.purge"
								@input="setPurge"

							/>

							<small class="full">
								<p class="type-note">Deleting existing presets allows you to override users/roles current presets.</p>
							</small>

							<v-notice v-if="bookmarkValue.purge.length > 0" class="full" type="warning">
								{{ t('create_default_delete_warning') }}
							</v-notice>

						</div>

			</v-card-text>

			<v-card-actions>
				<v-button secondary @click="cancel">
					{{ t('cancel') }}
				</v-button>
				<v-button :loading="saving" :kind="bookmarkValue.purge.length > 0 ? 'warning' : 'normal'" @click="$emit('save', saveBookmarkValue)" >
					{{ bookmarkValue.purge.length == 0 ? t('save') : 'Save and Delete' }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';


defineProps<{
	modelValue?: boolean;
	saving?: boolean;
}>();

const emit = defineEmits<{
	(e: 'save', value: { user : string | null; role : string | null; }): void;
	(e: 'update:modelValue', value: boolean): void;
}>();

const { t } = useI18n();

const bookmarkValue = reactive({
	scope: 'all',
	purge: [],
});

const saveBookmarkValue = computed(() => {

	if (bookmarkValue?.scope?.startsWith('user_')){
		return {
			user: bookmarkValue.scope.replace('user_', ''),
			role: null,
			purge: bookmarkValue.purge,
		}
	} else if (bookmarkValue?.scope?.startsWith('role_')){
		return {
			user: null,
			role: bookmarkValue.scope.replace('role_', ''),
			purge: bookmarkValue.purge,
		}
	} else {
		return {
			user: null,
			role: null,
			purge: bookmarkValue.purge,
		}
	}
});


const availablePurgeOptions = computed(() => {

	if(bookmarkValue.scope == "all"){
		return [
		{
			text: t('create_default_options.all_users'),
			value: 'all_users',
		},
		{
			text: t('create_default_options.all_roles'),
			value: 'all_roles',
		}
	];
	} else if(bookmarkValue.scope.startsWith('role')) {
		return [
		{
			text: t('create_default_options.all_role_users'),
			value: 'all_role_users',
		},
		{
			text: t('create_default_options.all_role'),
			value: 'all_role',
		},
	];
	} else if(bookmarkValue.scope.startsWith('user')) {
		return [
		{
			text: t('create_default_options.all_user'),
			value: 'all_user',
		}
	];
	}

	return [];
});

function setScope(scope: any) {
	setPurge([]);
	bookmarkValue.scope = scope;
}

function setPurge(purge: any) {
	bookmarkValue.purge = purge;
}

function cancel() {
	bookmarkValue.scope = 'all';
	bookmarkValue.purge = [];
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

.bookmark-tabs {
	width: 100%;
	background-color: var(--background-normal-alt);
	padding: 8px;
	border-radius: var(--border-radius);
	gap: 12px;
}

.bookmark-tab {
	color: var(--foreground-normal) !important;
	border-radius: var(--border-radius) !important;
	height: 56px !important;
}

.bookmark-tab.active {
	color: var(--white) !important;
	background-color: var(--primary) !important;
	box-shadow: 0 0 16px -8px var(--v-input-box-shadow-color-focus) !important;
	font-weight: 600 !important;
}
</style>
