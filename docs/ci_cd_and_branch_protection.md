# CI/CD, Branch Protection, and Environments

## CI Pipeline

The main CI workflow is defined in [.github/workflows/ci.yml](file:///C:/workspace/trae%20root/Habit_Tracker_Web_App/.github/workflows/ci.yml). It runs on pushes and pull requests to `main` and `develop` and:
- Lints client and server
- Runs tests for both packages
- Builds the React client
- Runs `npm audit` in client and server for security checks

## Release Pipeline (Semantic Versioning + Changelog)

The release workflow is defined in [.github/workflows/release.yml](file:///C:/workspace/trae%20root/Habit_Tracker_Web_App/.github/workflows/release.yml) and uses semantic-release to:
- Analyze commit messages
- Bump version in [package.json](file:///C:/workspace/trae%20root/Habit_Tracker_Web_App/package.json)
- Generate and update [CHANGELOG.md](file:///C:/workspace/trae%20root/Habit_Tracker_Web_App/CHANGELOG.md)
- Create GitHub releases

Commits should follow Conventional Commit style (e.g. `feat:`, `fix:`, `chore:`, `docs:`).

## Deploy Pipeline (Development and Production)

The deploy workflow is defined in [.github/workflows/deploy.yml](file:///C:/workspace/trae%20root/Habit_Tracker_Web_App/.github/workflows/deploy.yml). It is manually triggered and supports two environments:
- `development`
- `production`

The workflow uses environment-specific secrets:
- Development: `DEV_DEPLOY_URL`, `DEV_DEPLOY_TOKEN`
- Production: `PROD_DEPLOY_URL`, `PROD_DEPLOY_TOKEN`

Configure these in GitHub:
1. Go to **Settings → Environments**.
2. Create `development` and `production` environments.
3. Add the secrets for each environment.

## Dependabot

Dependabot configuration is in [.github/dependabot.yml](file:///C:/workspace/trae%20root/Habit_Tracker_Web_App/.github/dependabot.yml). It:
- Monitors npm dependencies in `/client` and `/server`
- Monitors GitHub Actions versions
- Opens weekly pull requests with updates

## Branch Protection for `main`

To enforce reviews and CI passing before merging:
1. Push this repository to GitHub and set `main` as the default branch.
2. In GitHub, go to **Settings → Branches → Branch protection rules**.
3. Add a rule for `main`:
   - Enable **Require a pull request before merging**.
   - Set at least 1 required reviewer.
   - Enable **Require status checks to pass before merging**.
   - Select the required checks, for example:
     - `CI / build-and-test (node-version: 14.x)`
     - `CI / build-and-test (node-version: 16.x)`
     - `CI / build-and-test (node-version: 18.x)`
     - `CI / security-audit`
   - Optionally enable **Require branches to be up to date before merging**.

## Secrets Management Summary

- CI uses the default `GITHUB_TOKEN` secret for releases.
- Deployments use environment-scoped secrets for development and production credentials.

