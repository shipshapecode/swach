# 🗂️ Supabase Migration Guide

This guide will help users migrate their data from AWS (Cognito + DynamoDB) to Supabase seamlessly.

## 📋 Migration Overview

The migration moves your Swach color data from AWS infrastructure to Supabase while preserving all your existing palettes and color collections.

## 🎯 What You Need to Do

### Step 1: Export Your Current Data

1. Open the current version of Swach (still using AWS)
2. Go to **Settings → Data Management**
3. Click **"Export Swatches"** button
4. Save the `swach-data.json` file to your computer
5. This exports ALL your palettes and colors including relationships

### Step 2: Prepare Supabase Environment

1. Make sure you have your Supabase project URL and keys
2. Set environment variables:
   ```bash
   export SUPABASE_URL=https://your-project-ref.supabase.co
   export SUPABASE_ANON_KEY=your-anon-key
   ```
3. Or update them directly in your `.env` file

### Step 3: Create Supabase Tables

Run the schema setup SQL from `supabase-schema.sql`:

```sql
-- Connect to your Supabase project SQL editor
-- Run the complete schema from: app/supabase-schema.sql
```

### Step 4: Import Your Data

1. Start the new version of Swach (with Supabase integration)
2. Go to **Settings → Data Management**
3. Click **"Import Swatches"** button
4. Select your `swach-data.json` file
5. Confirm the import - your data will be automatically transformed for Supabase
6. Verify all your palettes and colors are present

## ✅ Migration Verification

After migration, verify:

- [ ] **All palettes imported** - Check names, colors, and order
- [ ] **Color History palette** - Should be present and properly marked
- [ ] **Favorites preserved** - Starred palettes should remain favorites
- [ ] **Locked status** - Any locked palettes should remain locked
- [ ] **User isolation** - Only your data should be visible

## 🔧 What Happens During Migration

### Data Transformation

- **camelCase → snake_case**: Database columns are converted automatically
- **UUID preservation**: All record IDs are maintained
- **User ownership**: Your user ID is automatically applied to all records
- **Relationships**: Palette → Color connections are preserved
- **Legacy cleanup**: Old `hex` attributes are removed

### Security

- **Row Level Security**: Each user can only see their own data
- **Automatic user_id**: Your Supabase user ID is applied to all imported records
- **No data exposure**: Complete isolation between users

## 🚨 Troubleshooting

### Import Issues

- **"Invalid JSON"**: Make sure the export file isn't corrupted
- **"Missing relationships"**: Ensure both palettes and colors are in the export
- **"Permission denied"**: Check that RLS policies are applied correctly

### Authentication Issues

- **"Invalid credentials"**: Verify Supabase URL and anon key are correct
- **"Auth not working"**: Check that user account is properly created in Supabase

### Data Issues

- **Missing colors**: Colors should be linked to palettes, check relationships
- **Wrong order**: Verify `colorOrder` arrays are preserved
- **Duplicate palettes**: Check if `isColorHistory` constraint is violated

## 📞 Migration Support

### What to Export First

Before migration, export includes:

- ✅ All palettes with full color relationships
- ✅ Color history palette
- ✅ User preferences (favorites, locked palettes)
- ✅ Creation timestamps
- ✅ Custom palette names

### What Gets Automatically Fixed

- ✅ Legacy `hex` attributes removed (Supabase doesn't need them)
- ✅ Proper UUID primary keys
- ✅ User ownership applied
- ✅ Data type validation (RGB values 0-255, alpha 0-1.0)

### What's Preserved

- ✅ All color data (RGBA values)
- ✅ Palette metadata (names, flags, order)
- ✅ User-created content
- ✅ Custom color names

## 🎉 After Migration Success

Once migration is complete:

1. **Delete the old AWS version** (optional but recommended)
2. **Enjoy the benefits**: Real-time sync, simpler maintenance
3. **Backup your data**: Keep the export file as backup
4. **Share feedback**: Let us know how the migration went

## 🔗 Additional Resources

- **Supabase Dashboard**: https://app.supabase.com
- **Database Schema**: See `app/supabase-schema.sql`
- **Issue Reports**: Report any migration problems on GitHub
- **Live Chat**: Join our Discord for real-time help

---

## 📝 Migration Checklist

**Before Export:**

- [ ] Have current Swach working with AWS
- [ ] Can access all your palettes and colors
- [ ] No pending unsynced changes

**During Export:**

- [ ] Successfully export all data to JSON
- [ ] File saves to downloads folder
- [ ] File size seems reasonable

**After Import:**

- [ ] All palettes present with correct colors
- [ ] Color history palette exists and is unique
- [ ] Can create new palettes and colors
- [ ] Real-time sync working

**Final:**

- [ ] Old version decommissioned
- [ ] Migration documented in your records
- [ ] All AWS resources cleaned up

---

_This migration is designed to be **user-safe** with multiple fallbacks and data integrity checks._
