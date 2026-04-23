import { z } from 'zod';
import type { FormField } from '@@/shared/types/schema';

export const buildZodSchema = (fields: FormField[]) => {
	const schema: Record<string, z.ZodTypeAny> = {};

	fields.forEach((field) => {
		let fieldSchema: z.ZodTypeAny;

		switch (field.type) {
			case 'checkbox':
				fieldSchema = z.boolean().default(false);
				break;

			case 'checkbox_group':
				fieldSchema = z.array(z.string()).default([]);
				break;

			case 'radio':
				fieldSchema = z.string();
				break;

			case 'file':
				if (field.required) {
					fieldSchema = z.instanceof(File, {
						message: `${field.label || field.name} is required`,
					});
				} else {
					fieldSchema = z
						.instanceof(File, {
							message: `${field.label || field.name} must be a valid file if provided`,
						})
						.or(z.undefined());
				}

				break;

			default:
				fieldSchema = z.string();
				break;
		}

		if (field.validation) {
			const rules = field.validation.split('|');
			rules.forEach((rule) => {
				const [ruleName, ruleValue] = rule.split(':');
				const normalizedRule = ruleName?.toLowerCase();

				if (fieldSchema instanceof z.ZodString) {
					switch (normalizedRule) {
						case 'email':
							fieldSchema = fieldSchema.email(`${field.label || field.name} must be a valid email`);
							break;

						case 'url':
							fieldSchema = fieldSchema.url(`${field.label || field.name} must be a valid URL`);
							break;

						case 'min': {
							const min = ruleValue ? parseInt(ruleValue, 10) : 0;
							fieldSchema = fieldSchema.min(min, `${field.label || field.name} must be at least ${min} characters`);
							break;
						}

						case 'max': {
							const max = ruleValue ? parseInt(ruleValue, 10) : Infinity;
							fieldSchema = fieldSchema.max(max, `${field.label || field.name} must be at most ${max} characters`);
							break;
						}

						case 'length': {
							const length = ruleValue ? parseInt(ruleValue, 10) : 0;
							fieldSchema = fieldSchema.length(
								length,
								`${field.label || field.name} must be exactly ${length} characters`,
							);
							break;
						}

						default:
							fieldSchema = fieldSchema.refine(() => false, {
								message: `Unknown validation rule: ${ruleName}`,
							});
					}
				}
			});
		}

		if (field.required) {
			if (fieldSchema instanceof z.ZodString) {
				fieldSchema = fieldSchema.nonempty(`${field.label || field.name} is required`);
			}
		} else {
			// Allow empty strings or undefined for optional fields
			fieldSchema = fieldSchema.or(z.literal('')).or(z.undefined());
		}

		if (field.name) {
			schema[field.name] = fieldSchema;
		}
	});

	return z.object(schema);
};
