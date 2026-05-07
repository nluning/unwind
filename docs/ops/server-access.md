# Server access from a new machine

Runbook for getting SSH access to the Unwind production server from a laptop
that doesn't have a key set up yet. Written after recovering access from a
second machine on 2026-05-07.

**Server:** `unwind.nu`, hosted on Hetzner Cloud. The IP is in the Hetzner
Cloud panel; DNS also resolves it (`dig unwind.nu`).

## Before you start

You'll need:

- The Linux **username** on the server (the non-root sudo user). Not stored
  in the repo — find it via `ls /home` from the Hetzner web console if you
  don't remember.
- That user's **Linux password** (for the Hetzner web console login; SSH
  itself rejects passwords). If you don't have it, reset the root password
  from the Hetzner panel and set a new password for the user via console.
- Access to your **Hetzner Cloud account** (https://console.hetzner.cloud).

## Path A — old laptop is still accessible (preferred)

Cheapest path. Copy the existing keypair from the old machine to the new one.

1. On the old laptop, find the key — usually `~/.ssh/unwind_vps` and
   `~/.ssh/unwind_vps.pub`. (May be `id_ed25519` if the original setup didn't
   use a per-server filename.)
2. Transfer both files to the new laptop via USB stick or direct SCP. **Never
   email or upload the private key.**
3. On the new laptop:
   ```bash
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   mv /path/to/copied/unwind_vps ~/.ssh/
   chmod 600 ~/.ssh/unwind_vps
   chmod 644 ~/.ssh/unwind_vps.pub
   ```
4. Add the SSH config entry (see "SSH config" below) and test with
   `ssh unwind`.

## Path B — generate a new keypair + Hetzner console

Use this if the old laptop is unavailable, lost, or sold. Each machine ends up
with its own keypair; the server's `authorized_keys` accumulates one line per
machine.

### 1. Generate the keypair on the new laptop

In **Git Bash** (not PowerShell or CMD — those don't expand `~`):

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
ssh-keygen -t ed25519 -C "<your-name>-<machine-name>" -f ~/.ssh/unwind_vps
```

Set a passphrase when prompted — protects the private key at rest if the
laptop is stolen.

If you're not in Git Bash:
- PowerShell: replace `~` with `$env:USERPROFILE`
- CMD: replace `~` with `%USERPROFILE%`

### 2. Read the public key (one line!)

```bash
cat ~/.ssh/unwind_vps.pub
```

Output is **one line**, ~100 characters, starting with `ssh-ed25519 AAAA...`
and ending with the comment. Copy that whole line.

> **Never run** `cat ~/.ssh/unwind_vps*` (with a glob) — that prints both
> private and public keys. The private key (multi-line, `-----BEGIN OPENSSH
> PRIVATE KEY-----`) must never leave the laptop.

### 3. Open the Hetzner web console

1. https://console.hetzner.cloud → project → server.
2. Click **`>_ Console`** in the top-right. A noVNC terminal opens in the
   browser.
3. At `<hostname> login:`, enter the Linux username and password. Password
   auth is allowed at the TTY (SSH-only hardening doesn't affect it).

### 4. Append the public key on the server

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
```

Paste your public key on a new line. **Hetzner's noVNC paste is finicky** —
use the toolbar's "Send paste" / clipboard icon, not Ctrl+V. The pasted key
must end up on **one unbroken line** in the file. Save with `Ctrl+O`, Enter,
then `Ctrl+X`.

```bash
chmod 600 ~/.ssh/authorized_keys
```

Verify the file is well-formed:

```bash
cat -nA ~/.ssh/authorized_keys
```

Each key should appear as one numbered line ending in `$` (the EOL marker).
If a key is split across two lines with a `$` in the middle, the paste
corrupted it — fix it in nano before logging out, or SSH will reject it.

### 5. Log out of the console

Type `exit` first (returns the TTY to a login prompt — closing the tab alone
leaves the session live). Then close the browser tab.

### 6. SSH config on the new laptop

Edit `~/.ssh/config` (create it if missing):

```
Host unwind
  HostName unwind.nu
  User <linux-username>
  IdentityFile ~/.ssh/unwind_vps
```

### 7. Test

```bash
ssh unwind
```

First connection prompts you to accept the host key (`yes`), then asks for
your private key passphrase. Should land you in the shell.

## Common failure modes

| Symptom | Likely cause |
|---|---|
| `Permission denied (publickey)` | Wrong `User` in `~/.ssh/config`; or pasted public key got split across lines (`cat -nA ~/.ssh/authorized_keys` to check); or file permissions on server too loose (`~/.ssh` must be 700, `authorized_keys` 600) |
| `Connection refused` | Wrong IP, server down, or your IP is firewalled. Check Hetzner panel for current IP and server status |
| `Saving key "~/.ssh/..." failed: No such file or directory` | Shell isn't expanding `~`. Use Git Bash, or substitute the full path |
| Key generation works but `cat ~/.ssh/unwind_vps.pub` shows two key blocks | You ran `cat ~/.ssh/unwind_vps*` (with a glob) instead of `.pub`. Re-run the exact command |

## After adding a new machine

The server's `authorized_keys` now has one line per trusted machine. Each
line carries its `-C` comment so you can identify them at a glance.

Clean-up rules of thumb:

- If a laptop is **sold, lost, or no longer yours**, SSH in from another
  trusted machine and delete that machine's line from `~/.ssh/authorized_keys`
  on the server. There's no other revocation mechanism.
- The old line stays as long as you trust the old machine. Multiple working
  keys in `authorized_keys` is normal and intended.

## Why not just sync one private key across machines?

Per-machine keypairs:

- Are revocable individually (one line deletion vs. rotating the shared key
  on every machine).
- Make `authorized_keys` an audit log of which devices have access.
- Avoid the "where does the private key live" problem — every device
  generates its own and keeps it local.
