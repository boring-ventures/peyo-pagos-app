import { OnboardingScreen } from '@/app/components/OnboardingScreen';
import { Strings } from '@/app/constants/Strings';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const TOTAL_SCREENS = 4;

export default function OnboardingCarouselScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useSharedValue(0);

  const screens = [
    {
      title: Strings.onboarding.screens[0].title,
      subtitle: Strings.onboarding.screens[0].subtitle,
      buttonText: Strings.onboarding.screens[0].buttonText,
      illustrationType: 'welcome' as const,
    },
    {
      title: Strings.onboarding.screens[1].title,
      subtitle: Strings.onboarding.screens[1].subtitle,
      buttonText: Strings.onboarding.screens[1].buttonText,
      illustrationType: 'management' as const,
    },
    {
      title: Strings.onboarding.screens[2].title,
      subtitle: Strings.onboarding.screens[2].subtitle,
      buttonText: Strings.onboarding.screens[2].buttonText,
      illustrationType: 'tech' as const,
    },
    {
      title: Strings.onboarding.screens[3].title,
      subtitle: Strings.onboarding.screens[3].subtitle,
      buttonText: Strings.onboarding.screens[3].buttonText,
      illustrationType: 'companion' as const,
    },
  ];

  const goToLogin = () => {
    router.replace('/(public)/login' as any);
  };

  const goToRegister = () => {
    router.replace('/(public)/register' as any);
  };

  const handleNext = () => {
    if (currentIndex < TOTAL_SCREENS - 1) {
      // Move to next screen
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      translateX.value = withSpring(-nextIndex * width);
    } else {
      // Last screen - go to register
      goToRegister();
    }
  };

  const handleSkip = () => {
    goToLogin();
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
      const shouldMoveToNext = event.translationX < -width / 3 && currentIndex < TOTAL_SCREENS - 1;
      const shouldMoveToPrev = event.translationX > width / 3 && currentIndex > 0;

      if (shouldMoveToNext) {
        runOnJS(setCurrentIndex)(currentIndex + 1);
        translateX.value = withSpring(-(currentIndex + 1) * width);
      } else if (shouldMoveToPrev) {
        runOnJS(setCurrentIndex)(currentIndex - 1);
        translateX.value = withSpring(-(currentIndex - 1) * width);
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

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={styles.container}>
        <Animated.View style={[styles.screensContainer, animatedStyle]}>
          {screens.map((screen, index) => (
            <OnboardingScreen
              key={index}
              title={screen.title}
              subtitle={screen.subtitle}
              buttonText={screen.buttonText}
              illustrationType={screen.illustrationType}
              currentStep={index}
              totalSteps={TOTAL_SCREENS}
              onNext={handleNext}
              onSkip={handleSkip}
              showSkip={index < TOTAL_SCREENS - 1} // Don't show skip on last screen
            />
          ))}
        </Animated.View>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screensContainer: {
    flex: 1,
    flexDirection: 'row',
    width: width * TOTAL_SCREENS,
  },
}); 