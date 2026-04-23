/**
 * Test the onboarding prompt with different user profiles.
 *
 * Run: npx tsx scripts/test-onboarding.ts
 *
 * Tests 3 different profiles and checks:
 * - Is the JSON parseable?
 * - Are there 10-15 activities?
 * - Are there 3-5 memories?
 * - Do the activities respect the user's preferences?
 */

import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import { ONBOARDING_SYSTEM_PROMPT, buildOnboardingUserMessage } from '../src/routes/onboardingPrompt.js'

const client = new Anthropic()

const profiles = [
    {
        name: 'Sanne (indoor, alone, creative)',
        answers: {
            setting: 'indoor' as const,
            social: 'alone' as const,
            interests: ['Creatief', 'Lezen', 'Muziek'],
        },
    },
    {
        name: 'Daan (no preference, no preference, active)',
        answers: {
            setting: 'no_preference' as const,
            social: 'no_preference' as const,
            interests: ['Bewegen', 'Puzzels & denken', 'Muziek'],
        },
    },
    {
        name: 'Fatima (indoor, alone, low-effort)',
        answers: {
            setting: 'indoor' as const,
            social: 'alone' as const,
            interests: ['Koken', 'Niks doen'],
        },
    },
]

async function testProfile(profile: typeof profiles[number]) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Testing: ${profile.name}`)
    console.log('='.repeat(60))

    const userMessage = buildOnboardingUserMessage(profile.answers)
    console.log(`\nInput:\n${userMessage}\n`)

    const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: ONBOARDING_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
    })

    const text = response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('')

    console.log(`Tokens: ${response.usage.input_tokens} in / ${response.usage.output_tokens} out`)

    // Try to parse JSON — strip markdown fences if present
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
    if (!jsonMatch) {
        console.log('FAIL: No JSON found in response')
        console.log('Raw response:', text)
        return
    }

    try {
        const result = JSON.parse(jsonMatch[1])

        const activityCount = result.activities?.length ?? 0
        const memoryCount = result.memories?.length ?? 0

        console.log(`Activities: ${activityCount} (expected 10-15)`)
        console.log(`Memories: ${memoryCount} (expected 3-5)`)

        if (activityCount < 10 || activityCount > 15) {
            console.log('WARN: Activity count outside expected range')
        }
        if (memoryCount < 3 || memoryCount > 5) {
            console.log('WARN: Memory count outside expected range')
        }

        // Show a few activities
        console.log('\nSample activities:')
        for (const activity of result.activities.slice(0, 3)) {
            console.log(`  - ${activity.title} (${activity.category}, ${activity.duration_minutes}min, stress ${activity.min_stress}-${activity.max_stress})`)
            console.log(`    ${activity.description}`)
        }

        console.log('\nMemories:')
        for (const memory of result.memories) {
            console.log(`  - ${memory}`)
        }

        // Check preferences are respected
        if (profile.answers.setting === 'indoor') {
            const outdoorActivities = result.activities.filter((activity: any) =>
                /buiten|wandel|park|tuin|fiets/i.test(activity.title + ' ' + activity.description)
            )
            if (outdoorActivities.length > 0) {
                console.log(`\nWARN: ${outdoorActivities.length} activities mention outdoor despite indoor preference:`)
                for (const activity of outdoorActivities) {
                    console.log(`  - ${activity.title}`)
                }
            }
        }
    } catch (parseError) {
        console.log('FAIL: JSON parse error')
        console.log('Raw response:', text.slice(0, 500))
    }
}

async function main() {
    for (const profile of profiles) {
        await testProfile(profile)
    }
    console.log('\n' + '='.repeat(60))
    console.log('Done.')
}

main()
