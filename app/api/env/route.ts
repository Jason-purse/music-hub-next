import { NextResponse } from 'next/server'
import { getEnvironmentInfo } from '@/lib/env'
import { getAllPlugins } from '@/lib/plugins-db'

export async function GET() {
  const envInfo = getEnvironmentInfo()
  const plugins = getAllPlugins()

  return NextResponse.json({
    ...envInfo,
    installedPlugins: plugins.length,
  })
}
