# Contributing

Thanks for wanting to build sloke with us. This is an alpha project — the **adapter
interface is the contract** we're protecting, so read this before touching it.

## Getting started

```bash
npx ni
npx nr build
npx nr test
```

## Repo layout (npm workspaces)

```
packages/
  core/       task bus, task store, routing engine
  adapters/   qbt, direct, rss, yt-dlp (each a separate package)
  cli/        sloke CLI
  server/     HTTP API + daemon
docs/
  ADAPTER.md       the adapter contract (READ THIS FIRST)
  API.md           HTTP API spec
```

## The adapter contract

Adapters implement a small, stable interface. Any change to it goes through a review
checklist:

- Is it additive? (old adapters keep compiling without changes)
- Is the default behavior sane for a headless homelab daemon?
- Is the example in `docs/ADAPTER.md` updated?

## Commits

- Conventional Commits (`feat:`, `fix:`, `docs:`, ...)
- One logical change per commit
- Tests where it makes sense (task store and routing get the most love)

## Issues & PRs

- Open an issue first for anything beyond a trivial fix
- PRs should reference the issue
- Keep the surface small — a focused PR lands faster than a big-bang one

## License

By contributing you agree your contributions are licensed under the MIT license.
