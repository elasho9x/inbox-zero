'use client';

import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { RefreshableList } from '@/components/RefreshableList';
import { EmailItem } from '@/components/EmailItem';
import { useDrafts } from '@/hooks/useDrafts';

export default function DraftsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { drafts, isLoading, isRefreshing, loadMore, refresh, hasMore } = useDrafts();

  const handleRefresh = async () => {
    await refresh();
  };

  const handleLoadMore = async () => {
    await loadMore();
  };

  const renderDraft = ({ item }: { item: any }) => (
    <EmailItem
      email={item}
      onPress={() => router.push(`/app/compose?draftId=${item.id}`)}
      theme={theme}
    />
  );

  return (
    <View style={theme === 'dark' ? styles.containerDark : styles.container}>
      <RefreshableList
        data={drafts}
        renderItem={renderDraft}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No drafts yet</Text>
            <Text style={styles.emptySubtext}>Start composing to see drafts here</Text>
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