import { i18n } from '@/lang';

export type ValidationNode = {
	type: 'and' | 'or' | 'rule';
	children?: ValidationNode[];
	field?: string;
	operator?: string;
	value?: any;
};

export function parseValidationStructure(validation: any): ValidationNode | null {
	if (validation == null || typeof validation !== 'object' || Array.isArray(validation)) return null;

	if (validation._and && Array.isArray(validation._and)) {
		const children = validation._and
			.map((child: any) => parseValidationStructure(child))
			.filter(Boolean) as ValidationNode[];

		return {
			type: 'and',
			children,
		};
	}

	if (validation._or && Array.isArray(validation._or)) {
		const children = validation._or
			.map((child: any) => parseValidationStructure(child))
			.filter(Boolean) as ValidationNode[];

		return {
			type: 'or',
			children,
		};
	}

	const fieldKeys = Object.keys(validation).filter((key) => !key.startsWith('_'));

	if (fieldKeys.length > 0) {
		const field = fieldKeys[0]!;
		const fieldRules = validation[field];
		if (!fieldRules || typeof fieldRules !== 'object') return null;
		const operators = Object.keys(fieldRules).filter((key) => key.startsWith('_'));

		if (operators.length > 0) {
			const operator = operators[0];
			if (!operator) return null;
			const operatorName = operator.substring(1);
			const ruleValue = fieldRules[operator];

			return {
				type: 'rule',
				field,
				operator: operatorName,
				value: ruleValue,
			};
		}
	}

	return null;
}

export function formatValidationRule(node: ValidationNode, t: (key: string, params?: any) => string): string {
	if (node.type === 'rule') {
		const operator = node.operator ?? '';
		const key = `validationError.${operator}`;

		const quote = (v: unknown) => (typeof v === 'string' ? `"${v}"` : String(v));

		const params: Record<string, any> = {};
		const value = node.value;

		if (
			operator === 'contains' ||
			operator === 'ncontains' ||
			operator === 'starts_with' ||
			operator === 'istarts_with' ||
			operator === 'nstarts_with' ||
			operator === 'nistarts_with' ||
			operator === 'ends_with' ||
			operator === 'iends_with' ||
			operator === 'nends_with' ||
			operator === 'niends_with'
		) {
			params.substring = quote(value);
		} else if (
			operator === 'eq' ||
			operator === 'gt' ||
			operator === 'gte' ||
			operator === 'lt' ||
			operator === 'lte'
		) {
			params.valid = quote(value);
		} else if (operator === 'neq' || operator === 'nin') {
			params.invalid = Array.isArray(value) ? value.map(quote).join(', ') : quote(value);
		} else if (operator === 'in') {
			params.valid = Array.isArray(value) ? value.map(quote).join(', ') : quote(value);
		}

		const translationExists = i18n.global.te(key);

		if (!translationExists) {
			return t('validation_value_is_invalid');
		}

		return t(key, params);
	}

	return '';
}

export function hasNestedGroups(validation: any): boolean {
	if (!validation || typeof validation !== 'object') return false;

	if (validation._and && Array.isArray(validation._and)) {
		if (validation._and.length > 1) return true;
		return validation._and.some((child: any) => {
			if (!child || typeof child !== 'object') return false;
			return child._and || child._or || hasNestedGroups(child);
		});
	}

	if (validation._or && Array.isArray(validation._or)) {
		if (validation._or.length > 1) return true;
		return validation._or.some((child: any) => {
			if (!child || typeof child !== 'object') return false;
			return child._and || child._or || hasNestedGroups(child);
		});
	}

	return false;
}
