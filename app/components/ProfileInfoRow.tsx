import { useThemeColor } from '@/app/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { ThemedText } from './ThemedText';

type ProfileInfoRowProps = {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  action?: ReactNode;
};

export function ProfileInfoRow({ label, value, icon, style, action }: ProfileInfoRowProps) {
  const iconColor = useThemeColor({}, 'tint');

  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftContent}>
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={24} color={iconColor} />
          </View>
        )}
        <View style={styles.textContainer}>
          <ThemedText style={styles.label}>{label}</ThemedText>
          <ThemedText style={styles.value}>{value}</ThemedText>
        </View>
      </View>
      {action && <View style={styles.actionContainer}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    width: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionContainer: {
    marginLeft: 10,
  },
});

export default ProfileInfoRow; 