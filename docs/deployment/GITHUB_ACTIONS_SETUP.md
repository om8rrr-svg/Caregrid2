# GitHub Actions CI/CD Setup for Supabase

This guide explains how to set up automated deployment with Supabase using GitHub Actions.

## 🔑 Required GitHub Secrets

In your GitHub repository, go to **Settings > Secrets and variables > Actions** and add these secrets:

### Supabase Secrets

| Secret Name | Description | Where to Find |
|-------------|-------------|---------------|
| `SUPABASE_URL` | Your project URL | Supabase Dashboard > Settings > API |
| `SUPABASE_PROJECT_REF` | Project reference ID | Supabase Dashboard > Settings > General |
| `SUPABASE_ACCESS_TOKEN` | CLI automation token | Supabase Dashboard > Account > Access Tokens |
| `SUPABASE_SERVICE_ROLE` | Service role key (admin) | Supabase Dashboard > Settings > API |
| `SUPABASE_ANON_KEY` | Anonymous key (for tests) | Supabase Dashboard > Settings > API |

### Deployment Secrets (Optional)

| Secret Name | Description | Where to Find |
|-------------|-------------|---------------|
| `VERCEL_TOKEN` | Vercel deployment token | Vercel Dashboard > Settings > Tokens |
| `VERCEL_ORG_ID` | Vercel organization ID | Vercel project settings |
| `VERCEL_PROJECT_ID` | Vercel project ID | Vercel project settings |

## 🚦 Key Security Guidelines

### ✅ Safe to Use
- **SUPABASE_ANON_KEY**: Frontend/browser apps (enforces RLS)
- **SUPABASE_ACCESS_TOKEN**: CLI operations (migrations, schema)

### ⚠️ Server-Only (Never in Browser)
- **SUPABASE_SERVICE_ROLE**: Full admin access, bypasses RLS

### 🔒 Never Commit to Repo
- All keys and tokens should only exist as GitHub secrets
- Use `.env.example` files for documentation, never `.env` with real values

## 📋 Setup Steps

### 1. Create Supabase Access Token

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click your profile → **Access Tokens**
3. Click **Generate new token**
4. Name it "GitHub Actions CI/CD"
5. Copy the token and add as `SUPABASE_ACCESS_TOKEN` secret

### 2. Get Project Information

1. Go to your project in Supabase Dashboard
2. **Settings > General**: Copy **Reference ID** → `SUPABASE_PROJECT_REF`
3. **Settings > API**: Copy **Project URL** → `SUPABASE_URL`
4. **Settings > API**: Copy **service_role** key → `SUPABASE_SERVICE_ROLE`
5. **Settings > API**: Copy **anon** key → `SUPABASE_ANON_KEY`

### 3. Configure Workflow

The workflow file `.github/workflows/supabase-deploy.yml` will:

1. **Link to Supabase project** using access token
2. **Run migrations** with `supabase db push`
3. **Seed clinic data** using service role key
4. **Run tests** with anon key
5. **Deploy to Vercel** (if configured)

## 🔄 Workflow Triggers

- **Push to `main`**: Full deployment to production
- **Push to `staging`**: Deployment to staging environment
- **Pull requests**: Run tests and migrations check

## 📊 Data Seeding

The workflow includes a clinic data seeding step that:

- Uses the **service role key** to bypass RLS
- Reads from `assets/data/clinics.json`
- Performs upsert operations (insert or update)
- Verifies data integrity after seeding

## 🧪 Testing

Tests run with the **anon key** to ensure:
- RLS policies work correctly
- Frontend authentication flows
- API endpoints respect permissions

## 🚨 Troubleshooting

### Migration Fails
```bash
# Check if project is linked correctly
supabase status

# Verify access token has correct permissions
supabase projects list
```

### Data Seeding Fails
- Verify `SUPABASE_SERVICE_ROLE` is the service role key (not anon key)
- Check that `assets/data/clinics.json` exists and is valid JSON
- Ensure RLS policies allow service role to insert data

### Tests Fail
- Verify `SUPABASE_ANON_KEY` is correct
- Check that test database has proper RLS policies
- Ensure test data doesn't conflict with existing data

## 📝 Example Secret Values

```bash
# Example format (use your actual values)
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_PROJECT_REF=abcdefghijklmnop
SUPABASE_ACCESS_TOKEN=sbp_1234567890abcdef...
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔗 Useful Links

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)