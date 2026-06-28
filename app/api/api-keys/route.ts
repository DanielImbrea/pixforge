import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const API_UNAVAILABLE = { error: 'API access is not available.' } as const;

export async function GET() {
  return NextResponse.json(API_UNAVAILABLE, { status: 404 });
}

export async function POST(_req: NextRequest) {
  return NextResponse.json(API_UNAVAILABLE, { status: 404 });
}

export async function DELETE(_req: NextRequest) {
  return NextResponse.json(API_UNAVAILABLE, { status: 404 });
}
