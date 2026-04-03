import Anthropic from '@anthropic-ai/sdk'
import { readFile, readdir } from 'fs/promises'
import { join, resolve } from 'path'
import { execSync } from 'child_process'

/** Root of the project — two levels up from src/agent/ */
const PROJECT_ROOT = resolve(import.meta.dirname, '..', '..', '..')

/**
 * Tool definitions sent to the Claude API.
 * These tell the model what tools it can call and what parameters they accept.
 */
export const toolDefinitions: Anthropic.Tool[] = [
    {
        name: 'read_file',
        description:
            'Read the contents of a file in the project. Returns the file content as text. Use this to read ADRs, source code, config files, etc.',
        input_schema: {
            type: 'object' as const,
            properties: {
                path: {
                    type: 'string',
                    description:
                        'Relative path from the project root (e.g. "docs/adr/ADR-003-raw-sql-over-orm.md" or "backend/src/routes/chat.ts")',
                },
            },
            required: ['path'],
        },
    },
    {
        name: 'grep_codebase',
        description:
            'Search the codebase for a pattern using grep. Returns matching lines with file paths and line numbers. Use this to find where decisions are implemented, check for patterns, or find references.',
        input_schema: {
            type: 'object' as const,
            properties: {
                pattern: {
                    type: 'string',
                    description: 'The search pattern (basic regex supported)',
                },
                glob: {
                    type: 'string',
                    description:
                        'Optional file glob to narrow the search (e.g. "*.ts", "*.sql"). Omit to search all files.',
                },
            },
            required: ['pattern'],
        },
    },
    {
        name: 'list_directory',
        description:
            'List the contents of a directory in the project. Returns file and directory names. Use this to understand project structure.',
        input_schema: {
            type: 'object' as const,
            properties: {
                path: {
                    type: 'string',
                    description:
                        'Relative path from the project root (e.g. "backend/src" or "docs/adr"). Use "" or "." for project root.',
                },
            },
            required: ['path'],
        },
    },
]

/**
 * Execute a tool call and return the result as a string.
 * This is the bridge between what the model asks for and the actual filesystem.
 */
export async function executeTool(
    name: string,
    input: Record<string, string>
): Promise<string> {
    switch (name) {
        case 'read_file': {
            const filePath = resolve(PROJECT_ROOT, input.path)
            if (!filePath.startsWith(PROJECT_ROOT)) {
                return 'Error: path traversal not allowed'
            }
            try {
                return await readFile(filePath, 'utf-8')
            } catch {
                return `Error: file not found — ${input.path}`
            }
        }

        case 'grep_codebase': {
            const globArg = input.glob ? `--include="${input.glob}"` : ''
            try {
                const result = execSync(
                    `grep -rn ${globArg} "${input.pattern}" . --color=never`,
                    {
                        cwd: PROJECT_ROOT,
                        encoding: 'utf-8',
                        maxBuffer: 1024 * 1024,
                        timeout: 10_000,
                    }
                )
                // Cap output to avoid blowing up the context window
                const lines = result.split('\n')
                if (lines.length > 100) {
                    return lines.slice(0, 100).join('\n') + `\n... (${lines.length - 100} more lines truncated)`
                }
                return result || 'No matches found.'
            } catch {
                return 'No matches found.'
            }
        }

        case 'list_directory': {
            const dirPath = resolve(PROJECT_ROOT, input.path || '.')
            if (!dirPath.startsWith(PROJECT_ROOT)) {
                return 'Error: path traversal not allowed'
            }
            try {
                const entries = await readdir(dirPath, { withFileTypes: true })
                return entries
                    .map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
                    .join('\n')
            } catch {
                return `Error: directory not found — ${input.path}`
            }
        }

        default:
            return `Error: unknown tool — ${name}`
    }
}
