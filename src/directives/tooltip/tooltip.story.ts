import Vue from 'vue';
import VButton from '../../components/v-button';
import VIcon from '../../components/v-icon';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';

Vue.component('v-button', VButton);
Vue.component('v-icon', VIcon);

export default {
	title: 'Directives / Tooltip',
	decorators: [withPadding],
	parameters: {
		notes: markdown,
	},
};

export const withText = () => ({
	template: `
		<div style="display: flex; justify-content: space-around; flex-direction: column; align-items: center">
			<div>
				<v-button style="width: 150px; margin: 30px" v-tooltip.bottom.start="'Default Tooltip'">Bottom start</v-button>
				<v-button style="width: 150px; margin: 30px" v-tooltip.bottom="'Default Tooltip'">Bottom</v-button>
				<v-button style="width: 150px; margin: 30px" v-tooltip.bottom.end="'Default Tooltip'">Bottom end</v-button>
			</div>
			<div>
				<v-button style="width: 150px; margin: 30px" v-tooltip.left.start="'Default Tooltip'">Left start</v-button>
				<v-button style="width: 150px; margin: 30px" v-tooltip.left="'Default Tooltip'">Left</v-button>
				<v-button style="width: 150px; margin: 30px" v-tooltip.left.end="'Default Tooltip'">Left end</v-button>
			</div>
			<div>
				<v-button style="width: 150px; margin: 30px" v-tooltip.right.start="'Default Tooltip'">Right start</v-button>
				<v-button style="width: 150px; margin: 30px" v-tooltip.right="'Default Tooltip'">Right</v-button>
				<v-button style="width: 150px; margin: 30px" v-tooltip.right.end="'Default Tooltip'">Right end</v-button>
			</div>
			<div>
				<v-button style="width: 150px; margin: 30px" v-tooltip.start="'Default Tooltip'">Top start</v-button>
				<v-button style="width: 150px; margin: 30px" v-tooltip="'Default Tooltip'">Top</v-button>
				<v-button style="width: 150px; margin: 30px" v-tooltip.end="'Default Tooltip'">Top end</v-button>
			</div>
			<v-button style="width: 150px; margin: 30px" v-tooltip.instant="'Tooltip'">Instant Tooltip</v-button>
			<v-button style="width: 150px; margin: 30px" v-tooltip.inverted="'Tooltip'">Inverted Tooltip</v-button>
            <v-icon style="margin: 30px" v-tooltip.top="'Goto home menu'" name="home" />
            <v-icon style="margin: 30px" v-tooltip.bottom="'This is a really long text which wont fit into a single line!'" name="info" />
            <v-icon style="margin: 30px" v-tooltip.right="'This is a really long text which wont fit into a single line!'" name="info" />
        </div>
	`,
});
