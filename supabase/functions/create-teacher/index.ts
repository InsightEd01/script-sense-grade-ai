
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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the current user from the request
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the current user is authenticated
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Authenticated user:', user.id)

    // Check if user is admin using the new school_admins table
    const { data: adminData, error: adminCheckError } = await supabaseAdmin
      .from('school_admins')
      .select('school_id, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (adminCheckError || !adminData) {
      console.error('Admin check error:', adminCheckError)
      
      // Fallback: check if user is admin in users table
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('role, school_id')
        .eq('id', user.id)
        .single()

      if (!userData || userData.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Only admins can create teachers' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // If user is admin but not in school_admins table, use their school_id from users table
      if (!userData.school_id) {
        return new Response(JSON.stringify({ error: 'Admin must be associated with a school' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      adminData.school_id = userData.school_id
    }

    console.log('Admin verified for school:', adminData.school_id)

    const { email, password, name } = await req.json()

    if (!email || !password || !name) {
      return new Response(JSON.stringify({ error: 'Email, password, and name are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create the user account
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

    // Create user record in users table
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: newUser.user.id,
        email: email,
        role: 'teacher',
        school_id: adminData.school_id
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

    // Create teacher record
    const { error: teacherError } = await supabaseAdmin
      .from('teachers')
      .insert({
        id: newUser.user.id,
        name: name,
        school_id: adminData.school_id,
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
        school_id: adminData.school_id
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
