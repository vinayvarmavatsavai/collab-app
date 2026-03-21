import { NextResponse } from "next/server";
import { offerings } from "@/lib/mock-offerings";

export async function GET() {
  return NextResponse.json(offerings);
}