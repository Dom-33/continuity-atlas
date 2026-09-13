import { NextResponse } from "next/server";
import { analyseWithAstra } from "@/lib/astra";
import { validatedCases } from "@/data/cases";

export async function POST(request: Request) {
  const body = (await request.json()) as { query?: string };
  const query = body.query?.trim();

  if (!query) {
    return NextResponse.json({ error: "Enter a case to analyse." }, { status: 400 });
  }

  const result = await analyseWithAstra(query, validatedCases);
  return NextResponse.json(result);
}
