<template>
	<div class="form-grid">
		<div class="field half">
			<div class="type-label">{{ t('collection') }}</div>
			<interface-system-collection
				:model-value="options.collection"
				include-system
				:include-singleton="false"
				@input="options.collection = $event"
			/>
		</div>

		<div class="field half">
			<div class="type-label">{{ t('allow_multiple') }}</div>
			<v-checkbox
				block
				:label="'Select Multiple Items'"
				:model-value="options.allowMultiple"
				@update:model-value="options.allowMultiple = $event"
			/>
		</div>

		<div class="field">
			<v-input
				clickable
				:disabled="!options.collection"
				:placeholder="t('select_an_item')"
				@click="selectModalActive = true"
			>
				<template v-if="options.keys?.length > 0" #input>
					<div class="preview">
						{{ options.keys[0] }}
					</div>
				</template>

				<template #append>
					<v-icon
						v-if="options.keys?.length > 0"
						v-tooltip="t('deselect')"
						name="close"
						class="deselect"
						@click.stop="clearSelection"
					/>
					<v-icon v-else class="expand" name="expand_more" />
				</template>
			</v-input>
		</div>

		<drawer-collection
			v-if="options.collection"
			v-model:active="selectModalActive"
			:collection="options.collection"
			:selection="[]"
			:multiple="options.allowMultiple"
			@input="options.keys = $event"
		/>
	</div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import DrawerCollection from '@/views/private/components/drawer-collection.vue';

interface Props {
	/** value for relational global variable options */
	value?: Record<string, any> | null;
}

const props = withDefaults(defineProps<Props>(), {
	value: null,
});

const emit = defineEmits(['input']);

const { t } = useI18n();

const options = reactive({
	collection: undefined,
	keys: [],
	allowMultiple: false,
});

const selectModalActive = ref(false);

function input() {
	emit('input', null);
}

function clearSelection() {
	options.keys = [];
}
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.form-grid {
	@include form-grid;
}

.preview {
	flex-grow: 1;
}
</style>
