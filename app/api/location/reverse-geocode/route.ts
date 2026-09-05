import { NextRequest, NextResponse } from 'next/server';
import { StructuredAddress } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { success: false, error: 'Both lat and lng query parameters are required' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { success: false, error: 'Invalid latitude or longitude numbers' },
        { status: 400 }
      );
    }

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'SevaSetu-GovCitizenRedressal/2.0',
      },
      next: { revalidate: 3600 }, // Cache 1 hour
    });

    if (!res.ok) {
      throw new Error(`Geocoding upstream responded with status ${res.status}`);
    }

    const json = await res.json();
    const a = json.address ?? {};

    const structuredAddress: StructuredAddress = {
      houseNo: a.house_number ?? '',
      building: a.building ?? a.amenity ?? a.neighbourhood ?? a.suburb ?? '',
      street: a.road ?? a.pedestrian ?? a.footway ?? a.path ?? '',
      city: a.city ?? a.town ?? a.village ?? a.district ?? a.county ?? 'Delhi',
      state: a.state ?? 'Delhi',
      pincode: a.postcode ?? '',
    };

    return NextResponse.json({
      success: true,
      displayName: json.display_name || '',
      address: structuredAddress,
      latitude: lat,
      longitude: lng,
    });
  } catch (error: any) {
    console.error('Reverse geocode error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Reverse geocoding failed',
        fallbackAddress: {
          houseNo: '',
          building: '',
          street: 'MG Road',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110001',
        },
      },
      { status: 500 }
    );
  }
}
