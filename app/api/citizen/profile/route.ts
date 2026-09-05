import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/mock-db';
import { StructuredAddress } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone parameter is required' },
        { status: 400 }
      );
    }

    const profile = mockDb.getCitizenProfileByPhone(phone);
    if (!profile) {
      return NextResponse.json(
        { success: false, message: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, address, savedLat, savedLng } = body;

    if (!name || !phone || !address) {
      return NextResponse.json(
        { success: false, error: 'Name, phone, and address are required' },
        { status: 400 }
      );
    }

    const saved = mockDb.saveCitizenProfile({
      name,
      phone,
      email,
      address: address as StructuredAddress,
      savedLat,
      savedLng,
    });

    return NextResponse.json({
      success: true,
      message: 'Citizen profile saved successfully',
      profile: saved,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
