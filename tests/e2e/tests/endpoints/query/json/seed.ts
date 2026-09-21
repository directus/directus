import type { DirectusClient, RestClient } from '@directus/sdk';
import { createItems } from '@directus/sdk';
import type { Collections } from '@utils/use-snapshot.js';
import type { Schema } from './schema.d.ts';

/**
 * Shared fixture for the `_json` filter and `json()` function tests.
 *
 * departments  Tech Department (technology/100), Consumer Department (consumer/50)
 * categories   Tech → Tech Dept, Sports → Consumer Dept, Home → Consumer Dept
 * products     Alpha → Tech, Beta → Sports, Gamma → Tech, Delta → Home, Epsilon → no category
 * suppliers    Supplier A (EU/1) supplies Alpha + Beta, Supplier B (US/2) supplies Beta + Gamma
 */
export async function seed(
	api: DirectusClient<Schema> & RestClient<Schema>,
	collections: Collections<Schema>,
): Promise<void> {
	const departments = await api.request(
		createItems(collections.departments, [
			{ name: 'Tech Department', metadata: { sector: 'technology', budget: 100 } },
			{ name: 'Consumer Department', metadata: { sector: 'consumer', budget: 50 } },
		] as any),
	);

	const department = byName(departments);

	const categories = await api.request(
		createItems(collections.categories, [
			{ name: 'Tech', metadata: { color: 'blue' }, department_id: department['Tech Department'] },
			{ name: 'Sports', metadata: { color: 'green' }, department_id: department['Consumer Department'] },
			{ name: 'Home', metadata: { color: 'red' }, department_id: department['Consumer Department'] },
		] as any),
	);

	const category = byName(categories);

	const products = await api.request(
		createItems(collections.products, [
			{
				name: 'Alpha',
				metadata: {
					color: 'red',
					brand: 'BrandX',
					level: 2,
					tags: ['electronics', 'sale'],
					settings: { theme: 'dark' },
				},
				data: [{ test: 'foo' }],
				category_id: category['Tech'],
			},
			{
				name: 'Beta',
				metadata: { color: 'blue', brand: 'BrandY', level: 5, tags: ['home', 'new'], settings: { theme: 'light' } },
				data: [{ test: 'bar' }],
				category_id: category['Sports'],
			},
			{
				name: 'Gamma',
				metadata: { color: 'green', brand: 'BrandX', level: 8, tags: ['outdoor'], settings: { theme: 'dark' } },
				data: [{ test: 'foo' }],
				category_id: category['Tech'],
			},
			{
				name: 'Delta',
				metadata: { color: 'yellow', brand: 'BrandZ', level: 3, tags: ['clearance'], settings: { theme: 'auto' } },
				data: [{}],
				category_id: category['Home'],
			},
			{ name: 'Epsilon', metadata: { color: 'black', tags: [] }, data: null, category_id: null },
		] as any),
	);

	const product = byName(products);

	const suppliers = await api.request(
		createItems(collections.suppliers, [
			{ name: 'Supplier A', metadata: { region: 'EU', tier: 1 } },
			{ name: 'Supplier B', metadata: { region: 'US', tier: 2 } },
		] as any),
	);

	const supplier = byName(suppliers);

	await api.request(
		createItems(collections.products_suppliers, [
			{ products_id: product['Alpha'], suppliers_id: supplier['Supplier A'] },
			{ products_id: product['Beta'], suppliers_id: supplier['Supplier A'] },
			{ products_id: product['Beta'], suppliers_id: supplier['Supplier B'] },
			{ products_id: product['Gamma'], suppliers_id: supplier['Supplier B'] },
		] as any),
	);
}

function byName(items: { id?: unknown; name?: unknown }[]): Record<string, unknown> {
	return Object.fromEntries(items.map((item) => [String(item.name), item.id]));
}

/**
 * Fixture for the `json()` function tests, with deeper nesting than the filter fixture needs.
 *
 * Sorted by name:  Alpha < Beta < Gamma < Zeta
 * Sorted by color: black (Zeta) < blue (Beta) < green (Gamma) < red (Alpha)
 */
export async function seedFunctionProducts(
	api: DirectusClient<Schema> & RestClient<Schema>,
	collections: Collections<Schema>,
): Promise<void> {
	await api.request(
		createItems(collections.products, [
			{
				name: 'Alpha',
				metadata: {
					color: 'red',
					brand: 'BrandX',
					dimensions: { width: 10, height: 20, depth: 5 },
					tags: ['electronics', 'premium', 'new'],
					variants: [
						{ sku: 'SKU-001', price: 99.99, available: true },
						{ sku: 'SKU-002', price: 149.99, available: false },
					],
					specifications: { weight: 2.5, material: 'aluminum' },
				},
				data: { notifications: { email: true, sms: false }, theme: 'dark' },
			},
			{
				name: 'Beta',
				metadata: {
					color: 'blue',
					brand: 'BrandY',
					dimensions: { width: 15, height: 25, depth: 8 },
					tags: ['home', 'sale'],
					variants: [{ sku: 'SKU-003', price: 79.99, available: true }],
					specifications: { weight: 3.2, material: 'plastic' },
				},
				data: { notifications: { email: false, sms: true }, theme: 'light' },
			},
			{
				// Gamma carries an empty variants array
				name: 'Gamma',
				metadata: {
					color: 'green',
					brand: 'BrandX',
					dimensions: { width: 12, height: 18, depth: 6 },
					tags: ['outdoor'],
					variants: [],
					specifications: { weight: 1.8, material: 'steel' },
				},
				data: { notifications: { email: true, sms: true }, theme: 'auto' },
			},
			{
				// Zeta has no brand, dimensions or specifications, and a null second json column
				name: 'Zeta',
				metadata: { color: 'black', tags: [], variants: [{ sku: 'SKU-007' }] },
				data: null,
			},
		] as any),
	);
}

/**
 * Fixture for the relational `json()` tests.
 *
 * Shape A holds two circles, Shape B two squares, Shape C nothing.
 */
export async function seedShapes(
	api: DirectusClient<Schema> & RestClient<Schema>,
	collections: Collections<Schema>,
): Promise<(string | number)[]> {
	const shapes = await api.request(
		createItems(collections.shapes, [
			{
				name: 'Shape A',
				children: [
					{ collection: collections.circles, item: { name: 'Circle 1', metadata: { color: 'red' } } },
					{ collection: collections.circles, item: { name: 'Circle 2', metadata: { color: 'blue' } } },
				],
			},
			{
				name: 'Shape B',
				children: [
					{ collection: collections.squares, item: { name: 'Square 1', metadata: { color: 'orange' } } },
					{ collection: collections.squares, item: { name: 'Square 2', metadata: { color: 'pink' } } },
				],
			},
			{ name: 'Shape C' },
		] as any),
	);

	return shapes.map((shape: any) => shape.id);
}
