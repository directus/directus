<script setup lang="ts">
import type { DeepPartial, Field } from '@directus/types';
import { isEqual, isPlainObject, omit } from 'lodash-es';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { applyModelLimits, getFields, getOutputFieldsField, TYPE_CHOICES } from './fields';
import {
	exampleToSchema,
	fieldsToSchema,
	getRootExtra,
	type JsonSchema,
	type OutputField,
	OutputSchemaError,
	schemaToFields,
} from './output-schema';
import { STARTING_POINTS } from './starting-points';
import { useGenerateFields } from './use-generate-fields';
import AiStartingPoints from '@/ai/components/ai-starting-points.vue';
import { applyFormValues, mergeFileIds } from '@/ai/utils/operation-options';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VForm from '@/components/v-form/v-form.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VNotice from '@/components/v-notice.vue';
import VTextarea from '@/components/v-textarea.vue';
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
	output: 'text',
	permissions: '$trigger',
	...props.value,
}));

const fields = computed(() => translate(getFields(values.value)) as Field[]);
const promptFields = computed(() => fields.value.filter((f) => ['model', 'prompt'].includes(f.field!)));
const systemFields = computed(() => fields.value.filter((f) => f.field === 'system'));
const fileFields = computed(() => fields.value.filter((f) => ['files', 'permissions'].includes(f.field!)));
const outputFields = computed(() => fields.value.filter((f) => ['output', 'maxOutputTokens'].includes(f.field!)));

// The "Output Schema" header above names both views, so their own labels would repeat it
const schemaFields = computed(() =>
	fields.value.filter((f) => f.field === 'schema').map((f) => ({ ...f, hideLabel: true })),
);

const rowFields = computed(() =>
	(translate([getOutputFieldsField()]) as Field[]).map((f) => ({ ...f, hideLabel: true })),
);

const showFiles = computed(() => fileFields.value.some((f) => f.meta?.hidden !== true));

const startingPoints = computed(() =>
	STARTING_POINTS.map(({ key, icon }) => ({ key, icon, label: t(`operations.ai-text.starting_points.${key}`) })),
);

/** Clears what the starting points fill in, and keeps the rest. */
function startOver() {
	commit(omit(props.value ?? {}, ['prompt', 'output', 'schema', 'files']));
}

const isObject = computed(() => values.value.output === 'object');

const filesDrawerActive = ref(false);

// A `{{ }}` value from the raw editor can't be merged with picked ids
const filesFromData = computed(() => typeof values.value.files === 'string');

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
	const point = STARTING_POINTS.find((p) => p.key === key);
	if (!point) return;

	update({
		prompt: point.prompt,
		output: point.output,
		...(point.files ? { files: point.files } : {}),
		...(point.fields ? { schema: fieldsToSchema(point.fields) } : {}),
	});
}

function addFiles(ids: (string | number)[] | null) {
	if (!ids?.length) return;
	update({ files: mergeFileIds(values.value.files, ids) });
}

const { schema, rows, rowError, unsupported, view, updateRows } = useSchemaRows();

/**
 * The schema is stored. The rows are a second view of it, kept locally so a row that isn't finished yet (no name, or
 * an object with nothing inside) doesn't vanish while you type.
 */
function useSchemaRows() {
	const schema = computed<JsonSchema | null>(() => {
		const parsed = parseJson(values.value.schema);
		return isPlainObject(parsed) ? (parsed as JsonSchema) : null;
	});

	const unsupported = computed(() => !!schema.value && schemaToFields(schema.value) === null);
	const rows = ref<OutputField[]>(schemaToFields(schema.value) ?? []);
	const rowError = ref<string | null>(null);
	const view = ref<'fields' | 'json'>(unsupported.value ? 'json' : 'fields');

	let written: JsonSchema | null = null;

	watch(schema, (next) => {
		const ownWrite = written !== null && isEqual(next, written);
		written = null;
		if (ownWrite) return;
		rows.value = schemaToFields(next) ?? [];
		rowError.value = null;
	});

	function updateRows(formValues: Record<string, any>) {
		rows.value = formValues['fields'] ?? [];

		try {
			written = fieldsToSchema(rows.value, getRootExtra(schema.value));
			rowError.value = null;
			update({ schema: written });
		} catch (error) {
			rowError.value = t('operations.ai-text.row_error', { error: errorMessage(error) });
		}
	}

	return { schema, rows, rowError, unsupported, view, updateRows };
}

const VIEW_OPTIONS = ['fields', 'json'] as const;

const { model: generateModel, loading: generating, generate } = useGenerateFields(() => values.value.model);

const generateDialog = ref(false);
const description = ref('');
const suggested = ref<OutputField[] | null>(null);
const generateError = ref<string | null>(null);
let generateRequest: AbortController | null = null;

watch(generateDialog, (open) => {
	if (!open) generateRequest?.abort();
});

onBeforeUnmount(() => generateRequest?.abort());

