# İaşApp Project Rules

## Git & GitHub Branch Workflow (`dev` -> `main`)

- **Default Development Branch:** Work on the `dev` branch by default. The `main` branch is reserved exclusively for live production (`https://iasapp.netlify.app/`).
- **Auto-Commit & Push to `dev`:** Whenever any requested code, style, configuration, or documentation change in this project is completed and verified, ensure the active branch is `dev` (`git checkout dev`), automatically stage (`git add`), commit (`git commit` using Conventional Commits messages like `feat: ...`, `fix: ...`, `style: ...`, `docs: ...`), and push to GitHub (`git push origin dev`) before finalizing the response.
- **Production Release (`main`):** Do not push directly to `main` unless the user explicitly asks to deploy/merge to production (e.g., "canlıya al", "main'e birleştir"). When requested, merge `dev` into `main`, push `origin main`, and immediately switch back to `dev`.
- **Exceptions:** Only skip committing/pushing if the user explicitly asks to keep changes local or if the work is incomplete/broken.
