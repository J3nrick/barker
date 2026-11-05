# CI (not active yet)

`github-actions.yml` runs check, lint and build on every push and deploys to GitHub Pages.
It lives here because pushing files under `.github/workflows/` needs the `workflow` token scope.

To turn it on:

```bash
gh auth refresh -h github.com -s workflow
git mv ci/github-actions.yml .github/workflows/ci.yml
git commit -m "Enable CI" && git push
```

Then set *Settings → Pages → Source* to **GitHub Actions**. Until then the live site (https://j3nrick.github.io/barker/) is served from the `gh-pages` branch. Redeploy with `npm run deploy` in `app/`.
