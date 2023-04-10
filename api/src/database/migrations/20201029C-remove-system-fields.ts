import type { Knex } from 'knex';
import { merge, uniq } from 'lodash-es';

const defaults = {
	collection: null,
	field: null,
	special: null,
	interface: null,
	options: null,
	display: null,
	display_options: null,
	locked: false,
	readonly: false,
	hidden: false,
	sort: null,
	width: 'full',
	group: null,
	translations: null,
	note: null,
};

const systemFields = [
	{
		collection: 'directus_collections',
		field: 'collection_divider',
		special: 'alias',
		interface: 'divider',
		options: {
			icon: 'box',
			title: 'Collection Setup',
			color: '#2F80ED',
		},
		locked: true,
		sort: 1,
		width: 'full',
	},
	{
		collection: 'directus_collections',
		field: 'collection',
		interface: 'text-input',
		options: {
			font: 'monospace',
		},
		locked: true,
		readonly: true,
		sort: 2,
		width: 'half',
	},
	{
		collection: 'directus_collections',
		field: 'icon',
		interface: 'icon',
		options: null,
		locked: true,
		sort: 3,
		width: 'half',
	},
	{
		collection: 'directus_collections',
		field: 'note',
		interface: 'text-input',
		options: {
			placeholder: 'A description of this collection...',
		},
		locked: true,
		sort: 4,
		width: 'full',
	},
	{
		collection: 'directus_collections',
		field: 'display_template',
		interface: 'display-template',
		options: {
			collectionField: 'collection',
		},
		locked: true,
		sort: 5,
		width: 'full',
	},
	{
		collection: 'directus_collections',
		field: 'hidden',
		special: 'boolean',
		interface: 'toggle',
		options: {
			label: 'Hide within the App',
		},
		locked: true,
		sort: 6,
		width: 'half',
	},
	{
		collection: 'directus_collections',
		field: 'singleton',
		special: 'boolean',
		interface: 'toggle',
		options: {
			label: 'Treat as single object',
		},
		locked: true,
		sort: 7,
		width: 'half',
	},
	{
		collection: 'directus_collections',
		field: 'translations',
		special: 'json',
		interface: 'repeater',
		options: {
			template: '{{ translation }} ({{ language }})',
			fields: [
				{
					field: 'language',
					name: 'Language',
					type: 'string',
					schema: {
						default_value: 'en-US',
					},
					meta: {
						interface: 'system-language',
						width: 'half',
					},
				},
				{
					field: 'translation',
					name: 'translation',
					type: 'string',
					meta: {
						interface: 'text-input',
						width: 'half',
						options: {
							placeholder: 'Enter a translation...',
						},
					},
				},
			],
		},
		locked: true,
		sort: 8,
		width: 'full',
	},
	{
		collection: 'directus_collections',
		field: 'archive_divider',
		special: 'alias',
		interface: 'divider',
		options: {
			icon: 'archive',
			title: 'Archive',
			color: '#2F80ED',
		},
		locked: true,
		sort: 9,
		width: 'full',
	},
	{
		collection: 'directus_collections',
		field: 'archive_field',
		interface: 'field',
		options: {
			collectionField: 'collection',
			allowNone: true,
			placeholder: 'Choose a field...',
		},
		locked: true,
		sort: 10,
		width: 'half',
	},
	{
		collection: 'directus_collections',
		field: 'archive_app_filter',
		interface: 'toggle',
		special: 'boolean',
		options: {
			label: 'Enable App Archive Filter',
		},
		locked: true,
		sort: 11,
		width: 'half',
	},
	{
		collection: 'directus_collections',
		field: 'archive_value',
		interface: 'text-input',
		options: {
			font: 'monospace',
			iconRight: 'archive',
			placeholder: 'Value set when archiving...',
		},
		locked: true,
		sort: 12,
		width: 'half',
	},
	{
		collection: 'directus_collections',
		field: 'unarchive_value',
		interface: 'text-input',
		options: {
			font: 'monospace',
			iconRight: 'unarchive',
			placeholder: 'Value set when unarchiving...',
		},
		locked: true,
		sort: 13,
		width: 'half',
	},
	{
		collection: 'directus_collections',
		field: 'sort_divider',
		special: 'alias',
		interface: 'divider',
		options: {
			icon: 'sort',
			title: 'Sort',
			color: '#2F80ED',
		},
		locked: true,
		sort: 14,
		width: 'full',
	},
	{
		collection: 'directus_collections',
		field: 'sort_field',
		interface: 'field',
		options: {
			collectionField: 'collection',
			placeholder: 'Choose a field...',
			typeAllowList: ['float', 'decimal', 'integer'],
			allowNone: true,
		},
		locked: true,
		sort: 15,
		width: 'half',
	},
	{
		collection: 'directus_roles',
		field: 'id',
		hidden: true,
		interface: 'text-input',
		locked: true,
		special: 'uuid',
	},
	{
		collection: 'directus_roles',
		field: 'name',
		interface: 'text-input',
		options: {
			placeholder: 'The unique name for this role...',
		},
		locked: true,
		sort: 1,
		width: 'half',
	},
	{
		collection: 'directus_roles',
		field: 'icon',
		interface: 'icon',
		display: 'icon',
		locked: true,
		sort: 2,
		width: 'half',
	},
	{
		collection: 'directus_roles',
		field: 'description',
		interface: 'text-input',
		options: {
			placeholder: 'A description of this role...',
		},
		locked: true,
		sort: 3,
		width: 'full',
	},
	{
		collection: 'directus_roles',
		field: 'app_access',
		interface: 'toggle',
		locked: true,
		special: 'boolean',
		sort: 4,
		width: 'half',
	},
	{
		collection: 'directus_roles',
		field: 'admin_access',
		interface: 'toggle',
		locked: true,
		special: 'boolean',
		sort: 5,
		width: 'half',
	},
	{
		collection: 'directus_roles',
		field: 'ip_access',
		interface: 'tags',
		options: {
			placeholder: 'Add allowed IP addresses, leave empty to allow all...',
		},
		locked: true,
		special: 'csv',
		sort: 6,
		width: 'full',
	},
	{
		collection: 'directus_roles',
		field: 'enforce_tfa',
		interface: 'toggle',
		locked: true,
		sort: 7,
		special: 'boolean',
		width: 'half',
	},
	{
		collection: 'directus_roles',
		field: 'users',
		interface: 'one-to-many',
		locked: true,
		special: 'o2m',
		sort: 8,
		options: {
			fields: ['first_name', 'last_name'],
		},
		width: 'full',
	},
	{
		collection: 'directus_roles',
		field: 'module_list',
		interface: 'repeater',
		locked: true,
		options: {
			template: '{{ name }}',
			addLabel: 'Add New Module...',
			fields: [
				{
					name: 'Icon',
					field: 'icon',
					type: 'string',
					meta: {
						interface: 'icon',
						width: 'half',
					},
				},
				{
					name: 'Name',
					field: 'name',
					type: 'string',
					meta: {
						interface: 'text-input',
						width: 'half',
						options: {
							iconRight: 'title',
							placeholder: 'Enter a title...',
						},
					},
				},
				{
					name: 'Link',
					field: 'link',
					type: 'string',
					meta: {
						interface: 'text-input',
						width: 'full',
						options: {
							iconRight: 'link',
							placeholder: 'Relative or absolute URL...',
						},
					},
				},
			],
		},
		special: 'json',
		sort: 9,
		width: 'full',
	},
	{
		collection: 'directus_roles',
		field: 'collection_list',
		interface: 'repeater',
		locked: true,
		options: {
			template: '{{ group_name }}',
			addLabel: 'Add New Group...',
			fields: [
				{
					name: 'Group Name',
					field: 'group_name',
					type: 'string',
					meta: {
						width: 'half',
						interface: 'text-input',
						options: {
							iconRight: 'title',
							placeholder: 'Label this group...',
						},
					},
					schema: {
						is_nullable: false,
					},
				},
				{
					name: 'Type',
					field: 'accordion',
					type: 'string',
					schema: {
						default_value: 'always_open',
					},
					meta: {
						width: 'half',
						interface: 'dropdown',
						options: {
							choices: [
								{
									value: 'always_open',
									text: 'Always Open',
								},
								{
									value: 'start_open',
									text: 'Start Open',
								},
								{
									value: 'start_collapsed',
									text: 'Start Collapsed',
								},
							],
						},
					},
				},
				{
					name: 'Collections',
					field: 'collections',
					type: 'JSON',
					meta: {
						interface: 'repeater',
						options: {
							addLabel: 'Add New Collection...',
							template: '{{ collection }}',
							fields: [
								{
									name: 'Collection',
									field: 'collection',
									type: 'string',
									meta: {
										interface: 'collection',
										width: 'full',
									},
									schema: {
										is_nullable: false,
									},
								},
							],
						},
					},
				},
			],
		},
		special: 'json',
		sort: 10,
		width: 'full',
	},
	{
		collection: 'directus_fields',
		field: 'options',
		hidden: true,
		locked: true,
		special: 'json',
	},
	{
		collection: 'directus_fields',
		field: 'display_options',
		hidden: true,
		locked: true,
		special: 'json',
	},
	{
		collection: 'directus_fields',
		field: 'locked',
		hidden: true,
		locked: true,
		special: 'boolean',
	},
	{
		collection: 'directus_fields',
		field: 'readonly',
		hidden: true,
		locked: true,
		special: 'boolean',
	},
	{
		collection: 'directus_fields',
		field: 'hidden',
		hidden: true,
		locked: true,
		special: 'boolean',
	},
	{
		collection: 'directus_fields',
		field: 'special',
		hidden: true,
		locked: true,
		special: 'csv',
	},
	{
		collection: 'directus_fields',
		field: 'translations',
		hidden: true,
		locked: true,
		special: 'json',
	},
	{
		collection: 'directus_users',
		field: 'first_name',
		interface: 'text-input',
		locked: true,
		options: {
			iconRight: 'account_circle',
		},
		sort: 1,
		width: 'half',
	},
	{
		collection: 'directus_users',
		field: 'last_name',
		interface: 'text-input',
		locked: true,
		options: {
			iconRight: 'account_circle',
		},
		sort: 2,
		width: 'half',
	},
	{
		collection: 'directus_users',
		field: 'email',
		interface: 'text-input',
		locked: true,
		options: {
			iconRight: 'email',
		},
		sort: 3,
		width: 'half',
	},
	{
		collection: 'directus_users',
		field: 'password',
		special: 'hash, conceal',
		interface: 'hash',
		locked: true,
		options: {
			iconRight: 'lock',
			masked: true,
		},
		sort: 4,
		width: 'half',
	},
	{
		collection: 'directus_users',
		field: 'avatar',
		interface: 'file',
		locked: true,
		sort: 5,
		width: 'full',
	},
	{
		collection: 'directus_users',
		field: 'location',
		interface: 'text-input',
		options: {
			iconRight: 'place',
		},
		sort: 6,
		width: 'half',
	},
	{
		collection: 'directus_users',
		field: 'title',
		interface: 'text-input',
		options: {
			iconRight: 'work',
		},
		sort: 7,
		width: 'half',
	},
	{
		collection: 'directus_users',
		field: 'description',
		interface: 'textarea',
		sort: 8,
		width: 'full',
	},
	{
		collection: 'directus_users',
		field: 'tags',
		interface: 'tags',
		special: 'json',
		sort: 9,
		width: 'full',
		options: {
			iconRight: 'local_offer',
		},
	},
	{
		collection: 'directus_users',
		field: 'preferences_divider',
		interface: 'divider',
		options: {
			icon: 'face',
			title: 'User Preferences',
			color: '#2F80ED',
		},
		special: 'alias',
		sort: 10,
		width: 'full',
	},
	{
		collection: 'directus_users',
		field: 'language',
		interface: 'dropdown',
		locked: true,
		options: {
			choices: [
				{
					text: 'Afrikaans (South Africa)',
					value: 'af-ZA',
				},
				{
					text: 'Arabic (Saudi Arabia)',
					value: 'ar-SA',
				},
				{
					text: 'Catalan (Spain)',
					value: 'ca-ES',
				},
				{
					text: 'Chinese (Simplified)',
					value: 'zh-CN',
				},
				{
					text: 'Czech (Czech Republic)',
					value: 'cs-CZ',
				},
				{
					text: 'Danish (Denmark)',
					value: 'da-DK',
				},
				{
					text: 'Dutch (Netherlands)',
					value: 'nl-NL',
				},
				{
					text: 'English (United States)',
					value: 'en-US',
				},
				{
					text: 'Finnish (Finland)',
					value: 'fi-FI',
				},
				{
					text: 'French (France)',
					value: 'fr-FR',
				},
				{
					text: 'German (Germany)',
					value: 'de-DE',
				},
				{
					text: 'Greek (Greece)',
					value: 'el-GR',
				},
				{
					text: 'Hebrew (Israel)',
					value: 'he-IL',
				},
				{
					text: 'Hungarian (Hungary)',
					value: 'hu-HU',
				},
				{
					text: 'Icelandic (Iceland)',
					value: 'is-IS',
				},
				{
					text: 'Indonesian (Indonesia)',
					value: 'id-ID',
				},
				{
					text: 'Italian (Italy)',
					value: 'it-IT',
				},
				{
					text: 'Japanese (Japan)',
					value: 'ja-JP',
				},
				{
					text: 'Korean (Korea)',
					value: 'ko-KR',
				},
				{
					text: 'Malay (Malaysia)',
					value: 'ms-MY',
				},
				{
					text: 'Norwegian (Norway)',
					value: 'no-NO',
				},
				{
					text: 'Polish (Poland)',
					value: 'pl-PL',
				},
				{
					text: 'Portuguese (Brazil)',
					value: 'pt-BR',
				},
				{
					text: 'Portuguese (Portugal)',
					value: 'pt-PT',
				},
				{
					text: 'Russian (Russian Federation)',
					value: 'ru-RU',
				},
				{
					text: 'Spanish (Spain)',
					value: 'es-ES',
				},
				{
					text: 'Spanish (Latin America)',
					value: 'es-419',
				},
				{
					text: 'Taiwanese Mandarin (Taiwan)',
					value: 'zh-TW',
				},
				{
					text: 'Turkish (Turkey)',
					value: 'tr-TR',
				},
				{
					text: 'Ukrainian (Ukraine)',
					value: 'uk-UA',
				},
				{
					text: 'Vietnamese (Vietnam)',
					value: 'vi-VN',
				},
			],
		},
		sort: 11,
		width: 'half',
	},
	{
		collection: 'directus_users',
		field: 'theme',
		interface: 'dropdown',
		locked: true,
		options: {
			choices: [
				{
					value: 'auto',
					text: 'Automatic (Based on System)',
				},
				{
					value: 'light',
					text: 'Light Mode',
				},
				{
					value: 'dark',
					text: 'Dark Mode',
				},
			],
		},
		sort: 12,
		width: 'half',
	},
	{
		collection: 'directus_users',
		field: 'tfa_secret',
		interface: 'tfa-setup',
		locked: true,
		special: 'conceal',
		sort: 13,
		width: 'half',
	},
	{
		collection: 'directus_users',
		field: 'admin_divider',
		interface: 'divider',
		locked: true,
		options: {
			icon: 'verified_user',
			title: 'Admin Options',
			color: '#F2994A',
		},
		special: 'alias',
		sort: 14,
		width: 'full',
	},
	{
		collection: 'directus_users',
		field: 'status',
		interface: 'dropdown',
		locked: true,
		options: {
			choices: [
				{
					text: 'Draft',
					value: 'draft',
				},
				{
					text: 'Invited',
					value: 'invited',
				},
				{
					text: 'Active',
					value: 'active',
				},
				{
					text: 'Suspended',
					value: 'suspended',
				},
				{
					text: 'Archived',
					value: 'archived',
				},
			],
		},
		sort: 15,
		width: 'half',
	},
	{
		collection: 'directus_users',
		field: 'role',
		interface: 'many-to-one',
		locked: true,
		options: {
			template: '{{ name }}',
		},
		special: 'm2o',
		sort: 16,
		width: 'half',
	},
	{
		collection: 'directus_users',
		field: 'token',
		interface: 'token',
		locked: true,
		options: {
			iconRight: 'vpn_key',
			placeholder: 'Enter a secure access token...',
		},
		sort: 17,
		width: 'full',
	},
	{
		collection: 'directus_users',
		field: 'id',
		special: 'uuid',
		interface: 'text-input',
		locked: true,
		options: {
			iconRight: 'vpn_key',
		},
		sort: 18,
		width: 'full',
	},
	{
		collection: 'directus_folders',
		field: 'id',
		interface: 'text-input',
		locked: true,
		special: 'uuid',
	},
	{
		collection: 'directus_files',
		field: 'id',
		hidden: true,
		interface: 'text-input',
		locked: true,
		special: 'uuid',
	},
	{
		collection: 'directus_files',
		field: 'title',
		interface: 'text-input',
		locked: true,
		options: {
			iconRight: 'title',
			placeholder: 'A unique title...',
		},
		sort: 1,
		width: 'full',
	},
	{
		collection: 'directus_files',
		field: 'description',
		interface: 'textarea',
		locked: true,
		sort: 2,
		width: 'full',
		options: {
			placeholder: 'An optional description...',
		},
	},
	{
		collection: 'directus_files',
		field: 'tags',
		interface: 'tags',
		locked: true,
		options: {
			iconRight: 'local_offer',
		},
		special: 'json',
		sort: 3,
		width: 'full',
		display: 'tags',
	},
	{
		collection: 'directus_files',
		field: 'location',
		interface: 'text-input',
		locked: true,
		options: {
			iconRight: 'place',
			placeholder: 'An optional location...',
		},
		sort: 4,
		width: 'half',
	},
	{
		collection: 'directus_files',
		field: 'storage',
		interface: 'text-input',
		locked: true,
		options: {
			iconRight: 'storage',
		},
		sort: 5,
		width: 'half',
		readonly: true,
	},
	{
		collection: 'directus_files',
		field: 'storage_divider',
		interface: 'divider',
		locked: true,
		options: {
			icon: 'insert_drive_file',
			title: 'File Naming',
			color: '#2F80ED',
		},
		special: 'alias',
		sort: 6,
		width: 'full',
	},
	{
		collection: 'directus_files',
		field: 'filename_disk',
		interface: 'text-input',
		locked: true,
		options: {
			iconRight: 'publish',
			placeholder: 'Name on disk storage...',
		},
		sort: 7,
		width: 'half',
	},
	{
		collection: 'directus_files',
		field: 'filename_download',
		interface: 'text-input',
		locked: true,
		options: {
			iconRight: 'get_app',
			placeholder: 'Name when downloading...',
		},
		sort: 8,
		width: 'half',
	},
	{
		collection: 'directus_files',
		field: 'metadata',
		hidden: true,
		locked: true,
		special: 'json',
	},
	{
		collection: 'directus_files',
		field: 'type',
		display: 'mime-type',
	},
	{
		collection: 'directus_files',
		field: 'filesize',
		display: 'filesize',
	},
	{
		collection: 'directus_files',
		field: 'modified_by',
		interface: 'user',
		locked: true,
		special: 'user-updated',
		width: 'half',
		display: 'user',
	},
	{
		collection: 'directus_files',
		field: 'modified_on',
		interface: 'datetime',
		locked: true,
		special: 'date-updated',
		width: 'half',
		display: 'datetime',
	},
	{
		collection: 'directus_files',
		field: 'created_on',
		display: 'datetime',
	},
	{
		collection: 'directus_files',
		field: 'created_by',
		display: 'user',
	},
	{
		collection: 'directus_permissions',
		field: 'permissions',
		hidden: true,
		locked: true,
		special: 'json',
	},
	{
		collection: 'directus_permissions',
		field: 'presets',
		hidden: true,
		locked: true,
		special: 'json',
	},
	{
		collection: 'directus_presets',
		field: 'filters',
		hidden: true,
		locked: true,
		special: 'json',
	},
	{
		collection: 'directus_presets',
		field: 'layout_query',
		hidden: true,
		locked: true,
		special: 'json',
	},
	{
		collection: 'directus_presets',
		field: 'layout_options',
		hidden: true,
		locked: true,
		special: 'json',
	},
	{
		collection: 'directus_revisions',
		field: 'data',
		hidden: true,
		locked: true,
		special: 'json',
	},
	{
		collection: 'directus_revisions',
		field: 'delta',
		hidden: true,
		locked: true,
		special: 'json',
	},
	{
		collection: 'directus_settings',
		field: 'project_name',
		interface: 'text-input',
		locked: true,
		options: {
			iconRight: 'title',
			placeholder: 'My project...',
		},
		sort: 1,
		translations: {
			language: 'en-US',
			translations: 'Name',
		},
		width: 'half',
	},
	{
		collection: 'directus_settings',
		field: 'project_url',
		interface: 'text-input',
		locked: true,
		options: {
			iconRight: 'link',
			placeholder: 'https://example.com',
		},
		sort: 2,
		translations: {
			language: 'en-US',
			translations: 'Website',
		},
		width: 'half',
	},
	{
		collection: 'directus_settings',
		field: 'project_color',
		interface: 'color',
		locked: true,
		note: 'Login & Logo Background',
		sort: 3,
		translations: {
			language: 'en-US',
			translations: 'Brand Color',
		},
		width: 'half',
	},
	{
		collection: 'directus_settings',
		field: 'project_logo',
		interface: 'file',
		locked: true,
		note: 'White 40x40 SVG/PNG',
		sort: 4,
		translations: {
			language: 'en-US',
			translations: 'Brand Logo',
		},
		width: 'half',
	},
	{
		collection: 'directus_settings',
		field: 'public_divider',
		interface: 'divider',
		locked: true,
		options: {
			icon: 'public',
			title: 'Public Pages',
			color: '#2F80ED',
		},
		special: 'alias',
		sort: 5,
		width: 'full',
	},
	{
		collection: 'directus_settings',
		field: 'public_foreground',
		interface: 'file',
		locked: true,
		sort: 6,
		translations: {
			language: 'en-US',
			translations: 'Login Foreground',
		},
		width: 'half',
	},
	{
		collection: 'directus_settings',
		field: 'public_background',
		interface: 'file',
		locked: true,
		sort: 7,
		translations: {
			language: 'en-US',
			translations: 'Login Background',
		},
		width: 'half',
	},
	{
		collection: 'directus_settings',
		field: 'public_note',
		interface: 'textarea',
		locked: true,
		options: {
			placeholder: 'A short, public message that supports markdown formatting...',
		},
		sort: 8,
		width: 'full',
	},
	{
		collection: 'directus_settings',
		field: 'security_divider',
		interface: 'divider',
		locked: true,
		options: {
			icon: 'security',
			title: 'Security',
			color: '#2F80ED',
		},
		special: 'alias',
		sort: 9,
		width: 'full',
	},
	{
		collection: 'directus_settings',
		field: 'auth_password_policy',
		interface: 'dropdown',
		locked: true,
		options: {
			choices: [
				{
					value: null,
					text: 'None – Not Recommended',
				},
				{
					value: '/^.{8,}$/',
					text: 'Weak – Minimum 8 Characters',
				},
				{
					value: "/(?=^.{8,}$)(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+}{';'?>.<,])(?!.*\\s).*$/",
					text: 'Strong – Upper / Lowercase / Numbers / Special',
				},
			],
		},
		sort: 10,
		width: 'half',
	},
	{
		collection: 'directus_settings',
		field: 'auth_login_attempts',
		interface: 'numeric',
		locked: true,
		options: {
			iconRight: 'lock',
		},
		sort: 11,
		width: 'half',
	},
	{
		collection: 'directus_settings',
		field: 'files_divider',
		interface: 'divider',
		locked: true,
		options: {
			icon: 'storage',
			title: 'Files & Thumbnails',
			color: '#2F80ED',
		},
		special: 'alias',
		sort: 12,
		width: 'full',
	},
	{
		collection: 'directus_settings',
		field: 'storage_asset_presets',
		interface: 'repeater',
		locked: true,
		options: {
			fields: [
				{
					field: 'key',
					name: 'Key',
					type: 'string',
					schema: {
						is_nullable: false,
					},
					meta: {
						interface: 'slug',
						options: {
							onlyOnCreate: false,
						},
						width: 'half',
					},
				},
				{
					field: 'fit',
					name: 'Fit',
					type: 'string',
					schema: {
						is_nullable: false,
					},
					meta: {
						interface: 'dropdown',
						options: {
							choices: [
								{
									value: 'contain',
									text: 'Contain (preserve aspect ratio)',
								},
								{
									value: 'cover',
									text: 'Cover (forces exact size)',
								},
							],
						},
						width: 'half',
					},
				},
				{
					field: 'width',
					name: 'Width',
					type: 'integer',
					schema: {
						is_nullable: false,
					},
					meta: {
						interface: 'numeric',
						width: 'half',
					},
				},
				{
					field: 'height',
					name: 'Height',
					type: 'integer',
					schema: {
						is_nullable: false,
					},
					meta: {
						interface: 'numeric',
						width: 'half',
					},
				},
				{
					field: 'quality',
					type: 'integer',
					name: 'Quality',
					schema: {
						default_value: 80,
						is_nullable: false,
					},
					meta: {
						interface: 'slider',
						options: {
							max: 100,
							min: 0,
							step: 1,
						},
						width: 'full',
					},
				},
			],
			template: '{{key}}',
		},
		special: 'json',
		sort: 13,
		width: 'full',
	},
	{
		collection: 'directus_settings',
		field: 'storage_asset_transform',
		interface: 'dropdown',
		locked: true,
		options: {
			choices: [
				{
					value: 'all',
					text: 'All',
				},
				{
					value: 'none',
					text: 'None',
				},
				{
					value: 'presets',
					text: 'Presets Only',
				},
			],
		},
		sort: 14,
		width: 'half',
	},
	{
		collection: 'directus_settings',
		field: 'id',
		hidden: true,
		locked: true,
	},
	{
		collection: 'directus_settings',
		field: 'overrides_divider',
		interface: 'divider',
		locked: true,
		options: {
			icon: 'brush',
			title: 'App Overrides',
			color: '#2F80ED',
		},
		special: 'alias',
		sort: 15,
		width: 'full',
	},
	{
		collection: 'directus_settings',
		field: 'custom_css',
		interface: 'code',
		locked: true,
		options: {
			language: 'css',
			lineNumber: true,
		},
		sort: 16,
		width: 'full',
	},
	{
		collection: 'directus_webhooks',
		field: 'id',
		hidden: true,
		locked: true,
	},
	{
		collection: 'directus_webhooks',
		field: 'name',
		interface: 'text-input',
		locked: true,
		options: {
			iconRight: 'title',
		},
		sort: 1,
		width: 'full',
	},
	{
		collection: 'directus_webhooks',
		field: 'method',
		interface: 'dropdown',
		display: 'labels',
		display_options: {
			defaultBackground: '#ECEFF1',
			choices: null,
			format: false,
		},
		locked: true,
		options: {
			choices: ['GET', 'POST'],
		},
		sort: 2,
		width: 'half',
	},
	{
		collection: 'directus_webhooks',
		field: 'url',
		interface: 'text-input',
		locked: true,
		options: {
			iconRight: 'link',
		},
		sort: 3,
		width: 'half',
	},
	{
		collection: 'directus_webhooks',
		field: 'status',
		interface: 'dropdown',
		display: 'labels',
		display_options: {
			defaultColor: '#B0BEC5',
			defaultBackground: '#ECEFF1',
			showAsDot: true,
			choices: [
				{
					text: 'Active',
					value: 'active',
					foreground: '#607D8B',
					background: '#2F80ED',
				},
				{
					text: 'Inactive',
					value: 'inactive',
					foreground: '#607D8B',
					background: '#ECEFF1',
				},
			],
		},
		locked: true,
		options: {
			choices: [
				{
					text: 'Active',
					value: 'active',
				},
				{
					text: 'Inactive',
					value: 'inactive',
				},
			],
		},
		sort: 4,
		width: 'half',
	},
	{
		collection: 'directus_webhooks',
		field: 'data',
		interface: 'toggle',
		locked: true,
		options: {
			label: 'Send Event Data',
		},
		special: 'boolean',
		sort: 5,
		width: 'half',
	},
	{
		collection: 'directus_webhooks',
		field: 'triggers_divider',
		interface: 'divider',
		options: {
			icon: 'api',
			title: 'Triggers',
			color: '#2F80ED',
		},
		special: 'alias',
		sort: 6,
		width: 'full',
	},
	{
		collection: 'directus_webhooks',
		field: 'actions',
		interface: 'checkboxes',
		options: {
			choices: [
				{
					text: 'Create',
					value: 'create',
				},
				{
					text: 'Update',
					value: 'update',
				},
				{
					text: 'Delete',
					value: 'delete',
				},
			],
		},
		special: 'csv',
		sort: 7,
		width: 'full',
	},
	{
		collection: 'directus_webhooks',
		field: 'collections',
		interface: 'collections',
		special: 'csv',
		sort: 8,
		width: 'full',
	},
	{
		collection: 'directus_activity',
		field: 'action',
		display: 'labels',
		display_options: {
			defaultForeground: '#263238',
			defaultBackground: '#eceff1',
			choices: [
				{
					text: 'Create',
					value: 'create',
					foreground: '#27ae60',
					background: '#c9ebd7',
				},
				{
					text: 'Update',
					value: 'update',
					foreground: '#2f80ed',
					background: '#cbdffb',
				},
				{
					text: 'Delete',
					value: 'delete',
					foreground: '#eb5757',
					background: '#fad5d5',
				},
				{
					text: 'Login',
					value: 'authenticate',
					foreground: '#9b51e0',
					background: '#e6d3f7',
				},
			],
		},
	},
	{
		collection: 'directus_activity',
		field: 'collection',
		display: 'collection',
		display_options: {
			icon: true,
		},
	},
	{
		collection: 'directus_activity',
		field: 'timestamp',
		display: 'datetime',
		options: {
			relative: true,
		},
	},
	{
		collection: 'directus_activity',
		field: 'user',
		display: 'user',
	},
	{
		collection: 'directus_activity',
		field: 'comment',
		display: 'formatted-text',
		display_options: {
			subdued: true,
		},
	},
	{
		collection: 'directus_activity',
		field: 'user_agent',
		display: 'formatted-text',
		display_options: {
			font: 'monospace',
		},
	},
	{
		collection: 'directus_activity',
		field: 'ip',
		display: 'formatted-text',
		display_options: {
			font: 'monospace',
		},
	},
	{
		collection: 'directus_activity',
		field: 'revisions',
		interface: 'one-to-many',
		locked: true,
		special: 'o2m',
		options: {
			fields: ['collection', 'item'],
		},
		width: 'full',
	},
	{
		collection: 'directus_relations',
		field: 'one_allowed_collections',
		locked: true,
		special: 'csv',
	},
].map((row) => {
	for (const [key, value] of Object.entries(row)) {
		if (value !== null && (typeof value === 'object' || Array.isArray(value))) {
			(row as any)[key] = JSON.stringify(value);
		}
	}

	return merge({}, defaults, row);
});

export async function up(knex: Knex): Promise<void> {
	const fieldKeys = uniq(systemFields.map((field: any) => field.field));

	await knex('directus_fields').delete().where('collection', 'like', 'directus_%').whereIn('field', fieldKeys);
}

export async function down(knex: Knex): Promise<void> {
	await knex.insert(systemFields).into('directus_fields');
}
