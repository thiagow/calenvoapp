import { DefaultSession } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      planType: string
      businessName?: string | null
      segmentType?: string | null
      masterId?: string | null
      isActive?: boolean
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: string
    planType: string
    businessName?: string | null
    segmentType?: string | null
    masterId?: string | null
    isActive?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?: string
    role?: string
    planType?: string
    businessName?: string | null
    segmentType?: string | null
    masterId?: string | null
    isActive?: boolean
  }
}
