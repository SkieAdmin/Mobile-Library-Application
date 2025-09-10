import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { theme } from '../styles/theme';

const BookCard = ({ book, onPress, onBorrow, onReserve }) => {
  const isAvailable = book.availableCopies > 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        {book.imageUrl ? (
          <Image source={{ uri: book.imageUrl }} style={styles.bookImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.author} numberOfLines={1}>{book.author}</Text>
        <Text style={styles.category}>{book.category}</Text>
        
        <View style={styles.availability}>
          <Text style={[styles.availabilityText, isAvailable ? styles.available : styles.unavailable]}>
            {isAvailable ? `${book.availableCopies} available` : 'Not available'}
          </Text>
        </View>
        
        <View style={styles.actions}>
          {isAvailable ? (
            <TouchableOpacity
              style={styles.borrowButton}
              onPress={(e) => {
                e.stopPropagation();
                onBorrow();
              }}
            >
              <Text style={styles.borrowButtonText}>Borrow</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.reserveButton}
              onPress={(e) => {
                e.stopPropagation();
                onReserve();
              }}
            >
              <Text style={styles.reserveButtonText}>Reserve</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    elevation: theme.elevation.low,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    height: 120,
    borderTopLeftRadius: theme.borderRadius.md,
    borderTopRightRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  bookImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    ...theme.typography.caption,
    color: theme.colors.text.hint,
  },
  content: {
    padding: theme.spacing.md,
  },
  title: {
    ...theme.typography.body2,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  author: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  category: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  availability: {
    marginBottom: theme.spacing.sm,
  },
  availabilityText: {
    ...theme.typography.caption,
    fontWeight: '600',
  },
  available: {
    color: theme.colors.success,
  },
  unavailable: {
    color: theme.colors.error,
  },
  actions: {
    flexDirection: 'row',
  },
  borrowButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  borrowButtonText: {
    ...theme.typography.caption,
    color: theme.colors.text.inverse,
    fontWeight: '600',
  },
  reserveButton: {
    flex: 1,
    backgroundColor: theme.colors.warning,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  reserveButtonText: {
    ...theme.typography.caption,
    color: theme.colors.text.inverse,
    fontWeight: '600',
  },
});

export default BookCard;