import { test, expect, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';

import {
	useRelationPermissionsM2A,
	useRelationPermissionsM2M,
	useRelationPermissionsM2O,
	useRelationPermissionsO2M,
} from '@/composables/use-relation-permissions';
import { RelationO2M } from './use-relation-o2m';
import { createTestingPinia } from '@pinia/testing';
import { merge } from 'lodash';
import { RelationM2O } from './use-relation-m2o';
import { RelationM2M } from './use-relation-m2m';
import { RelationM2A } from './use-relation-m2a';

const currentUser = {
	id: '9ff55949-9f97-4fa7-a09e-db81585d6c52',
	first_name: 'Admin',
	last_name: 'User',
	email: 'admin@example.com',
	role: {
		admin_access: true,
		app_access: true,
		id: 'd5c4be68-627f-4082-a8c2-5d1f3ebce2f2',
	},
};

const permissions = [
	{
		role: 'd5c4be68-627f-4082-a8c2-5d1f3ebce2f2',
		permissions: {},
		validation: null,
		presets: null,
		fields: ['*'],
		system: false,
		collection: 'a_b',
		action: 'update',
	},
	{
		role: 'd5c4be68-627f-4082-a8c2-5d1f3ebce2f2',
		permissions: {},
		validation: null,
		presets: null,
		fields: ['*'],
		system: false,
		collection: 'b',
		action: 'update',
	},
];

const relationO2M = ref({
	relation: {
		meta: {
			one_deselect_action: 'nullify',
		},
	},
	relatedCollection: {
		collection: 'b',
	},
	type: 'o2m',
} as RelationO2M);

test('useRelationPermissionsO2M as admin', () => {
	// eslint-disable-next-line vue/one-component-per-file
	const TestComponent = defineComponent({
		setup() {
			return useRelationPermissionsO2M(relationO2M);
		},
		render: () => h('div'),
	});

	const wrapper = mount(TestComponent, {
		global: {
			plugins: [
				createTestingPinia({
					initialState: {
						userStore: { currentUser },
						permissionsStore: { permissions },
					},
					createSpy: vi.fn,
				}),
			],
		},
	});

	expect(wrapper.vm.createAllowed).toBeTruthy();
	expect(wrapper.vm.updateAllowed).toBeTruthy();
	expect(wrapper.vm.deleteAllowed).toBeTruthy();
});

test('useRelationPermissionsO2M with no permissions', () => {
	// eslint-disable-next-line vue/one-component-per-file
	const TestComponent = defineComponent({
		setup() {
			return useRelationPermissionsO2M(relationO2M);
		},
		render: () => h('div'),
	});

	const wrapper = mount(TestComponent, {
		global: {
			plugins: [
				createTestingPinia({
					initialState: {
						userStore: { currentUser: merge({}, currentUser, { role: { admin_access: false } }) },
						permissionsStore: { permissions: [] },
					},
					createSpy: vi.fn,
				}),
			],
		},
	});

	expect(wrapper.vm.createAllowed).toBeFalsy();
	expect(wrapper.vm.updateAllowed).toBeFalsy();
	expect(wrapper.vm.deleteAllowed).toBeFalsy();
});

test('useRelationPermissionsO2M with update permissions', () => {
	// eslint-disable-next-line vue/one-component-per-file
	const TestComponent = defineComponent({
		setup() {
			return useRelationPermissionsO2M(relationO2M);
		},
		render: () => h('div'),
	});

	const wrapper = mount(TestComponent, {
		global: {
			plugins: [
				createTestingPinia({
					initialState: {
						userStore: { currentUser: merge({}, currentUser, { role: { admin_access: false } }) },
						permissionsStore: { permissions },
					},
					createSpy: vi.fn,
				}),
			],
		},
	});

	expect(wrapper.vm.createAllowed).toBeFalsy();
	expect(wrapper.vm.updateAllowed).toBeTruthy();
	expect(wrapper.vm.deleteAllowed).toBeTruthy();
});

const relationM2O = ref({
	relatedCollection: {
		collection: 'b',
	},
	type: 'm2o',
} as RelationM2O);

test('useRelationPermissionsM2O as admin', () => {
	// eslint-disable-next-line vue/one-component-per-file
	const TestComponent = defineComponent({
		setup() {
			return useRelationPermissionsM2O(relationM2O);
		},
		render: () => h('div'),
	});

	const wrapper = mount(TestComponent, {
		global: {
			plugins: [
				createTestingPinia({
					initialState: {
						userStore: { currentUser },
						permissionsStore: { permissions },
					},
					createSpy: vi.fn,
				}),
			],
		},
	});

	expect(wrapper.vm.createAllowed).toBeTruthy();
	expect(wrapper.vm.updateAllowed).toBeTruthy();
});

test('useRelationPermissionsM2O with no permissions', () => {
	// eslint-disable-next-line vue/one-component-per-file
	const TestComponent = defineComponent({
		setup() {
			return useRelationPermissionsM2O(relationM2O);
		},
		render: () => h('div'),
	});

	const wrapper = mount(TestComponent, {
		global: {
			plugins: [
				createTestingPinia({
					initialState: {
						userStore: { currentUser: merge({}, currentUser, { role: { admin_access: false } }) },
						permissionsStore: { permissions: [] },
					},
					createSpy: vi.fn,
				}),
			],
		},
	});

	expect(wrapper.vm.createAllowed).toBeFalsy();
	expect(wrapper.vm.updateAllowed).toBeFalsy();
});

test('useRelationPermissionsM2O with update permissions', () => {
	// eslint-disable-next-line vue/one-component-per-file
	const TestComponent = defineComponent({
		setup() {
			return useRelationPermissionsM2O(relationM2O);
		},
		render: () => h('div'),
	});

	const wrapper = mount(TestComponent, {
		global: {
			plugins: [
				createTestingPinia({
					initialState: {
						userStore: { currentUser: merge({}, currentUser, { role: { admin_access: false } }) },
						permissionsStore: { permissions },
					},
					createSpy: vi.fn,
				}),
			],
		},
	});

	expect(wrapper.vm.createAllowed).toBeFalsy();
	expect(wrapper.vm.updateAllowed).toBeTruthy();
});

const relationM2M = ref({
	junctionCollection: {
		collection: 'a_b',
	},
	relatedCollection: {
		collection: 'b',
	},
	junction: {
		meta: {
			one_deselect_action: 'nullify',
		},
	},
} as RelationM2M);

test('useRelationPermissionsM2M as admin', () => {
	// eslint-disable-next-line vue/one-component-per-file
	const TestComponent = defineComponent({
		setup() {
			return useRelationPermissionsM2M(relationM2M);
		},
		render: () => h('div'),
	});

	const wrapper = mount(TestComponent, {
		global: {
			plugins: [
				createTestingPinia({
					initialState: {
						userStore: { currentUser },
						permissionsStore: { permissions },
					},
					createSpy: vi.fn,
				}),
			],
		},
	});

	expect(wrapper.vm.createAllowed).toBeTruthy();
	expect(wrapper.vm.updateAllowed).toBeTruthy();
	expect(wrapper.vm.deleteAllowed).toBeTruthy();
	expect(wrapper.vm.selectAllowed).toBeTruthy();
});

test('useRelationPermissionsM2M with no permissions', () => {
	// eslint-disable-next-line vue/one-component-per-file
	const TestComponent = defineComponent({
		setup() {
			return useRelationPermissionsM2M(relationM2M);
		},
		render: () => h('div'),
	});

	const wrapper = mount(TestComponent, {
		global: {
			plugins: [
				createTestingPinia({
					initialState: {
						userStore: { currentUser: merge({}, currentUser, { role: { admin_access: false } }) },
						permissionsStore: { permissions: [] },
					},
					createSpy: vi.fn,
				}),
			],
		},
	});

	expect(wrapper.vm.createAllowed).toBeFalsy();
	expect(wrapper.vm.updateAllowed).toBeFalsy();
	expect(wrapper.vm.deleteAllowed).toBeFalsy();
	expect(wrapper.vm.selectAllowed).toBeFalsy();
});

test('useRelationPermissionsM2M with update permissions', () => {
	// eslint-disable-next-line vue/one-component-per-file
	const TestComponent = defineComponent({
		setup() {
			return useRelationPermissionsM2M(relationM2M);
		},
		render: () => h('div'),
	});

	const wrapper = mount(TestComponent, {
		global: {
			plugins: [
				createTestingPinia({
					initialState: {
						userStore: { currentUser: merge({}, currentUser, { role: { admin_access: false } }) },
						permissionsStore: { permissions },
					},
					createSpy: vi.fn,
				}),
			],
		},
	});

	expect(wrapper.vm.createAllowed).toBeFalsy();
	expect(wrapper.vm.updateAllowed).toBeTruthy();
	expect(wrapper.vm.deleteAllowed).toBeTruthy();
	expect(wrapper.vm.selectAllowed).toBeFalsy();
});

const relationM2A = ref({
	junctionCollection: {
		collection: 'a_b',
	},
	allowedCollections: [{ collection: 'a' }, { collection: 'b' }],
	junction: {
		meta: {
			one_deselect_action: 'nullify',
		},
	},
} as RelationM2A);

test('useRelationPermissionsM2A as admin', () => {
	// eslint-disable-next-line vue/one-component-per-file
	const TestComponent = defineComponent({
		setup() {
			return useRelationPermissionsM2A(relationM2A);
		},
		render: () => h('div'),
	});

	const wrapper = mount(TestComponent, {
		global: {
			plugins: [
				createTestingPinia({
					initialState: {
						userStore: { currentUser },
						permissionsStore: { permissions },
					},
					createSpy: vi.fn,
				}),
			],
		},
	});

	expect(wrapper.vm.createAllowed).toEqual({ a: true, b: true });
	expect(wrapper.vm.updateAllowed).toEqual({ a: true, b: true });
	expect(wrapper.vm.deleteAllowed).toEqual({ a: true, b: true });
	expect(wrapper.vm.selectAllowed).toBeTruthy();
});

test('useRelationPermissionsM2A with no permissions', () => {
	// eslint-disable-next-line vue/one-component-per-file
	const TestComponent = defineComponent({
		setup() {
			return useRelationPermissionsM2A(relationM2A);
		},
		render: () => h('div'),
	});

	const wrapper = mount(TestComponent, {
		global: {
			plugins: [
				createTestingPinia({
					initialState: {
						userStore: { currentUser: merge({}, currentUser, { role: { admin_access: false } }) },
						permissionsStore: { permissions: [] },
					},
					createSpy: vi.fn,
				}),
			],
		},
	});

	expect(wrapper.vm.createAllowed).toEqual({ a: false, b: false });
	expect(wrapper.vm.updateAllowed).toEqual({ a: false, b: false });
	expect(wrapper.vm.deleteAllowed).toEqual({ a: false, b: false });
	expect(wrapper.vm.selectAllowed).toBeFalsy();
});

test('useRelationPermissionsM2A with update permissions', () => {
	// eslint-disable-next-line vue/one-component-per-file
	const TestComponent = defineComponent({
		setup() {
			return useRelationPermissionsM2A(relationM2A);
		},
		render: () => h('div'),
	});

	const wrapper = mount(TestComponent, {
		global: {
			plugins: [
				createTestingPinia({
					initialState: {
						userStore: { currentUser: merge({}, currentUser, { role: { admin_access: false } }) },
						permissionsStore: { permissions },
					},
					createSpy: vi.fn,
				}),
			],
		},
	});

	expect(wrapper.vm.createAllowed).toEqual({ a: false, b: false });
	expect(wrapper.vm.updateAllowed).toEqual({ a: false, b: true });
	expect(wrapper.vm.deleteAllowed).toEqual({ a: false, b: true });
	expect(wrapper.vm.selectAllowed).toBeFalsy();
});
