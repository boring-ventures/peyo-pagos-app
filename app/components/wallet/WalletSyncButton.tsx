/**
 * WalletSyncButton Component
 * Button for manual wallet synchronization with loading states and feedback
 */

import { ThemedText } from '@/app/components/ThemedText';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { WalletSyncButtonProps } from '@/app/types/WalletTypes';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

export const WalletSyncButton: React.FC<WalletSyncButtonProps> = ({
  onSync,
  isLoading = false,
  showText = true,
  disabled = false,
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  const handlePress = async () => {
    if (!disabled && !isLoading && onSync) {
      await onSync();
    }
  };

  const buttonStyle = [
    styles.button,
    {
      backgroundColor: disabled ? borderColor : backgroundColor,
      borderColor: disabled ? borderColor : tintColor,
    },
    !showText && styles.iconOnlyButton,
  ];

  const iconColor = disabled ? textColor : tintColor;
  const textColorFinal = disabled ? textColor : tintColor;

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={iconColor}
            style={showText ? styles.iconWithText : undefined}
          />
        ) : (
          <Ionicons
            name="refresh-outline"
            size={20}
            color={iconColor}
            style={showText ? styles.iconWithText : undefined}
          />
        )}
        
        {showText && (
          <ThemedText 
            style={[
              styles.buttonText, 
              { color: textColorFinal }
            ]}
          >
            {isLoading ? 'Syncing...' : 'Sync Wallets'}
          </ThemedText>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  iconOnlyButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    minWidth: 44,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWithText: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 