import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    borrowedBooks: 0,
    reservedBooks: 0,
    totalUsers: 0,
    activeMembers: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.getAnalyticsDashboard();
      setStats({
        totalBooks: response.totalBooks || 0,
        availableBooks: response.availableBooks || 0,
        borrowedBooks: response.borrowedBooks || 0,
        reservedBooks: response.reservedBooks || 0,
        totalUsers: response.totalUsers || 0,
        activeMembers: response.activeMembers || 0,
      });
    } catch (error) {
      console.error('Dashboard API Error:', error);
      Alert.alert('Error', error.message || 'Failed to fetch dashboard data');
      // Reset stats to 0 on error
      setStats({
        totalBooks: 0,
        availableBooks: 0,
        borrowedBooks: 0,
        reservedBooks: 0,
        totalUsers: 0,
        activeMembers: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const StatCard = ({ title, value, subtitle, color = theme.colors.primary }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          Welcome back, {user?.firstName}!
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Library Statistics</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Books"
              value={isLoading ? '...' : stats.totalBooks.toLocaleString()}
              subtitle="In collection"
              color={theme.colors.primary}
            />
            <StatCard
              title="Available"
              value={isLoading ? '...' : stats.availableBooks.toLocaleString()}
              subtitle="Ready to borrow"
              color={theme.colors.success}
            />
            <StatCard
              title="Borrowed"
              value={isLoading ? '...' : stats.borrowedBooks.toLocaleString()}
              subtitle="Currently out"
              color={theme.colors.warning}
            />
            <StatCard
              title="Reserved"
              value={isLoading ? '...' : stats.reservedBooks.toLocaleString()}
              subtitle="On hold"
              color={theme.colors.info}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Statistics</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Users"
              value={isLoading ? '...' : stats.totalUsers.toLocaleString()}
              subtitle="Registered"
              color={theme.colors.primary}
            />
            <StatCard
              title="Active Members"
              value={isLoading ? '...' : stats.activeMembers.toLocaleString()}
              subtitle="This month"
              color={theme.colors.success}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Add New Book</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Manage Users</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>View Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>System Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

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
            <Text style={styles.navTextActive}>Dashboard</Text>
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
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.text.inverse,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    width: '48%',
    borderLeftWidth: 4,
    elevation: theme.elevation.low,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  statTitle: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  statSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    elevation: theme.elevation.low,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionButtonText: {
    ...theme.typography.button,
    color: theme.colors.primary,
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

export default DashboardScreen;