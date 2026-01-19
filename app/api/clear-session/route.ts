
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = cookies()
    
    // Clear all NextAuth cookies
    const allCookies = cookieStore.getAll()
    
    const response = NextResponse.json({ 
      success: true, 
      message: 'Session cleared successfully',
      clearedCookies: allCookies.map(c => c.name)
    })
    
    // Delete all cookies
    allCookies.forEach(cookie => {
      response.cookies.delete(cookie.name)
    })
    
    // Specifically clear NextAuth cookies
    response.cookies.delete('next-auth.session-token')
    response.cookies.delete('__Secure-next-auth.session-token')
    response.cookies.delete('next-auth.csrf-token')
    response.cookies.delete('__Secure-next-auth.csrf-token')
    response.cookies.delete('next-auth.callback-url')
    response.cookies.delete('__Secure-next-auth.callback-url')
    
    return response
  } catch (error) {
    console.error('Error clearing session:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to clear session' 
    }, { status: 500 })
  }
}
