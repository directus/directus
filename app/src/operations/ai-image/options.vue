<script setup lang="ts">
import { AI_IMAGE_REFERENCE_MIME_TYPES, DEFAULT_ASPECT_RATIO, type OpenRouterModel } from '@directus/ai';
import type { Field } from '@directus/types';
import { omit } from 'lodash-es';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { applyModelLimits, getFields } from './fields';
import { IMAGE_STARTING_POINTS } from './starting-points';
import AiStartingPoints from '@/ai/components/ai-starting-points.vue';
import { fetchOpenRouterModels } from '@/ai/utils/openrouter-models';
import { applyFormValues, mergeFileIds } from '@/ai/utils/operation-options';
import VButton from '@/components/v-button.vue';
import VForm from '@/components/v-form/v-form.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import { useServerStore } from '@/stores/server';
import { translate } from '@/utils/translate-object-values';
import DrawerFiles from '@/views/private/components/drawer-files.vue';

const props = defineProps<{
	value: Record<string, any> | null;
}>();

const emit = defineEmits<{
	input: [value: Record<string, any>];
}>();

const { t } = useI18n();

const values = computed<Record<string, any>>(() => ({
	aspectRatio: DEFAULT_ASPECT_RATIO,
	count: 1,
	transparent: false,
	permissions: '$trigger',
	...props.value,
}));

const openRouterModels = ref<OpenRouterModel[]>([]);

if (useServerStore().info.ai_providers?.includes('openrouter')) {
	fetchOpenRouterModels('image').then((models) => (openRouterModels.value = models));
}

const fields = computed(() => translate(getFields(values.value, openRouterModels.value)) as Field[]);
const promptFields = computed(() => fields.value.filter((f) => ['model', 'prompt'].includes(f.field!)));
const referenceFields = computed(() => fields.value.filter((f) => f.field === 'referenceImages'));

const restFields = computed(() =>
	fields.value.filter((f) => !['model', 'prompt', 'referenceImages'].includes(f.field!)),
);

const startingPoints = computed(() =>
	IMAGE_STARTING_POINTS.map(({ key, icon }) => ({ key, icon, label: t(`operations.ai-image.starting_points.${key}`) })),
);

/** Clears what the starting points fill in, and keeps the rest. */
function startOver() {
	commit(omit(props.value ?? {}, ['prompt', 'aspectRatio', 'transparent']));
}

const filesDrawerActive = ref(false);

// A `{{ }}` value from the raw editor can't be merged with picked ids
const referencesFromData = computed(() => typeof values.value.referenceImages === 'string');

function update(patch: Record<string, any>) {
	commit({ ...props.value, ...patch });
}

function commit(next: Record<string, any>) {
	emit('input', applyModelLimits(next));
}

function updateFromForm(formFields: Field[], formValues: Record<string, any>) {
	commit(applyFormValues(props.value, formFields, formValues));
}

function applyStartingPoint(key: string) {
	const point = IMAGE_STARTING_POINTS.find((p) => p.key === key);
	if (!point) return;
	update({ prompt: point.prompt, aspectRatio: point.aspectRatio, transparent: point.transparent ?? false });
}

function addReferences(ids: (string | number)[] | null) {
	if (!ids?.length) return;
	update({ referenceImages: mergeFileIds(values.value.referenceImages, ids) });
}
</script>

<template>
	<div class="ai-image-options">
		<VForm
			:model-value="values"
			:fields="promptFields"
			primary-key="+"
			raw-editor-enabled
			@update:model-value="updateFromForm(promptFields, $event)"
		/>

		<AiStartingPoints
			:points="startingPoints"
			:prompt="values.prompt"
			@apply="applyStartingPoint"
			@start-over="startOver"
		/>

		<VForm
			:model-value="values"
			:fields="referenceFields"
			primary-key="+"
			raw-editor-enabled
			@update:model-value="updateFromForm(referenceFields, $event)"
		/>

		<VButton
			v-tooltip="referencesFromData ? t('operations.ai-image.choose_files_disabled') : null"
			class="choose-files"
			secondary
			x-small
			:disabled="referencesFromData"
			@click="filesDrawerActive = true"
		>
			<VIcon name="folder_open" x-small left />
			{{ t('ai.flow_operations.choose_files') }}
		</VButton>

		<DrawerFiles
			v-model:active="filesDrawerActive"
			multiple
			:filter="{ type: { _in: [...AI_IMAGE_REFERENCE_MIME_TYPES] } }"
			@input="addReferences"
		/>

		<VForm
			:model-value="values"
			:fields="restFields"
			primary-key="+"
			raw-editor-enabled
			@update:model-value="updateFromForm(restFields, $event)"
		/>
	</div>
</template>

<style lang="scss" scoped>
.ai-image-options {
	display: flex;
	flex-direction: column;
	gap: var(--theme--form--row-gap);
}

.choose-files {
	align-self: flex-start;
	margin-block-start: calc(-1 * var(--theme--form--row-gap) + 0.25rem);
}
</style>
