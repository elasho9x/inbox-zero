'use client';

import { FlatList, RefreshControl, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface RefreshableListProps<T> {
  data: T[];
  renderItem: ({ item }: { item: T }) => React.ReactNode;
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh: () => Promise<void>;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  keyExtractor: (item: T) => string;
  ListEmptyComponent?: React.ReactNode;
  contentContainerStyle?: any;
}

export function RefreshableList<T>({
  data,
  renderItem,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onLoadMore,
  hasMore = false,
  keyExtractor,
  ListEmptyComponent,
  contentContainerStyle,
}: RefreshableListProps<T>) {
  const { theme } = useTheme();

  const handleLoadMore = useCallback(() => {
    if (onLoadMore && hasMore) {
      onLoadMore();
    }
  }, [onLoadMore, hasMore]);

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={['#3B82F6']}
          progressBackgroundColor={theme === 'dark' ? '#1E3A8A' : '#F8FAFC'}
        />
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={ListEmptyComponent}
      contentContainerStyle={[
        styles.contentContainer,
        theme === 'dark' ? { backgroundColor: '#0F172A' } : { backgroundColor: '#F8FAFC' },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 100,
  },
});