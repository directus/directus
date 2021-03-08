import node from './targets/node';
import browser from './targets/browser';

function withTarget(target) {
	if (Array.isArray(target)) {
		return target;
	}
	return [target];
}

function withTargets(...targets) {
	return targets.map((target) => withTarget(target)).reduce((prev, curr) => [...prev, ...curr], []);
}

export default withTargets(node, browser);
