import { NextResponse } from 'next/server';
import { supabaseServer, handleDatabaseError } from '@/lib/supabase/server';

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('sports')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      const errorResponse = handleDatabaseError(error);
      return NextResponse.json(errorResponse, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching sports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
