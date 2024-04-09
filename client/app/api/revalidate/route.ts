import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const path = searchParams.get("path");
  const token = searchParams.get("token");

  if (!token) {
    return Response.json({
      revalidated: false,
      message: "Missing token",
    });
  }

  if (token !== process.env.REVALIDATE_TOKEN) {
    return Response.json({
      revalidated: false,
      message: "Invalid token",
    });
  }

  if (!path) {
    return Response.json({
      revalidated: false,
      message: "Missing path to revalidate",
    });
  }

  revalidatePath(path, "layout");
  return Response.json({ revalidated: true });
}
