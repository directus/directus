import type { BaseCollectionMeta } from '@directus/system-data'
import type { FieldMeta, RelationMeta } from '@directus/types';

export const COLLECTION_META_DEFAULTS = {
	"accountability": "all",
	"group": null,
	"hidden": false,
	"icon": null,
	"item_duplication_fields": null,
	"note": null,
	"singleton": false,
	"translations": null,
	"versioning": false,
	"system": false
} satisfies Partial<BaseCollectionMeta>;

export const FIELD_META_DEFAULTS = {
	"conditions": null,
	"group": null,
	"hidden": false,
	"note": null,
	"options": null,
	"readonly": false,
	"required": false,
	"special": null,
	"translations": null,
	"validation": null,
	"validation_message": null,
	"width": "full"
} satisfies Partial<FieldMeta>

export const RELATION_META_DEFAULTS = {
	one_deselect_action: 'nullify',
	system: false
} satisfies Partial<RelationMeta>
