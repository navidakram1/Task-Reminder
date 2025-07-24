# Development Workflow

## 1. Feature Development
- Create a new branch from `main`
- Implement the feature in `/src`
- Update or add tests

## 2. Testing
- Run tests locally before pushing
- Ensure all tests pass

## 3. Code Review
- Open a pull request to `main`
- Request review from at least one team member
- Address feedback and make necessary changes

## 4. Deployment
- Merge PRs only after approval and passing tests
- Deploy via Expo or web as needed

## 5. Environment
- Store secrets in `.env` (never commit secrets)
- Use environment variables for Supabase keys 