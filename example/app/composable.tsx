/**
 * Demo of the composable `EmojiPicker.*` primitives (§5). Builds a picker from
 * parts with a custom category header + a live "active emoji" preview driven by
 * `EmojiPicker.useActiveEmoji()`, and shows the `Empty` and `SkinToneSelector`
 * slots. This is the from-scratch alternative to the batteries-included
 * `<EmojiKeyboard>`.
 */
import { EmojiPicker, type EmojiType } from '@softwhere-uz/react-native-emoji-keyboard';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/** Live preview bar reading the hovered/focused emoji from context. */
function Preview() {
  const active = EmojiPicker.useActiveEmoji();
  return (
    <View style={styles.preview}>
      <Text style={styles.previewGlyph}>{active?.emoji ?? '·'}</Text>
      <Text style={styles.previewLabel} numberOfLines={1}>
        {active?.label ?? 'Tap or arrow-key through the grid'}
      </Text>
    </View>
  );
}

export default function ComposableScreen() {
  const [last, setLast] = useState<EmojiType | null>(null);

  return (
    <View style={styles.screen}>
      <View style={styles.picked}>
        <Text style={styles.pickedText}>
          {last ? `Picked ${last.emoji}  ${last.name}` : 'Nothing picked yet'}
        </Text>
      </View>

      <View style={styles.card}>
        <EmojiPicker.Root
          onEmojiSelect={setLast}
          columns={9}
          colorScheme="auto"
          enableRecentlyUsed
        >
          <EmojiPicker.Search placeholder="Search emoji" />
          <Preview />
          <EmojiPicker.Viewport>
            <EmojiPicker.Empty>
              {({ search }) => (
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No emoji for “{search}”</Text>
                </View>
              )}
            </EmojiPicker.Empty>
            <EmojiPicker.List
              components={{
                // A custom, pill-styled category header slot.
                CategoryHeader: ({ label }) => (
                  <View style={styles.header}>
                    <Text style={styles.headerText}>{label.toUpperCase()}</Text>
                  </View>
                ),
                // A custom emoji slot with a focus ring for keyboard nav (web).
                Emoji: ({ emoji, emojiSize, widthPercent, focused, onPress, onActivate }) => (
                  <Pressable
                    onPress={onPress}
                    onPressIn={onActivate}
                    style={[
                      styles.cell,
                      { width: widthPercent },
                      focused && styles.cellFocused,
                    ]}
                  >
                    <Text style={{ fontSize: emojiSize }}>{emoji.glyph}</Text>
                  </Pressable>
                ),
              }}
            />
          </EmojiPicker.Viewport>
          <EmojiPicker.SkinToneSelector />
        </EmojiPicker.Root>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f2f2f7' },
  picked: { padding: 16 },
  pickedText: { fontSize: 16, fontWeight: '600' },
  card: {
    flex: 1,
    margin: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 10,
  },
  previewGlyph: { fontSize: 28 },
  previewLabel: { flex: 1, color: '#666', fontSize: 14 },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  headerText: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: '#888' },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cellFocused: { borderColor: '#3b82f6' },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 15 },
});
