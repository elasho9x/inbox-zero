'use client';

import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { EmailItem } from '@/components/EmailItem';
import { useSearch } from '@/hooks/useSearch';

export default function SearchScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { emails, isLoading, isSearching, search, query, clearSearch } = useSearch();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim()) {
      search(text.trim());
    } else {
      clearSearch();
    }
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
  };

  const renderEmail = ({ item }: { item: any }) => (
    <EmailItem
      email={item}
      onPress={() => router.push(`/app/email/${item.id}`)}
      theme={theme}
    />
  );

  return (
    <View style={theme === 'dark' ? styles.containerDark : styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            theme === 'dark' ? styles.searchInputDark : styles.searchInputLight,
          ]}
          placeholder="Search emails..."
            value={searchQuery}
            onChangeText={handleSearch}
            onSubmitEditing={handleSubmit}
            placeholderTextColor={theme === 'dark' ? '#64748B' : '#94A3B8'}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        {searchQuery && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {isSearching && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={{ marginTop: 8, color: theme === 'dark' ? '#94A3B8' : '#64748B' }}>
            Searching...
          </Text>
        </View>
      )}

      <FlatList
        data={emails}
        renderItem={({ item }) => (
          <EmailItem
            email={item}
            onPress={() => router.push(`/app/email/${item.id}`)}
            theme={theme}
          />
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          query ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No results found</Text>
              <Text style={styles.emptySubtext}>Try different keywords</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Search your emails</Text>
              <Text style={styles.emptySubtext}>Enter keywords to find messages</Text>
            </View>
          )
        }
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchContainerDark: {
    backgroundColor: '#1E293B',
    borderBottomColor: '#334155',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
  },
  searchInputLight: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    color: '#1E293B',
  },
  searchInputDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    color: '#F1F5F9',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 100,
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