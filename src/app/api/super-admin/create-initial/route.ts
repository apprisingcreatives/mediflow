// import { NextResponse } from 'next/server';
// import { supabaseAdmin } from '@/lib/supabase';

// /**
//  * ONE-TIME USE ONLY: Create the initial super admin user
//  * After creating the first super admin, DELETE this file for security
//  * 
//  * Usage: POST to /api/super-admin/create-initial
//  * Body: { email: "admin@mediflow.com", password: "SecurePassword123", name: "Admin Name" }
//  */
// export async function POST(request: Request) {
//   try {
//     const { email, password, name } = await request.json();

//     if (!email || !password || !name) {
//       return NextResponse.json(
//         { error: 'Email, password, and name are required' },
//         { status: 400 },
//       );
//     }

//     // Check if a super admin already exists
//     const { data: existingAdmins } = await supabaseAdmin
//       .from('super_admins')
//       .select('id')
//       .limit(1);

//     if (existingAdmins && existingAdmins.length > 0) {
//       return NextResponse.json(
//         { 
//           error: 'Super admin already exists. Use the invitation flow instead.',
//           hint: 'Delete this API route for security.'
//         },
//         { status: 403 },
//       );
//     }

//     // Create Supabase Auth user
//     const { data: authData, error: authError } = 
//       await supabaseAdmin.auth.admin.createUser({
//         email,
//         password,
//         email_confirm: true, // Auto-confirm for initial admin
//         user_metadata: {
//           name,
//           role: 'super_admin',
//         },
//       });

//     if (authError || !authData.user) {
//       console.error('Auth creation error:', authError);
//       return NextResponse.json(
//         { error: authError?.message || 'Failed to create auth user' },
//         { status: 500 },
//       );
//     }

//     // Create super_admins record
//     const { data: admin, error: dbError } = await supabaseAdmin
//       .from('super_admins')
//       .insert({
//         auth_user_id: authData.user.id,
//         email,
//         name,
//         is_active: true,
//       })
//       .select()
//       .single();

//     if (dbError) {
//       // Rollback: delete auth user
//       await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
//       console.error('Database error:', dbError);
//       return NextResponse.json(
//         { error: 'Failed to create super admin record' },
//         { status: 500 },
//       );
//     }

//     return NextResponse.json({
//       message: 'Initial super admin created successfully',
//       admin: {
//         id: admin.id,
//         email: admin.email,
//         name: admin.name,
//         auth_user_id: admin.auth_user_id,
//       },
//       important: '⚠️ DELETE the file src/app/api/super-admin/create-initial/route.ts NOW for security!',
//     }, { status: 201 });

//   } catch (error) {
//     console.error('Unexpected error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 },
//     );
//   }
// }
