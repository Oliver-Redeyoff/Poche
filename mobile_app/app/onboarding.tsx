import React, { useState, useRef } from 'react'
import { 
  StyleSheet, 
  View, 
  Dimensions, 
  TouchableOpacity, 
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent
} from 'react-native'
import { ThemedText } from '../components/themed-text'
import { ThemedView } from '../components/themed-view'
import { useThemeColor } from '@/hooks/use-theme-color'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { useAuth } from './_layout'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface OnboardingSlide {
  id: number
  icon: string
  title: string
  subtitle: string
  description: string
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    icon: 'books.vertical',
    title: 'Welcome to Poche',
    subtitle: 'Save it now. Read it later.',
    description: 'Your personal reading companion for saving articles from anywhere and reading them whenever you want.',
  },
  {
    id: 2,
    icon: 'square.and.arrow.down',
    title: 'Save from Anywhere',
    subtitle: 'One click to save',
    description: 'Use our browser extension for Chrome, Firefox, or Safari to save articles with a single click while you browse.',
  },
  {
    id: 3,
    icon: 'icloud.and.arrow.down',
    title: 'Read Offline',
    subtitle: 'No internet? No problem.',
    description: 'Articles are saved for offline reading. Perfect for flights, commutes, or anywhere without internet.',
  },
  {
    id: 4,
    icon: 'tag',
    title: 'Stay Organized',
    subtitle: 'Tags make it easy',
    description: 'Add tags to organize your reading list. Filter by topic, project, or priority to find any article in seconds.',
  },
]

export default function Onboarding() {
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]
  const textSecondary = useThemeColor({}, 'textSecondary')
  const { completeOnboarding } = useAuth()
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x
    const index = Math.round(contentOffset / SCREEN_WIDTH)
    setCurrentIndex(index)
  }

  const goToSlide = (index: number) => {
    scrollViewRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true })
    setCurrentIndex(index)
  }

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      goToSlide(currentIndex + 1)
    } else {
      completeOnboarding()
    }
  }

  const handleSkip = () => {
    completeOnboarding()
  }

  const isLastSlide = currentIndex === slides.length - 1

  return (
    <ThemedView style={styles.container}>
      {/* Skip Button */}
      {!isLastSlide && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <ThemedText style={[styles.skipText, { color: textSecondary }]}>
            Skip
          </ThemedText>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={styles.slideContent}>
              {/* Icon */}
              <View style={[styles.iconContainer, { backgroundColor: colors.accentLight }]}>
                <IconSymbol name={slide.icon as any} size={64} color={colors.accent} />
              </View>

              {/* Text Content */}
              <ThemedText style={styles.title}>{slide.title}</ThemedText>
              <ThemedText style={[styles.subtitle, { color: colors.accent }]}>
                {slide.subtitle}
              </ThemedText>
              <ThemedText style={[styles.description, { color: textSecondary }]}>
                {slide.description}
              </ThemedText>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => goToSlide(index)}
              style={[
                styles.dot,
                {
                  backgroundColor: index === currentIndex ? colors.accent : colors.divider,
                  width: index === currentIndex ? 24 : 8,
                }
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.accent }]}
          onPress={handleNext}
        >
          <ThemedText style={styles.actionButtonText}>
            {isLastSlide ? 'Get Started' : 'Next'}
          </ThemedText>
          {!isLastSlide && (
            <IconSymbol name="chevron.right" size={18} color="white" style={{ marginLeft: 4 }} />
          )}
        </TouchableOpacity>
      </View>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    fontFamily: 'SourceSans3_500Medium',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Bitter_700Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'SourceSans3_600SemiBold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: 'SourceSans3_400Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    gap: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'SourceSans3_600SemiBold',
  },
})
