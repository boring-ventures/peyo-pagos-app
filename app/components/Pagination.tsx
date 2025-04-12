import { useThemeColor } from '@/app/hooks/useThemeColor';
import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

type PaginationProps = {
  activeIndex: number;
  length: number;
  scrollX?: Animated.Value;
};

export const Pagination: React.FC<PaginationProps> = ({
  activeIndex,
  length,
  scrollX,
}) => {
  const tintColor = useThemeColor({}, 'tint');
  const inactiveColor = useThemeColor({}, 'tabIconDefault');

  // Si tenemos scrollX (para animación), lo usamos, sino se usa activeIndex
  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => {
        if (scrollX) {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 20, 10],
            extrapolate: 'clamp',
          });
          
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });
          
          return (
            <Animated.View
              key={`dot-${index}`}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  backgroundColor: tintColor,
                  opacity,
                },
              ]}
            />
          );
        }
        
        // Versión no animada
        return (
          <View
            key={`dot-${index}`}
            style={[
              styles.dot,
              {
                width: activeIndex === index ? 20 : 10,
                backgroundColor: activeIndex === index ? tintColor : inactiveColor,
                opacity: activeIndex === index ? 1 : 0.4,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const width = 300; // anchura aproximada de cada slide

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
}); 