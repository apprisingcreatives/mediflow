import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from "@/lib/supabase-admin";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  try {
    const { clinicId } = await params;

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

    const { data: questions, error } = await supabaseAdmin
      .from("clinic_onboarding_questions")
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Error fetching onboarding questions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  try {
    const { clinicId } = await params;

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
    const {
      question_text,
      question_type,
      options,
      is_required = true,
      display_order,
      category,
    } = body;

    if (!question_text || !question_type || display_order === undefined) {
      return NextResponse.json(
        { error: "Question text, type, and display order are required" },
        { status: 400 }
      );
    }

    const { data: question, error } = await supabaseAdmin
      .from("clinic_onboarding_questions")
      .insert({
        clinic_id: clinicId,
        question_text,
        question_type,
        options,
        is_required,
        display_order,
        category,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error("Error creating onboarding question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
