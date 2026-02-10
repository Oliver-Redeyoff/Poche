import React, { useRef } from 'react'
import { 
  StyleSheet, 
  View, 
  Dimensions, 
  Pressable,
} from 'react-native'
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedStyle, 
  interpolate,
  interpolateColor,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated'
import { useState } from 'react'
import { ThemedText } from '../components/themed-text'
import { ThemedView } from '../components/themed-view'
import { Button } from '../components/button'
import { Header } from '../components/header'
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

// Animated dot component that smoothly transitions based on scroll position
function PaginationDot({ 
  index, 
  scrollX, 
  accentColor, 
  dividerColor,
  onPress 
}: { 
  index: number
  scrollX: SharedValue<number>
  accentColor: string
  dividerColor: string
  onPress: () => void
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ]
    
    const width = interpolate(
      scrollX.value,
      inputRange,
      [8, 24, 8],
      'clamp'
    )
    
    const backgroundColor = interpolateColor(
      scrollX.value,
      inputRange,
      [dividerColor, accentColor, dividerColor]
    )
    
    return {
      width,
      backgroundColor,
    }
  })

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.dot, animatedStyle]} />
    </Pressable>
  )
}

export default function Onboarding() {
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]
  const textSecondary = useThemeColor({}, 'textSecondary')
  const { completeOnboarding } = useAuth()
  
  const scrollX = useSharedValue(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollViewRef = useRef<Animated.ScrollView>(null)

  const updateCurrentIndex = (index: number) => {
    setCurrentIndex(index)
  }

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x
      // Update the current index for button text (only when crossing index boundaries)
      const newIndex = Math.round(event.contentOffset.x / SCREEN_WIDTH)
      runOnJS(updateCurrentIndex)(newIndex)
    },
  })

  const goToSlide = (index: number) => {
    scrollViewRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true })
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
      {/* Header with Skip Button */}
      <Header 
        showLogo
        rightElement={
          <Pressable
            onPress={handleSkip}
            style={({ pressed }) => [
              styles.skipButton,
              pressed && styles.skipButtonPressed,
            ]}
          >
            <ThemedText style={[styles.skipText, { color: textSecondary }]}>
              Skip
            </ThemedText>
          </Pressable>
        }
      />

      {/* Slides */}
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
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
      </Animated.ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <PaginationDot
              key={index}
              index={index}
              scrollX={scrollX}
              accentColor={colors.accent}
              dividerColor={colors.divider}
              onPress={() => goToSlide(index)}
            />
          ))}
        </View>

        {/* Action Button */}
        <Button
          title={isLastSlide ? 'Get Started' : 'Next'}
          variant="primary"
          onPress={handleNext}
          iconRight={!isLastSlide ? (
            <IconSymbol name="chevron.right" size={18} color="white" />
          ) : undefined}
          textStyle={styles.actionButtonText}
        />
      </View>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    padding: 4,
  },
  skipButtonPressed: {
    opacity: 0.6,
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
  actionButtonText: {
    fontSize: 18,
  },
})
