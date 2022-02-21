import betweenOperator from './between.operator';
import containsOperator from './contains.operator';
import endsWithOperator from './ends-with.operator';
import equalsOperator from './equals.operator';
import greatherThanEqualsOperator from './greather-than-equals.operator';
import greatherThanOperator from './greather-than.operator';
import inOperator from './in.operator';
import insensitiveContainsOperator from './insensitive-contains.operator';
import insensitiveEndsWithOperator from './insensitive-ends-with.operator';
import insensitiveEqualsOperator from './insensitive-equals.operator';
import insensitiveNotContainsOperator from './insensitive-not-contains.operator';
import insensitiveNotEndsWithOperator from './insensitive-not-ends-with.operator';
import insensitiveNotEqualsOperator from './insensitive-not-equals.operator';
import insensitiveNotStartsWithOperator from './insensitive-not-starts-with.operator';
import insensitiveStartsWithOperator from './insensitive-starts-with.operator';
import intersectsBboxOperator from './intersects-bbox.operator';
import intersectsOperator from './intersects.operator';
import isEmptyOperator from './is-empty.operator';
import isNotEmptyOperator from './is-not-empty.operator';
import isNotNullOperator from './is-not-null.operator';
import isNullOperator from './is-null.operator';
import lessThanEqualsOperator from './less-than-equals.operator';
import lessThanOperator from './less-than.operator';
import notBetweenOperator from './not-between.operator';
import notContainsOperator from './not-contains.operator';
import notEndsWithOperator from './not-ends-with.operator';
import notEqualsOperator from './not-equals.operator';
import notInOperator from './not-in.operator';
import notIntersectsBboxOperator from './not-intersects-bbox.operator';
import notIntersectsOperator from './not-intersects.operator';
import notStartsWithOperator from './not-starts-with.operator';
import { OperatorRegister } from './operator-register';
import startsWithOperator from './starts-with.operator';

const operators = [
	isNullOperator,
	isNotNullOperator,
	isEmptyOperator,
	isNotEmptyOperator,
	equalsOperator,
	notEqualsOperator,
	containsOperator,
	notContainsOperator,
	startsWithOperator,
	notStartsWithOperator,
	endsWithOperator,
	notEndsWithOperator,
	greatherThanOperator,
	greatherThanEqualsOperator,
	lessThanOperator,
	lessThanEqualsOperator,
	inOperator,
	notInOperator,
	betweenOperator,
	notBetweenOperator,
	intersectsOperator,
	notIntersectsOperator,
	intersectsBboxOperator,
	notIntersectsBboxOperator,
	insensitiveContainsOperator,
	insensitiveNotContainsOperator,
	insensitiveEqualsOperator,
	insensitiveNotEqualsOperator,
	insensitiveStartsWithOperator,
	insensitiveNotStartsWithOperator,
	insensitiveEndsWithOperator,
	insensitiveNotEndsWithOperator,
];

export default operators.reduce((a, b) => ({ ...a, [b.operator]: b }), {}) as Record<string, OperatorRegister>;
