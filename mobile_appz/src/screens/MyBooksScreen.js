import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

const MyBooksScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [borrows, setBorrows] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [activeTab, setActiveTab] = useState('borrowed');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUserBooks();
  }, []);

  const fetchUserBooks = async () => {
    try {
      setIsLoading(true);
      const [borrowsResponse, reservationsResponse] = await Promise.all([
        ApiService.getUserBorrows(),
        ApiService.getUserReservations({ isActive: 'true' })
      ]);
      
      setBorrows(borrowsResponse.borrows || []);
      setReservations(reservationsResponse.reservations || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch your books');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserBooks();
    setRefreshing(false);
  };

  const handleRenewBook = async (borrowId) => {
    try {
      await ApiService.renewBook(borrowId);
      Alert.alert('Success', 'Book renewed successfully!');
      fetchUserBooks();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to renew book');
    }
  };

  const handleCancelReservation = async (reservationId) => {
    Alert.alert(
      'Cancel Reservation',
      'Are you sure you want to cancel this reservation?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await ApiService.cancelReservation(reservationId);
              Alert.alert('Success', 'Reservation cancelled successfully!');
              fetchUserBooks();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to cancel reservation');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const BorrowedBooks = () => (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {borrows.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No borrowed books</Text>
          <Text style={styles.emptySubtext}>Visit the library to borrow some books!</Text>
        </View>
      ) : (
        borrows.map((borrow) => (
          <View key={borrow.id} style={styles.bookItem}>
            <View style={styles.bookInfo}>
              <Text style={styles.bookTitle}>{borrow.book.title}</Text>
              <Text style={styles.bookAuthor}>by {borrow.book.author}</Text>
              <View style={styles.dateInfo}>
                <Text style={styles.dateLabel}>Borrowed: {formatDate(borrow.borrowDate)}</Text>
                <Text style={[
                  styles.dateLabel, 
                  isOverdue(borrow.dueDate) ? styles.overdue : styles.dueDate
                ]}>
                  Due: {formatDate(borrow.dueDate)}
                  {isOverdue(borrow.dueDate) && ' (OVERDUE)'}
                </Text>
              </View>
              {borrow.renewalCount < 2 && (
                <Text style={styles.renewalInfo}>
                  Renewals left: {2 - borrow.renewalCount}
                </Text>
              )}
            </View>
            {borrow.status === 'ACTIVE' && borrow.renewalCount < 2 && (
              <TouchableOpacity
                style={styles.renewButton}
                onPress={() => handleRenewBook(borrow.id)}
              >
                <Text style={styles.renewButtonText}>Renew</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );

  const ReservedBooks = () => (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {reservations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No reserved books</Text>
          <Text style={styles.emptySubtext}>Reserve books when they're not available!</Text>
        </View>
      ) : (
        reservations.map((reservation) => (
          <View key={reservation.id} style={styles.bookItem}>
            <View style={styles.bookInfo}>
              <Text style={styles.bookTitle}>{reservation.book.title}</Text>
              <Text style={styles.bookAuthor}>by {reservation.book.author}</Text>
              <View style={styles.dateInfo}>
                <Text style={styles.dateLabel}>Reserved: {formatDate(reservation.reservationDate)}</Text>
                <Text style={styles.dateLabel}>Expires: {formatDate(reservation.expiryDate)}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelReservation(reservation.id)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Books</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'borrowed' && styles.activeTab]}
          onPress={() => setActiveTab('borrowed')}
        >
          <Text style={[styles.tabText, activeTab === 'borrowed' && styles.activeTabText]}>
            Borrowed ({borrows.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reserved' && styles.activeTab]}
          onPress={() => setActiveTab('reserved')}
        >
          <Text style={[styles.tabText, activeTab === 'reserved' && styles.activeTabText]}>
            Reserved ({reservations.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'borrowed' ? <BorrowedBooks /> : <ReservedBooks />}
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.navText}>Books</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('MyBooks')}
        >
          <Text style={styles.navTextActive}>My Books</Text>
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
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.text.inverse,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  bookItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: theme.elevation.low,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    ...theme.typography.body1,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  bookAuthor: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  dateInfo: {
    marginBottom: theme.spacing.xs,
  },
  dateLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  dueDate: {
    color: theme.colors.info,
  },
  overdue: {
    color: theme.colors.error,
    fontWeight: '600',
  },
  renewalInfo: {
    ...theme.typography.caption,
    color: theme.colors.warning,
    fontStyle: 'italic',
  },
  renewButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  renewButtonText: {
    ...theme.typography.caption,
    color: theme.colors.text.inverse,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  cancelButtonText: {
    ...theme.typography.caption,
    color: theme.colors.text.inverse,
    fontWeight: '600',
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

export default MyBooksScreen;