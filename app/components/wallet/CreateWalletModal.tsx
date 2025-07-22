/**
 * CreateWalletModal Component
 * Modal interface for creating new wallets with configuration options
 */

import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { walletService } from '@/app/services/walletService';
import {
    CreateWalletModalProps,
    WALLET_CONSTANTS,
    WalletChain,
    WalletCurrency,
    WalletTag,
} from '@/app/types/WalletTypes';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

// Chain options with icons and colors
const CHAIN_OPTIONS = [
  {
    value: 'solana' as WalletChain,
    label: 'Solana',
    description: 'High-speed blockchain',
    icon: 'planet-outline' as keyof typeof Ionicons.glyphMap,
    color: '#9945FF',
  },
  {
    value: 'base' as WalletChain,
    label: 'Base',
    description: 'Ethereum L2 by Coinbase',
    icon: 'diamond-outline' as keyof typeof Ionicons.glyphMap,
    color: '#0052FF',
  },
];

// Currency options
const CURRENCY_OPTIONS = WALLET_CONSTANTS.SUPPORTED_CURRENCIES.map(currency => ({
  value: currency,
  label: currency.toUpperCase(),
  description: `${currency.toUpperCase()} stablecoin`,
}));

// Wallet tag options
const TAG_OPTIONS = [
  {
    value: 'general_use' as WalletTag,
    label: 'General Use',
    description: 'For everyday transactions',
    color: '#4ECDC4',
  },
  {
    value: 'p2p' as WalletTag,
    label: 'P2P',
    description: 'For peer-to-peer payments',
    color: '#FF6B6B',
  },
];

export const CreateWalletModal: React.FC<CreateWalletModalProps> = ({
  isVisible,
  onClose,
  onSuccess,
  profileId,
  customerId,
}) => {
  const [selectedChain, setSelectedChain] = useState<WalletChain>('base');
  const [selectedCurrency, setSelectedCurrency] = useState<WalletCurrency>('usdc');
  const [selectedTag, setSelectedTag] = useState<WalletTag>('general_use');
  const [isCreating, setIsCreating] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  const handleCreate = async () => {
    if (!walletService.canCreateWallets()) {
      Alert.alert(
        'Not Available',
        'Wallet creation is only available in production environment.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsCreating(true);
    
    try {
      console.log('💳 Creating wallet with params:', {
        profileId,
        customerId,
        chain: selectedChain,
        currency: selectedCurrency,
        walletTag: selectedTag,
      });

      const result = await walletService.createWallet({
        profileId,
        customerId,
        chain: selectedChain,
        currency: selectedCurrency,
        walletTag: selectedTag,
        bridgeTags: ['primary'], // Default Bridge tags
      });

      if (result.success && result.data) {
        console.log('✅ Wallet created successfully:', result.data);
        
        Alert.alert(
          'Wallet Created',
          `Your ${selectedChain.charAt(0).toUpperCase() + selectedChain.slice(1)} wallet has been created successfully!`,
          [
            {
              text: 'OK',
              onPress: () => {
                onSuccess(result.data!);
                onClose();
              },
            },
          ]
        );
      } else {
        console.error('❌ Wallet creation failed:', result.error);
        Alert.alert(
          'Creation Failed',
          result.error || 'Failed to create wallet. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('💥 Error creating wallet:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    if (!isCreating) {
      onClose();
    }
  };

  const canCreate = profileId && customerId && !isCreating;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <ThemedView style={[styles.container, { backgroundColor }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <ThemedText style={[styles.title, { color: textColor }]}>
            Create New Wallet
          </ThemedText>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleCancel}
            disabled={isCreating}
          >
            <Ionicons
              name="close"
              size={24}
              color={textColor}
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Environment Warning */}
          {!walletService.canCreateWallets() && (
            <View style={[styles.warningContainer, { borderColor: '#FF9800' }]}>
              <Ionicons name="warning" size={20} color="#FF9800" />
              <ThemedText style={[styles.warningText, { color: textColor }]}>
                Wallet creation is only available in production environment.
              </ThemedText>
            </View>
          )}

          {/* Chain Selection */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
              Blockchain Network
            </ThemedText>
            <View style={styles.optionsContainer}>
              {CHAIN_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionCard,
                    {
                      borderColor: selectedChain === option.value ? tintColor : borderColor,
                      backgroundColor: selectedChain === option.value 
                        ? `${tintColor}15` 
                        : backgroundColor,
                    },
                  ]}
                  onPress={() => setSelectedChain(option.value)}
                  disabled={isCreating}
                >
                  <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                    <Ionicons
                      name={option.icon}
                      size={24}
                      color="white"
                    />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <ThemedText style={[styles.optionTitle, { color: textColor }]}>
                      {option.label}
                    </ThemedText>
                    <ThemedText style={[styles.optionDescription, { color: textColor }]}>
                      {option.description}
                    </ThemedText>
                  </View>
                  {selectedChain === option.value && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={tintColor}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Currency Selection */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
              Currency
            </ThemedText>
            <View style={styles.optionsContainer}>
              {CURRENCY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionCard,
                    {
                      borderColor: selectedCurrency === option.value ? tintColor : borderColor,
                      backgroundColor: selectedCurrency === option.value 
                        ? `${tintColor}15` 
                        : backgroundColor,
                    },
                  ]}
                  onPress={() => setSelectedCurrency(option.value)}
                  disabled={isCreating}
                >
                  <View style={[styles.currencyIcon, { backgroundColor: tintColor }]}>
                    <ThemedText style={styles.currencyText}>
                      {option.label}
                    </ThemedText>
                  </View>
                  <View style={styles.optionTextContainer}>
                    <ThemedText style={[styles.optionTitle, { color: textColor }]}>
                      {option.label}
                    </ThemedText>
                    <ThemedText style={[styles.optionDescription, { color: textColor }]}>
                      {option.description}
                    </ThemedText>
                  </View>
                  {selectedCurrency === option.value && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={tintColor}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Wallet Tag Selection */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
              Wallet Type
            </ThemedText>
            <View style={styles.optionsContainer}>
              {TAG_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionCard,
                    {
                      borderColor: selectedTag === option.value ? tintColor : borderColor,
                      backgroundColor: selectedTag === option.value 
                        ? `${tintColor}15` 
                        : backgroundColor,
                    },
                  ]}
                  onPress={() => setSelectedTag(option.value)}
                  disabled={isCreating}
                >
                  <View style={[styles.tagIcon, { backgroundColor: option.color }]}>
                    <Ionicons
                      name={option.value === 'p2p' ? 'people-outline' : 'wallet-outline'}
                      size={20}
                      color="white"
                    />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <ThemedText style={[styles.optionTitle, { color: textColor }]}>
                      {option.label}
                    </ThemedText>
                    <ThemedText style={[styles.optionDescription, { color: textColor }]}>
                      {option.description}
                    </ThemedText>
                  </View>
                  {selectedTag === option.value && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={tintColor}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: borderColor }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor }]}
            onPress={handleCancel}
            disabled={isCreating}
          >
            <ThemedText style={[styles.cancelButtonText, { color: textColor }]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.createButton,
              { 
                backgroundColor: canCreate ? tintColor : borderColor,
                opacity: canCreate ? 1 : 0.6,
              },
            ]}
            onPress={handleCreate}
            disabled={!canCreate}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <ThemedText style={styles.createButtonText}>
                Create Wallet
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  warningText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  section: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderRadius: 12,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  currencyIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  currencyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  tagIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 