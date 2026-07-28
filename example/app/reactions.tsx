import {
  EmojiKeyboard,
  EmojiModal,
  ReactionStrip,
  type EmojiType,
} from '@softwhere-uz/react-native-emoji-keyboard';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ReactionsScreen() {
  const [reaction, setReaction] = useState<EmojiType | null>(null);
  const [open, setOpen] = useState(false);

  const pick = useCallback((e: EmojiType) => {
    setReaction(e);
    setOpen(false);
  }, []);

  return (
    <View style={styles.screen}>
      <View style={styles.chosen}>
        <Text style={styles.chosenLabel}>Chosen reaction</Text>
        <Text style={styles.chosenEmoji}>{reaction ? reaction.emoji : '—'}</Text>
        {reaction ? <Text style={styles.chosenName}>{reaction.name}</Text> : null}
      </View>

      <Text style={styles.section}>ReactionStrip — tap a quick reaction, or ＋ for the full picker</Text>
      <ReactionStrip onEmojiSelected={pick} onMorePress={() => setOpen(true)} />

      {/* EmojiModal bottom-sheet with the full keyboard inside */}
      <EmojiModal open={open} onClose={() => setOpen(false)}>
        <EmojiKeyboard
          onEmojiSelected={pick}
          defaultHeight={520}
          enableSearchBar
          enablePreview
          categoryPosition="top"
          disableSafeArea
        />
      </EmojiModal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff', padding: 16, gap: 20 },
  chosen: { alignItems: 'center', gap: 6, paddingVertical: 16 },
  chosenLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chosenEmoji: { fontSize: 56, lineHeight: 64 },
  chosenName: { fontSize: 14, color: '#374151' },
  section: { fontSize: 13, color: '#6b7280' },
});
