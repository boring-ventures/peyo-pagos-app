import { OnboardingSlide } from '@/app/components/OnboardingSlide';
import { Pagination } from '@/app/components/Pagination';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedView } from '@/app/components/ThemedView';
import { Strings } from '@/app/constants/Strings';
import { useThemedAsset } from '@/app/hooks/useThemedAsset';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, StyleSheet, View } from 'react-native';

// Placeholder para los logos hasta que el usuario los coloque
const imageLight1 = require('@/assets/images/icon-light.png');
const imageDark1 = require('@/assets/images/icon-dark.png');
const imageLight2 = require('@/assets/images/icon-light.png');
const imageDark2 = require('@/assets/images/icon-dark.png');
const imageLight3 = require('@/assets/images/icon-light.png');
const imageDark3 = require('@/assets/images/icon-dark.png');

const { width } = Dimensions.get('window');

export default function OnboardingCarouselScreen() {
  const router = useRouter();
  const [activeSlide, setActiveSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  
  // Imágenes con soporte para tema
  const image1 = useThemedAsset(imageLight1, imageDark1);
  const image2 = useThemedAsset(imageLight2, imageDark2);
  const image3 = useThemedAsset(imageLight3, imageDark3);
  
  // Datos del slider con las imágenes cargadas según el tema
  const slides = [
    {
      id: '1',
      title: Strings.onboarding.screens[0].title,
      subtitle: Strings.onboarding.screens[0].subtitle,
      image: image1,
    },
    {
      id: '2',
      title: Strings.onboarding.screens[1].title,
      subtitle: Strings.onboarding.screens[1].subtitle,
      image: image2,
    },
    {
      id: '3',
      title: Strings.onboarding.screens[2].title,
      subtitle: Strings.onboarding.screens[2].subtitle,
      image: image3,
    },
  ];
  
  const goToLogin = () => {
    router.replace('/(public)/login');
  };
  
  const goToNextSlide = () => {
    if (activeSlide < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeSlide + 1,
        animated: true,
      });
    } else {
      goToLogin();
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
            image={item.image}
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
            onPress={goToLogin}
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