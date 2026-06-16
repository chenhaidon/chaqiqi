import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/authSession";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = getCurrentUser();
  return NextResponse.json({ user });
}
