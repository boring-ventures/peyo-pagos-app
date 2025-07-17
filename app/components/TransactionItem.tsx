import { useThemeColor } from '@/app/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TransactionItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  date: string;
  amount: string;
  isPositive?: boolean;
  onPress?: () => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  icon,
  title,
  date,
  amount,
  isPositive = false,
  onPress
}) => {
  const textColor = useThemeColor({}, 'text');
  const subtextColor = useThemeColor({}, 'textSecondary');
  const iconBgColor = useThemeColor({ light: '#F5F5F5', dark: '#2A2A2A' }, 'background');
  const iconColor = useThemeColor({ light: '#4A90E2', dark: '#5A9DE8' }, 'tint');
  
  const amountColor = isPositive ? '#4CAF50' : textColor;

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          <Text style={[styles.amount, { color: amountColor }]}>{amount}</Text>
        </View>
        <Text style={[styles.date, { color: subtextColor }]}>{date}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  date: {
    fontSize: 12,
    opacity: 0.7,
  },
}); 