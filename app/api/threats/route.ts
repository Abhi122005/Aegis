import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export async function GET() {
  try {
    const backendResponse = await fetch(`${BACKEND_URL}/threats/monthly`, {
      method: "GET",
      // Set no-cache to always fetch latest data from backend
      cache: "no-store", 
    });

    if (!backendResponse.ok) {
      const text = await backendResponse.text();
      throw new Error(`Backend returned ${backendResponse.status}: ${text}`);
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    return new NextResponse(
      JSON.stringify({
        error: "Backend proxy failed for /threats/monthly",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 502,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
