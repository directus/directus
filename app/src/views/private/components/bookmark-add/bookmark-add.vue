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

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, reactive } from 'vue';

export default defineComponent({
	props: {
		modelValue: {
			type: Boolean,
			default: false,
		},
		saving: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['save', 'update:modelValue'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const bookmarkValue = reactive({
			name: null,
			icon: 'bookmark_outline',
			color: null,
		});

		return { t, bookmarkValue, setIcon, setColor, cancel };

		function setIcon(icon: any) {
			bookmarkValue.icon = icon;
		}

		function setColor(color: any) {
			bookmarkValue.color = color;
		}

		function cancel() {
			bookmarkValue.name = null;
			bookmarkValue.icon = 'bookmark_outline';
			bookmarkValue.color = null;
			emit('update:modelValue', false);
		}
	},
});
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
