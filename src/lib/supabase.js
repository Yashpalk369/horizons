import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://seaxoymyktpphhllfpje.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlYXhveW15a3RwcGhobGxmcGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5ODk5ODksImV4cCI6MjA2MzU2NTk4OX0.64EQdCkKceUOBaLSgmNbiQyFioOfReEjv8rGjb4lMoQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
