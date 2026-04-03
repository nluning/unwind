import Anthropic from '@anthropic-ai/sdk'
import { toolDefinitions, executeTool } from './tools.js'
import { INTERROGATOR_SYSTEM_PROMPT, buildInterrogatorPrompt } from './prompts.js'

const client = new Anthropic()

const MAX_ITERATIONS = 25

interface AgentResult {
    critique: string
    totalInputTokens: number
    totalOutputTokens: number
    toolCalls: number
}

/**
 * Run the ADR interrogator agent.
 *
 * This is the core agentic loop:
 * 1. Send messages + tools to Claude
 * 2. If response contains tool_use blocks → execute them, append results, loop
 * 3. If response is just text → we're done, extract the critique
 */
export async function runInterrogator(adrPath: string): Promise<AgentResult> {
    const messages: Anthropic.MessageParam[] = [
        { role: 'user', content: buildInterrogatorPrompt(adrPath) },
    ]

    let totalInputTokens = 0
    let totalOutputTokens = 0
    let toolCalls = 0

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const response = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 4096,
            system: INTERROGATOR_SYSTEM_PROMPT,
            tools: toolDefinitions,
            messages,
        })

        totalInputTokens += response.usage.input_tokens
        totalOutputTokens += response.usage.output_tokens

        // Append the full assistant response (may contain text + tool_use blocks)
        messages.push({ role: 'assistant', content: response.content })

        // If the model is done (no more tool calls), extract the final text
        if (response.stop_reason === 'end_turn') {
            const critique = response.content
                .filter((block): block is Anthropic.TextBlock => block.type === 'text')
                .map((block) => block.text)
                .join('\n')

            return { critique, totalInputTokens, totalOutputTokens, toolCalls }
        }

        // Process tool calls
        const toolUseBlocks = response.content.filter(
            (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
        )

        if (toolUseBlocks.length === 0) {
            // No tool calls and not end_turn — shouldn't happen, but handle gracefully
            const text = response.content
                .filter((block): block is Anthropic.TextBlock => block.type === 'text')
                .map((block) => block.text)
                .join('\n')
            return { critique: text, totalInputTokens, totalOutputTokens, toolCalls }
        }

        // Execute each tool and build the tool_result messages
        const toolResults: Anthropic.ToolResultBlockParam[] = []

        for (const toolUse of toolUseBlocks) {
            toolCalls++
            const input = toolUse.input as Record<string, string>

            process.stderr.write(`  🔧 ${toolUse.name}(${JSON.stringify(input)})\n`)

            const result = await executeTool(toolUse.name, input)
            toolResults.push({
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: result,
            })
        }

        // Feed tool results back to continue the loop
        messages.push({ role: 'user', content: toolResults })
    }

    return {
        critique: 'Error: agent hit maximum iteration limit without producing a final critique.',
        totalInputTokens,
        totalOutputTokens,
        toolCalls,
    }
}
