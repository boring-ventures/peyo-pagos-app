import { OnboardingContent } from "@/app/components/OnboardingContent";
import { OnboardingProgress } from "@/app/components/OnboardingProgress";
import { ThemedButton } from "@/app/components/ThemedButton";
import ThemedText from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { Strings } from "@/app/constants/Strings";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const TOTAL_SCREENS = 4;

export default function OnboardingCarouselScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useSharedValue(0);
  const textSecondaryColor = useThemeColor({}, "textSecondary");

  const screens = [
    {
      title: Strings.onboarding.screens[0].title,
      subtitle: Strings.onboarding.screens[0].subtitle,
      buttonText: Strings.onboarding.screens[0].buttonText,
      illustrationType: "welcome" as const,
    },
    {
      title: Strings.onboarding.screens[1].title,
      subtitle: Strings.onboarding.screens[1].subtitle,
      buttonText: Strings.onboarding.screens[1].buttonText,
      illustrationType: "management" as const,
    },
    {
      title: Strings.onboarding.screens[2].title,
      subtitle: Strings.onboarding.screens[2].subtitle,
      buttonText: Strings.onboarding.screens[2].buttonText,
      illustrationType: "tech" as const,
    },
    {
      title: Strings.onboarding.screens[3].title,
      subtitle: Strings.onboarding.screens[3].subtitle,
      buttonText: Strings.onboarding.screens[3].buttonText,
      illustrationType: "companion" as const,
    },
  ];

  const goToGetStarted = () => {
    router.push("/(public)/get-started" as any);
  };

  const handleNext = () => {
    if (currentIndex < TOTAL_SCREENS - 1) {
      // Move to next screen
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      translateX.value = withSpring(-nextIndex * width);
    } else {
      // Last screen - go to get started auth screen
      goToGetStarted();
    }
  };

  const handleSkip = () => {
    goToGetStarted();
  };

  // Gesture handler for swipe navigation
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
    },
    onEnd: (event) => {
      const shouldMoveToNext =
        event.translationX < -width / 3 && currentIndex < TOTAL_SCREENS - 1;
      const shouldMoveToPrev =
        event.translationX > width / 3 && currentIndex > 0;

      if (shouldMoveToNext) {
        const nextIndex = currentIndex + 1;
        runOnJS(setCurrentIndex)(nextIndex);
        translateX.value = withSpring(-nextIndex * width);
      } else if (shouldMoveToPrev) {
        const prevIndex = currentIndex - 1;
        runOnJS(setCurrentIndex)(prevIndex);
        translateX.value = withSpring(-prevIndex * width);
      } else {
        translateX.value = withSpring(-currentIndex * width);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const currentScreen = screens[currentIndex];
  const showSkip = currentIndex < TOTAL_SCREENS - 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Fixed Header with Skip Button */}
        {showSkip && (
          <View style={styles.header}>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <ThemedText style={[styles.skipText, { color: textSecondaryColor }]}>
                {Strings.common.skip}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Animated Content Area */}
        <View style={styles.contentArea}>
          <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View style={[styles.contentContainer, animatedStyle]}>
              {screens.map((screen, index) => (
                <OnboardingContent
                  key={index}
                  title={screen.title}
                  subtitle={screen.subtitle}
                  illustrationType={screen.illustrationType}
                  style={{ width }}
                />
              ))}
            </Animated.View>
          </PanGestureHandler>
        </View>

        {/* Fixed Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Progress Indicator */}
          <OnboardingProgress
            currentStep={currentIndex}
            totalSteps={TOTAL_SCREENS}
            style={styles.progress}
          />

          {/* Action Button */}
          <ThemedButton
            title={currentScreen.buttonText}
            onPress={handleNext}
            size="large"
            style={styles.actionButton}
          />
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 16,
    paddingBottom: 8,
    minHeight: 48,
    paddingHorizontal: 24,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "500",
  },
  contentArea: {
    flex: 1,
    overflow: "hidden",
    width: width,
    justifyContent: "center",
  },
  contentContainer: {
    flexDirection: "row",
    width: width * TOTAL_SCREENS,
  },
  bottomSection: {
    paddingBottom: 32,
    minHeight: 120,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
  },
  progress: {
    marginBottom: 24,
  },
  actionButton: {
    width: "100%",
    marginHorizontal: 0,
    height: 56,
    borderRadius: 28,
  },
});
