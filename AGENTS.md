# Agent Instructions

## Pull request workflow (required)

Every task that changes code or docs MUST end with an open pull request on GitHub. Do not stop at pushing a branch — the repository owner only reviews and merges PRs.

1. Create a feature branch off `main`, commit, and push it.
2. Create a PR targeting `main` with a clear title and a summary of the changes.
3. If the built-in PR tool fails (e.g. `Origin pull requests are not available for GitHub-mirrored repos`), fall back to the GitHub CLI, which is authenticated in this environment (binary may be at `/exec-daemon/gh` if not on PATH):

   ```sh
   gh auth status   # verify authentication first
   gh pr create --repo thilllon/blockies-typed --base main --head <branch> --title "<title>" --body "<summary>"
   ```

4. Report the PR URL to the user. Never merge PRs yourself.

## Development

- Package manager: `pnpm`
- Verify changes with `pnpm test`, `pnpm build`, and `pnpm lint` before opening a PR.
