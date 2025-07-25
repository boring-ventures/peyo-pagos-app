import { useThemeColor } from '@/app/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { ThemedText } from '../ThemedText';

interface BackButtonProps {
  title?: string;
  onPress?: () => void;
  style?: any;
  showTitle?: boolean;
}

export function BackButton({ 
  title = 'Atrás', 
  onPress, 
  style,
  showTitle = true 
}: BackButtonProps) {
  const router = useRouter();
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Ionicons 
          name="chevron-back" 
          size={24} 
          color={tintColor} 
          style={styles.icon}
        />
        {showTitle && (
          <ThemedText style={[styles.title, { color: tintColor }]}>
            {title}
          </ThemedText>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  icon: {
    marginRight: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
}); 