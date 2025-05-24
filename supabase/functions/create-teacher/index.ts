
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create admin client with the correct service role key for admin operations
    const supabaseAdmin = createClient(
      'https://pppteoxncuuraqjlrhir.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwcHRlb3huY3V1cmFxamxyaGlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDAzNjgwNSwiZXhwIjoyMDU5NjEyODA1fQ.St80m_RyyeVGfwdPWGSJmAJLy6E0iCVcCikh6I3tf1I'
    )

    // Create regular client for user authentication
    const supabaseUser = createClient(
      'https://pppteoxncuuraqjlrhir.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwcHRlb3huY3V1cmFxamxyaGlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMzY4MDUsImV4cCI6MjA1OTYxMjgwNX0.XbnTDdFS7Tjgh3XTsrEZr81bJmsGJ4g6UA3lC_x_KTM'
    )

    // Get the current user from the request
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the current user is authenticated using the user client
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser(token)
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Authenticated user:', user.id)

    // Check if user is admin using the admin client (bypasses RLS)
    const { data: adminData, error: adminCheckError } = await supabaseAdmin
      .from('school_admins')
      .select('school_id, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    let schoolId = null;

    if (adminCheckError || !adminData) {
      console.log('Admin check via school_admins failed, checking users table:', adminCheckError)
      
      // Fallback: check if user is admin in users table using admin client
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('role, school_id')
        .eq('id', user.id)
        .single()

      if (userError || !userData || userData.role !== 'admin') {
        console.error('User is not an admin:', userError)
        return new Response(JSON.stringify({ error: 'Only admins can create teachers' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (!userData.school_id) {
        return new Response(JSON.stringify({ error: 'Admin must be associated with a school' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      schoolId = userData.school_id
    } else {
      schoolId = adminData.school_id
    }

    console.log('Admin verified for school:', schoolId)

    const { email, password, name } = await req.json()

    if (!email || !password || !name) {
      return new Response(JSON.stringify({ error: 'Email, password, and name are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create the user account using admin client with service role
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'teacher',
        name
      }
    })

    if (createError) {
      console.error('User creation error:', createError)
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('User created:', newUser.user.id)

    // Create user record in users table using admin client
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: newUser.user.id,
        email: email,
        role: 'teacher',
        school_id: schoolId
      })

    if (userError) {
      console.error('User record creation error:', userError)
      // Cleanup: delete the auth user if user record creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return new Response(JSON.stringify({ error: 'Failed to create user record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('User record created')

    // Get the admin record from school_admins for proper linking
    const { data: adminRecord } = await supabaseAdmin
      .from('school_admins')
      .select('id')
      .eq('user_id', user.id)
      .single()

    // Create teacher record using admin client
    const { error: teacherError } = await supabaseAdmin
      .from('teachers')
      .insert({
        id: newUser.user.id,
        name: name,
        school_id: schoolId,
        created_by_admin: adminRecord?.id || null
      })

    if (teacherError) {
      console.error('Teacher record creation error:', teacherError)
      // Cleanup: delete user and auth records if teacher creation fails
      await supabaseAdmin.from('users').delete().eq('id', newUser.user.id)
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return new Response(JSON.stringify({ error: 'Failed to create teacher record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Teacher created successfully')

    return new Response(JSON.stringify({ 
      success: true, 
      teacher: { 
        id: newUser.user.id, 
        email, 
        name,
        school_id: schoolId
      } 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
