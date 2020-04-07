import { useCollection } from './use-collection';
import Vue from 'vue';
import VueCompositionAPI, { ref } from '@vue/composition-api';
import useCollectionsStore from '@/stores/collections/';
import useFieldsStore from '@/stores/fields/';

describe('Compositions / useCollection', () => {
	let req: any = {};

	beforeAll(() => {
		Vue.use(VueCompositionAPI);
	});

	beforeEach(() => {
		req = {};
	});

	it('Gets the collection info from the collections store', () => {
		useCollectionsStore(req).state.collections = [
			{
				collection: 'files',
				test: true,
			},
			{
				collection: 'another-collection',
				test: false,
			},
		] as any;
		useFieldsStore(req).state.fields = [
			{
				collection: 'files',
				field: 'id',
				primary_key: true,
				test: true,
			},
			{
				collection: 'another-collection',
				field: 'id',
				primary_key: true,
				test: false,
			},
			{
				collection: 'files',
				field: 'title',
				primary_key: false,
				test: true,
			},
		] as any;

		const { info, fields, primaryKeyField } = useCollection(ref('files'));

		expect(info.value).toEqual({
			collection: 'files',
			test: true,
		});

		expect(fields.value).toEqual([
			{
				collection: 'files',
				field: 'id',
				primary_key: true,
				test: true,
			},
			{
				collection: 'files',
				field: 'title',
				primary_key: false,
				test: true,
			},
		]);

		expect(primaryKeyField.value).toEqual({
			collection: 'files',
			field: 'id',
			primary_key: true,
			test: true,
		});
	});
});
