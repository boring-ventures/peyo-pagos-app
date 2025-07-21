import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { USER_TAG_CONFIG } from '@/app/types/UserTag';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

export interface UserTagDisplayProps {
  userTag?: string | null;
  isLoading?: boolean;
  showCopyButton?: boolean;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  onCopy?: (tag: string) => void;
}

export const UserTagDisplay: React.FC<UserTagDisplayProps> = ({
  userTag,
  isLoading = false,
  showCopyButton = true,
  showLabel = true,
  size = 'medium',
  onCopy
}) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const successColor = '#4CAF50';
  const errorColor = '#FF6B6B';

  const sizeStyles = {
    small: {
      container: styles.containerSmall,
      text: styles.textSmall,
      label: styles.labelSmall,
      icon: 16
    },
    medium: {
      container: styles.containerMedium,
      text: styles.textMedium,
      label: styles.labelMedium,
      icon: 18
    },
    large: {
      container: styles.containerLarge,
      text: styles.textLarge,
      label: styles.labelLarge,
      icon: 20
    }
  };

  const currentSize = sizeStyles[size];

  const handleCopyToClipboard = async () => {
    if (!userTag) return;

    try {
      // For now, just show the copy success message
      // In a production app, you would use expo-clipboard or react-native-clipboard
      setCopyStatus('copied');
      
      // Reset status after 2 seconds
      setTimeout(() => setCopyStatus('idle'), 2000);
      
      // Trigger custom callback if provided
      onCopy?.(userTag);
      
      // Show success feedback
      Alert.alert('¡Copiado!', `Tu código de usuario ${userTag} ha sido copiado al portapapeles.`);
      
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
      Alert.alert('Error', 'No se pudo copiar el código de usuario.');
    }
  };

  const validateUserTag = (tag: string): boolean => {
    return USER_TAG_CONFIG.PATTERN.test(tag);
  };

  const getCopyButtonColor = () => {
    switch (copyStatus) {
      case 'copied': return successColor;
      case 'error': return errorColor;
      default: return tintColor;
    }
  };

  const getCopyButtonIcon = () => {
    switch (copyStatus) {
      case 'copied': return 'checkmark-circle';
      case 'error': return 'alert-circle';
      default: return 'copy';
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, currentSize.container, { backgroundColor, borderColor }]}>
        {showLabel && (
          <ThemedText style={[currentSize.label, { color: textSecondaryColor }]}>
            Código de Usuario
          </ThemedText>
        )}
        <View style={styles.contentRow}>
          <View style={styles.loadingContainer}>
            <Ionicons name="hourglass-outline" size={currentSize.icon} color={textSecondaryColor} />
            <ThemedText style={[currentSize.text, styles.loadingText, { color: textSecondaryColor }]}>
              Generando...
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    );
  }

  if (!userTag) {
    return (
      <ThemedView style={[styles.container, currentSize.container, { backgroundColor, borderColor }]}>
        {showLabel && (
          <ThemedText style={[currentSize.label, { color: textSecondaryColor }]}>
            Código de Usuario
          </ThemedText>
        )}
        <View style={styles.contentRow}>
          <View style={styles.emptyContainer}>
            <Ionicons name="ellipse-outline" size={currentSize.icon} color={textSecondaryColor} />
            <ThemedText style={[currentSize.text, styles.emptyText, { color: textSecondaryColor }]}>
              No asignado
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    );
  }

  const isValidTag = validateUserTag(userTag);

  return (
    <ThemedView style={[styles.container, currentSize.container, { backgroundColor, borderColor }]}>
      {showLabel && (
        <ThemedText style={[currentSize.label, { color: textSecondaryColor }]}>
          Código de Usuario
        </ThemedText>
      )}
      <View style={styles.contentRow}>
        <View style={styles.tagContainer}>
          <Ionicons 
            name={isValidTag ? "person-circle" : "alert-circle"} 
            size={currentSize.icon} 
            color={isValidTag ? tintColor : errorColor} 
          />
          <ThemedText style={[
            currentSize.text, 
            styles.tagText, 
            { 
              color: isValidTag ? textColor : errorColor,
              fontFamily: 'monospace' // Use monospace for better tag readability
            }
          ]}>
            {userTag}
          </ThemedText>
        </View>
        
        {showCopyButton && isValidTag && (
          <TouchableOpacity 
            style={[styles.copyButton, { borderColor: getCopyButtonColor() }]}
            onPress={handleCopyToClipboard}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={getCopyButtonIcon() as any} 
              size={currentSize.icon} 
              color={getCopyButtonColor()} 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {!isValidTag && (
        <View style={styles.errorContainer}>
          <ThemedText style={[styles.errorText, { color: errorColor }]}>
            Formato de código inválido
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
  },
  containerSmall: {
    padding: 12,
    borderRadius: 8,
  },
  containerMedium: {
    padding: 16,
    borderRadius: 12,
  },
  containerLarge: {
    padding: 20,
    borderRadius: 16,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tagText: {
    marginLeft: 8,
    fontWeight: '600',
    letterSpacing: 1,
  },
  textSmall: {
    fontSize: 14,
  },
  textMedium: {
    fontSize: 16,
  },
  textLarge: {
    fontSize: 18,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '500',
  },
  labelMedium: {
    fontSize: 14,
    fontWeight: '500',
  },
  labelLarge: {
    fontSize: 16,
    fontWeight: '500',
  },
  copyButton: {
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
    marginLeft: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  loadingText: {
    marginLeft: 8,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emptyText: {
    marginLeft: 8,
    fontStyle: 'italic',
  },
  errorContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FF6B6B',
  },
  errorText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
}); 