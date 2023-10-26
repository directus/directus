import { Field, FieldMeta } from '@directus/types';
import { cloneDeep } from 'lodash';

export function pushGroupOptionsDown(fields: Field[]) {
	if (fields.length < 2) return fields;

	fields = cloneDeep(fields);

	const tree = getFieldsTree(fields);

	processFieldsTree(tree);

	return fields;
}

type Item = {
	field: Field;
};

type GroupItem = {
	field?: Field;
	children: (Item | GroupItem)[];
};

type FinalGroupItem = {
	field: Field;
	children: (Item | FinalGroupItem)[];
};

type TreeItem = Item | FinalGroupItem;

function processFieldsTree(tree: TreeItem[]) {
	for (const item of tree) {
		if ('children' in item) {
			const readonly = item.field.meta?.readonly;
			const required = item.field.meta?.required;

			item.field.meta ??= {} as FieldMeta;

			item.field.meta.readonly = false;
			item.field.meta.required = false;

			for (const child of item.children) {
				child.field.meta ??= {} as FieldMeta;

				if (readonly) {
					child.field.meta.readonly = true;
				}

				if (required) {
					child.field.meta.required = true;
				}
			}

			processFieldsTree(item.children);
		}
	}
}

function getFieldsTree(fields: Field[]): TreeItem[] {
	const rootFields: TreeItem[] = [];
	const lookup = new Map<Field['field'], GroupItem>();

	for (const field of fields) {
		const id = field.field;
		const groupId = field.meta?.group;
		const isGroup = field.meta?.special?.includes('group');

		let treeItem;

		if (isGroup) {
			treeItem = lookup.get(id);

			if (!treeItem) {
				treeItem = { field, children: [] };
				lookup.set(id, treeItem);
			} else {
				treeItem.field = field;
			}

			if (!groupId) {
				rootFields.push(treeItem as FinalGroupItem);
			}
		}

		if (groupId) {
			let group = lookup.get(groupId);

			if (!group) {
				group = { children: [] };
				lookup.set(groupId, group);
			}

			group.children.push(treeItem ?? { field });
		}
	}

	return rootFields;
}
