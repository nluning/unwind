/**
 * Manual prompt testing script for Mode 4.
 *
 * Run: npx tsx scripts/test-prompt.ts
 *
 * This simulates a multi-turn conversation with Claude using the
 * same system prompt as the /chat endpoint. Use it to iterate on
 * the prompt before building any UI.
 *
 * Type your messages and press Enter. Type "quit" to exit.
 * The script prints token usage after each response so you can
 * track cost.
 */

import Anthropic from '@anthropic-ai/sdk'
import * as readline from 'readline'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are a creative assistant who speaks to the point and helps the user think of an activity they can do to relax and wind down. The user is most probably neurodivergent (autism, ADHD and/or gifted), so they probably have trouble slowing down once they are stressed, once they have 'empty time' on their hands, and just because their brains don't like slowing down. You will help them find some peace and joy by suggesting activities they could do without overwhelming them: the conversation is meant to be short and simple. You speak to the point. Maximum exchanges = 10.

You start the conversation in Dutch. Get to the point directly and ask the first question without greeting etc. If the user responds in another language, switch to that language. 

In coming up with new activities, you are creative and think outside of the box. You start by asking questions to understand the user's state of mind, in order to come up with suggestions that are both new and creative, as well as fitting within the parameters that the user sets. 
Examples include: whether the user wants high or low stimuli, if they want to retreat or rather go out, if they need calm or action instead, if they feel creative or need structure.

Don't ask for identifying information (name, location, contact details).

When you suggest an activity, always include a JSON block with this format:
\`\`\`json
{ "title": "...", "description": "...", "category": "Head|Heart|Hands", "duration_minutes": N, "min_stress": N, "max_stress": N }
\`\`\``

// Change these to test different scenarios
const STRESS_LEVEL: number | null = null  // try: 1, 3, 5, or null
const CATEGORIES_DONE: string[] = []      // try: ['Head'], ['Head', 'Hands'], etc.

function buildSystemPrompt(): string {
    const context: string[] = []

    if (STRESS_LEVEL) {
        context.push(`User's current stress level: ${STRESS_LEVEL}/5`)
    }

    if (CATEGORIES_DONE.length > 0) {
        context.push(`Categories already done today: ${CATEGORIES_DONE.join(', ')}`)
    }

    if (context.length === 0) return SYSTEM_PROMPT
    return SYSTEM_PROMPT + `\n\nContext for this conversation:\n${context.join('\n')}`
}

const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []
let totalInputTokens = 0
let totalOutputTokens = 0

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

console.log('=== Mode 4 Prompt Tester ===')
console.log(`Stress level: ${STRESS_LEVEL ?? 'unknown'}`)
console.log(`Categories done: ${CATEGORIES_DONE.length > 0 ? CATEGORIES_DONE.join(', ') : 'none'}`)
console.log('Type your messages. Type "quit" to exit.\n')

async function getAssistantResponse() {
    const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: buildSystemPrompt(),
        messages,
    })

    const text = response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('')

    totalInputTokens += response.usage.input_tokens
    totalOutputTokens += response.usage.output_tokens

    messages.push({ role: 'assistant', content: text })

    console.log(`\nAssistant: ${text}`)
    console.log(`  [tokens: ${response.usage.input_tokens} in / ${response.usage.output_tokens} out]\n`)
}

function ask() {
    rl.question('You: ', async (input) => {
        if (input.trim().toLowerCase() === 'quit') {
            console.log(`\n=== Session total: ${totalInputTokens} input + ${totalOutputTokens} output tokens ===`)
            rl.close()
            return
        }

        messages.push({ role: 'user', content: input })

        try {
            await getAssistantResponse()
        } catch (err: any) {
            console.error(`\nError: ${err.message}\n`)
        }

        ask()
    })
}

// AI speaks first — send initial message to get the opening question
async function start() {
    console.log('(Getting opening message from Claude...)\n')
    try {
        // The Anthropic API requires at least one user message,
        // so we send a brief greeting to kick off the conversation
        messages.push({ role: 'user', content: 'Hoi' })
        await getAssistantResponse()
    } catch (err: any) {
        console.error(`Error: ${err.message}`)
    }
    ask()
}

start()
