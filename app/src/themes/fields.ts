import { RawField } from '@directus/shared/types';
import { merge } from 'lodash';
import { i18n } from '@/lang';
const { t } = i18n.global;

export const fields: Partial<RawField>[] = [
	/* ---------- Colors ---------- */
	divider('colors_divider', 'sections.colors.title'),
	description('colors_description', 'sections.colors.description'),
	// Start main_colors_group
	...group(
		'main_colors_group',
		'group-raw',
		[
			/* ---------- Primary Color Group  ---------- */
			...group(
				'colors_primary',
				'group-raw',
				[
					colorSource('global.color.primary.normal', 'colors.primary_normal'),
					generatedColor(
						'global.color.primary.accent',
						'colors.primary_accent',
						'accent',
						'global.color.primary.normal'
					),
					generatedColor(
						'global.color.primary.subtle',
						'colors.primary_subtle',
						'subtle',
						'global.color.primary.normal',
						{
							backgroundSource: 'global.color.background.page',
						}
					),
				],
				{ class: 'theme-color-group' }
			),
			/* ---------- Secondary Color Group  ---------- */
			...group(
				'colors_secondary',
				'group-raw',
				[
					colorSource('global.color.secondary.normal', 'colors.secondary_normal'),
					generatedColor(
						'global.color.secondary.accent',
						'colors.secondary_accent',
						'accent',
						'global.color.secondary.normal'
					),
					generatedColor(
						'global.color.secondary.subtle',
						'colors.secondary_subtle',
						'subtle',
						'global.color.secondary.normal',
						{
							backgroundSource: 'global.color.background.page',
						}
					),
				],
				{ class: 'theme-color-group' }
			),
			/* ---------- Success Color Group  ---------- */
			...group(
				'colors_success',
				'group-raw',
				[
					colorSource('global.color.success.normal', 'colors.success_normal'),
					generatedColor(
						'global.color.success.accent',
						'colors.success_accent',
						'accent',
						'global.color.success.normal'
					),
					generatedColor(
						'global.color.success.subtle',
						'colors.success_subtle',
						'subtle',
						'global.color.success.normal',
						{
							backgroundSource: 'global.color.background.page',
						}
					),
				],
				{ class: 'theme-color-group' }
			),
			/* ---------- Warning Color Group  ---------- */
			...group(
				'colors_warning',
				'group-raw',
				[
					colorSource('global.color.warning.normal', 'colors.warning_normal'),
					generatedColor(
						'global.color.warning.accent',
						'colors.warning_accent',
						'accent',
						'global.color.warning.normal'
					),
					generatedColor(
						'global.color.warning.subtle',
						'colors.warning_subtle',
						'subtle',
						'global.color.warning.normal',
						{
							backgroundSource: 'global.color.background.page',
						}
					),
				],
				{ class: 'theme-color-group' }
			),
			/* ---------- Danger Color Group  ---------- */
			...group(
				'colors_danger',
				'group-raw',
				[
					colorSource('global.color.danger.normal', 'colors.danger_normal'),
					generatedColor('global.color.danger.accent', 'colors.danger_accent', 'accent', 'global.color.danger.normal'),
					generatedColor('global.color.danger.subtle', 'colors.danger_subtle', 'subtle', 'global.color.danger.normal', {
						backgroundSource: 'global.color.background.page',
					}),
				],
				{ class: 'theme-color-group' }
			),
		],
		{ class: 'narrow-columns' }
	), // End main_colors_group
	/* ---------- Foreground  ---------- */
	divider('foreground_divider', 'sections.foreground.title'),
	description('foreground_description', 'sections.foreground.description'),
	dropdown('global.font.family.sans', 'font.sans', false, [
		['Inter'],
		['Open Sans'],
		['Montserrat'],
		['Noto Sans Display'],
		['Josefin Sans'],
		['Merriweather Sans'],
	]),
	dropdown('global.font.family.serif', 'font.serif', false, [
		['Merriweather'],
		['Playfair Display'],
		['Noto Serif Display'],
		['Source Serif 4'],
		['Roboto Serif'],
		['Roboto Slab'],
	]),
	dropdown('global.font.family.mono', 'font.mono', false, [
		['Fira Mono'],
		['Fira Code'],
		['Source Code Pro'],
		['Red Hat Mono'],
		['Roboto Mono'],
		['JetBrains Mono'],
		['Noto Sans Mono'],
	]),
	// Start foreground_colors_group
	...group(
		'foreground_colors_group',
		'group-raw',
		[
			color('global.color.foreground.normal', 'colors.foreground_normal'),
			color('global.color.foreground.accent', 'colors.foreground_accent'),
			color('global.color.foreground.subtle', 'colors.foreground_subtle'),
			color('global.color.foreground.invert', 'colors.foreground_invert'),
		],
		{ class: 'narrow-columns' }
	), // End foreground_colors_group
	/* ---------- Background  ---------- */
	divider('background_divider', 'sections.background.title'),
	description('background_description', 'sections.background.description'),
	// Start background_colors_group
	...group(
		'background_colors_group',
		'group-raw',
		[
			color('global.color.background.normal', 'colors.background_normal'),
			color('global.color.background.accent', 'colors.background_accent'),
			color('global.color.background.subtle', 'colors.background_subtle'),
			color('global.color.background.page', 'colors.background_page'),
			color('global.color.background.invert', 'colors.background_invert'),
		],
		{ class: 'narrow-columns' }
	), // End background_colors_group
	/* ---------- Border  ---------- */
	divider('border_divider', 'sections.border.title'),
	description('border_description', 'sections.border.description'),
	integer('global.border.width', 'border.width', 0, 2),
	integer('global.border.radius', 'border.radius', 0, 30),
	// Start border_colors_group
	...group(
		'border_colors_group',
		'group-raw',
		[
			color('global.color.border.normal', 'colors.border_normal'),
			color('global.color.border.accent', 'colors.border_accent'),
			color('global.color.border.subtle', 'colors.border_subtle'),
		],
		{ class: 'narrow-columns' }
	), // End border_colors_group
	/* ---------- Text Styles  ---------- */
	// divider('text_styles_divider', 'sections.text_styles.title'),
	// description('text_styles_description', 'sections.text_styles.description'),
	/* ---------- Module Bar  ---------- */
	divider('module_divider', 'sections.module.title'),
	description('module_description', 'sections.module.description'),

	// Start module_colors_group
	...group(
		'module_colors_group',
		'group-raw',
		[
			color('components.module.background.normal', 'colors.module_background_normal'),
			color('components.module.foreground.normal', 'colors.module_foreground_normal'),

			color('components.module.background.hover', 'colors.module_background_hover'),
			color('components.module.foreground.hover', 'colors.module_foreground_hover'),

			color('components.module.background.active', 'colors.module_background_active'),
			color('components.module.foreground.active', 'colors.module_foreground_active'),
		],
		{ class: 'narrow-columns' }
	), // End module_colors_group
];

