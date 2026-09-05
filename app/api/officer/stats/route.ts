import { NextResponse } from 'next/server';
import { mockDb } from '@/lib/mock-db';

export async function GET() {
  try {
    const stats = mockDb.getStats();
    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch officer stats' },
      { status: 500 }
    );
  }
}
