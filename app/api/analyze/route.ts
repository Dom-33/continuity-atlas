import { NextResponse } from "next/server";
import { analyseWithAstra } from "@/lib/astra";
import { validatedCases } from "@/data/cases";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { query?: string };
    const query = body.query?.trim();

    if (!query) {
      return NextResponse.json({ error: "Enter a case to analyse." }, { status: 400 });
    }

    const result = await analyseWithAstra(query, validatedCases);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis request failed.";
    console.error("Continuity Atlas analysis failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
