import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from "@/lib/supabase-admin";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clinicId: string; questionId: string }> }
) {
  try {
    const { clinicId, questionId } = await params;

    // Auth: verify authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: question, error } = await supabaseAdmin
      .from("clinic_onboarding_questions")
      .select("*")
      .eq("id", questionId)
      .eq("clinic_id", clinicId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Error fetching onboarding question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clinicId: string; questionId: string }> }
) {
  try {
    const { clinicId, questionId } = await params;

    // Auth: verify clinic admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is clinic admin
    const { data: admin } = await supabaseAdmin
      .from('clinic_admins')
      .select('id')
      .eq('auth_user_id', user.id)
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Only accept known fields to prevent mass assignment
    const allowedFields: Record<string, unknown> = {};
    const knownFields = [
      'question_text',
      'question_type',
      'options',
      'is_required',
      'display_order',
      'category',
      'is_active',
    ] as const;
    for (const field of knownFields) {
      if (field in body) {
        allowedFields[field] = body[field];
      }
    }

    const { data: question, error } = await supabaseAdmin
      .from("clinic_onboarding_questions")
      .update({
        ...allowedFields,
        updated_at: new Date().toISOString(),
      })
      .eq("id", questionId)
      .eq("clinic_id", clinicId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Error updating onboarding question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ clinicId: string; questionId: string }> }
) {
  try {
    const { clinicId, questionId } = await params;

    // Auth: verify clinic admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is clinic admin
    const { data: admin } = await supabaseAdmin
      .from('clinic_admins')
      .select('id')
      .eq('auth_user_id', user.id)
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete by setting is_active to false
    const { error } = await supabaseAdmin
      .from("clinic_onboarding_questions")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", questionId)
      .eq("clinic_id", clinicId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting onboarding question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
