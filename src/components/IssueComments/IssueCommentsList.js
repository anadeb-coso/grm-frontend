import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Divider } from 'react-native-paper';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

import { colors } from '../../utils/colors';

// Commentaires des catégories confidentielles, chiffrés côté web (même convention que le
// dashboard : représentation `b'...'`).
const displayText = (text) => (text && text.includes("b'") ? '***' : text);

/**
 * Commentaires d'une issue (du plus récent au plus ancien), non lus mis en évidence. Rendu en
 * simple liste de vues : s'insère dans une FlatList ou une ScrollView existante.
 */
function IssueCommentsList({ comments, unreadIds }) {
  const { t } = useTranslation();

  if (!comments?.length) {
    return <Text style={styles.empty}>{t('no_comments')}</Text>;
  }

  return (
    <View>
      {comments.map((comment, index) => {
        const unread = unreadIds?.has(comment.id);
        return (
          <View key={comment.id || index}>
            {index > 0 && <Divider />}
            <View style={[styles.item, unread && styles.unreadItem]}>
              <View style={styles.header}>
                <Text style={styles.author}>{comment.authorName || '-'}</Text>
                {unread && <Text style={styles.unreadBadge}>{t('unread')}</Text>}
              </View>
              <Text style={styles.date}>{comment.at ? moment(comment.at).format('DD-MMM-YYYY HH:mm') : ''}</Text>
              <Text style={styles.text}>{displayText(comment.text)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#707070', marginVertical: 10 },
  item: { paddingVertical: 10, paddingHorizontal: 6 },
  unreadItem: { backgroundColor: 'rgba(36,195,139,0.08)', borderLeftWidth: 3, borderLeftColor: colors.primary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  author: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#373737' },
  unreadBadge: { fontFamily: 'Poppins_500Medium', fontSize: 11, color: colors.primary },
  date: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#9a9a9a', marginTop: 2 },
  text: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#707070', marginTop: 4 },
});

export default IssueCommentsList;
