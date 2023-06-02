import { describe, test, expect } from "vitest";
import {getSelects} from './statement.js'
import type { AbstractQuery, AbstractQueryFieldNodePrimitive, AbstractQueryFieldNode } from '@directus/data/types';


test('get all selects', ()=> {

	const nodes: AbstractQueryFieldNode = [
		{
			type: 'primitive',
			field: 'attribute_xy',
		},
		{
			type: 'primitive',
			field: 'attribute_zz',
		},
		{
			type: 'func',
			fn: 'year',
			targetNode: 'attribute_f',
		},
	];

	const res = getSelects(nodes);

	const expected = ['attribute_xy', 'attribute_zz', 'attribute_f'];

	expect(res).toStrictEqual(expected);
});


describe('relations', ()=> {


	test('m2o', () => {

		const nodes: AbstractQueryFieldNodeRelatedManyToOne = [
			{
				type: 'primitive',
				field: 'attribute_xy',
			},
			{
				type: 'primitive',
				field: 'attribute_zz',
			},
			{
				type: 'func',
				fn: 'year',
				targetNode: 'attribute_f',
			},
		];

		const res = getSelects(nodes);

		const expected = ['attribute_xy', 'attribute_zz', 'attribute_f'];

		expect(res).toStrictEqual(expected);
	});

});

