// rimraf ./dist && pnpm --filter directus deploy --prod dist
import { rimraf } from 'rimraf';
import { join } from 'path';
import { spawn } from 'child_process';
import { argv } from 'process';
import blessed from 'blessed';
import { directusConfig } from './env';

const distFolder = join(import.meta.dirname, '..', '..', '..', 'dist');

// Rebuild directus
if (argv.some((arg) => arg === '--rebuild')) {
	console.log('Rebuilding');
	// Delete workspace/dist
	await rimraf(distFolder);

	const build = spawn(
		/^win/.test(process.platform) ? 'pnpm.cmd' : 'pnpm',
		['--filter', 'directus', 'deploy', '--prod', distFolder],
		{
			cwd: join(import.meta.dirname, '..', '..', '..'),
			shell: true,
		},
	);

	build.stdout.on('data', (data) => {
		console.log(String(data));
	});

	build.stderr.on('data', (data) => {
		console.error(String(data));
	});

	await new Promise((resolve) => build.on('close', resolve));
}

const screen = blessed.screen({
	smartCSR: true,
});

screen.title = 'Load Testing';

const box1 = blessed.text({
	label: 'Directus',
	top: 0,
	left: 0,
	width: '40%',
	height: '100%',
	content: '',
	tags: true,
	vi: true,
	border: {
		type: 'line',
	},
	keys: true,
	mouse: true,
	scrollable: true,
	scrollbar: {
		ch: ' ',
		bg: 'white',
	},
});

const box2 = blessed.text({
	label: 'K6 Load Testing',
	top: 0,
	right: 0,
	width: '60%',
	height: '100%',
	content: '',
	tags: true,
	border: {
		type: 'line',
	},
	style: {
		fg: 'white',
		border: {
			fg: '#f0f0f0',
		},
	},
	keys: true,
	mouse: true,
	scrollable: true,
	scrollbar: {
		ch: ' ',
		bg: 'white',
	},
});

// Append our box to the screen.
screen.append(box1);
screen.append(box2);

screen.render();

screen.key(['escape', 'q', 'C-c'], function (ch, key) {
	return process.exit(0);
});

const api = spawn('node', [join(distFolder, 'cli.js'), 'start'], {
	env: directusConfig,
});

api.stderr.on('data', (data) => {
	console.error(String(data));
});

await new Promise((resolve, reject) => {
	api.stdout.on('data', (data) => {
		box1.setContent(box1.getContent() + String(data));
		box1.scrollTo(box1.getScrollHeight());
		screen.render();

		if (String(data).includes('Server started at http://0.0.0.0:8055')) resolve(null);
	});

	// In case the api takes too long to start
	setTimeout(reject, 10000);
});

const k6 = spawn('k6', ['run', join(import.meta.dirname, '..', 'http', 'version.ts')]);

let result: string | undefined = undefined;

k6.stdout.on('data', (data) => {
	box2.setContent(box2.getContent() + String(data));
	box2.scrollTo(box2.getScrollHeight());
	screen.render();

	if (String(data).includes('TOTAL RESULTS')) {
		result = '';
	}

	if (result) {
		result += String(data);
	}
});

k6.stderr.on('data', (data) => {
	console.error(String(data));
});

await new Promise((resolve) => k6.on('close', resolve));

box2.width = '100%';
box2.setLabel('Results');

screen.remove(box1);
screen.render();

api.kill();
