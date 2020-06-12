import FieldSetup from './field-setup.vue';
import { types, Type } from '@/stores/fields/types';
import { LocalType } from './types';

const localTypeGroups: Record<LocalType, Type[]> = {
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
