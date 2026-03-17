import { defineConfig } from 'vitest/config'
import { config } from 'dotenv'                                                                                                   

config({ path: '.env.test' })    

export default defineConfig({
  test: {
        include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
        fileParallelism: false,
              typecheck: {
        tsconfig: './tsconfig.json',
    },
  },
})