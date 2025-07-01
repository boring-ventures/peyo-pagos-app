import { OnboardingSlide } from '@/app/components/OnboardingSlide';
import { OnboardingSvg1 } from '@/app/components/OnboardingSvg1';
import { OnboardingSvg2 } from '@/app/components/OnboardingSvg2';
import { OnboardingSvg3 } from '@/app/components/OnboardingSvg3';
import { OnboardingSvg4 } from '@/app/components/OnboardingSvg4';
import { Pagination } from '@/app/components/Pagination';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedView } from '@/app/components/ThemedView';
import { Strings } from '@/app/constants/Strings';
import { useOnboardingStore } from '@/app/store/onboardingStore';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function OnboardingCarouselScreen() {
  const router = useRouter();
  const { markOnboardingCompleted } = useOnboardingStore();
  const [activeSlide, setActiveSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  
  // Onboarding slides data with SVG components
  const slides = [
    {
      id: '1',
      title: Strings.onboarding.screens[0].title,
      subtitle: Strings.onboarding.screens[0].subtitle,
      SvgComponent: OnboardingSvg1,
    },
    {
      id: '2',
      title: Strings.onboarding.screens[1].title,
      subtitle: Strings.onboarding.screens[1].subtitle,
      SvgComponent: OnboardingSvg2,
    },
    {
      id: '3',
      title: Strings.onboarding.screens[2].title,
      subtitle: Strings.onboarding.screens[2].subtitle,
      SvgComponent: OnboardingSvg3,
    },
    {
      id: '4',
      title: Strings.onboarding.screens[3].title,
      subtitle: Strings.onboarding.screens[3].subtitle,
      SvgComponent: OnboardingSvg4,
    },
  ];
  
  const completeOnboarding = async () => {
    await markOnboardingCompleted();
    router.replace('/(public)/login');
  };
  
  const goToNextSlide = () => {
    if (activeSlide < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeSlide + 1,
        animated: true,
      });
    } else {
      completeOnboarding();
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        renderItem={({ item }) => (
          <OnboardingSlide
            title={item.title}
            subtitle={item.subtitle}
            SvgComponent={item.SvgComponent}
          />
        )}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setActiveSlide(index);
        }}
      />
      
      <View style={styles.bottomContainer}>
        <Pagination
          activeIndex={activeSlide}
          length={slides.length}
          scrollX={scrollX}
        />
        
        <View style={styles.buttonsContainer}>
          <ThemedButton
            title={Strings.common.skip}
            type="text"
            onPress={completeOnboarding}
          />
          
          <ThemedButton
            title={activeSlide === slides.length - 1 ? Strings.common.start : Strings.common.next}
            type="primary"
            onPress={goToNextSlide}
          />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomContainer: {
    padding: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
}); 