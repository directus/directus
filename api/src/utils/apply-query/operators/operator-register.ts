import { Knex } from 'knex';
import { Helpers } from '../../../database/helpers';

export type OperatorRegisterContext = {
	query: Knex.QueryBuilder<any, any>;
	selectionRaw: any;
	compareValue: any;
	helpers: Helpers;
};

export type OperatorRegister = {
	operator: string;
	apply: (context: OperatorRegisterContext) => void;
};

export function registerOperator(register: OperatorRegister): OperatorRegister {
	return register;
}
