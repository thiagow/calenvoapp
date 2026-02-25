export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const diagnostics: Record<string, any> = {
        timestamp: new Date().toISOString(),
        env: {}
    }

    // 1. Verificar variáveis de ambiente
    const envVars = [
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_ENDPOINT',
        'AWS_REGION',
        'AWS_BUCKET_NAME',
        'AWS_FOLDER_PREFIX',
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL'
    ]

    for (const v of envVars) {
        const val = process.env[v]
        diagnostics.env[v] = val
            ? `SET (${val.length} chars, starts: ${val.substring(0, 4)}...)`
            : 'NOT SET ❌'
    }

    // 2. Testar conexão com banco
    try {
        const { prisma } = await import('@/lib/db')
        const count = await prisma.user.count()
        diagnostics.database = `OK ✅ (${count} users)`
    } catch (err: any) {
        diagnostics.database = `ERRO ❌: ${err.message}`
    }

    // 3. Testar conexão S3
    try {
        const { createS3Client } = await import('@/lib/aws-config')
        const client = createS3Client()
        diagnostics.s3_client = 'Criado ✅'

        // Testar um HeadBucket
        const { HeadBucketCommand } = await import('@aws-sdk/client-s3')
        const { getBucketConfig } = await import('@/lib/aws-config')
        const { bucketName } = getBucketConfig()
        await client.send(new HeadBucketCommand({ Bucket: bucketName }))
        diagnostics.s3_bucket = `Acessível ✅ (${bucketName})`
    } catch (err: any) {
        diagnostics.s3_bucket = `ERRO ❌: ${err.message}`
    }

    // 4. Testar sessão
    try {
        const { getServerSession } = await import('next-auth')
        const { authOptions } = await import('@/lib/auth-options')
        const session = await getServerSession(authOptions)
        diagnostics.session = session?.user
            ? `OK ✅ (${session.user.email})`
            : 'Sem sessão (visitante)'
    } catch (err: any) {
        diagnostics.session = `ERRO ❌: ${err.message}`
    }

    return NextResponse.json(diagnostics, { status: 200 })
}
