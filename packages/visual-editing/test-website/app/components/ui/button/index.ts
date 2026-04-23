import { cva, type VariantProps } from 'class-variance-authority';

export { default as Button } from './Button.vue';

export const buttonVariants = cva(
	'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
	{
		variants: {
			variant: {
				default: 'bg-gray text-gray-dark hover:bg-gray/90 hover:text-accent',
				destructive: 'bg-red-600 text-white hover:bg-red-500',
				outline: 'border border-gray-500  hover:text-accent hover:border-accent',
				secondary: 'bg-blue text-white hover:bg-blue-800 dark:bg-accent',
				ghost: 'bg-transparent text-gray-900 hover:bg-background-muted dark:text-white',
				link: 'text-gray-700 underline-offset-4 hover:text-accent dark:text-gray-500',
			},
			size: {
				default: 'h-10 px-4 py-2',
				sm: 'h-9 rounded-md px-3',
				lg: 'h-11 rounded-md px-8',
				icon: 'size-10 p-0',
			},
			block: {
				true: 'w-full',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
