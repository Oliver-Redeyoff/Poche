import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { StyleSheet, View, Alert, Button, TextInput, ScrollView, FlatList } from 'react-native'
import { Session } from '@supabase/supabase-js'
import { ThemedText } from './themed-text'
import { useThemeColor } from '@/hooks/use-theme-color'

interface Article {
  id: string
  title?: string
  content?: string
  url?: string
  created_at?: string
  [key: string]: any
}

export default function Account({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [website, setWebsite] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [articles, setArticles] = useState<Article[]>([])
  const [articlesLoading, setArticlesLoading] = useState(false)
  const borderColor = useThemeColor({}, 'icon')
  const backgroundColor = useThemeColor({}, 'background')
  const textColor = useThemeColor({}, 'text')

  useEffect(() => {
    if (session) {
      getProfile()
      getArticles()
    }
  }, [session])

  async function getProfile() {
    try {
      setLoading(true)
      if (!session?.user) throw new Error('No user on the session!')

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, website, avatar_url`)
        .eq('id', session?.user.id)
        .single()
      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setUsername(data.username)
        setWebsite(data.website)
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function getArticles() {
    try {
      setArticlesLoading(true)
      if (!session?.user) {
        throw new Error('No user on the session!')
      }
      
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('user_id', session.user.id)
        

      if (error) {
        throw error
      }

      if (data) {
        setArticles(data)
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error fetching articles', error.message)
      }
    } finally {
      setArticlesLoading(false)
    }
  }

  async function updateProfile({
    username,
    website,
    avatar_url,
  }: {
    username: string
    website: string
    avatar_url: string
  }) {
    try {
      setLoading(true)
      if (!session?.user) throw new Error('No user on the session!')

      const updates = {
        id: session?.user.id,
        username,
        website,
        avatar_url,
        updated_at: new Date(),
      }

      const { error } = await supabase.from('profiles').upsert(updates)

      if (error) {
        throw error
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <ThemedText type="defaultSemiBold" style={styles.label}>
          Email
        </ThemedText>
        <TextInput
          value={session?.user?.email || ''}
          editable={false}
          style={[styles.input, { borderColor, backgroundColor, color: textColor, opacity: 0.6 }]}
        />
      </View>
      <View style={styles.verticallySpaced}>
        <ThemedText type="defaultSemiBold" style={styles.label}>
          Username
        </ThemedText>
        <TextInput
          value={username || ''}
          onChangeText={(text) => setUsername(text)}
          placeholder="Username"
          placeholderTextColor={borderColor}
          autoCapitalize="none"
          style={[styles.input, { borderColor, backgroundColor, color: textColor }]}
        />
      </View>
      <View style={styles.verticallySpaced}>
        <ThemedText type="defaultSemiBold" style={styles.label}>
          Website
        </ThemedText>
        <TextInput
          value={website || ''}
          onChangeText={(text) => setWebsite(text)}
          placeholder="Website URL"
          placeholderTextColor={borderColor}
          autoCapitalize="none"
          keyboardType="url"
          style={[styles.input, { borderColor, backgroundColor, color: textColor }]}
        />
      </View>

      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button
          title={loading ? 'Loading ...' : 'Update'}
          onPress={() => updateProfile({ username, website, avatar_url: avatarUrl })}
          disabled={loading}
        />
      </View>

      <View style={styles.verticallySpaced}>
        <Button title="Sign Out" onPress={() => supabase.auth.signOut()} />
      </View>

      <View style={[styles.verticallySpaced, styles.mt20]}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
          My Articles ({articles.length})
        </ThemedText>
        {articlesLoading ? (
          <ThemedText style={styles.loadingText}>Loading articles...</ThemedText>
        ) : articles.length === 0 ? (
          <ThemedText style={styles.emptyText}>No articles found</ThemedText>
        ) : (
          <FlatList
            data={articles}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={[styles.articleCard, { borderColor, backgroundColor }]}>
                {item.title && (
                  <ThemedText type="defaultSemiBold" style={styles.articleTitle}>
                    {item.title}
                  </ThemedText>
                )}
                {item.url && (
                  <ThemedText style={[styles.articleUrl, { color: textColor }]}>
                    {item.url}
                  </ThemedText>
                )}
                {item.content && (
                  <ThemedText style={[styles.articleContent, { color: textColor }]} numberOfLines={3}>
                    {item.content}
                  </ThemedText>
                )}
                {item.created_at && (
                  <ThemedText style={[styles.articleDate, { color: borderColor }]}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </ThemedText>
                )}
              </View>
            )}
          />
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
    marginTop: 8,
  },
  loadingText: {
    marginTop: 8,
    opacity: 0.6,
  },
  emptyText: {
    marginTop: 8,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  articleCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  articleTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  articleUrl: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.7,
  },
  articleContent: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  articleDate: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.6,
  },
})