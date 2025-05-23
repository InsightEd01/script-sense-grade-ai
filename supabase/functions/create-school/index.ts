
// Define the create-school function that will be deployed as a Supabase Edge Function
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RequestBody {
  schoolName: string;
  schoolAddress: string | null;
  userId: string;
}

serve(async (req) => {
  try {
    // Create a Supabase client with the admin key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the request body
    const { schoolName, schoolAddress, userId } = await req.json() as RequestBody

    if (!schoolName || !userId) {
      return new Response(
        JSON.stringify({ error: 'School name and user ID are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Insert the new school record with service role to bypass RLS
    const { data, error } = await supabase
      .from('schools')
      .insert({
        name: schoolName,
        address: schoolAddress,
        created_by: userId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating school:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Return the new school data
    return new Response(
      JSON.stringify(data),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
