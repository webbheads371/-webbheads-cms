import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function test() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'select 1' })
  console.log('Data:', data)
  console.log('Error:', error)
}
test()
