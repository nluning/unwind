/**
 * Shared creativity-calibration guidance for every activity-generating prompt
 * (Mode 4 chat, onboarding, and the Q&A / analyse-fit routes).
 *
 * Background: review 007's addendum. "Out-of-the-box" ideation is a gifted-
 * specific preference, neutral-to-harmful for everyone else — novel-divergent
 * suggestions read as effortful, not-for-me, or (for the PDA-coded audience)
 * like a demand. So creativity is a knob the user turns through use, anchored to
 * their own register, not a virtue baked into the prompt. Routes that generate a
 * batch (analyse-fit's 3, onboarding's 10–15) layer a count-specific mix on top
 * of this; single-suggestion routes (chat, Q&A) use it as-is.
 */
export const CREATIVITY_GUIDANCE = `Anchor every suggestion to what you know about this user — their stated preferences, the activities they've added themselves, and the ones they've accepted before. Do NOT default to "creative" or out-of-the-box ideas. For most people a novel, divergent suggestion reads as effortful, as not-for-them, or like a demand, and gets dismissed before it's even considered.

Calibrate to the signal you have:
- Lean familiar and adjacent: things recognizably close to what this user already does or likes, that need almost no planning to start.
- Only reach for more unexpected or divergent suggestions when there is a clear signal the user welcomes variety — a wide-ranging set of interests or accepted activities.
- With little signal to go on, stay on the familiar, low-effort end. Never withhold a suggestion or tell the user to add more first.`
