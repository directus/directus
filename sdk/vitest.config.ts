/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    typecheck: {
		// include: ['src/types/*.test.ts'],
		ignoreSourceErrors: true,
	}
  },
})
