import FieldSetup from './field-setup.vue';
import { types, Type } from '@/stores/fields/types';
import { LocalType } from './types';

/**
 * @todo fix local type groups in settings
 */
const localTypeGroups: Record<LocalType, string[]> = {
	relational: ['m2o', 'o2m', 'm2m', 'translation'],
	file: ['file'],
	files: ['files'],
	standard: [],
};

localTypeGroups.standard = types.filter((typeName: Type) => {
	return (
		[...localTypeGroups.relational, ...localTypeGroups.file, ...localTypeGroups.files].includes(typeName) === false
	);
});

export { localTypeGroups };

export { FieldSetup };
export default FieldSetup;
