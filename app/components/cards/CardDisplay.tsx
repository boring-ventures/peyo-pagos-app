import { useThemeColor } from '@/app/hooks/useThemeColor';
import { Card } from '@/app/types/Card';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { ThemedText } from '../ThemedText';

interface CardDisplayProps {
  card: Card;
  onPress?: () => void;
  showFullPan?: boolean;
  style?: any;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 40;
const CARD_HEIGHT = CARD_WIDTH * 0.63; // Standard credit card ratio

export function CardDisplay({ card, onPress, showFullPan = false, style }: CardDisplayProps) {
  const [showDetails, setShowDetails] = useState(showFullPan);
  const [flipAnimation] = useState(new Animated.Value(0));
  
  const cardBackground = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'background');
  const subtextColor = useThemeColor({ light: 'rgba(255,255,255,0.8)', dark: 'rgba(255,255,255,0.7)' }, 'background');
  const borderColor = useThemeColor({}, 'border');

  const formatPan = (pan: string) => {
    if (!pan) return '•••• •••• •••• ••••';
    
    if (showDetails) {
      // Format as groups of 4: 1234 5678 9012 3456
      return pan.replace(/(.{4})/g, '$1 ').trim();
    } else {
      // Show only last 4 digits: •••• •••• •••• 3456
      const lastFour = pan.slice(-4);
      return `•••• •••• •••• ${lastFour}`;
    }
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(balance);
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
    
    // Flip animation
    Animated.spring(flipAnimation, {
      toValue: showDetails ? 0 : 1,
      useNativeDriver: true,
    }).start();
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const CardFront = () => (
    <Animated.View
      style={[
        styles.cardContainer,
        { backgroundColor: cardBackground, transform: [{ rotateY: frontInterpolate }] },
        style,
      ]}
    >
      <TouchableOpacity
        style={styles.cardTouchable}
        onPress={onPress}
        activeOpacity={0.95}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.balanceContainer}>
            <Text style={[styles.balanceLabel, { color: subtextColor }]}>
              Balance disponible
            </Text>
            <Text style={[styles.balanceAmount, { color: textColor }]}>
              {formatBalance(card.available_balance)}
            </Text>
          </View>
          
          {/* Status indicator */}
          <View style={styles.statusContainer}>
            {card.frozen && (
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name="snow-outline" size={12} color={textColor} />
                <Text style={[styles.statusText, { color: textColor }]}>Congelada</Text>
              </View>
            )}
          </View>
        </View>

        {/* Card Number */}
        <View style={styles.cardNumberContainer}>
          <Text style={[styles.cardNumber, { color: textColor }]}>
            {formatPan(card.pan)}
          </Text>
          
          <TouchableOpacity onPress={toggleDetails} style={styles.toggleButton}>
            <Ionicons 
              name={showDetails ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color={textColor} 
            />
          </TouchableOpacity>
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.expiryContainer}>
            <Text style={[styles.expiryLabel, { color: subtextColor }]}>
              VÁLIDA HASTA
            </Text>
            <Text style={[styles.expiryDate, { color: textColor }]}>
              {card.display_expiration}
            </Text>
          </View>
          
          {showDetails && (
            <View style={styles.cvvContainer}>
              <Text style={[styles.cvvLabel, { color: subtextColor }]}>CVV</Text>
              <Text style={[styles.cvvNumber, { color: textColor }]}>
                {card.cvv}
              </Text>
            </View>
          )}
          
          {/* Card Brand Logo */}
          <View style={styles.cardBrand}>
            <View style={styles.mastercardContainer}>
              <View style={[styles.circle, styles.redCircle]} />
              <View style={[styles.circle, styles.yellowCircle]} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[styles.container, style]}>
      <CardFront />
      
      {/* Card actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[styles.actionButton, { borderColor }]}
          onPress={() => {/* Handle freeze/unfreeze */}}
        >
          <Ionicons 
            name={card.frozen ? "flame-outline" : "snow-outline"} 
            size={16} 
            color={cardBackground} 
          />
          <ThemedText style={styles.actionText}>
            {card.frozen ? 'Descongelar' : 'Congelar'}
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { borderColor }]}
          onPress={toggleDetails}
        >
          <Ionicons 
            name={showDetails ? "eye-off-outline" : "eye-outline"} 
            size={16} 
            color={cardBackground} 
          />
          <ThemedText style={styles.actionText}>
            {showDetails ? 'Ocultar' : 'Ver datos'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  cardTouchable: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  balanceContainer: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  cardNumber: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  toggleButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  expiryContainer: {
    alignItems: 'flex-start',
  },
  expiryLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  expiryDate: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  cvvContainer: {
    alignItems: 'center',
  },
  cvvLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  cvvNumber: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  cardBrand: {
    alignItems: 'flex-end',
  },
  mastercardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  redCircle: {
    backgroundColor: '#FF5F5F',
    marginRight: -8,
    zIndex: 1,
  },
  yellowCircle: {
    backgroundColor: '#FFCC00',
    zIndex: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 