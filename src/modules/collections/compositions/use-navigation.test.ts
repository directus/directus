import mountComposition from '../../../../.jest/mount-composition';
import { useProjectsStore } from '@/stores/projects';
import { useCollectionsStore } from '@/stores/collections';
import useNavigation from './use-navigation';

describe('Modules / Collections / Compositions / useNavigation', () => {
	afterEach(() => {
		useProjectsStore().reset();
		useCollectionsStore().reset();
	});

	it('Converts the visible collections to navigation links', () => {
		const projectsStore = useProjectsStore();
		const collectionsStore = useCollectionsStore();

		projectsStore.state.currentProjectKey = 'my-project';

		collectionsStore.state.collections = [
			{
				collection: 'test',
				name: 'Test',
				icon: 'box',
				note: null,
				hidden: false,
				managed: true,
				single: false,
				translation: null
			}
		];

		let navItems: any;

		mountComposition(() => {
			navItems = useNavigation().navItems;
		});

		expect(navItems).toEqual([
			{
				collection: 'test',
				name: 'Test',
				to: '/my-project/collections/test',
				icon: 'box'
			}
		]);
	});

	it('Sorts the collections alphabetically by name', () => {
		const projectsStore = useProjectsStore();
		const collectionsStore = useCollectionsStore();

		projectsStore.state.currentProjectKey = 'my-project';

		collectionsStore.state.collections = [
			{
				collection: 'test',
				name: 'B Test',
				icon: 'box',
				note: null,
				hidden: false,
				managed: true,
				single: false,
				translation: null
			},
			{
				collection: 'test2',
				name: 'A Test',
				icon: 'box',
				note: null,
				hidden: false,
				managed: true,
				single: false,
				translation: null
			},
			{
				collection: 'test3',
				name: 'C Test',
				icon: 'box',
				note: null,
				hidden: false,
				managed: true,
				single: false,
				translation: null
			}
		];

		let navItems: any;

		mountComposition(() => {
			navItems = useNavigation().navItems;
		});

		expect(navItems[0].name).toBe('A Test');
		expect(navItems[1].name).toBe('B Test');
		expect(navItems[2].name).toBe('C Test');
	});
});
