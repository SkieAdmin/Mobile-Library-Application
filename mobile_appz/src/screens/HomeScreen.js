import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import BookCard from '../components/BookCard';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [books, setBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchBooks();
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, selectedCategory]);

  const fetchBooks = async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.category = selectedCategory;
      
      const response = await ApiService.getBooks(params);
      setBooks(response.books || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch books');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await ApiService.getCategories();
      setCategories(response || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBooks();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const handleBookPress = (book) => {
    navigation.navigate('BookDetail', { book });
  };

  const handleBorrowBook = async (bookId) => {
    try {
      await ApiService.borrowBook(bookId);
      Alert.alert('Success', 'Book borrowed successfully!');
      fetchBooks();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to borrow book');
    }
  };

  const handleReserveBook = async (bookId) => {
    try {
      await ApiService.reserveBook(bookId);
      Alert.alert('Success', 'Book reserved successfully!');
      fetchBooks();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to reserve book');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.firstName}!</Text>
            <Text style={styles.subGreeting}>
              {user?.role === 'STUDENT' ? `ID: ${user.studentId}` : user?.role}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Search books by title, author, or ISBN..."
          placeholderTextColor={theme.colors.text.hint}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
            onPress={() => setSelectedCategory('')}
          >
            <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.categoryChip, selectedCategory === category && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[styles.categoryText, selectedCategory === category && styles.categoryTextActive]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.booksGrid}>
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onPress={() => handleBookPress(book)}
              onBorrow={() => handleBorrowBook(book.id)}
              onReserve={() => handleReserveBook(book.id)}
            />
          ))}
        </View>

        {books.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No books found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or category filter</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.navTextActive}>Books</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('MyBooks')}
        >
          <Text style={styles.navText}>My Books</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
        {(user?.role === 'STAFF' || user?.role === 'ADMIN') && (
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.navText}>Dashboard</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  greeting: {
    ...theme.typography.h3,
    color: theme.colors.text.inverse,
  },
  subGreeting: {
    ...theme.typography.body2,
    color: theme.colors.text.inverse,
    opacity: 0.8,
  },
  logoutButton: {
    padding: theme.spacing.sm,
  },
  logoutText: {
    ...theme.typography.body2,
    color: theme.colors.text.inverse,
    fontWeight: '600',
  },
  searchInput: {
    ...theme.typography.body1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    color: theme.colors.text.primary,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: theme.colors.surface,
  },
  categoryText: {
    ...theme.typography.body2,
    color: theme.colors.text.inverse,
  },
  categoryTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: theme.spacing.xxl,
  },
  emptyText: {
    ...theme.typography.h4,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    ...theme.typography.body2,
    color: theme.colors.text.hint,
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
    elevation: theme.elevation.medium,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  navText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  navTextActive: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default HomeScreen;