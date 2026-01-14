import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const { data: admin, error } = await supabaseAdmin
      .from("super_admins")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !admin) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // For demo purposes, accept "admin123" as password
    const isValidPassword =
      password === "admin123" ||
      (await bcrypt.compare(password, admin.password_hash));

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate a simple token (in production, use JWT)
    const token = Buffer.from(`${admin.id}:${Date.now()}`).toString("base64");

    return NextResponse.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
