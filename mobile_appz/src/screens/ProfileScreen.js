import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileUpdate = async () => {
    try {
      const updatedUser = await ApiService.updateProfile(user.id, profileData);
      updateUser(updatedUser);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters long');
      return;
    }

    try {
      await ApiService.changePassword(user.id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      Alert.alert('Success', 'Password changed successfully!');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to change password');
    }
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </Text>
          </View>
          
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userRole}>
            {user?.role === 'STUDENT' ? `Student - ${user.studentId}` : user?.role}
          </Text>
          <Text style={styles.memberSince}>
            Member since {formatDate(user?.registrationDate)}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <TouchableOpacity
              onPress={() => setIsEditing(!isEditing)}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>
                {isEditing ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>First Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={profileData.firstName}
                onChangeText={(value) => setProfileData({ ...profileData, firstName: value })}
                placeholder="First Name"
              />
            ) : (
              <Text style={styles.value}>{user?.firstName}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Last Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={profileData.lastName}
                onChangeText={(value) => setProfileData({ ...profileData, lastName: value })}
                placeholder="Last Name"
              />
            ) : (
              <Text style={styles.value}>{user?.lastName}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={profileData.email}
                onChangeText={(value) => setProfileData({ ...profileData, email: value })}
                placeholder="Email"
                keyboardType="email-address"
              />
            ) : (
              <Text style={styles.value}>{user?.email}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Role</Text>
            <Text style={styles.value}>
              {user?.role === 'STUDENT' ? 'Student' : user?.role}
            </Text>
          </View>

          {user?.studentId && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Student ID</Text>
              <Text style={styles.value}>{user.studentId}</Text>
            </View>
          )}

          {isEditing && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleProfileUpdate}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Security</Text>
            <TouchableOpacity
              onPress={() => setIsChangingPassword(!isChangingPassword)}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>
                {isChangingPassword ? 'Cancel' : 'Change Password'}
              </Text>
            </TouchableOpacity>
          </View>

          {isChangingPassword && (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Current Password</Text>
                <TextInput
                  style={styles.input}
                  value={passwordData.currentPassword}
                  onChangeText={(value) => setPasswordData({ ...passwordData, currentPassword: value })}
                  placeholder="Enter current password"
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={passwordData.newPassword}
                  onChangeText={(value) => setPasswordData({ ...passwordData, newPassword: value })}
                  placeholder="Enter new password (min 8 characters)"
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  value={passwordData.confirmPassword}
                  onChangeText={(value) => setPasswordData({ ...passwordData, confirmPassword: value })}
                  placeholder="Confirm new password"
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handlePasswordChange}
              >
                <Text style={styles.saveButtonText}>Change Password</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
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
          <Text style={styles.navTextActive}>Profile</Text>
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
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  profileCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    elevation: theme.elevation.low,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarText: {
    ...theme.typography.h2,
    color: theme.colors.text.inverse,
    fontWeight: 'bold',
  },
  userName: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  userRole: {
    ...theme.typography.body1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  memberSince: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    elevation: theme.elevation.low,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
  },
  editButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  editButtonText: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  value: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
  },
  input: {
    ...theme.typography.body1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    color: theme.colors.text.primary,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  saveButtonText: {
    ...theme.typography.button,
    color: theme.colors.text.inverse,
  },
  logoutButton: {
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  logoutButtonText: {
    ...theme.typography.button,
    color: theme.colors.text.inverse,
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

export default ProfileScreen;