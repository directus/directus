<template>
	<v-dialog :model-value="modelValue" persistent @update:model-value="$emit('update:modelValue', $event)" @esc="cancel">
		<template #activator="slotBinding">
			<slot name="activator" v-bind="slotBinding" />
		</template>

		<v-card>
			<v-card-title>{{ t('create_bookmark') }}</v-card-title>

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
				</div>
			</v-card-text>

			<v-card-actions>
				<v-button secondary @click="cancel">
					{{ t('cancel') }}
				</v-button>
				<v-button :disabled="bookmarkValue.name === null" :loading="saving" @click="$emit('save', bookmarkValue)">
					{{ t('save') }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';

defineProps<{
	modelValue?: boolean;
	saving?: boolean;
}>();

const emit = defineEmits<{
	(e: 'save', value: { name: string | null; icon: string | null; color: string | null }): void;
	(e: 'update:modelValue', value: boolean): void;
}>();

const { t } = useI18n();

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

function cancel() {
	bookmarkValue.name = null;
	bookmarkValue.icon = 'bookmark';
	bookmarkValue.color = null;
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
