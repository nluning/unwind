// PreToolUse hook (Bash): blocks commits and PR create/edit calls that carry
// Claude attribution. See CLAUDE.md, "Working preferences". Exit 2 = block.
const fs = require('fs')

const ATTRIBUTION =
  /co-authored-by:.*(claude|anthropic)|noreply@anthropic\.com|generated with .*claude code/i
const GUARDED = /\bgit\s+(commit|commit-tree)\b|\bgh\s+pr\s+(create|edit)\b/
const MESSAGE_FILE = /(?:--body-file|--file|-F|-t)[\s=]+["']?([^\s"']+)/g

let input = ''
process.stdin.on('data', (chunk) => (input += chunk))
process.stdin.on('end', () => {
  let command = ''
  try {
    command = JSON.parse(input).tool_input?.command ?? ''
  } catch {
    return
  }
  if (!GUARDED.test(command)) return

  let text = command
  for (const [, path] of command.matchAll(MESSAGE_FILE)) {
    try {
      text += '\n' + fs.readFileSync(path, 'utf8')
    } catch {}
  }

  if (ATTRIBUTION.test(text)) {
    console.error(
      'Blocked: Claude attribution (Co-Authored-By / Generated with Claude Code) is not allowed in commits or PRs. Remove it and retry. See CLAUDE.md.',
    )
    process.exit(2)
  }
})
