/**
 * WalletList Component
 * Displays a list of user wallets with refresh functionality and empty states
 */

import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { Wallet, WalletListProps } from '@/app/types/WalletTypes';
import React from 'react';
import {
    FlatList,
    ListRenderItem,
    RefreshControl,
    StyleSheet,
    View
} from 'react-native';
import { WalletItem } from './WalletItem';

export const WalletList: React.FC<WalletListProps> = ({
  wallets,
  isLoading = false,
  error = null,
  onRefresh,
  onWalletPress,
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const renderWallet: ListRenderItem<Wallet> = ({ item }) => (
    <WalletItem
      wallet={item}
      onPress={onWalletPress}
      showActions={true}
    />
  );

  const renderEmptyState = () => {
    if (error) {
      return (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText style={[styles.emptyIcon, { color: textColor }]}>
            ⚠️
          </ThemedText>
          <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
            Error Loading Wallets
          </ThemedText>
          <ThemedText style={[styles.emptyMessage, { color: textColor }]}>
            {error}
          </ThemedText>
          {onRefresh && (
            <ThemedText 
              style={[styles.refreshHint, { color: tintColor }]}
              onPress={onRefresh}
            >
              Tap to retry
            </ThemedText>
          )}
        </ThemedView>
      );
    }

    return (
      <ThemedView style={styles.emptyContainer}>
        <ThemedText style={[styles.emptyIcon, { color: textColor }]}>
          💳
        </ThemedText>
        <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
          No Wallets Yet
        </ThemedText>
        <ThemedText style={[styles.emptyMessage, { color: textColor }]}>
          Create your first wallet to start managing your digital assets.
        </ThemedText>
        {onRefresh && (
          <ThemedText 
            style={[styles.refreshHint, { color: tintColor }]}
            onPress={onRefresh}
          >
            Pull down to refresh
          </ThemedText>
        )}
      </ThemedView>
    );
  };

  const keyExtractor = (item: Wallet) => item.id;

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <FlatList
        data={wallets}
        renderItem={renderWallet}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          wallets.length === 0 && styles.emptyListContent
        ]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isLoading}
              onRefresh={onRefresh}
              tintColor={tintColor}
              colors={[tintColor]}
            />
          ) : undefined
        }
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => (
          <View style={styles.separator} />
        )}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
    marginBottom: 16,
  },
  refreshHint: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
}); 