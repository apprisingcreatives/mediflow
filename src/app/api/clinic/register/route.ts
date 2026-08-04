import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const DEFAULT_WORKING_HOURS = [
  { day_of_week: 1, start_time: '09:00:00', end_time: '17:00:00', is_available: true }, // Monday
  { day_of_week: 2, start_time: '09:00:00', end_time: '17:00:00', is_available: true }, // Tuesday
  { day_of_week: 3, start_time: '09:00:00', end_time: '17:00:00', is_available: true }, // Wednesday
  { day_of_week: 4, start_time: '09:00:00', end_time: '17:00:00', is_available: true }, // Thursday
  { day_of_week: 5, start_time: '09:00:00', end_time: '17:00:00', is_available: true }, // Friday
  { day_of_week: 6, start_time: '09:00:00', end_time: '17:00:00', is_available: false }, // Saturday
  { day_of_week: 0, start_time: '09:00:00', end_time: '17:00:00', is_available: false }, // Sunday
];

export async function POST(request: Request) {
  let createdClinicId: string | null = null;
  let createdAuthUserId: string | null = null;
  let createdPractitionerAuthUserId: string | null = null;

  try {
    const { clinic, practitioner, services } = await request.json();

    // --- Basic validations ---
    if (!clinic.name || !clinic.email || !clinic.password) {
      return NextResponse.json(
        { error: "Clinic name, email, and password are required" },
        { status: 400 }
      );
    }

    if (!practitioner.name || !practitioner.email || !practitioner.specialization) {
      return NextResponse.json(
        { error: "Practitioner name, email, and specialization are required" },
        { status: 400 }
      );
    }

    // --- Check if clinic/admin email already exists ---
    const { data: existingClinic } = await supabaseAdmin
      .from("clinics")
      .select("id")
      .eq("email", clinic.email)
      .single();

    if (existingClinic) {
      return NextResponse.json(
        { error: "A clinic with this email already exists" },
        { status: 400 }
      );
    }

    const { data: existingAdmin } = await supabaseAdmin
      .from("clinic_admins")
      .select("id")
      .eq("email", clinic.email)
      .single();

    if (existingAdmin) {
      return NextResponse.json(
        { error: "An admin with this email already exists" },
        { status: 400 }
      );
    }

    // --- Check if practitioner email already exists in system ---
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
    const emailInUse = existingAuthUser?.users?.some(u => u.email?.toLowerCase() === practitioner.email.toLowerCase());
    
    if (emailInUse) {
      return NextResponse.json(
        { error: "This practitioner email is already registered in the system" },
        { status: 400 }
      );
    }

    // --- Calculate trial dates ---
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    // --- Generate slug from clinic name ---
    const generateSlug = (name: string): string => {
      return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    };

    const baseSlug = generateSlug(clinic.name);
    let slug = baseSlug;
    let counter = 1;

    // Ensure slug is unique
    while (true) {
      const { data: existingSlug } = await supabaseAdmin
        .from("clinics")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!existingSlug) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // --- Create clinic ---
    const { data: newClinic, error: clinicError } = await supabaseAdmin
      .from("clinics")
      .insert({
        name: clinic.name,
        email: clinic.email,
        phone: clinic.phone || null,
        address: clinic.address || null,
        city: clinic.city || null,
        description: clinic.description || null,
        slug: slug,
        subscription_plan: clinic.subscription_plan || "starter",
        trial_start_date: trialStartDate.toISOString(),
        trial_end_date: trialEndDate.toISOString(),
        is_trial_active: true,
        is_subscription_active: true,
        payment_status: "trial",
      })
      .select()
      .single();

    if (clinicError) {
      return NextResponse.json({ error: clinicError.message }, { status: 500 });
    }

    createdClinicId = newClinic.id;

    // Create admin user in Supabase Auth with password
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: clinic.email,
        password: clinic.password,
        email_confirm: true, // Auto-confirm email for clinic admin
        user_metadata: {
          name: clinic.name + " Admin",
          role: "clinic_admin",
          clinic_id: newClinic.id,
        },
      });

    if (authError || !authUser.user) {
      throw new Error(authError?.message || "Failed to create admin user");
    }

    createdAuthUserId = authUser.user.id;

    // Insert admin record into clinic_admins table
    const baseAdminRecord = {
      clinic_id: newClinic.id,
      email: clinic.email,
      name: clinic.name + " Admin",
      role: "admin",
      auth_user_id: authUser.user.id,
    };

    let { error: adminInsertError } = await supabaseAdmin
      .from("clinic_admins")
      .insert({ ...baseAdminRecord, staff_role: "owner" });

    if (adminInsertError?.message?.includes("staff_role")) {
      ({ error: adminInsertError } = await supabaseAdmin
        .from("clinic_admins")
        .insert(baseAdminRecord));
    }

    if (adminInsertError) {
      throw new Error(adminInsertError.message);
    }

    // --- Invite/Create Practitioner ---
    const { data: invitedUser, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(practitioner.email, {
        data: {
          name: practitioner.name,
          specialization: practitioner.specialization,
          role: 'clinic_practitioner',
          clinic_id: newClinic.id,
          clinic_name: newClinic.name,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/practitioner/setup-account`,
      });

    if (inviteError || !invitedUser.user) {
      throw new Error(inviteError?.message || "Failed to send invitation to practitioner");
    }

    createdPractitionerAuthUserId = invitedUser.user.id;

    // Create practitioner record in database
    const { data: newPractitioner, error: practitionerError } = await supabaseAdmin
      .from('practitioners')
      .insert({
        auth_user_id: invitedUser.user.id,
        clinic_id: newClinic.id,
        name: practitioner.name,
        email: practitioner.email,
        specialization: practitioner.specialization,
        is_active: false, // Will be activated after confirmation/setup
      })
      .select()
      .single();

    if (practitionerError) {
      throw new Error(practitionerError.message || "Failed to create practitioner record");
    }

    // Get default branch created by DB trigger seed_default_branch
    const { data: defaultBranch } = await supabaseAdmin
      .from('branches')
      .select('id')
      .eq('clinic_id', newClinic.id)
      .eq('is_default', true)
      .single();

    if (defaultBranch) {
      // Assign practitioner to default branch
      await supabaseAdmin
        .from('practitioner_branches')
        .insert({
          practitioner_id: newPractitioner.id,
          branch_id: defaultBranch.id,
        });
    }

    // Update user metadata with practitioner_id
    await supabaseAdmin.auth.admin.updateUserById(invitedUser.user.id, {
      user_metadata: {
        name: practitioner.name,
        specialization: practitioner.specialization,
        role: 'clinic_practitioner',
        clinic_id: newClinic.id,
        clinic_name: newClinic.name,
        practitioner_id: newPractitioner.id,
      },
    });

    // Create default working hours
    const workingHoursData = DEFAULT_WORKING_HOURS.map(wh => ({
      ...wh,
      practitioner_id: newPractitioner.id,
    }));

    await supabaseAdmin
      .from('practitioner_working_hours')
      .insert(workingHoursData);

    // --- Insert services if provided ---
    if (services && services.length > 0) {
      const servicesToInsert = services.map(
        (service: {
          name: string;
          description?: string;
          duration?: string;
          price: string;
        }) => ({
          clinic_id: newClinic.id,
          name: service.name,
          description: service.description || null,
          duration_minutes: parseInt(service.duration || "30"),
          price: parseFloat(service.price),
        })
      );

      const { error: servicesInsertError } = await supabaseAdmin
        .from("clinic_services")
        .insert(servicesToInsert);

      if (servicesInsertError) {
        throw new Error(`Failed to insert clinic services: ${servicesInsertError.message}`);
      }
    }
    return NextResponse.json(
      {
        message: "Clinic registered successfully. Practitioner invite has been sent via email.",
        clinic: {
          ...newClinic,
          trial_end_date: trialEndDate.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);

    // Rollback
    if (createdPractitionerAuthUserId) {
      await supabaseAdmin.auth.admin.deleteUser(createdPractitionerAuthUserId);
    }
    if (createdAuthUserId) {
      await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
    }
    if (createdClinicId) {
      // Due to cascade constraints, deleting clinic deletes practitioner_branches, practitioner_working_hours, clinic_admins, clinic_services, branches
      await supabaseAdmin.from("clinics").delete().eq("id", createdClinicId);
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
