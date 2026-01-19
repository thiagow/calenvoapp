
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    let whereConditions: any = {
      userId: userId
    }

    if (search) {
      whereConditions.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          email: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          phone: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    const clients = await prisma.client.findMany({
      where: whereConditions,
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    const body = await request.json()
    const {
      name,
      email,
      phone,
      cpf,
      birthDate,
      address,
      notes
    } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    // Check if client already exists by name (to avoid duplicates)
    let client = await prisma.client.findFirst({
      where: {
        userId: userId,
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    })

    if (!client) {
      // Create new client if doesn't exist
      client = await prisma.client.create({
        data: {
          name,
          email,
          phone,
          cpf,
          birthDate: birthDate ? new Date(birthDate) : null,
          address,
          notes,
          user: {
            connect: {
              id: userId
            }
          }
        }
      })
    } else {
      // Update existing client with any new information provided
      client = await prisma.client.update({
        where: {
          id: client.id
        },
        data: {
          email: email || client.email,
          phone: phone || client.phone,
          cpf: cpf || client.cpf,
          birthDate: birthDate ? new Date(birthDate) : client.birthDate,
          address: address || client.address,
          notes: notes || client.notes
        }
      })
    }

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
