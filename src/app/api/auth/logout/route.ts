import { NextResponse } from "next/server";
import { logoutCurrentSession } from "@/lib/authSession";

export const dynamic = "force-dynamic";

export async function POST() {
  logoutCurrentSession();
  return NextResponse.json({ ok: true });
}
