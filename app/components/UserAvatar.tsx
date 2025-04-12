import { useThemeColor } from '@/app/hooks/useThemeColor';
import { authService } from '@/app/services/authService';
import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import { ThemedText } from './ThemedText';

type UserAvatarProps = {
  imageUrl?: string | null;
  firstName?: string;
  lastName?: string;
  size?: number;
  style?: ViewStyle;
};

export function UserAvatar({ 
  imageUrl, 
  firstName = '', 
  lastName = '', 
  size = 100,
  style 
}: UserAvatarProps) {
  const backgroundColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'background');

  // Get initials from first and last name
  const getInitials = () => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  };

  // Calculate font size based on avatar size
  const fontSize = size * 0.4;

  // Determine if we need to use getAvatarUrl or if it's already a full URL
  const isFullUrl = imageUrl?.startsWith('http') || imageUrl?.startsWith('data:');
  const avatarUrl = imageUrl 
    ? isFullUrl 
      ? imageUrl 
      : authService.getAvatarUrl(imageUrl)
    : null;

  return (
    <View 
      style={[
        styles.container, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          backgroundColor: avatarUrl ? 'transparent' : backgroundColor 
        },
        style
      ]}
    >
      {avatarUrl ? (
        <Image 
          source={{ uri: avatarUrl }} 
          style={[
            styles.image, 
            { width: size, height: size, borderRadius: size / 2 }
          ]} 
        />
      ) : (
        <ThemedText
          style={[
            styles.initials,
            { fontSize, color: textColor }
          ]}
        >
          {getInitials()}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontWeight: 'bold',
  },
}); 