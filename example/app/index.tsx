import { EmojiKeyboard, type EmojiType } from '@softwhere-uz/react-native-emoji-keyboard';
import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ComposerScreen() {
  const [lastEmoji, setLastEmoji] = useState<EmojiType | null>(null);

  return (
    <View style={styles.screen}>
      {/* Message preview */}
      <View style={styles.preview}>
        <Text style={styles.previewLabel}>Message preview</Text>
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>
            {lastEmoji ? `${lastEmoji.emoji}  ${lastEmoji.name}` : 'Pick an emoji below…'}
          </Text>
        </View>

        <Link href="/reactions" style={styles.link}>
          Go to reactions demo →
        </Link>
      </View>

      {/* Inline keyboard filling the bottom panel */}
      <View style={styles.panel}>
        <EmojiKeyboard
          onEmojiSelected={setLastEmoji}
          categoryPosition="top"
          enableRecentlyUsed
          enableSearchBar
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  preview: {
    padding: 16,
    gap: 12,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bubble: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 16,
    color: '#ffffff',
  },
  link: {
    fontSize: 15,
    color: '#2563eb',
    fontWeight: '600',
  },
  panel: {
    flex: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
});
