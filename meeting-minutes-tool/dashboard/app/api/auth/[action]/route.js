import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  const { action } = params; // "login" or "register"
  if (action !== "login" && action !== "register") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const body = await request.json();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://13.60.66.170:8000";

  try {
    const res = await fetch(`${apiUrl}/auth/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    const data = await res.json();
    
    // Set cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: "token",
      value: data.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
