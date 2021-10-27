<template>
	<div class="theme-container homepage" :class="pageClasses" @touchstart="onTouchStart" @touchend="onTouchEnd">
		<Navbar v-if="shouldShowNavbar" />

		<div class="header">
			<div class="text">
				<div>
					<h1>Directus Documentation</h1>
					<h3>Comprehensive tutorials, references, example code, and more for Directus.</h3>
				</div>
			</div>
			<svg width="696" height="205" fill="none" xmlns="http://www.w3.org/2000/svg">
				<g filter="url(#a)">
					<rect
						width="330.52"
						height="247.97"
						rx="4"
						transform="matrix(.86603 .5 -.78575 .61855 536.7 32.27)"
						fill="#FBC54F"
					/>
				</g>
				<g filter="url(#b)">
					<rect
						width="353.52"
						height="257.97"
						rx="4"
						transform="matrix(.86603 .5 -.78575 .61855 487.76 22.27)"
						fill="#0BA582"
					/>
				</g>
				<g filter="url(#c)">
					<path fill="#fff" d="m523.23 61.25 207.14 119.6-209.2 167.47-207.14-119.6z" />
					<path
						d="m383.9 52.87 29 16.75L256 195.22l-25.54-14.74c-1.9-1.1-2.06-3.12-.34-4.5L383.9 52.87Z"
						fill="#18222F"
					/>
					<path fill="#F0F4F9" d="m465.2 27.75 58.02 33.5-209.2 167.47-58.01-33.5z" />
					<path d="M433.07 13.5a6.3 6.3 0 0 1 6.6-.5l25.54 14.75-26.15 20.93-29.01-16.75 23.02-18.43Z" fill="#FBC54F" />
					<path fill="#F0F4F9" d="m410.05 31.93 29 16.75-26.14 20.94-29.01-16.75z" />
					<path
						d="M383.26 71.5c-1.06-.62-3.65-1.45-4.6-.68l-.71.56 6.33 3.66.7-.57c.97-.77-.66-2.36-1.72-2.98Zm-3.44-.15c.63.02 1.8.34 2.62.8a3.8 3.8 0 0 1 1.58 1.63l-4.2-2.43Zm4.15-.42c.87.5 2.22.41 3.03-.23.78-.63.7-1.56-.18-2.06a2.89 2.89 0 0 0-3.01.22c-.8.64-.71 1.56.16 2.07Zm2.05-1.64c.38.22.39.62.06.88-.34.27-.9.32-1.29.1-.38-.22-.41-.61-.07-.89.33-.26.91-.32 1.3-.1Zm.39 4.07c.18.59.1 1.15-.5 1.64l-.72.57 1.8 1.04.72-.57c.82-.66-.27-1.95-1.3-2.68Zm.28-.86c.87.5 2.22.41 3.03-.23.78-.63.7-1.56-.18-2.06-.25-.15-.5-.24-.81-.28-.1.45-.36.9-.84 1.28a4.2 4.2 0 0 1-1.75.79c.14.18.3.35.55.5ZM360.36 89.95l.06 1.17 4.02 2.32-4.08 3.27-7.27-4.2 4.9-3.92 2.37 1.36Zm1.18-.45-2.72-1.57a1.67 1.67 0 0 0-1.72.14L352.2 92c-.44.35-.42.89.07 1.17l7.27 4.2c.48.28 1.27.2 1.71-.15l4.08-3.26c.46-.37.42-.9-.07-1.18l-3.63-2.1-.1-1.18ZM334.63 111.68l.9.52-.83.66-.9-.52.83-.66Zm-1.65 1.32.9.52-2.45 1.96-.9-.52 2.45-1.96Zm4.13-2.69a8.21 8.21 0 0 0-8.6.66c-2.27 1.8-2.07 4.43.44 5.88a8.21 8.21 0 0 0 8.6-.66c2.26-1.8 2.06-4.43-.44-5.88Zm-7.36 5.9c-2-1.16-2.15-3.29-.36-4.73a6.64 6.64 0 0 1 6.91-.52c2 1.15 2.16 3.28.36 4.72a6.64 6.64 0 0 1-6.9.52ZM309.86 136.79l.42-.31c.13-.1.25-.23.38-.34l1.63.02c.14 0 .27-.08.3-.2l.51-1.65c.01-.07-.01-.14-.1-.19-.02-.01-.06-.04-.1-.03l-1.53-.33a2.4 2.4 0 0 0-.36-.76l.9-.96c.08-.1.07-.2-.04-.26l-1.82-1.06c-.11-.06-.27-.05-.39.02l-1.24.76c-.38-.09-.78-.1-1.17-.12l-.72-.97a.15.15 0 0 0-.07-.07.4.4 0 0 0-.29-.03l-2.33.6c-.16.05-.25.15-.22.24l.28 1.1-.42.3-.38.34-1.63-.02c-.14 0-.28.08-.3.2l-.51 1.65c-.02.07 0 .14.1.2.01 0 .06.03.1.03l1.52.32c.09.26.19.53.37.77l-.9.95c-.08.1-.07.2.04.26l1.82 1.06c.1.06.27.05.39-.02l1.24-.76c.37.09.78.11 1.17.12l.72.97c.02.04.05.06.07.07a.4.4 0 0 0 .28.03l2.34-.6c.15-.04.25-.15.22-.24l-.28-1.1Zm-.21-1.1c-.11.12-.2.2-.28.26-.08.06-.18.14-.33.23l-.53.33.12.47.14.56-.8.2-.36-.5-.31-.4-.67-.02c-.33 0-.62-.03-.88-.08l-.64-.13-.55.32-.64.4-.63-.38.46-.49.4-.4-.31-.43a1.49 1.49 0 0 1-.25-.56l-.16-.46-.64-.13-.78-.16.18-.59.83.01h.7l.39-.4a2.9 2.9 0 0 1 .61-.5l.52-.32-.11-.47-.15-.56.8-.2.36.5.32.4.67.02c.32 0 .61.03.88.08l.64.13.55-.31.63-.4.64.37-.47.5-.4.4.32.42c.12.17.21.35.25.56l.13.45.66.14.79.16-.18.59h-.83l-.7-.01-.39.4Zm-1.14-2.48c-1-.57-2.54-.46-3.44.26-.9.72-.82 1.77.18 2.35 1 .58 2.54.46 3.44-.26.9-.72.81-1.77-.18-2.35Zm-2.45 1.97c-.5-.29-.54-.84-.1-1.2a1.7 1.7 0 0 1 1.74-.12c.5.28.53.83.1 1.18a1.7 1.7 0 0 1-1.75.14ZM258.66 173.12a8.21 8.21 0 0 0-8.6.65c-2.27 1.81-2.07 4.43.44 5.88a8.21 8.21 0 0 0 8.6-.65c2.26-1.81 2.07-4.43-.44-5.88Zm-8.88 4.03c.56-.18 2.11.22 2.96.7.85.5 1.68 1.48 1.5 1.88a5.93 5.93 0 0 1-2.94-.72 3.02 3.02 0 0 1-1.52-1.86Zm5.72 2.48c.05-.94-1.28-2.05-1.94-2.43-.65-.38-2.47-1.1-3.84-.9.1-.7.48-1.42 1.23-2.01a6.64 6.64 0 0 1 6.9-.53c2 1.16 2.16 3.28.36 4.72-.74.6-1.71.97-2.71 1.15Zm1.53-5.2a2.9 2.9 0 0 0-3.03.22c-.78.63-.7 1.55.18 2.06.87.5 2.22.41 3-.22.81-.64.72-1.56-.15-2.07Zm-2.05 1.63c-.38-.22-.4-.62-.06-.88.34-.28.9-.32 1.29-.1.38.22.4.6.06.88-.32.27-.9.32-1.29.1Z"
						fill="#8196B1"
					/>
					<path d="m704.22 201.78 29.01 16.75-26.15 20.93-29-16.75 26.14-20.93Z" fill="#E4EAF1" />
					<path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M441.9 34.18a1.14 1.14 0 0 1-.16-.18.33.33 0 0 1-.06-.16c.38-.25.63-.5.99-.74 1.4-.94 1.89-.1 2.89.19.62.18 1.37.26 2.02-.09a6.47 6.47 0 0 0-.3-2.24c-.78-2.35-3.04-4.42-5.98-5.59a2.5 2.5 0 0 0 .28 2.1s-.7-.4-.89-1.05c-.23-.05-.7-.16-.95-.2.19 1.73 2.18 3.06 4.76 3.1-.02 0-.33.07-1.25.59-1.98 1.1-2.88.4-3.74-.66-1.77-2.2-4.02-2.4-3.7-4.47a2.2 2.2 0 0 0-1.57.4c-.41.33-.5.75-.33 1.11.43-.07.59-.08.93.12-.8-.09-1.1.07-2 .46-1.07.48-1.77 1.2-3.28.62-.73-.37-1.13-.03-2.01.33-1.13.47-1.88.5-3.46.64-.03.49.27.72.76.82 1 .2 2.42-.16 3.5-.3 1.21-.14 2.37.89 4.05 1.03 1.14.1 2.06-.14 2.5-1.17 0 .43-.2.86-.6 1.21 1.39.6 1.68 2.65 2.97 3.7.02-.23.09-.45.19-.66.2-.4.5-.7.83-.93-.61.68-.74 1.93.52 2.78.32.22.73.4 1.23.54.59.17 1.19.29 1.61.66.32.27.5.61.43.98-.1.54.53 1.04 1.4.8 1-1.82-.92-3.08-1.58-3.74Z"
						fill="#fff"
					/>
					<path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="m404.84 50.2 2.4 3.71c.08.11.2.18.37.21l5.79 1.01c.24.04.45 0 .61-.14l4.4-3.52a.5.5 0 0 0 .07-.06l.02-.02a.32.32 0 0 0 .03-.05l.01-.02a.35.35 0 0 0 .03-.07v-.09l-.02-.06a.34.34 0 0 0-.03-.07l-2.4-3.72c-.08-.1-.2-.18-.37-.2l-5.79-1.02h-.3l-.02.01a.8.8 0 0 0-.1.03h-.02a.8.8 0 0 0-.07.04l-.02.01a.56.56 0 0 0-.08.05l-4.4 3.53c-.17.13-.2.28-.1.43Zm4.77-2.96 1.88 2.92-3.53 2.82-1.88-2.92 3.53-2.82Zm-.77 6.25 3.53-2.82 4.55.79-3.53 2.82-4.55-.79Zm6.3-5.65 1.78 2.77-4.3-.75-1.78-2.77 4.3.75Z"
						fill="#182B44"
					/>
					<rect
						width="54.43"
						height="8.37"
						rx="4"
						transform="matrix(.86603 .5 -.78065 .62497 440.05 56.01)"
						fill="#E4EAF1"
					/>
					<rect
						width="54.43"
						height="8.37"
						rx="4"
						transform="matrix(.86603 .5 -.78065 .62497 548.32 89.25)"
						fill="#F0F4F9"
					/>
					<rect
						width="18.84"
						height="18.84"
						rx="9.42"
						transform="matrix(.86603 .5 -.78065 .62497 532.01 74.2)"
						fill="#F0F4F9"
					/>
					<rect
						width="40.82"
						height="8.37"
						rx="4"
						transform="matrix(.86603 .5 -.78065 .62497 428.6 65.17)"
						fill="#E4EAF1"
					/>
					<rect
						width="37.16"
						height="8.37"
						rx="4"
						transform="matrix(.86603 .5 -.78065 .62497 405.73 83.49)"
						fill="#E4EAF1"
					/>
					<rect
						width="47.11"
						height="8.37"
						rx="4"
						transform="matrix(.86603 .5 -.78065 .62497 417.17 74.33)"
						fill="#E4EAF1"
					/>
					<rect
						width="47.11"
						height="8.37"
						rx="4"
						transform="matrix(.86603 .5 -.78065 .62497 394.28 92.65)"
						fill="#E4EAF1"
					/>
					<rect
						width="18.84"
						height="18.84"
						rx="9.42"
						transform="matrix(.86603 .5 -.78065 .62497 694.28 167.89)"
						fill="#FBC54F"
					/>
					<path
						d="m697.85 180.63-2.72-1.56-2.45 1.96-.9-.52 2.46-1.96-2.72-1.57.8-.64 2.72 1.57 2.45-1.97.9.52-2.46 1.96 2.72 1.57-.8.64Z"
						fill="#fff"
					/>
					<rect
						width="18.84"
						height="18.84"
						rx="9.42"
						transform="matrix(.86603 .5 -.78065 .62497 674.34 156.37)"
						fill="#FEECD0"
					/>
					<path
						d="M673.7 165c-1-.58-2.56-.45-3.46.28-.9.72-.82 1.76.18 2.34 1 .58 2.55.47 3.45-.25.9-.72.82-1.8-.18-2.37Zm-2.46 1.96c-.49-.28-.53-.8-.09-1.16a1.64 1.64 0 0 1 1.72-.14c.5.3.55.82.09 1.19-.44.35-1.21.4-1.72.11Zm4.03 1.78a2.5 2.5 0 0 0-2.58.2c-.67.53-.61 1.33.13 1.76a2.5 2.5 0 0 0 2.59-.2c.67-.53.6-1.33-.13-1.76Zm-1.62 1.3c-.26-.15-.28-.4-.05-.58.23-.18.6-.21.85-.06.26.14.3.4.07.59a.82.82 0 0 1-.87.05Zm7.2-4.83a4.53 4.53 0 0 0-4.72.35c-1.24 1-1.15 2.45.23 3.25 1.38.8 3.5.62 4.74-.38 1.23-.98 1.14-2.43-.24-3.22Zm-3.67 2.94c-.87-.5-.96-1.43-.16-2.07a2.89 2.89 0 0 1 3.01-.22c.88.5.97 1.43.18 2.06a2.9 2.9 0 0 1-3.03.23Z"
						fill="#FBC54F"
					/>
					<rect
						x=".04"
						y=".56"
						width="17.84"
						height="17.84"
						rx="8.92"
						transform="matrix(.86603 .5 -.78065 .62497 654.84 145.05)"
						fill="#fff"
						stroke="#D3DAE4"
					/>
					<path
						d="M652.34 154.2c.04.52.34.94.9 1.27.57.32 1.24.46 1.99.4a3.36 3.36 0 0 0 1.9-.7c.5-.4.74-.87.7-1.38-.04-.52-.34-.94-.9-1.27a3.35 3.35 0 0 0-1.99-.4c-.75.05-1.38.29-1.9.7-.5.4-.74.87-.7 1.38Zm3.63 2.84.22 2.92-1.3.1-.22-2.93.33-.26-.01-.16c-.96.02-1.81-.18-2.55-.6-.82-.48-1.26-1.08-1.33-1.83-.06-.73.28-1.4 1.02-2 .74-.58 1.65-.92 2.73-1 1.1-.09 2.07.1 2.89.58.82.48 1.25 1.09 1.3 1.83.05.74-.3 1.4-1.03 2-.67.53-1.47.85-2.43.97l.02.17.36.2Z"
						fill="#A2B5CD"
					/>
					<path fill="#E4EAF1" d="m465.4 27.86 58.02 33.5-26.15 20.93-58.02-33.5z" />
					<path opacity=".25" fill="#8196B1" d="m257.6 158.98 21.75 12.56-.82.66-21.76-12.56z" />
					<path d="m458.69 47.33.65-7.78c2.8.12 5.1.7 6.9 1.74a7.79 7.79 0 0 1 3.63 4.35l-11.18 1.7Z" fill="#A2B5CD" />
					<rect
						width="38.73"
						height="8.37"
						rx="4"
						transform="matrix(.86603 .5 -.78065 .62497 474.9 46.85)"
						fill="#A2B5CD"
					/>
					<rect
						x=".04"
						y=".56"
						width="204.69"
						height="103.68"
						rx="3.5"
						transform="matrix(.86603 .5 -.78065 .62497 501.66 99.4)"
						fill="#fff"
						stroke="#D3DAE4"
					/>
					<path
						fill="#F0F4F9"
						d="m466.34 136.5 163.17 94.2-.82.66-163.17-94.2zM449.58 149.9l163.18 94.22-.82.66-163.18-94.21zM483.09 123.09l163.17 94.2-.82.66-163.17-94.2z"
					/>
					<path
						opacity=".25"
						d="m449.83 155.14-3.48-2.01-13.47 10.78 162.72 93.95 29.55-23.65c-8.71-5.03-20.88 5.46-30.4-.03-9.5-5.5-17.95 4.78-28.66-1.41-10.72-6.19 33.74-38.27 24.23-43.76-9.51-5.49-31.95 14.69-41.73 9.05-9.78-5.65 3.36-13.21-6.55-18.94-9.91-5.72 10.8-20.27 1.42-25.68-9.37-5.41-45.27 24.99-54.78 19.5-9.5-5.5-13.13-.01-23.38-5.46-10.25-5.45-11.85-10.26-15.47-12.34Z"
						fill="url(#d)"
					/>
					<path
						d="m446.27 153.19 3.48 2.01c3.62 2.09 5.19 6.92 15.44 12.37 10.26 5.44 13.9-.05 23.4 5.44 9.51 5.49 45.5-24.98 54.87-19.57 9.38 5.41-11.38 20-1.47 25.72 9.91 5.73-3.25 13.31 6.52 18.96 9.78 5.64 32.28-14.59 41.8-9.1 9.5 5.5-35.06 37.66-24.34 43.85 10.71 6.18 19.18-4.11 28.7 1.38 9.5 5.49 21.71-5.02 30.42 0"
						stroke="#FBC54F"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<rect
						width="47.11"
						height="8.37"
						rx="4"
						transform="matrix(.86603 .5 -.78065 .62497 501.75 106.27)"
						fill="#E4EAF1"
					/>
					<rect
						x=".04"
						y=".56"
						width="204.69"
						height="61.81"
						rx="3.5"
						transform="matrix(.86603 .5 -.78065 .62497 406.87 175.29)"
						fill="#fff"
						stroke="#D3DAE4"
					/>
					<rect
						width="26.17"
						height="8.37"
						rx="4"
						transform="matrix(.86603 .5 -.78065 .62497 406.96 182.16)"
						fill="#E4EAF1"
					/>
					<rect
						width="8.37"
						height="26.17"
						rx="4"
						transform="matrix(.86603 .5 -.78065 .62497 394.06 194.98)"
						fill="#FEECD0"
					/>
					<rect
						width="8.37"
						height="20.94"
						rx="4"
						transform="matrix(.86603 .5 -.78065 .62497 400.85 204.54)"
						fill="#FEECD0"
					/>
				</g>
				<path fill="#7FE3CA" d="m61 160 346.41 200-1 1.73L60 161.73z" />
				<g filter="url(#e)">
					<circle r="7" transform="matrix(.86603 .5 -.78575 .61855 63.13 162.83)" fill="#FBC54F" />
				</g>
				<path fill="#7FE3CA" d="M0 281.26 315.2 35l1.23 1.57L1.23 282.84z" />
				<g filter="url(#f)">
					<circle r="7" transform="matrix(.86603 .5 -.78575 .61855 319.13 33.83)" fill="#FBC54F" />
				</g>
				<defs>
					<filter
						id="a"
						x="341.79"
						y="32.56"
						width="481.22"
						height="320.06"
						filterUnits="userSpaceOnUse"
						color-interpolation-filters="sRGB"
					>
						<feFlood flood-opacity="0" result="BackgroundImageFix" />
						<feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
						<feOffset dy="1" />
						<feGaussianBlur stdDeviation="1" />
						<feComposite in2="hardAlpha" operator="out" />
						<feColorMatrix values="0 0 0 0 0.0901961 0 0 0 0 0.160784 0 0 0 0 0.25098 0 0 0 0.1 0" />
						<feBlend in2="BackgroundImageFix" result="effect1_dropShadow" />
						<feBlend in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
					</filter>
					<filter
						id="b"
						x="284.99"
						y="22.56"
						width="509"
						height="337.74"
						filterUnits="userSpaceOnUse"
						color-interpolation-filters="sRGB"
					>
						<feFlood flood-opacity="0" result="BackgroundImageFix" />
						<feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
						<feOffset dy="1" />
						<feGaussianBlur stdDeviation="1" />
						<feComposite in2="hardAlpha" operator="out" />
						<feColorMatrix values="0 0 0 0 0.0901961 0 0 0 0 0.160784 0 0 0 0 0.25098 0 0 0 0.1 0" />
						<feBlend in2="BackgroundImageFix" result="effect1_dropShadow" />
						<feBlend in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
					</filter>
					<filter
						id="c"
						x="212.92"
						y=".3"
						width="568.53"
						height="391.47"
						filterUnits="userSpaceOnUse"
						color-interpolation-filters="sRGB"
					>
						<feFlood flood-opacity="0" result="BackgroundImageFix" />
						<feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
						<feOffset dx="4" dy="8" />
						<feGaussianBlur stdDeviation="10" />
						<feColorMatrix values="0 0 0 0 0.0901961 0 0 0 0 0.160784 0 0 0 0 0.25098 0 0 0 0.05 0" />
						<feBlend in2="BackgroundImageFix" result="effect1_dropShadow" />
						<feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
						<feOffset dx="4" dy="8" />
						<feGaussianBlur stdDeviation="4" />
						<feColorMatrix values="0 0 0 0 0.0901961 0 0 0 0 0.160784 0 0 0 0 0.25098 0 0 0 0.1 0" />
						<feBlend in2="effect1_dropShadow" result="effect2_dropShadow" />
						<feBlend in="SourceGraphic" in2="effect2_dropShadow" result="shape" />
					</filter>
					<filter
						id="e"
						x="52.95"
						y="156.26"
						width="20.37"
						height="15.14"
						filterUnits="userSpaceOnUse"
						color-interpolation-filters="sRGB"
					>
						<feFlood flood-opacity="0" result="BackgroundImageFix" />
						<feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
						<feOffset dy="1" />
						<feGaussianBlur stdDeviation="1" />
						<feComposite in2="hardAlpha" operator="out" />
						<feColorMatrix values="0 0 0 0 0.0901961 0 0 0 0 0.160784 0 0 0 0 0.25098 0 0 0 0.1 0" />
						<feBlend in2="BackgroundImageFix" result="effect1_dropShadow" />
						<feBlend in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
					</filter>
					<filter
						id="f"
						x="308.95"
						y="27.26"
						width="20.37"
						height="15.14"
						filterUnits="userSpaceOnUse"
						color-interpolation-filters="sRGB"
					>
						<feFlood flood-opacity="0" result="BackgroundImageFix" />
						<feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
						<feOffset dy="1" />
						<feGaussianBlur stdDeviation="1" />
						<feComposite in2="hardAlpha" operator="out" />
						<feColorMatrix values="0 0 0 0 0.0901961 0 0 0 0 0.160784 0 0 0 0 0.25098 0 0 0 0.1 0" />
						<feBlend in2="BackgroundImageFix" result="effect1_dropShadow" />
						<feBlend in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
					</filter>
					<linearGradient id="d" x1="568.17" y1="167.71" x2="535.99" y2="223.44" gradientUnits="userSpaceOnUse">
						<stop stop-color="#FBC54F" />
						<stop offset="1" stop-color="#FBC54F" stop-opacity="0" />
					</linearGradient>
				</defs>
			</svg>
		</div>

		<div class="panels">
			<a href="/getting-started/introduction/" class="panel">
				<svg width="60" height="60" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="30" cy="30" r="30" fill="#00C897" />
					<path
						d="M33 21.98v7.04h-9.84l-1.18 1.17v-8.2H33Zm.98-1.96H21a.96.96 0 0 0-.98.98v14.02L24 30.98h9.98a1 1 0 0 0 1.04-.98v-9a1 1 0 0 0-1.04-.98ZM39 24h-2.02v9H24v2.02c0 .51.47.98.98.98H36l3.98 3.98v-15A.99.99 0 0 0 39 24Z"
						fill="#fff"
					/>
				</svg>
				<h2>Getting Started</h2>
				<span>Get started with Directus, learning basic concepts and instructions for popular use cases.</span>
				<u>Learn More</u>
			</a>
			<a href="/app/overview/" class="panel">
				<svg width="60" height="60" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="30" cy="30" r="30" fill="#00C897" />
					<path
						d="M21.98 24h18v-2.02h-18c-1.07 0-1.96.94-1.96 2.02v11.02H18v3h14.02v-3H21.98V24Zm19.04 2.02h-6a1 1 0 0 0-1.04.98v9.98c0 .57.47 1.04 1.04 1.04h6c.51 0 .98-.47.98-1.04V27a.99.99 0 0 0-.98-.98Zm-1.04 9H36v-7.04h3.98v7.04Z"
						fill="#fff"
					/>
				</svg>
				<h2>The App Guide</h2>
				<span>A non-technical overview of the Directus no-code App and its various features.</span>
				<u>Learn More</u>
			</a>
			<a href="/configuration/overview/" class="panel">
				<svg width="60" height="60" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="30" cy="30" r="30" fill="#00C897" />
					<path
						d="M21 35.02v1.96h6v-1.96h-6Zm0-12v1.96h9.98v-1.96H21ZM30.98 39v-2.02H39v-1.96h-8.02V33h-1.96v6h1.96Zm-6-12v2.02H21v1.96h3.98V33H27v-6h-2.02ZM39 30.98v-1.96h-9.98v1.96H39ZM33 27h2.02v-2.02H39v-1.96h-3.98V21H33v6Z"
						fill="#fff"
					/>
				</svg>
				<h2>Configuration</h2>
				<span>Administrator guides for tailoring the Directus platform to fit your exact project needs.</span>
				<u>Learn More</u>
			</a>
			<a href="/reference/introduction/" class="panel">
				<svg width="60" height="60" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="30" cy="30" r="30" fill="#00C897" />
					<path
						d="M30 29.02c-1.08 0-2.02.89-2.02 1.96 0 1.13.94 2.02 2.02 2.02s2.02-.9 2.02-2.02c0-1.07-.94-1.96-2.02-1.96Zm6 1.96a6.01 6.01 0 1 0-9 5.2l.98-1.73A4.02 4.02 0 0 1 30 27c2.2 0 3.98 1.78 3.98 3.98 0 1.5-.8 2.77-1.96 3.47L33 36.2a5.99 5.99 0 0 0 3-5.2ZM30 21a10 10 0 0 0-5.02 18.66l.99-1.74a8.14 8.14 0 0 1-3.99-6.94A8 8 0 0 1 30 23.02a8 8 0 0 1 8.02 7.96 8.08 8.08 0 0 1-4.04 6.94l1.04 1.74A10 10 0 0 0 30 21Z"
						fill="#fff"
					/>
				</svg>
				<h2>Connecting Data</h2>
				<span>A toolkit for connecting your data, including the REST API, GraphQL, CLI, SDK, and more.</span>
				<u>Learn More</u>
			</a>
			<a href="/extensions/introduction/" class="panel">
				<svg width="60" height="60" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="30" cy="30" r="30" fill="#00C897" />
					<path
						d="M33.98 27v4.64l-3.46 3.52v1.82h-1.04v-1.82l-3.46-3.52V27h7.96Zm0-6h-1.96v3.98h-4.04V21h-1.96v3.98h-.05A2 2 0 0 0 24 27v5.48L27.52 36v3h4.96v-3L36 32.48V27c0-1.08-.9-2.02-2.02-2.02V21Z"
						fill="#fff"
					/>
				</svg>
				<h2>Extending the Platform</h2>
				<span>Tutorials for creating your own custom extensions within the Directus ecosystem.</span>
				<u>Learn More</u>
			</a>
			<a href="/contributing/introduction/" class="panel">
				<svg width="60" height="60" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="30" cy="30" r="30" fill="#00C897" />
					<path
						d="M34.5 21c-1.73 0-3.42.8-4.5 2.1a5.89 5.89 0 0 0-4.5-2.1 5.43 5.43 0 0 0-5.48 5.48c0 3.8 3.37 6.9 8.53 11.58L30 39.33l1.45-1.31c5.16-4.65 8.53-7.74 8.53-11.54 0-3.04-2.39-5.48-5.48-5.48Zm-4.4 15.56-.1.1-.1-.1c-4.77-4.31-7.92-7.17-7.92-10.08 0-1.96 1.5-3.46 3.52-3.46 1.55 0 3.05.98 3.56 2.34h1.88a3.88 3.88 0 0 1 3.56-2.34c2.02 0 3.52 1.5 3.52 3.46 0 2.91-3.15 5.77-7.93 10.08Z"
						fill="#fff"
					/>
				</svg>
				<h2>Contributing</h2>
				<span>Ready to start working on Directus Core? These Wikis will provide the tools needed to contribute.</span>
				<u>Learn More</u>
			</a>
		</div>

		<div class="listings">
			<div class="listing">
				<h2>Popular Topics</h2>
				<ul>
					<li><a href="/configuration/filter-rules">Filter Rules (Configuration)</a></li>
					<li><a href="#">App Guide -> Layouts</a></li>
					<li><a href="/configuration/installation/docker/">Getting Started -> Installation -> Docker</a></li>
					<li><a href="#">Fields Parameter (Data Access)</a></li>
				</ul>
			</div>

			<div class="listing">
				<h2>Latest Updates</h2>
				<ul>
					<li><a href="/configuration/config-options/">Environment Variables (Configuration)</a></li>
					<li><a href="#">Setting up SSO (Configuration)</a></li>
					<li>
						<a href="/getting-started/introduction/#database-mirroring">Understanding Database Mirroring</a>
					</li>
					<li><a href="#">Backing Directus</a></li>
				</ul>
			</div>
		</div>
	</div>
