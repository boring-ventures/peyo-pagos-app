import { ActionButtons } from '@/app/components/ActionButtons';
import { BalanceCard } from '@/app/components/BalanceCard';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { TransactionItem } from '@/app/components/TransactionItem';
import { UserAvatar } from '@/app/components/UserAvatar';
import { useBridgeAutoRefresh } from '@/app/hooks/useBridgeAutoRefresh';
import { useRejectedUserCheck } from '@/app/hooks/useRejectedUserCheck';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { useAuthStore } from '@/app/store/authStore';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { profile, user } = useAuthStore();
  const [debugTapCount, setDebugTapCount] = useState(0);
  
  // Auto-refresh Bridge status on home screen
  useBridgeAutoRefresh();
  
  // Check for rejected users
  useRejectedUserCheck();
  
  const textColor = useThemeColor({}, 'text');
  const subtextColor = useThemeColor({}, 'textSecondary');

  // Sample data - replace with real data from your API
  const balance = "23,105.00";
  const transactions = [
    {
      id: '1',
      icon: 'basket-outline' as const,
      title: 'Grocery Shopping',
      date: 'Apr 18, 2024 • 10:58PM',
      amount: '-$75.50',
      isPositive: false,
    },
    {
      id: '2',
      icon: 'home-outline' as const,
      title: 'Rent Payment',
      date: 'Jun 14, 2024 • 12:11PM',
      amount: '-$1,200.00',
      isPositive: false,
    },
    {
      id: '3',
      icon: 'card-outline' as const,
      title: 'Salary Deposit',
      date: 'Mar 8, 2024 • 03:57PM',
      amount: '+$12,500.00',
      isPositive: true,
    },
    {
      id: '4',
      icon: 'card-outline' as const,
      title: 'Salary Deposit',
      date: 'Mar 8, 2024 • 03:57PM',
      amount: '+$12,500.00',
      isPositive: true,
    },
  ];

  const userName = profile?.first_name || 'Usuario';
  const greeting = `Bienvenido\n${userName}`;

  // Debug panel access (tap header 5 times)
  const handleHeaderTap = () => {
    const newCount = debugTapCount + 1;
    setDebugTapCount(newCount);
    
    if (newCount >= 5) {
      setDebugTapCount(0);
      router.push('/(private)/bridge-debug');
    }
  };

  const handleDeposit = () => {
    Alert.alert('Depositar', 'Función de depósito próximamente disponible');
  };

  const handleWithdraw = () => {
    Alert.alert('Retirar', 'Función de retiro próximamente disponible');
  };

  const handleTransactionPress = (transaction: any) => {
    Alert.alert(
      'Detalle de Transacción',
      `${transaction.title}\n${transaction.date}\n${transaction.amount}`
    );
  };

  const handleViewAllTransactions = () => {
    Alert.alert('Ver todas', 'Historial completo próximamente disponible');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <TouchableOpacity 
          style={styles.header}
          onPress={handleHeaderTap}
          activeOpacity={1}
        >
          <View style={styles.greetingContainer}>
            <Text style={[styles.greeting, { color: textColor }]}>
              {greeting}
            </Text>
          </View>
          <UserAvatar 
            size={50}
            firstName={profile?.first_name}
            lastName={profile?.last_name}
            imageUrl={profile?.avatar_url}
          />
        </TouchableOpacity>

        {/* Balance Card */}
        <BalanceCard balance={balance} />

        {/* Action Buttons */}
        <ActionButtons 
          onDeposit={handleDeposit}
          onWithdraw={handleWithdraw}
        />

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <ThemedText type="subtitle" style={styles.transactionsTitle}>
              Últimos movimientos
            </ThemedText>
            <TouchableOpacity onPress={handleViewAllTransactions}>
              <Text style={[styles.viewAllText, { color: '#4A90E2' }]}>
                Ver todos
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionsList}>
            {transactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                icon={transaction.icon}
                title={transaction.title}
                date={transaction.date}
                amount={transaction.amount}
                isPositive={transaction.isPositive}
                onPress={() => handleTransactionPress(transaction)}
              />
            ))}
          </View>
        </View>

        {/* Hidden debug info */}
        {debugTapCount > 0 && debugTapCount < 5 && (
          <Text style={styles.debugHint}>
            Taps: {debugTapCount}/5 para debug panel
          </Text>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for tab bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 30,
  },
  transactionsSection: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsList: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  debugHint: {
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.5,
    marginTop: 20,
    marginBottom: 10,
  },
}); 