function integer(fieldId: string, namePath: string, min: number, max: number) {
	const base = baseField(fieldId, namePath);
	const overrides = {
		type: 'integer',
		meta: {
			options: {
				min,
				max,
			},
		},
		schema: {
			default_value: 0,
		},
	};
	return merge({}, base, overrides);
}

/**
 * Choices is an array containing arrays of 1 or 2 strings. A single string will set the
 * text and value to be equal on that choice. Tuples will map to [text, value].
 */
function dropdown(fieldId: string, namePath: string, allowCustom = false, choices: [string, string?][] = [['Value']]) {
	const base = baseField(fieldId, namePath);
	const resolvedChoices = choices.reduce<{ text: string; value: string }[]>((acc, choice) => {
		acc.push({
			text: choice[0],
			value: choice[1] ?? choice[0],
		});
		return acc;
	}, []);
	const overrides = {
		meta: {
			interface: 'select-dropdown',
			options: {
				allowOther: allowCustom,
				choices: resolvedChoices,
			},
		},
	};
	return merge({}, base, overrides);
}

function colorSource(fieldId: string, namePath: string) {
	const base = color(fieldId, namePath);
	const overrides = {
		meta: {
			options: {
				source: true,
			},
			width: 'full',
		},
	};
	return merge({}, base, overrides);
}

function color(fieldId: string, namePath: string) {
	const base = baseField(fieldId, namePath);
	const overrides = {
		meta: {
			interface: 'theme-color-picker',
			width: 'full',
		},
		schema: {
			default_value: '#cccccc',
		},
	};
	return merge({}, base, overrides);
}

function generatedColor(
	fieldId: string,
	namePath: string,
	generateType: 'accent' | 'subtle',
	source: string,
	options = {}
) {
	const base = baseField(fieldId, namePath);
	const overrides = {
		hideLabel: true,
		meta: {
			interface: 'theme-generated-color',
			options: {
				generated: true,
				generateType,
				source,
				...options,
			},
			width: 'full',
			schema: {
				default_value: '#cccccc',
			},
		},
	};
	return merge({}, base, overrides);
}

function group(
	groupId: string,
	fieldInterface: string,
	items: RawField[],
	options?: Record<string, string>
): RawField[] {
	const base = baseField(groupId);
	const overrides = {
		type: 'alias',
		meta: {
			interface: fieldInterface,
			special: ['alias', 'no-data', 'group'],
			options,
			width: 'full',
		},
	};
	const groupAlias = merge({}, base, overrides);
	const groupAppliedFields = items.map((field) => {
		if (field.meta && !field.meta.group) field.meta.group = groupId;
		return field;
	});
	return [groupAlias, ...groupAppliedFields];
}

function divider(fieldId: string, titlePath: string): RawField {
	const base = baseField(fieldId);
	const overrides = {
		type: 'alias',
		meta: {
			interface: 'presentation-divider',
			options: {
				title: titlePath ? _t(titlePath) : '',
				inlineTitle: false,
				class: 'theme-editor-divider',
			},
			special: ['alias', 'no-data'],
			width: 'full',
		},
	};
	return merge({}, base, overrides);
}

function description(fieldId: string, textPath: string): RawField {
	const base = baseField(fieldId);
	const overrides = {
		type: 'alias',
		meta: {
			interface: 'presentation-text-block',
			options: {
				text: textPath ? _t(textPath) : '',
			},
			special: ['alias', 'no-data'],
			width: 'full',
		},
	};
	return merge({}, base, overrides);
}

function baseField(fieldId: string, namePath = '') {
	const base: RawField = {
		field: fieldId,
		type: 'string',
		name: namePath ? _t(namePath) : '',
		meta: {
			field: fieldId,
			interface: 'input',
			width: 'half',
		},
		schema: {
			is_nullable: false,
			default_value: '',
		},
	};
	return base;
}

// Get translations at theme_overrides path
function _t(subPath: string) {
	const path = 'field_options.directus_settings.theme_overrides';
	return t(`${path}.${subPath}`);
}
