import { Field } from '@/stores/fields/types';

export type FormField = Pick<Field, 'field' | 'name' | 'interface' | 'options' | 'sort' | 'width'> &
	Partial<Field>;
