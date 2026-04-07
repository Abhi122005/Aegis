import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export async function POST(request: Request) {
  try {
    const options: RequestInit & { duplex?: string } = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      ...(request.body ? { body: request.body, duplex: "half" } : {}),
    };

    const backendResponse = await fetch(`${BACKEND_URL}/simulate-attack`, options);

    const responseBody = await backendResponse.text();
    const contentType = backendResponse.headers.get("content-type") ?? "application/json";

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: { "content-type": contentType },
    });
  } catch (error) {
    return new NextResponse(
      JSON.stringify({
        error: "Backend proxy failed",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 502,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