/** The suggestion as indented lines, so you can check it before it replaces anything. */
const suggestedLines = computed(() => {
	const lines: { key: string; name: string; type: string; choices: string; depth: number }[] = [];

	function add(fields: OutputField[], depth: number, path: string) {
		for (const field of fields) {
			const key = `${path}.${field.name}`;
			const type = translate(TYPE_CHOICES.find((choice) => choice.value === (field.type ?? 'string'))?.text ?? '');
			const optional = field.required === false ? ` · ${t('operations.ai-text.optional')}` : '';
			lines.push({ key, name: field.name, type: type + optional, choices: field.choices?.join(', ') ?? '', depth });
			if (field.fields) add(field.fields, depth + 1, key);
		}
	}

	add(suggested.value ?? [], 0, '');
	return lines;
});

function openGenerate() {
	suggested.value = null;
	generateError.value = null;
	generateDialog.value = true;
}

async function runGenerate() {
	if (!description.value.trim() || generating.value) return;

	generateError.value = null;
	const request = new AbortController();
	generateRequest = request;

	try {
		const fields = await generate(description.value, request.signal);
		if (request.signal.aborted) return;
		if (fields.length === 0) throw new Error(t('operations.ai-text.generate_empty'));
		// Throws on rows the schema can't be built from, so a bad suggestion never reaches "Use"
		fieldsToSchema(fields);
		suggested.value = fields;
	} catch (error) {
		// A closed dialog or an unmounted editor no longer owns this state
		if (request.signal.aborted) return;
		suggested.value = null;
		generateError.value = errorMessage(error);
	}
}

function useSuggestion() {
	if (!suggested.value) {
		runGenerate();
		return;
	}

	update({ schema: fieldsToSchema(suggested.value) });
	generateDialog.value = false;
}

const exampleDialog = ref(false);
const example = ref<Record<string, any>>({});
const exampleError = ref<string | null>(null);

const exampleField: DeepPartial<Field> = {
	field: 'example',
	name: '$t:operations.ai-text.example',
	type: 'json',
	meta: {
		width: 'full',
		interface: 'input-code',
		note: '$t:operations.ai-text.example_note',
		options: {
			language: 'json',
			placeholder: JSON.stringify({ alt: 'Alt text under 125 characters', focal_point: { x: 0, y: 0 } }, null, 2),
		},
	},
};

const exampleFields = computed(() => translate([exampleField]) as Field[]);

function openExample() {
	example.value = {};
	exampleError.value = null;
	exampleDialog.value = true;
}

function useExample() {
	const value = parseJson(example.value['example']);

	if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length === 0) {
		exampleError.value = t('operations.ai-text.example_invalid');
		return;
	}

	try {
		update({ schema: exampleToSchema(value) });
		exampleDialog.value = false;
	} catch (error) {
		exampleError.value = errorMessage(error);
	}
}

function errorMessage(error: unknown): string {
	if (error instanceof OutputSchemaError) return t(`operations.ai-text.schema_errors.${error.code}`, error.params);
	return (error as Error).message;
}

function parseJson(value: unknown): unknown {
	if (typeof value !== 'string') return value ?? null;

	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
}
</script>

