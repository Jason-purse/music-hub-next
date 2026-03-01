import { NextResponse } from 'next/server'
import { BUILTIN_DATASOURCES } from '@/lib/datasources/builtin'
import { executeDataSource } from '@/lib/datasources/engine'

// POST /api/datasources/[id]/fetch
// Body: { paramOverrides?: Record<string, any> }
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const ds = BUILTIN_DATASOURCES.find(d => d.id === params.id)
  if (!ds) return NextResponse.json({ error: '数据源不存在' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const paramOverrides = body.paramOverrides || {}

  const result = await executeDataSource(ds, paramOverrides)

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ data: result.data, schema: ds.schema })
}

// GET /api/datasources/[id]/fetch?limit=10&sort=play_count (便于测试)
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const ds = BUILTIN_DATASOURCES.find(d => d.id === params.id)
  if (!ds) return NextResponse.json({ error: '数据源不存在' }, { status: 404 })

  const url = new URL(req.url)
  const paramOverrides: Record<string, any> = {}
  url.searchParams.forEach((v, k) => { paramOverrides[k] = v })

  const result = await executeDataSource(ds, paramOverrides)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })

  return NextResponse.json({ data: result.data, schema: ds.schema, source: ds.name })
}
