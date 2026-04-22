import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const upstream = category
    ? `https://goodvibesclub.ai/api/brand?category=${encodeURIComponent(category)}`
    : 'https://goodvibesclub.ai/api/brand';

  try {
    const res = await fetch(upstream, { next: { revalidate: 3600 } });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ assets: [], categories: [] }, { status: 502 });
  }
}