</template>

<script>
import Navbar from '@theme/components/Navbar.vue';

export default {
	name: 'Layout',

	components: {
		Navbar,
	},

	computed: {
		shouldShowNavbar() {
			const { themeConfig } = this.$site;
			const { frontmatter } = this.$page;
			if (frontmatter.navbar === false || themeConfig.navbar === false) {
				return false;
			}
			return this.$title || themeConfig.logo || themeConfig.repo || themeConfig.nav || this.$themeLocaleConfig.nav;
		},
	},
};
</script>

<style>
.homepage {
	max-width: 1140px;
	margin: 90px auto 40px;
	padding: 40px;
	font-weight: 500;
}

.header {
	position: relative;
	width: 100%;
	min-height: 220px;
	overflow: hidden;
	background-color: #00c897;
	border-radius: 4px;
}

.header svg {
	position: absolute;
	right: 0;
	bottom: 0;
	z-index: 1;
	opacity: 0.5;
}

.header .text {
	position: absolute;
	top: 40px;
	right: 40px;
	bottom: 40px;
	left: 40px;
	z-index: 2;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	color: #fff;
}

.header .text h1 {
	margin: 0 0 10px;
	line-height: 1;
}

.header .text h3 {
	margin: 0 !important;
	line-height: 1.3;
	border-bottom: none;
}

