'use client';

import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { RefreshableList } from '@/components/RefreshableList';
import { EmailItem } from '@/components/EmailItem';
import { useInbox } from '@/hooks/useInbox';

export default function InboxScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { emails, isLoading, isRefreshing, loadMore, refresh, hasMore } = useInbox();

  const handleRefresh = async () => {
    await refresh();
  };

  const handleLoadMore = async () => {
    await loadMore();
  };

  const renderEmail = ({ item }: { item: any }) => (
    <EmailItem
      email={item}
      onPress={() => router.push(`/app/email/${item.id}`)}
      theme={theme}
    />
  );

  if (theme === 'dark') {
    return (
      <View style={styles.containerDark}>
        <RefreshableList
          data={emails}
          renderItem={renderEmail}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No emails yet</Text>
              <Text style={styles.emptySubtext}>Pull to refresh or wait for sync</Text>
            </View>
          }
        />
    );
  }

  return (
    <View style={styles.container}>
      <RefreshableList
        data={emails}
        renderItem={renderEmail}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No emails yet</Text>
            <Text style={styles.emptySubtext}>Pull to refresh or wait for sync</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  containerDark: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
  },
});