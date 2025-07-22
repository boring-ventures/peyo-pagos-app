/**
 * WalletItem Component
 * Displays individual wallet information with chain indicators and copy functionality
 */

import { ThemedText } from '@/app/components/ThemedText';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { WalletChain, WalletItemProps } from '@/app/types/WalletTypes';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import {
    Alert,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

// Chain configuration
const CHAIN_CONFIG = {
  solana: {
    name: 'Solana',
    icon: 'planet-outline' as keyof typeof Ionicons.glyphMap,
    color: '#9945FF',
    shortName: 'SOL'
  },
  base: {
    name: 'Base',
    icon: 'diamond-outline' as keyof typeof Ionicons.glyphMap,
    color: '#0052FF',
    shortName: 'BASE'
  }
};

const getChainConfig = (chain: WalletChain) => {
  return CHAIN_CONFIG[chain] || CHAIN_CONFIG.base;
};

const formatAddress = (address: string): string => {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};

const getWalletTagColor = (tag: string): string => {
  switch (tag) {
    case 'p2p':
      return '#FF6B6B';
    case 'general_use':
    default:
      return '#4ECDC4';
  }
};

const getWalletTagLabel = (tag: string): string => {
  switch (tag) {
    case 'p2p':
      return 'P2P';
    case 'general_use':
      return 'General';
    default:
      return tag.charAt(0).toUpperCase() + tag.slice(1);
  }
};

export const WalletItem: React.FC<WalletItemProps> = ({
  wallet,
  onPress,
  showActions = true,
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');

  const chainConfig = getChainConfig(wallet.chain);

  const handleCopyAddress = async () => {
    try {
      await Clipboard.setStringAsync(wallet.address);
      Alert.alert(
        'Address Copied',
        `${chainConfig.name} address copied to clipboard`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to copy address to clipboard');
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress(wallet);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { 
          backgroundColor,
          borderColor: borderColor,
        }
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Chain Icon and Info */}
      <View style={styles.header}>
        <View style={styles.chainInfo}>
          <View 
            style={[
              styles.chainIconContainer,
              { backgroundColor: chainConfig.color }
            ]}
          >
            <Ionicons
              name={chainConfig.icon}
              size={20}
              color="white"
            />
          </View>
          <View style={styles.chainTextContainer}>
            <ThemedText style={[styles.chainName, { color: textColor }]}>
              {chainConfig.name}
            </ThemedText>
            <ThemedText style={[styles.chainShort, { color: textColor }]}>
              {chainConfig.shortName}
            </ThemedText>
          </View>
        </View>

        {/* Wallet Tag */}
        <View 
          style={[
            styles.tagContainer,
            { backgroundColor: getWalletTagColor(wallet.walletTag) }
          ]}
        >
          <ThemedText style={styles.tagText}>
            {getWalletTagLabel(wallet.walletTag)}
          </ThemedText>
        </View>
      </View>

      {/* Address Section */}
      <View style={styles.addressSection}>
        <ThemedText style={[styles.addressLabel, { color: textColor }]}>
          Address:
        </ThemedText>
        <View style={styles.addressContainer}>
          <ThemedText 
            style={[styles.address, { color: textColor }]}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {formatAddress(wallet.address)}
          </ThemedText>
          {showActions && (
            <TouchableOpacity
              style={[styles.copyButton, { borderColor: tintColor }]}
              onPress={handleCopyAddress}
            >
              <Ionicons
                name="copy-outline"
                size={16}
                color={tintColor}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Metadata */}
      <View style={styles.metadata}>
        <ThemedText style={[styles.metadataText, { color: textColor }]}>
          Created: {new Date(wallet.createdAt).toLocaleDateString()}
        </ThemedText>
        {wallet.bridgeTags.length > 0 && (
          <ThemedText style={[styles.metadataText, { color: textColor }]}>
            Bridge Tags: {wallet.bridgeTags.join(', ')}
          </ThemedText>
        )}
      </View>

      {/* Status Indicator */}
      <View style={styles.statusContainer}>
        <View 
          style={[
            styles.statusIndicator,
            { backgroundColor: wallet.isActive ? '#4CAF50' : '#FF9800' }
          ]}
        />
        <ThemedText style={[styles.statusText, { color: textColor }]}>
          {wallet.isActive ? 'Active' : 'Inactive'}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chainIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chainTextContainer: {
    flex: 1,
  },
  chainName: {
    fontSize: 16,
    fontWeight: '600',
  },
  chainShort: {
    fontSize: 12,
    opacity: 0.7,
  },
  tagContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  addressSection: {
    marginBottom: 12,
  },
  addressLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  address: {
    fontSize: 14,
    fontFamily: 'monospace',
    flex: 1,
    marginRight: 8,
  },
  copyButton: {
    padding: 8,
    borderWidth: 1,
    borderRadius: 6,
  },
  metadata: {
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 