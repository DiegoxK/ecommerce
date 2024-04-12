import { getAuthToken, url_apify } from "@/lib/epayco";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const token = await getAuthToken();

  if (!token) {
    throw new Error("Failed to get auth token");
  }

  myHeaders.append("Authorization", `Bearer ${token}`);

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(body),
    redirect: "follow" as RequestRedirect,
  };

  try {
    const response = await fetch(
      `${url_apify}/payment/session/create`,
      requestOptions
    );

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const result = await response.text();

    return NextResponse.json({ sessionId: JSON.parse(result).data.sessionId });
  } catch (error) {
    console.error("Error getting the Session Id:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
