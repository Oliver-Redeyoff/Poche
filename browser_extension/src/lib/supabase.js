import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ixpfqquzduzwktjaumtn.supabase.co"
const supabasePublishableKey = "sb_publishable_i2csvda3pa7hm_1cJk6Vvw_s_LiATFY"

// Custom storage adapter for browser extension
// Works with both Chrome and Firefox
const getStorage = () => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return chrome.storage.local
  } else if (typeof browser !== 'undefined' && browser.storage) {
    return browser.storage.local
  }
  // Fallback to localStorage for development
  return {
    get: async (key) => {
      const value = localStorage.getItem(key)
      return { [key]: value }
    },
    set: async (items) => {
      Object.entries(items).forEach(([key, value]) => {
        localStorage.setItem(key, value)
      })
    },
    remove: async (key) => {
      localStorage.removeItem(key)
    }
  }
}

const storage = getStorage()

const storageAdapter = {
  getItem: async (key) => {
    const result = await storage.get(key)
    return result[key] || null
  },
  setItem: async (key, value) => {
    await storage.set({ [key]: value })
  },
  removeItem: async (key) => {
    await storage.remove(key)
  }
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
