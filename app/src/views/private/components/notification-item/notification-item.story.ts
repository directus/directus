import withPadding from '../../../../../.storybook/decorators/with-padding';
import { withKnobs, text, select, boolean } from '@storybook/addon-knobs';
import readme from './readme.md';
import { defineComponent } from '@vue/composition-api';
import { useNotificationsStore } from '@/stores/';
import NotificationItem from './notification-item.vue';

export default {
	title: 'Views / Private / Components / Notification Item',
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: readme,
	},
};

export const basic = () =>
	defineComponent({
		components: { NotificationItem },
		setup() {
			useNotificationsStore({});
		},
		template: `
			<div>
				<notification-item
					id="abc"
					type="info"
					title="This is a notification item"
					text="How much fun is that!"
					icon="box"
				/>

				<notification-item
					id="def"
					type="success"
					title="This is a notification item"
					text="How much fun is that!"
					icon="check"
				/>

				<notification-item
					id="ghi"
					type="warning"
					title="This is a notification item"
					text="This one is persistent!"
					icon="warning"
					persist
				/>

				<notification-item
					id="jkl"
					type="error"
					title="This is a notification item"
					text="How much fun is that!"
					icon="error"
					tail
				/>
			</div>
		`,
	});

export const interactive = () =>
	defineComponent({
		components: { NotificationItem },
		props: {
			title: {
				default: text('Title', 'This is a notification'),
			},
			text: {
				default: text('Body text', ''),
			},
			icon: {
				default: text('Icon', 'box'),
			},
			type: {
				default: select('Type', ['info', 'success', 'warning', 'error'], 'info'),
			},
			persist: {
				default: boolean('Persist', false),
			},
			dense: {
				default: boolean('Dense', false),
			},
			tail: {
				default: boolean('Tail', false),
			},
		},
		template: `
			<notification-item
				id="not"
				:type="type"
				:title="title"
				:text="text"
				:icon="icon"
				:persist="persist"
				:dense="dense"
				:tail="tail"
			/>
		`,
	});
