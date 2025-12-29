# Supabase Migration Guide

This document describes the migration from AWS Cognito/DynamoDB to Supabase for authentication and data storage.

## Overview

The migration replaces:
- **AWS Cognito** -> **Supabase Auth** (with OTP/passwordless login)
- **AWS DynamoDB** (via API Gateway + Lambda) -> **Supabase PostgreSQL**
- **AWS IAM** -> **Supabase Row Level Security (RLS)**

## User Experience Changes

### Authentication Flow

**Before (Cognito):**
1. User enters email and password
2. For new users: Enter confirmation code from email
3. Password reset flow for forgotten passwords

**After (Supabase OTP):**
1. User enters email address
2. User receives a 6-digit code via email
3. User enters the code to authenticate
4. No passwords to remember or reset!

This flow works for both new and existing users - if the email doesn't exist, a new account is created automatically.

## Environment Setup

### Required Environment Variables

Set these environment variables before running the app:

```bash
export SUPABASE_URL=https://your-project-ref.supabase.co
export SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Project Setup

1. Create a new Supabase project at https://supabase.com
2. Run the SQL schema from `supabase-schema.sql` in the Supabase SQL editor
3. Copy your project URL and anon key to environment variables

### Database Schema

The schema includes:
- `palettes` table for storing palette metadata
- `colors` table for storing individual colors
- Row Level Security policies for user data isolation
- Indexes for common queries
- Automatic `updated_at` timestamps

## Technical Changes

### New Files
- `app/services/supabase.ts` - Supabase client wrapper
- `app/authenticators/supabase.ts` - ember-simple-auth authenticator
- `app/data-sources/remote.ts` - Orbit.js source using Supabase

### Removed Files
- `app/services/cognito.js`
- `app/authenticators/cognito.js`
- `app/components/forgot-password.gts`
- `app/components/register-confirm.gts`

### Modified Files
- `app/components/login.gts` - OTP flow UI
- `app/components/register.gts` - Simplified (OTP handles both)
- `config/environment.js` - Supabase config instead of Cognito
- `app/router.ts` - Removed unused routes

### Dependencies

**Removed:**
- `ember-cognito`
- `aws4fetch`

**Added:**
- `@supabase/supabase-js`

## Data Migration for Existing Users

If you have existing data in AWS DynamoDB:

1. Export your current data using Swach's export feature (Settings > Data > Export)
2. Log in to the new Supabase version
3. Import your data using the import feature

The import process will:
- Transform the data format automatically
- Apply your user ID to all records
- Preserve all relationships between palettes and colors

## Real-time Sync

Supabase enables real-time sync capabilities:
- Changes sync automatically across devices
- Other users' changes are invisible (RLS)
- Offline changes queue and sync when online

## Security

- Row Level Security (RLS) ensures users only see their own data
- OTP codes expire after a configurable time
- Session tokens refresh automatically
- No passwords stored (passwordless auth)

## Troubleshooting

### "Supabase configuration is missing"
Make sure `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables are set.

### "Invalid or expired OTP"
Request a new code - codes expire after a few minutes.

### "Remote requests require authentication"
Make sure you're logged in before syncing.

### Real-time sync not working
Check that RLS policies are applied correctly and the `supabase_realtime` publication includes your tables.
