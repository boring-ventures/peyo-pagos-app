import { useThemeColor } from '@/app/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { ThemedText } from './ThemedText';

type ActionCardProps = {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  style?: ViewStyle;
};

export function ActionCard({ title, subtitle, icon, onPress, style }: ActionCardProps) {
  const backgroundColor = useThemeColor({}, 'card');
  const iconColor = useThemeColor({}, 'tint');

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { backgroundColor },
        style
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      {icon && (
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={28} color={iconColor} />
        </View>
      )}
      <View style={styles.textContainer}>
        <ThemedText type="subtitle" style={styles.title}>{title}</ThemedText>
        {subtitle && <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>}
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={22} color={iconColor} style={styles.arrow} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.7,
  },
  arrow: {
    marginLeft: 8,
  },
});

export default ActionCard; 