<template>
	<div class="ai-text-options">
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
			:fields="systemFields"
			primary-key="+"
			raw-editor-enabled
			@update:model-value="updateFromForm(systemFields, $event)"
		/>

		<template v-if="showFiles">
			<VForm
				:model-value="values"
				:fields="fileFields"
				primary-key="+"
				raw-editor-enabled
				@update:model-value="updateFromForm(fileFields, $event)"
			/>

			<VButton
				v-tooltip="filesFromData ? t('operations.ai-text.choose_files_disabled') : null"
				class="small-action"
				secondary
				x-small
				:disabled="filesFromData"
				@click="filesDrawerActive = true"
			>
				<VIcon name="folder_open" x-small left />
				{{ t('ai.flow_operations.choose_files') }}
			</VButton>

			<DrawerFiles v-model:active="filesDrawerActive" multiple @input="addFiles" />
		</template>

		<VForm
			:model-value="values"
			:fields="outputFields"
			primary-key="+"
			raw-editor-enabled
			@update:model-value="updateFromForm(outputFields, $event)"
		/>

		<template v-if="isObject">
			<div class="schema-header">
				<span class="type-label">{{ t('operations.ai-text.output_schema') }}</span>
				<div class="view-toggle" role="group" :aria-label="t('operations.ai-text.output_schema')">
					<VButton
						v-for="option in VIEW_OPTIONS"
						:key="option"
						ghost
						x-small
						:active="view === option"
						@click="view = option"
					>
						{{ t(`operations.ai-text.view_${option}`) }}
					</VButton>
				</div>
			</div>

			<template v-if="view === 'fields'">
				<VNotice v-if="unsupported">{{ t('operations.ai-text.schema_unsupported') }}</VNotice>

				<VForm
					v-else
					:model-value="{ fields: rows }"
					:fields="rowFields"
					primary-key="+"
					@update:model-value="updateRows($event)"
				/>

				<VNotice v-if="rowError" type="warning">{{ rowError }}</VNotice>
			</template>

			<VForm
				v-else
				:model-value="values"
				:fields="schemaFields"
				primary-key="+"
				@update:model-value="updateFromForm(schemaFields, $event)"
			/>

			<div class="schema-actions">
				<VButton
					v-tooltip="generateModel ? null : t('operations.ai-text.generate_disabled')"
					class="small-action"
					secondary
					x-small
					:disabled="!generateModel"
					@click="openGenerate"
				>
					<VIcon name="auto_awesome" x-small left />
					{{ t('operations.ai-text.generate_schema') }}
				</VButton>

				<VButton class="small-action" secondary x-small @click="openExample">
					<VIcon name="data_object" x-small left />
					{{ t('operations.ai-text.paste_example') }}
				</VButton>
			</div>

			<span v-if="schema && view === 'json'" class="type-note schema-note">
				{{ t('operations.ai-text.schema_note') }}
			</span>
		</template>

		<VDialog v-model="generateDialog" @esc="generateDialog = false" @apply="useSuggestion">
			<VCard>
				<VCardTitle>{{ t('operations.ai-text.generate_schema') }}</VCardTitle>
				<VCardText class="generate-body">
					<VTextarea
						v-model="description"
						autofocus
						:aria-label="t('operations.ai-text.generate_schema')"
						:placeholder="t('operations.ai-text.generate_placeholder')"
					/>
					<small class="type-note">
						{{ t('operations.ai-text.generate_note', { model: generateModel?.name ?? '--' }) }}
					</small>

					<template v-if="suggested">
						<span class="type-label">{{ t('operations.ai-text.suggested_fields') }}</span>
						<ul class="suggestion">
							<li
								v-for="line in suggestedLines"
								:key="line.key"
								:aria-level="line.depth + 1"
								:style="{ paddingInlineStart: `${line.depth * 1.25}rem` }"
							>
								<code>{{ line.name }}</code>
								<span class="suggestion-type">{{ line.type }}</span>
								<span v-if="line.choices" class="suggestion-choices">{{ line.choices }}</span>
							</li>
						</ul>
						<small class="type-note">{{ t('operations.ai-text.generate_replaces') }}</small>
					</template>

					<VNotice v-if="generateError" type="danger">{{ generateError }}</VNotice>
				</VCardText>
				<VCardActions>
					<VButton secondary @click="generateDialog = false">{{ t('cancel') }}</VButton>
					<VButton :secondary="!!suggested" :disabled="!description.trim()" :loading="generating" @click="runGenerate">
						{{ suggested ? t('operations.ai-text.regenerate') : t('generate') }}
					</VButton>
					<VButton v-if="suggested" @click="useSuggestion">{{ t('operations.ai-text.use_fields') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>

		<VDialog v-model="exampleDialog" @esc="exampleDialog = false" @apply="useExample">
			<VCard>
				<VCardTitle>{{ t('operations.ai-text.paste_example') }}</VCardTitle>
				<VCardText>
					<VForm v-model="example" :fields="exampleFields" primary-key="+" />
					<VNotice v-if="exampleError" type="danger" class="example-error">{{ exampleError }}</VNotice>
				</VCardText>
				<VCardActions>
					<VButton secondary @click="exampleDialog = false">{{ t('cancel') }}</VButton>
					<VButton @click="useExample">{{ t('operations.ai-text.use_example') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
	</div>
</template>

<style lang="scss" scoped>
.ai-text-options {
	display: flex;
	flex-direction: column;
	gap: var(--theme--form--row-gap);
}

.small-action {
	align-self: flex-start;
}

.ai-text-options > .small-action,
.schema-actions {
	margin-block-start: calc(-1 * var(--theme--form--row-gap) + 0.25rem);
}

.schema-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	margin-block-end: calc(-1 * var(--theme--form--row-gap) + 0.5rem);
}

.schema-actions {
	display: flex;
	gap: 0.5rem;
}

.view-toggle {
	display: flex;
	gap: 0.125rem;
	padding: 0.125rem;
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--background-normal);
}

.schema-note {
	margin-block-start: calc(-1 * var(--theme--form--row-gap) + 0.25rem);
}

.example-error {
	margin-block-start: 1rem;
}

.generate-body {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;

	.type-label {
		margin-block-start: 1rem;
	}
}

.suggestion {
	display: flex;
	flex-direction: column;
	gap: 0.375rem;
	margin: 0;
	padding: 0.75rem;
	list-style: none;
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);

	li {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem;
	}

	code {
		font-family: var(--theme--fonts--monospace--font-family);
	}
}

.suggestion-type {
	color: var(--theme--foreground-subdued);
}

.suggestion-choices {
	color: var(--theme--foreground-subdued);
	font-style: italic;
}
</style>
