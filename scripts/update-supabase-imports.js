/**
 * Script to update supabaseAdmin imports to use new supabase-admin.ts file
 * Run with: node scripts/update-supabase-imports.js
 */

const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/app/api/super-admin/clinics/[clinicId]/features/route.ts',
  'src/app/api/super-admin/clinics/route.ts',
  'src/app/api/super-admin/clinics/[clinicId]/route.ts',
  'src/app/api/super-admin/ai-features/route.ts',
  'src/app/api/clinics/[slug]/route.ts',
  'src/app/api/clinic/[clinicId]/subscribe/route.ts',
  'src/app/api/clinic/[clinicId]/payments/route.ts',
  'src/app/api/clinic/[clinicId]/patients/[patientId]/onboarding/route.ts',
  'src/app/api/clinic/[clinicId]/patients/[patientId]/documents/route.ts',
  'src/app/api/clinic/[clinicId]/onboarding/questions/route.ts',
  'src/app/api/clinic/[clinicId]/onboarding/questions/[questionId]/route.ts',
  'src/app/api/clinic/[clinicId]/onboarding/documents/route.ts',
  'src/app/api/clinic/[clinicId]/onboarding/documents/[documentId]/route.ts',
  'src/app/api/admin/schema/route.ts',
];

let updatedCount = 0;
let errorCount = 0;

filesToUpdate.forEach((file) => {
  const filePath = path.join(process.cwd(), file);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${file} (not found)`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Pattern 1: import { supabaseAdmin } from '@/lib/supabase';
    content = content.replace(
      /from ['"]@\/lib\/supabase['"]/g,
      "from '@/lib/supabase-admin'"
    );

    // Pattern 2: Split imports - import { supabase, supabaseAdmin } from '@/lib/supabase';
    content = content.replace(
      /import\s*{\s*supabase\s*,\s*supabaseAdmin\s*}\s*from\s*['"]@\/lib\/supabase['"]/g,
      "import { supabase } from '@/lib/supabase';\nimport { supabaseAdmin } from '@/lib/supabase-admin'"
    );

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated ${file}`);
      updatedCount++;
    } else {
      console.log(`ℹ️  No changes needed in ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${file}:`, error.message);
    errorCount++;
  }
});

console.log('\n' + '='.repeat(50));
console.log(`✅ Updated: ${updatedCount} files`);
console.log(`❌ Errors: ${errorCount} files`);
console.log('='.repeat(50));

if (updatedCount > 0) {
  console.log('\n📝 Next steps:');
  console.log('1. Restart your dev server');
  console.log('2. Check for any TypeScript errors');
  console.log('3. Test the updated API routes');
}
