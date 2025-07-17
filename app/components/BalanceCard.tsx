import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface BalanceCardProps {
  balance: string;
  cardNumber?: string;
  expiryDate?: string;
  currency?: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  cardNumber = '5282 3456 7890 1289',
  expiryDate = '09/25',
  currency = '$'
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Balance Section */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>{currency}{balance}</Text>
        </View>

        {/* Card Details */}
        <View style={styles.cardDetails}>
          <Text style={styles.cardNumber}>{cardNumber}</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.expiryDate}>{expiryDate}</Text>
            <View style={styles.mastercardLogo}>
              <View style={[styles.circle, styles.redCircle]} />
              <View style={[styles.circle, styles.yellowCircle]} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 16,
  },
  card: {
    backgroundColor: '#4A90E2',
    borderRadius: 16,
    padding: 24,
    minHeight: 180,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  balanceSection: {
    marginBottom: 20,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: -1,
  },
  cardDetails: {
    marginTop: 'auto',
  },
  cardNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 2,
    marginBottom: 12,
  },
  cardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expiryDate: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  mastercardLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  redCircle: {
    backgroundColor: '#EB001B',
    marginRight: -6,
    zIndex: 1,
  },
  yellowCircle: {
    backgroundColor: '#FF5F00',
    zIndex: 2,
  },
}); 