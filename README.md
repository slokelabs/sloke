<p align="center">
  <img src="https://raw.githubusercontent.com/slokelabs/.github/main/profile/assets/logo.svg" width="120" alt="sloke">
</p>

<h1 align="center">sloke</h1>

<p align="center">
  <b>Self-hosted download orchestration.</b><br>
  One task bus. Pluggable adapters. Everything lands in the right media directory.
</p>

<p align="center">
  <img alt="License" src="https://img.shields.io/github/license/slokelabs/sloke?color=%234ac694">
  <img alt="Bun" src="https://img.shields.io/badge/Bun-%3E%3D1.3-%234ac694">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-%234ac694">
  <img alt="Status" src="https://img.shields.io/badge/status-alpha-%23ff9800">
  <img alt="CI" src="https://img.shields.io/github/actions/workflow/status/slokelabs/sloke/ci.yml?color=%234ac694">
</p>

---

## What is this?

If you self-host a media stack, you've felt it: **BT needs qBittorrent, direct links need
aria2, podcast RSS needs yet another downloader — and every consumer service
(Audiobookshelf, Kavita, Jellyfin, Navidrome) mounts the same directories read-only.**

**sloke is the missing layer.** It's a small daemon that:

1. Receives a **task** (via HTTP API, watched folder, or webhook)
2. Routes it to the right **adapter** (qBittorrent for BT, built-in downloader for RSS/direct, ...)
3. Drops the result into the correct media directory with the right ownership
4. Lets your consumer services pick it up via their normal folder watching

```
                ┌─────────────────────────────┐
                │            sloke            │
                │    (task bus + adapters)    │
                └──────────┬──────────────────┘
              BT (.torrent/.magnet)      non-BT (URL/RSS/direct)
                           │                     │
                 ┌─────────┴──────────┐         │
                 ▼                    ▼         │
        qBittorrent (API)     built-in downloader
                 │                    │         │
                 └─────────┬──────────┘         │
                           ▼                    ▼
              /tank/home-resources/{Books,Videos,Music}/...
                           │
                           ▼
             consumer services (read-only mount, auto-scan)
```

## Why sloke?

- **One interface, all download types.** Stop maintaining qBT rules + aria2 + RSS tools separately.
- **Read-only consumers.** Your media servers never write; sloke writes, they watch.
- **Adaptable by design.** The adapter interface is the contract — write your own in minutes, or use someone else's.
- **Drops into your existing homelab.** Point it at your directories and go.

## Quick start

**Requires [Bun](https://bun.sh) ≥ 1.3** (a [Nix flake](flake.nix) dev shell is included).

```bash
# enter the dev shell (Nix users)
direnv allow

# install workspace deps
bun install

# run the API daemon
bun run dev          # listening on :3939
curl localhost:3939/healthz   # {"status":"ok"}
```

```bash
# create a download task
curl -X POST localhost:3939/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"type":"direct","source":"https://example.com/file.bin","target":{"library":"books","category":"downloads"}}'

# list tasks
curl localhost:3939/api/tasks
```

Enable the qBittorrent adapter by setting `QBT_URL`, `QBT_USER`, `QBT_PASS` (optionally
`QBT_CATEGORY`) before starting the daemon.

## Project layout

```
packages/
  core/       task model, adapter contract, routing engine
  adapters/   qbt, direct (each a separate factory)
  server/     Hono HTTP API + bun:sqlite task store
  cli/        sloke CLI
docs/
  ADAPTER.md  the adapter contract (READ THIS FIRST)
  API.md      HTTP API spec
develop/      nix dev shell + git-hooks
```

## Concepts

| Term | Meaning |
|---|---|
| **Task** | "download this resource to that target" — the unit of work |
| **Adapter** | something that can execute a task (qBT, aria2, RSS, yt-dlp, ...) |
| **Target** | the destination rule: media type → directory + ownership |
| **Bridge** | external connectors (Telegram, memos, webhooks) that *create* tasks |

## Status

**Alpha** — the core task bus, HTTP API, SQLite store, qBT and direct adapters are working.
The **adapter interface** is the one thing we'll keep stable.

## Roadmap

See [ROADMAP.md](ROADMAP.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
