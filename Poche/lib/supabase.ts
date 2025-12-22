import 'expo-sqlite/localStorage/install'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = "https://ixpfqquzduzwktjaumtn.supabase.co"
const supabasePublishableKey = "sb_publishable_i2csvda3pa7hm_1cJk6Vvw_s_LiATFY"

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })

