<script setup lang="ts">
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import InterfaceSystemInputTranslatedString from '@/interfaces/_system/system-input-translated-string/input-translated-string.vue';
import InterfaceSelectColor from '@/interfaces/select-color/select-color.vue';
import InterfaceSelectIcon from '@/interfaces/select-icon/select-icon.vue';
import { reactive } from 'vue';

const props = defineProps<{
	modelValue?: boolean;
	saving?: boolean;
}>();

const emit = defineEmits<{
	(e: 'save', value: { name: string | null; icon: string | null; color: string | null }): void;
	(e: 'update:modelValue', value: boolean): void;
}>();

const bookmarkValue = reactive({
	name: null,
	icon: 'bookmark',
	color: null,
});

function setIcon(icon: any) {
	bookmarkValue.icon = icon;
}

function setColor(color: any) {
	bookmarkValue.color = color;
}

function save() {
	if (bookmarkValue.name === null || props.saving) return;

	emit('save', bookmarkValue);
}

function cancel() {
	bookmarkValue.name = null;
	bookmarkValue.icon = 'bookmark';
	bookmarkValue.color = null;
	emit('update:modelValue', false);
}
</script>

<template>
	<v-dialog
		:model-value="modelValue"
		persistent
		keep-behind
		@update:model-value="$emit('update:modelValue', $event)"
		@esc="cancel"
		@apply="save"
	>
		<template #activator="slotBinding">
			<slot name="activator" v-bind="slotBinding" />
		</template>

		<v-card>
			<v-card-title>{{ $t('create_bookmark') }}</v-card-title>

			<v-card-text>
				<div class="fields">
					<interface-system-input-translated-string
						:value="bookmarkValue.name"
						class="full"
						autofocus
						trim
						:placeholder="$t('bookmark_name')"
						@input="bookmarkValue.name = $event"
					/>
					<interface-select-icon width="half" :value="bookmarkValue.icon" @input="setIcon" />
					<interface-select-color width="half" :value="bookmarkValue.color" @input="setColor" />
				</div>
			</v-card-text>

			<v-card-actions>
				<v-button secondary @click="cancel">
					{{ $t('cancel') }}
				</v-button>
				<v-button :disabled="bookmarkValue.name === null" :loading="saving" @click="save">
					{{ $t('save') }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

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
