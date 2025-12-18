import type { Field } from '@directus/types';
import { computed, MaybeRefOrGetter, toValue } from 'vue';
import { z, type ZodType } from 'zod';

export const useInputSchema = (finalFields: MaybeRefOrGetter<Field[]>) => {
	const inputSchema = computed(() =>
		z.object(
			toValue(finalFields).reduce(
				(acc, field) => {
					if (field.meta?.readonly) return acc;

					if (field.type === 'alias') return acc;

					let type;

					switch (field.type) {
						case 'string':
						case 'text':
						case 'hash':
						case 'csv':
							type = z.string();
							break;
						case 'boolean':
							type = z.boolean();
							break;
						case 'integer':
						case 'decimal':
						case 'float':
							type = z.number();
							break;
						case 'bigInteger':
							type = z.bigint();
							break;
						case 'date':
							type = z.iso.date();
							break;
						case 'time':
							type = z.iso.time();
							break;
						case 'dateTime':
						case 'timestamp':
							type = z.iso.datetime();
							break;
						case 'json':
							type = z.json();
							break;
						case 'binary':
						case 'uuid':
							type = z.uuidv4();
							break;
						case 'geometry':
						case 'geometry.Point':
						case 'geometry.LineString':
						case 'geometry.Polygon':
						case 'geometry.MultiPoint':
						case 'geometry.MultiLineString':
						case 'geometry.MultiPolygon':
							type = z.json();
							break;
						// case 'alias':
						case 'unknown':
						default:
							type = z.unknown();
					}

					// `choices` are the options for dropdowns and other selection interfaces
					if (field.meta?.options?.choices) {
						type = z.enum(
							field.meta.options.choices.map(
								// Only return the value of the choice to reduce size and potential for confusion.
								(choice: { value: string }) => choice.value,
							),
						);
					}

					if (field.meta?.note) {
						type = type.describe(field.meta.note);
					}

					acc[field.field] = type.optional();

					return acc;
				},
				{} as { [field: string]: ZodType },
			),
		),
	);

	return { inputSchema };
};
