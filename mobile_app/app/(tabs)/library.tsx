import { useState, useEffect } from 'react'
import { StyleSheet, View, ScrollView, RefreshControl, Pressable, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { useHeaderHeight } from '@react-navigation/elements'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useThemeColor } from '@/hooks/use-theme-color'
import { Article, tagToColor } from '@poche/shared'
import { useAuth } from '../_layout'
import { loadArticlesFromStorage, syncArticles } from '@/lib/article-sync'
import { IconSymbol } from '@/components/ui/icon-symbol'

interface LibraryTile {
  id: string
  title: string
  count: number
  icon?: string
  color?: string
  filter: { type: 'all' | 'favorites' | 'tag'; value?: string }
}

const TILE_GAP = 12
const GRID_PADDING = 16

export default function LibraryScreen() {
  const { session } = useAuth()
  const router = useRouter()
  const headerHeight = useHeaderHeight()
  const { width: screenWidth } = useWindowDimensions()
  const [articles, setArticles] = useState<Article[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const textSecondary = useThemeColor({}, 'icon')
  const tintColor = useThemeColor({}, 'tint')
  const cardColor = useThemeColor({}, 'card')

  const topPadding = headerHeight
  // Calculate tile width: (screen - padding*2 - gap) / 2
  const tileWidth = (screenWidth - (GRID_PADDING * 2) - TILE_GAP) / 2

  useEffect(() => {
    if (session?.user) {
      loadStoredArticles()
    } else {
      setArticles([])
    }
  }, [session])

  async function loadStoredArticles() {
    try {
      if (!session?.user) return
      const storedArticles = await loadArticlesFromStorage(session.user.id)
      setArticles(storedArticles)
    } catch (error) {
      console.error('Error loading stored articles:', error)
    }
  }

  async function onRefresh() {
    setRefreshing(true)
    try {
      if (!session?.user) return
      const result = await syncArticles(session.user.id, { processImages: true })
      if (!result.error || result.allArticles.length > 0) {
        setArticles(result.allArticles)
      }
    } finally {
      setRefreshing(false)
    }
  }

  // Build the library tiles
  function buildTiles(): LibraryTile[] {
    const tiles: LibraryTile[] = []

    // All Articles tile
    tiles.push({
      id: 'all',
      title: 'All Articles',
      count: articles.length,
      icon: 'doc.text.fill',
      filter: { type: 'all' },
    })

    // Favorites tile
    const favoritesCount = articles.filter(a => a.isFavorite).length
    tiles.push({
      id: 'favorites',
      title: 'Favorites',
      count: favoritesCount,
      icon: 'star.fill',
      filter: { type: 'favorites' },
    })

    // Tag tiles
    const tagCounts = new Map<string, number>()
    articles.forEach(article => {
      if (article.tags) {
        article.tags.split(',').forEach(tag => {
          const trimmedTag = tag.trim()
          if (trimmedTag) {
            tagCounts.set(trimmedTag, (tagCounts.get(trimmedTag) || 0) + 1)
          }
        })
      }
    })

    // Sort tags alphabetically
    const sortedTags = Array.from(tagCounts.entries()).sort((a, b) => 
      a[0].toLowerCase().localeCompare(b[0].toLowerCase())
    )

    sortedTags.forEach(([tag, count]) => {
      tiles.push({
        id: `tag-${tag}`,
        title: tag,
        count,
        color: tagToColor(tag, 1.0),
        filter: { type: 'tag', value: tag },
      })
    })

    return tiles
  }

  function handleTilePress(tile: LibraryTile) {
    // Navigate to articles list with filter
    router.push({
      pathname: '/articles',
      params: {
        filterType: tile.filter.type,
        filterValue: tile.filter.value || '',
        title: tile.title,
      },
    })
  }

  if (!session?.user) {
    return null
  }

  const tiles = buildTiles()

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: topPadding, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tintColor}
            colors={[tintColor]}
            progressViewOffset={topPadding}
          />
        }
      >
        {/* Search Bar Placeholder */}
        <Pressable 
          style={[styles.searchBar, { backgroundColor: cardColor }]}
          onPress={() => {/* TODO: Implement search */}}
        >
          <IconSymbol name="magnifyingglass" size={20} color={textSecondary} />
          <ThemedText style={[styles.searchPlaceholder, { color: textSecondary }]}>
            Search articles...
          </ThemedText>
        </Pressable>

        {/* Tile Grid */}
        <View style={styles.tileGrid}>
          {tiles.map(tile => (
            <Pressable
              key={tile.id}
              style={({ pressed }) => [
                styles.tile,
                { backgroundColor: cardColor, width: tileWidth },
                pressed && styles.tilePressed,
              ]}
              onPress={() => handleTilePress(tile)}
            >
              <View style={styles.tileContent}>
                {tile.icon ? (
                  <IconSymbol 
                    name={tile.icon as any} 
                    size={28} 
                    color={tile.id === 'favorites' ? '#FFB800' : tintColor} 
                  />
                ) : (
                  <View style={[styles.tagDot, { backgroundColor: tile.color }]} />
                )}
                <ThemedText style={styles.tileTitle} numberOfLines={1}>
                  {tile.title}
                </ThemedText>
                <ThemedText style={[styles.tileCount, { color: textSecondary }]}>
                  {tile.count} {tile.count === 1 ? 'article' : 'articles'}
                </ThemedText>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchPlaceholder: {
    fontSize: 16,
    fontFamily: 'SourceSans3_400Regular',
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_PADDING,
    gap: TILE_GAP,
  },
  tile: {
    aspectRatio: 1.2,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tilePressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  tileContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  tileTitle: {
    fontSize: 18,
    fontFamily: 'Bitter_600SemiBold',
    marginTop: 8,
  },
  tileCount: {
    fontSize: 14,
    fontFamily: 'SourceSans3_400Regular',
  },
  tagDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
})
