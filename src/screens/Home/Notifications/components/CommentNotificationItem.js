import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

import { colors } from '../../../../utils/colors';

/** Issue commentée : nombre de commentaires, non lus et dernier commentaire reçu. */
const CommentNotificationItem = ({ notification, onPress }) => {
  const { t } = useTranslation();
  const unread = notification.unreadCount > 0;
  const lastText = notification.lastCommentText || '';

  return (
    <>
      <TouchableOpacity style={styles.item} onPress={onPress} accessibilityRole="button">
        <View style={[styles.icon, unread && styles.iconUnread]}>
          <Feather name="message-square" size={20} color={unread ? 'white' : colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, unread && styles.titleUnread]}>{notification.issueCode}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {notification.lastAuthorName ? `${notification.lastAuthorName} : ` : ''}
            {lastText}
          </Text>
          <Text style={[styles.status, { color: unread ? colors.error : '#9a9a9a' }]}>
            {t('comment_notification_summary', {
              count: notification.commentsCount,
              unread: notification.unreadCount,
            })}
            {notification.lastAt ? ` · ${moment(notification.lastAt).format('DD-MMM-YYYY HH:mm')}` : ''}
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color="#b0b0b0" />
      </TouchableOpacity>
      <Divider style={{ marginHorizontal: '5%' }} />
    </>
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: 'white',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(36,195,139,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconUnread: { backgroundColor: colors.primary },
  title: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#373737' },
  titleUnread: { fontFamily: 'Poppins_700Bold' },
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#707070', marginTop: 2 },
  status: { fontFamily: 'Poppins_400Regular', fontSize: 12, marginTop: 4 },
});

export default CommentNotificationItem;
