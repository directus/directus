import { groupBy, mapValues, orderBy } from 'lodash-es';
import type { AccessRow } from '../types.js';

export function orderPoliciesByPriority(policies: AccessRow[], roles: string[]) {
	// The order of all policies should be:
	//
	// - Public
	// - Role, sorted by tree (eg grandparent -> parent -> current), followed by `sort`
	// - User, sorted by `sort`
	//
	// where the latter two are optional in public requests

	// To sort the policies attached to roles, we'll start by..
	let rolePolicies = policies.filter(({ user }) => user === null);

	// grouping them by their roles, after which..
	const rolePoliciesGrouped = groupBy(rolePolicies, 'role');

	// we can sort each individual policy role group by it's configured sort value, after which..
	const rolePoliciesGroupedSorted = mapValues(rolePoliciesGrouped, (value) => {
		return orderBy(value, 'sort');
	});

	// we will reconstruct the policies list in order of public -> outer parent -> parent -> current
	rolePolicies = [
		...(rolePoliciesGroupedSorted['null'] ?? []),
		...roles.map((role) => rolePoliciesGroupedSorted[role] ?? []).flat(),
	];

	// User policies are nice and easy to sort as there's no parent "user" grouping like with roles.
	const userPolicies = orderBy(
		policies.filter(({ user }) => user !== null),
		'sort',
	);

	// Policies is now in order of priority (least to most)
	return [...rolePolicies, ...userPolicies];
}
