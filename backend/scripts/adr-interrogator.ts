/**
 * ADR Interrogator — an agentic CLI tool that critiques Architecture Decision Records.
 *
 * The agent reads the ADR, explores the codebase using tools (read_file, grep, list_dir),
 * cross-references the decision against the actual implementation, and produces a
 * structured markdown critique.
 *
 * Usage:
 *   npx dotenv -e .env -- npx tsx scripts/adr-interrogator.ts <adr-path>
 *
 * Example:
 *   npx dotenv -e .env -- npx tsx scripts/adr-interrogator.ts docs/adr/ADR-003-raw-sql-over-orm.md
 *
 * Output is saved to docs/adr/critiques/<adr-filename>.critique.md
 */

import { runInterrogator } from '../src/agent/loop.js'
import { writeFile, mkdir } from 'fs/promises'
import { basename, resolve } from 'path'

const adrPath = process.argv[2]

if (!adrPath) {
    console.error('Usage: npx tsx scripts/adr-interrogator.ts <adr-path>')
    console.error('Example: npx tsx scripts/adr-interrogator.ts docs/adr/ADR-003-raw-sql-over-orm.md')
    process.exit(1)
}

console.log(`\n🔍 Interrogating: ${adrPath}\n`)

try {
    const result = await runInterrogator(adrPath)

    // Save critique to docs/adr/critiques/
    const critiquesDir = resolve(import.meta.dirname, '..', '..', 'docs', 'adr', 'critiques')
    await mkdir(critiquesDir, { recursive: true })

    const adrName = basename(adrPath, '.md')
    const outputPath = resolve(critiquesDir, `${adrName}.critique.md`)
    await writeFile(outputPath, result.critique, 'utf-8')

    console.log(result.critique)
    console.log(`\n---`)
    console.log(`📄 Saved to: docs/adr/critiques/${adrName}.critique.md`)
    console.log(`📊 Tokens: ${result.totalInputTokens} input + ${result.totalOutputTokens} output`)
    console.log(`🔧 Tool calls: ${result.toolCalls}`)
} catch (err: any) {
    console.error(`\nError: ${err.message}`)
    if (err.status === 401) {
        console.error('Check that ANTHROPIC_API_KEY is set in your .env file.')
    }
    process.exit(1)
}
