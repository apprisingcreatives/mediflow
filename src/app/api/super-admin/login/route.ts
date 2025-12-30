import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if environment variables are set
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      console.error("Missing Supabase environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const { data: admin, error } = await supabase
      .from("super_admins")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      console.error("Supabase query error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      // If table doesn't exist or no matching record, return invalid credentials
      if (error.code === "PGRST116" || error.code === "PGRST101") {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: "Database error", details: error.message },
        { status: 500 }
      );
    }

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // For demo purposes, accept "admin123" as password
    const isValidPassword =
      password === "admin123" ||
      (admin.password_hash &&
        (await bcrypt.compare(password, admin.password_hash)));

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
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
