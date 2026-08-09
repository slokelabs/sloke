# Roadmap

> Direction of travel. Things will change; the **adapter interface** is the contract we commit to keeping stable.

## Vision

sloke becomes the standard way self-hosters move *any* resource into their media stack —
the `docker-compose` of download orchestration. One task bus, an adapter ecosystem, and
bridges that let you drive it from anywhere (Telegram, memos, CLI, webhooks).

## Phase 0 — Foundation (in progress)

- [ ] Monorepo setup (npm workspaces + TypeScript)
- [ ] Task data model (`Task`, `Adapter`, `Target`) and task store
- [ ] HTTP API: `POST /tasks`, `GET /tasks/:id`, `GET /adapters`, `POST /webhooks/task-completed`
- [ ] Adapter interface spec + TypeScript types (the stable contract)
- [ ] Config file + directory/ownership routing rules

## Phase 1 — First usable release (MVP)

- [ ] **qBittorrent adapter** (add torrent by magnet/link, report completion)
- [ ] **Direct-download adapter** (HTTP GET → file, with auth headers & size limits)
- [ ] **RSS adapter** (podcast feeds: poll, detect new episodes, download)
- [ ] Watched-folder intake (`drop a .magnet → it just works`)
- [ ] CLI: `sloke init`, `sloke run`, `sloke task add`
- [ ] Docker image + example `docker-compose.yml` wired to a real homelab layout
- [ ] Showcase: demo script showing BT + RSS + direct all landing in one tree

## Phase 2 — Ecosystem

- [ ] `yt-dlp` adapter (video direct-download)
- [ ] **sloke-bridge** repo: Telegram bot (send `/dl <url>` → creates task → notifies on done)
- [ ] `memos` bridge: "saved link" → auto task
- [ ] Webhook/notification targets (ntfy, Telegram, Discord)
- [ ] Adapter template repo + docs for third-party adapters
- [ ] Publish packages under `@sloke/*` on npm

## Phase 3 — Polish & scale

- [ ] Task queue with retries, backoff, concurrency limits
- [ ] Web UI (task dashboard) — or first-class API clients
- [ ] Multi-host / multi-user permissions
- [ ] Pluggable storage backends (SQLite first, then Postgres)
- [ ] `awesome-selfhosted` listing

## Non-goals (for now)

- Not a media *manager* — ABS/Kavita/Jellyfin stay your frontends
- Not a scraper itself — scrapers are *input adapters* (and third parties can build them)
- No VM/K8s control-plane ambitions

## How to help

Jump in where the checkboxes aren't checked. Start with the adapter interface spec or the
task store — those are the foundations everything else builds on.
