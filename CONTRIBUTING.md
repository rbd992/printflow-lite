# Contributing to PrintFlow Lite

First — thank you for being here. It genuinely means a lot.

---

## A note from the developer

I started building PrintFlow because I run a small 3D print shop out of Alliston, Ontario, and couldn't find software that actually fit the way I work. What started as a tool for myself turned into something I wanted to share with other makers running their own shops.

I'm not a professional software developer by trade — I'm learning as I build. Every issue filed, every pull request, every suggestion, and every piece of feedback helps me grow as a developer and makes this tool better for everyone who uses it.

If you've found PrintFlow Lite useful, contributing — even in a small way — is one of the best things you can do to keep this project moving forward. Whether that's reporting a bug, suggesting a feature, improving the docs, or writing code, it all counts.

— Rob

---

## Ways to Contribute

### Report a Bug

Found something broken? Please [open a bug report](https://github.com/rbd992/printflow-lite/issues/new?template=bug_report.md).

Include:
- What you were doing when it happened
- What you expected vs. what actually happened
- Your OS and version (macOS, Windows, Linux)
- Any error messages from the app

### Suggest a Feature

Have an idea that would make PrintFlow Lite better for your shop? [Open a feature request](https://github.com/rbd992/printflow-lite/issues/new?template=feature_request.md). I read every one.

### Improve the Docs

If something in the README or Help section is confusing or missing, a pull request fixing it is incredibly welcome. Docs improvements are some of the most valuable contributions a project can receive.

### Submit a Pull Request

Ready to write code? Here's how:

1. **Fork** the repo and clone it locally
2. **Create a branch** — `git checkout -b fix/your-bug-name` or `feat/your-feature-name`
3. **Install dependencies** — `npm install` then `cd src/server && npm install && cd ../..`
4. **Run in dev mode** — `npm start`
5. **Make your changes** — keep them focused on one thing
6. **Test manually** — make sure nothing is broken
7. **Commit** with a clear message — `fix: order status not saving` or `feat: add weight tracking per spool`
8. **Open a pull request** describing what you changed and why

### Support the Project

If PrintFlow Lite saves you time or helps your business, consider [buying me a coffee](https://buymeacoffee.com/rbd992). It helps cover the time I put into building and maintaining this.

---

## Code Style

- JavaScript (no TypeScript for now — keeping the barrier to entry low)
- React functional components with hooks
- Keep components focused — one job per file
- Inline styles following the existing pattern (CSS variables for theming)
- No external UI libraries — everything is hand-built

---

## What's Planned

Check the [Issues](https://github.com/rbd992/printflow-lite/issues) tab for things I'm actively working on or considering. Issues labeled `good first issue` are great starting points if you're new to the codebase.

---

## Questions?

Open a [Discussion](https://github.com/rbd992/printflow-lite/discussions) or file an issue. I'll respond.

Thanks again for being here — it genuinely helps more than you know.
