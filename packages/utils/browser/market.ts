import { ref, watch } from 'vue'
import type { Ref } from 'vue'

export const formatNumber = new Intl.NumberFormat('en-US', {
	notation: 'compact',
}).format

export const formatSize = new Intl.NumberFormat('en-US', {
	notation: 'compact',
	style: 'unit',
	unit: 'byte',
	unitDisplay: 'narrow',
}).format

export function formatTitle(title: string) {
	const name = /^(?:directus-extension-(\S*?$)|@\S*?\/directus-extension-(\S*?$))/.exec(title)
	if (name === null) return title

	return (name[1] ?? name[2] ?? '').split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

export function formatDate(date: string) {
	const formatter = new Intl.RelativeTimeFormat('en-US', {
		numeric: 'always',
		style: 'short',
	})

	const dateObj = new Date(date)
	const now = new Date()
	const diff = now.getTime() - dateObj.getTime()
	const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24))
	const diffWeeks = Math.floor(diffDays / 7)
	const diffMoths = Math.floor(diffDays / 30)
	const diffYears = Math.floor(diffDays / 365)

	let text

	if (diffYears > 0) text = formatter.format(-diffYears, 'years')
	if (diffMoths > 0) text = formatter.format(-diffMoths, 'months')
	if (diffWeeks > 0) text = formatter.format(-diffWeeks, 'weeks')
	else text = formatter.format(-diffDays, 'days')

	return text.split(' ').slice(0, -1).join(' ')
}

export function useSize(
	target: Ref
) {
	const width = ref(0)
	const height = ref(0)

	const observer = new ResizeObserver((entries) => {
		const rect = entries[0]?.contentRect
		width.value = rect?.width ?? 0
		height.value = rect?.height ?? 0
	})

	watch(target, (el) => {
		if (el) {
			observer.observe(el)
		}
	}, { immediate: true })

	return {
		width,
		height,
	}
}
