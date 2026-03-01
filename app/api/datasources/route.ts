import { NextResponse } from 'next/server'
import { BUILTIN_DATASOURCES } from '@/lib/datasources/builtin'

// GET /api/datasources - 返回所有数据源
export async function GET() {
  return NextResponse.json({ datasources: BUILTIN_DATASOURCES })
}
