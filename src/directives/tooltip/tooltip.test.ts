import { createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import VButton from '../../components/v-button';
import Tooltip, {
	getTooltip,
	animateIn,
	animateOut,
	onLeaveTooltip,
	updateTooltip,
	onEnterTooltip
} from './tooltip';

jest.useFakeTimers();

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-button', VButton);
localVue.directive('tooltip', Tooltip);

describe('Tooltip', () => {
	afterEach(() => {
		document.getElementsByTagName('html')[0].innerHTML = '';
	});

	describe('onEnterTooltip', () => {
		it('Instant does not wait to show the tooltip', () => {
			const div = document.createElement('div');
			const tooltip = document.createElement('div');
			tooltip.id = 'tooltip';
			document.body.appendChild(tooltip);

			onEnterTooltip(div, {
				name: 'tooltip',
				modifiers: {
					top: true,
					instant: true
				}
			});

			expect(tooltip.className).toBe('visible enter top');
		});

		it('Default waits 600ms to show tooltip', () => {
			const div = document.createElement('div');
			const tooltip = document.createElement('div');
			tooltip.id = 'tooltip';
			document.body.appendChild(tooltip);

			onEnterTooltip(div, {
				name: 'tooltip',
				modifiers: {
					top: true,
					instant: false
				}
			});

			expect(tooltip.className).toBe('');
			jest.advanceTimersByTime(650);
			expect(tooltip.className).toBe('visible top enter-active');
		});
	});

	describe('updateTooltip', () => {
		describe('Styles and classes', () => {
			type Modifier = {
				right: boolean;
				bottom: boolean;
				left: boolean;
				start: boolean;
				end: boolean;
				inverted: boolean;
			};

			function testUpdateTooltip(modifiers: Modifier) {
				const div = document.createElement('div');
				const tooltip = document.createElement('div');
				updateTooltip(
					div,
					{
						name: 'tooltip',
						modifiers: modifiers
					},
					tooltip
				);
				return tooltip;
			}

			test('top (default)', () => {
				const tooltip = testUpdateTooltip({
					right: false,
					bottom: false,
					left: false,
					start: false,
					end: false,
					inverted: false
				});
				expect(tooltip.className).toBe('top');
				expect(tooltip.getAttribute('style')).toBe(
					'transform: translate(calc(0px - 50%), calc(-10px - 100%));'
				);
			});

			test('top start', () => {
				const tooltip = testUpdateTooltip({
					right: false,
					bottom: false,
					left: false,
					start: true,
					end: false,
					inverted: false
				});
				expect(tooltip.className).toBe('start top');
				expect(tooltip.getAttribute('style')).toBe(
					'transform: translate(calc(20px - 100%), calc(-10px - 100%));'
				);
			});

			test('top end', () => {
				const tooltip = testUpdateTooltip({
					right: false,
					bottom: false,
					left: false,
					start: false,
					end: true,
					inverted: false
				});
				expect(tooltip.className).toBe('end top');
				expect(tooltip.getAttribute('style')).toBe(
					'transform: translate(calc(-20px - 0%), calc(-10px - 100%));'
				);
			});

			test('right', () => {
				const tooltip = testUpdateTooltip({
					right: true,
					bottom: false,
					left: false,
					start: false,
					end: false,
					inverted: false
				});
				expect(tooltip.className).toBe('right');
				expect(tooltip.getAttribute('style')).toBe(
					'transform: translate(10px, calc(0px - 50%));'
				);
			});

			test('right start', () => {
				const tooltip = testUpdateTooltip({
					right: true,
					bottom: false,
					left: false,
					start: true,
					end: false,
					inverted: false
				});
				expect(tooltip.className).toBe('start right');
				expect(tooltip.getAttribute('style')).toBe(
					'transform: translate(10px, calc(20px - 100%));'
				);
			});

			test('right end', () => {
				const tooltip = testUpdateTooltip({
					right: true,
					bottom: false,
					left: false,
					start: false,
					end: true,
					inverted: false
				});
				expect(tooltip.className).toBe('end right');
				expect(tooltip.getAttribute('style')).toBe(
					'transform: translate(10px, calc(-20px - 0%));'
				);
			});

			test('bottom', () => {
				const tooltip = testUpdateTooltip({
					right: false,
					bottom: true,
					left: false,
					start: false,
					end: false,
					inverted: false
				});
				expect(tooltip.className).toBe('bottom');
				expect(tooltip.getAttribute('style')).toBe(
					'transform: translate(calc(0px - 50%), 10px);'
				);
			});

			test('bottom start', () => {
				const tooltip = testUpdateTooltip({
					right: false,
					bottom: true,
					left: false,
					start: true,
					end: false,
					inverted: false
				});
				expect(tooltip.className).toBe('start bottom');
				expect(tooltip.getAttribute('style')).toBe(
					'transform: translate(calc(20px - 100%), 10px);'
				);
			});

			test('bottom end', () => {
				const tooltip = testUpdateTooltip({
					right: false,
					bottom: true,
					left: false,
					start: false,
					end: true,
					inverted: false
				});
				expect(tooltip.className).toBe('end bottom');
				expect(tooltip.getAttribute('style')).toBe(
					'transform: translate(calc(-20px - 0%), 10px);'
				);
			});

			test('left', () => {
				const tooltip = testUpdateTooltip({
					right: false,
					bottom: false,
					left: true,
					start: false,
					end: false,
					inverted: false
				});
				expect(tooltip.className).toBe('left');
				expect(tooltip.getAttribute('style')).toBe(
					'transform: translate(calc(-10px - 100%), calc(0px - 50%));'
				);
			});

			test('left start', () => {
				const tooltip = testUpdateTooltip({
					right: false,
					bottom: false,
					left: true,
					start: true,
					end: false,
					inverted: false
				});
				expect(tooltip.className).toBe('start left');
				expect(tooltip.getAttribute('style')).toBe(
					'transform: translate(calc(-10px - 100%), calc(20px - 100%));'
				);
			});

			test('left end', () => {
				const tooltip = testUpdateTooltip({
					right: false,
					bottom: false,
					left: true,
					start: false,
					end: true,
					inverted: false
				});
				expect(tooltip.className).toBe('end left');
				expect(tooltip.getAttribute('style')).toBe(
					'transform: translate(calc(-10px - 100%), calc(-20px - 0%));'
				);
			});

			test('Inverted', () => {
				const tooltip = testUpdateTooltip({
					right: false,
					bottom: false,
					left: false,
					start: false,
					end: false,
					inverted: true
				});
				expect(tooltip.className).toBe('inverted top');
			});
		});
	});

	describe('onLeaveTooltip', () => {
		it('Clears the timeout', () => {
			onLeaveTooltip();
			expect(clearTimeout).toHaveBeenCalled();
		});
	});

	describe('animateIn / animateOut', () => {
		it('Adds the appropriate classes on entering', () => {
			const div = document.createElement('div');
			animateIn(div);

			expect(div.classList).toContain('enter');
			jest.advanceTimersByTime(5);
			expect(div.classList).toContain('enter-active');
			jest.advanceTimersByTime(225);
			expect(div.classList.contains('enter-active')).toBe(false);
		});

		it('Stops animating in when it already has enter / enter-active class', () => {
			const tooltip = document.createElement('div');

			animateIn(tooltip);
			tooltip.classList.remove('enter');

			jest.advanceTimersByTime(5);
			expect(tooltip.classList.contains('enter-active')).toBe(false);
			jest.advanceTimersByTime(225);
			expect(tooltip.classList.contains('enter-active')).toBe(false);
		});

		it('Adds the appropriate classes on leave', () => {
			const div = document.createElement('div');
			div.classList.add('visible');

			animateOut(div);

			expect(div.classList).toContain('leave');
			jest.advanceTimersByTime(5);
			expect(div.classList).toContain('leave-active');
			jest.advanceTimersByTime(225);
			expect(div.classList.contains('leave-active')).toBe(false);
		});

		it('Stops animating out when it does not have leave / leave-active class', () => {
			const tooltip = document.createElement('div');
			tooltip.classList.add('visible');

			animateOut(tooltip);
			tooltip.classList.remove('leave');

			jest.advanceTimersByTime(5);
			expect(tooltip.classList.contains('leave-active')).toBe(false);
			jest.advanceTimersByTime(225);
			expect(tooltip.classList.contains('visible')).toBe(true);
		});
	});

	describe('getTooltip', () => {
		it('Creates a new div element if tooltip does not exist yet', () => {
			const spy = jest.spyOn(document, 'createElement');
			getTooltip();
			expect(spy).toHaveBeenCalledWith('div');
		});

		it('Returns the existing div if found in dom', () => {
			const div = document.createElement('div');
			div.id = 'tooltip';
			div.setAttribute('test', 'true');
			document.body.appendChild(div);

			const returnedDiv = getTooltip();
			expect(returnedDiv.getAttribute('test')).toBe('true');
		});
	});
});
