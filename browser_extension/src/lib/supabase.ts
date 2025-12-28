import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ixpfqquzduzwktjaumtn.supabase.co"
const supabasePublishableKey = "sb_publishable_i2csvda3pa7hm_1cJk6Vvw_s_LiATFY"

// Custom storage adapter for browser extension
// Works with both Chrome and Firefox
const getStorage = (): chrome.storage.StorageArea | {
  get: (key: string) => Promise<{ [key: string]: string | null }>
  set: (items: { [key: string]: string }) => Promise<void>
  remove: (key: string) => Promise<void>
} => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return chrome.storage.local
  } else if (typeof browser !== 'undefined' && (browser as typeof chrome).storage) {
    return (browser as typeof chrome).storage.local
  }
  // Fallback to localStorage for development
  return {
    get: async (key: string): Promise<{ [key: string]: string | null }> => {
      const value = localStorage.getItem(key)
      return { [key]: value }
    },
    set: async (items: { [key: string]: string }): Promise<void> => {
      Object.entries(items).forEach(([key, value]) => {
        localStorage.setItem(key, value)
      })
    },
    remove: async (key: string): Promise<void> => {
      localStorage.removeItem(key)
    }
  }
}

const storage = getStorage()

const storageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const result = await storage.get(key)
    return result[key] || null
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await storage.set({ [key]: value })
  },
  removeItem: async (key: string): Promise<void> => {
    await storage.remove(key)
  }
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Keep session alive longer
    flowType: 'pkce',
  },
})

