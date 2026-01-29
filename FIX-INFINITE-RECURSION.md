# 🚨 Fix: Infinite Recursion Error

## The Problem

Getting this error when logging in:
```json
{
  "code": "42P17",
  "message": "infinite recursion detected in policy for relation \"super_admins\""
}
```

---

## ✅ Quick Fix (2 minutes)

### Step 1: Run the Fix Migration

Go to Supabase Dashboard → SQL Editor → New Query

Copy and paste the entire contents of:
```
supabase/migrations/fix_super_admins_rls_recursion.sql
```

Click **Run** ▶️

---

### Step 2: Verify

You should see:
```
✅ RLS policies fixed successfully!
✅ Helper function created to prevent recursion
```

---

### Step 3: Test Login

Try logging in again. Should work now! 🎉

---

## 🤔 What Was Wrong?

### The Problem
```sql
-- This policy queried the same table it was protecting
CREATE POLICY "..." ON super_admins
USING (
  EXISTS (SELECT 1 FROM super_admins ...)  -- ← RECURSION!
);
```

When checking if user can SELECT from `super_admins`:
1. Policy checks: "Is user in super_admins table?"
2. To check that, it needs to SELECT from super_admins
3. Which triggers the policy again
4. Infinite loop! 🔄

---

### The Fix
```sql
-- Helper function with SECURITY DEFINER bypasses RLS
CREATE FUNCTION is_active_super_admin() ...
  SECURITY DEFINER;  -- ← Breaks the recursion

-- Policy now uses the function
CREATE POLICY "..." ON super_admins
USING (public.is_active_super_admin());  -- ✅ No recursion!
```

The function runs with elevated privileges and **bypasses RLS** when checking the table, breaking the cycle.

---

## 📋 What Changed

| Before | After |
|--------|-------|
| Policy queries `super_admins` directly | Policy calls helper function |
| Causes infinite recursion | Function bypasses RLS |
| Login fails with error | Login works! ✅ |

---

## 🔍 Files Updated

1. **Fix Migration**: `supabase/migrations/fix_super_admins_rls_recursion.sql`
   - Drops old policies
   - Creates helper function
   - Creates new policies using the function

2. **Main Migration**: `supabase/migrations/super_admins_rls.sql`
   - Updated to include helper function from the start

3. **Documentation**: 
   - `docs/SUPER-ADMINS-RLS.md` - Added helper function explanation
   - `docs/SUPER-ADMINS-RLS-QUICK-REF.md` - Added to troubleshooting

---

## ✅ After Fix

Your super admin login will work:
1. ✅ Enter email/password
2. ✅ `signInWithPassword()` creates session
3. ✅ Query super_admins table (no recursion!)
4. ✅ Check `is_active` status
5. ✅ Redirect to dashboard

---

**Need help?** Check `docs/SUPER-ADMINS-RLS.md` for full documentation.
