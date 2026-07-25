import { EmojiKeyboard, type EmojiType } from '@softwhere-uz/react-native-emoji-keyboard';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ReactionsScreen() {
  const [reaction, setReaction] = useState<EmojiType | null>(null);

  return (
    <View style={styles.screen}>
      <View style={styles.chosen}>
        <Text style={styles.chosenLabel}>Chosen reaction</Text>
        <Text style={styles.chosenEmoji}>{reaction ? reaction.emoji : '—'}</Text>
        {reaction ? <Text style={styles.chosenName}>{reaction.name}</Text> : null}
      </View>

      {/* Compact reaction picker inside a rounded, clipped box */}
      <View style={styles.pickerBox}>
        <EmojiKeyboard
          onEmojiSelected={setReaction}
          defaultHeight={280}
          hideHeader
          categoryPosition="top"
          disableSafeArea
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    gap: 24,
  },
  chosen: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  chosenLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chosenEmoji: {
    fontSize: 56,
    lineHeight: 64,
  },
  chosenName: {
    fontSize: 14,
    color: '#374151',
  },
  pickerBox: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
});
