# Second site on the same server

Runbook for the extra static website served from the Unwind VPS, by the same
nginx container. The site's content, build and deploy command live in a
separate private repo; this file only covers the server side.

**The domain name is deliberately not recorded here.** This repo is public.
Placeholders below: `<domain>` (the second site's domain) and `site2` (the
neutral name used for its directories). The domain is still visible in DNS and
in Let's Encrypt's public certificate transparency logs, so treat it as
unlisted rather than secret.

## How it is wired

```
browser ──► nginx (frontend container)
              ├─ unwind.nu          → Vue app + /api proxy   (frontend/nginx.conf)
              └─ <domain>           → static files           (host-only site2.conf)
```

| Piece | Where | In git? |
|---|---|---|
| `include /etc/nginx/extra-sites/*.conf;` | `frontend/nginx.conf` | Yes |
| Mounts `/etc/unwind/extra-sites` and `/var/www/site2` (read-only) | `docker-compose.production.yml`, `frontend` service | Yes |
| The second site's server blocks | `/etc/unwind/extra-sites/site2.conf` on the VPS | **No** |
| The site's files | `/var/www/site2/` on the VPS | **No** |
| Its certificate | `/etc/letsencrypt/live/<domain>/` on the VPS | **No** |

Why the server blocks are host-only: putting `server_name <domain>` in
`frontend/nginx.conf` would publish the domain in this repo. A wildcard
`include` that matches no files is not an error, so Unwind is unaffected when
the directory is empty.

**Consequence:** the three "No" rows exist only on the VPS. Rebuilding the
server from scratch loses them. Re-create them from this file, and re-sync the
site files from the site's repo.

## Rules that keep Unwind safe

1. **`site2.conf` must always be valid.** The container loads it on every
   start and every deploy. A bad file, or one that references a certificate
   that doesn't exist, stops the frontend container and takes **Unwind down**.
2. **Only add the HTTPS blocks after the cert files exist** on the host.
3. **Always run `nginx -t` before reloading.** A reload with a failing config
   keeps the old config running, so test first and nothing changes if it fails.
4. **No AAAA record for `<domain>`.** nginx listens on IPv4 only
   (`listen 80;` / `listen 443 ssl;`), so IPv6 visitors would fail to connect.
5. **The second site needs its own port-80 block.** Requests for unknown hosts
   go to the first server block in `frontend/nginx.conf`, which redirects to
   `https://unwind.nu`.

## `/etc/unwind/extra-sites/site2.conf`

```nginx
# Port 80: ACME challenges for cert issuance and renewal, redirect the rest.
server {
    listen 80;
    server_name <domain> www.<domain>;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://<domain>$request_uri;
    }
}

# www -> apex
server {
    listen 443 ssl;
    http2 on;
    server_name www.<domain>;

    ssl_certificate /etc/letsencrypt/live/<domain>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<domain>/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers off;

    return 301 https://<domain>$request_uri;
}

# The site
server {
    listen 443 ssl;
    http2 on;
    server_name <domain>;

    ssl_certificate /etc/letsencrypt/live/<domain>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<domain>/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers off;

    root /usr/share/nginx/site2;
    index index.html;

    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy strict-origin-when-cross-origin;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

## Editing the config

On the VPS, from the repo directory (`~/unwind`):

```bash
sudo nano /etc/unwind/extra-sites/site2.conf
docker compose -f docker-compose.production.yml exec frontend nginx -t
docker compose -f docker-compose.production.yml exec frontend nginx -s reload
```

Only reload if `nginx -t` reports `syntax is ok` and `test is successful`. No
PR or deploy is needed for changes to this file.

**Emergency off-switch** if the second site ever causes trouble for Unwind:
move the file out of the directory (`sudo mv /etc/unwind/extra-sites/site2.conf
/etc/unwind/site2.conf.off`) and reload. Unwind keeps working.

## Setting it up from scratch

1. **DNS** at the registrar: A records for `@` and `www` pointing at the VPS
   IPv4 (`dig unwind.nu`). No AAAA. Wait until `dig <domain>` returns the IP.
2. **Directories** on the VPS:
   ```bash
   sudo mkdir -p /var/www/site2 /etc/unwind/extra-sites
   sudo chown $USER:$USER /var/www/site2
   ```
   Create them *before* the deploy that adds the mounts. Otherwise Docker
   creates them itself, owned by root, and `rsync` as your own user fails.
3. **Deploy the repo change** (the `include` line and the two mounts) through
   the normal `development` → `main` flow. See `ci-cd.md`.
4. **Port-80 block only** in `site2.conf` (the first block above), then
   `nginx -t` and reload. Check `curl -I http://<domain>/` returns a 301 to
   `https://<domain>/`, not to `unwind.nu`.
5. **Certificate**, same webroot method as the Unwind cert:
   ```bash
   sudo certbot certonly --webroot -w /var/www/certbot -d <domain> -d www.<domain>
   sudo ls /etc/letsencrypt/live/<domain>/     # fullchain.pem and privkey.pem
   ```
6. **HTTPS blocks**: append the other two blocks to `site2.conf`, `nginx -t`,
   reload.
7. **Publish the site files** from the site's repo (see its README).

## Certificate renewal

Certbot's timer renews both certificates over the port-80 `/.well-known/`
paths, so those must stay reachable. **The container reads certificates when
it starts**, so a renewed cert is only served after a reload or restart.
Without a reload hook, *both* sites' certs expire inside the running container
after about 90 days unless a deploy happens to restart it.

Check that something covers this:

```bash
sudo certbot certificates
sudo ls /etc/letsencrypt/renewal-hooks/deploy/
sudo certbot renew --dry-run
```

A deploy hook that runs
`docker compose -f docker-compose.production.yml exec -T frontend nginx -s reload`
from the repo directory (absolute path, since certbot runs hooks as root)
closes the gap.

Verify what is actually being served:

```bash
echo | openssl s_client -connect <domain>:443 -servername <domain> 2>/dev/null | openssl x509 -noout -dates
```

## Related

- `docs/ops/ci-cd.md`: how changes to `frontend/nginx.conf` and the compose
  file are deployed, and how to roll back.
- `docs/ops/server-access.md`: the `ssh unwind` setup.