.panels {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	margin: 60px auto 40px;
}

.panel {
	width: calc((100% - 60px - (40px * 6) - (2px * 6)) / 3);
	margin-bottom: 30px;
	padding: 40px;
	overflow: hidden;
	border: 2px solid #f0f4f9;
	border-radius: 4px;
	cursor: pointer;
	transition: border 0.25s ease;
}

.panel:hover {
	border-color: #00c897;
}

.panel svg {
	display: block;
	margin: 0;
}

.panel h2 {
	margin: 24px 0 16px !important;
	color: #172940;
	font-weight: 800;
	line-height: 1.3;
	border-bottom: none;
}

.panel span {
	color: #a2b5cd;
}

.panel u {
	display: block;
	margin-top: 20px;
	font-weight: 600;
	font-size: 14px;
	line-height: 25px;
	text-decoration: none;
}

.listings {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	margin: 40px auto 0;
}

.listing {
	width: calc((100% - 30px) / 2);
	margin-bottom: 30px;
	font-size: 18px;
	line-height: 25px;
}

@media (max-width: 1000px) {
	.panel {
		width: calc((100% - 60px - (20px * 6) - (2px * 6)) / 3);
		padding: 20px;
	}
}

@media (max-width: 900px) {
	.listing {
		width: 100%;
	}

	.panel {
		width: calc((100% - 30px - (20px * 4) - (2px * 4)) / 2);
		padding: 20px;
	}
}

@media (max-width: 700px) {
	.header .text h1 {
		font-size: 42px;
	}

	.panel {
		width: 100%;
	}
}
</style>
