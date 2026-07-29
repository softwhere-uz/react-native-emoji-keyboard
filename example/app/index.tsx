import {
  EmojiKeyboard,
  useEmojiKeyboardSwap,
  type EmojiType,
} from '@softwhere-uz/react-native-emoji-keyboard';
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const BAR_HEIGHT = 60;

export default function ComposerScreen() {
  const [messages, setMessages] = useState<string[]>([]);
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Seamless keyboard <-> emoji swap. `inset` is held constant across the swap,
  // so the composer never jumps.
  const { emojiOpen, toggle, onInputFocus, close, inset } = useEmojiKeyboardSwap({ inputRef });

  const send = () => {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [...m, t]);
    setText('');
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.messages}
        contentContainerStyle={[styles.messagesContent, { paddingBottom: inset + BAR_HEIGHT + 12 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {messages.length === 0 ? (
          <Text style={styles.hint}>
            Type a message, then tap 😀 — the emoji picker replaces the keyboard at the same height
            with no jump. Tap ⌨️ to swap back.
          </Text>
        ) : (
          messages.map((m, i) => (
            <View key={i} style={styles.bubble}>
              <Text style={styles.bubbleText}>{m}</Text>
            </View>
          ))
        )}
        <Link href="/reactions" style={styles.link}>
          Reactions + modal demo →
        </Link>
        <Link href="/composable" style={styles.link}>
          Composable EmojiPicker primitives →
        </Link>
      </ScrollView>

      {/* Tap-outside-to-dismiss. The OS keyboard already closes on a background
          tap (keyboardShouldPersistTaps="handled"), but the emoji panel is React
          state, so while it's open we overlay the message area with a Pressable
          that calls `close()` — matching the native "tap out to dismiss" feel. */}
      {emojiOpen ? (
        <Pressable
          style={[styles.dismissOverlay, { bottom: inset + BAR_HEIGHT }]}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Close emoji picker"
        />
      ) : null}

      {/* Composer bar — pinned at a CONSTANT offset (inset) above whatever is at
          the bottom (keyboard or emoji panel), so it never jumps during a swap. */}
      <View style={[styles.barWrap, { bottom: inset }]}>
        <Pressable
          onPress={toggle}
          accessibilityRole="button"
          accessibilityLabel={emojiOpen ? 'Show keyboard' : 'Show emoji picker'}
          style={styles.iconBtn}
        >
          <Text style={styles.icon}>{emojiOpen ? '⌨️' : '😀'}</Text>
        </Pressable>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Message"
          placeholderTextColor="#9ca3af"
          onFocus={onInputFocus}
          returnKeyType="send"
          onSubmitEditing={send}
        />
        <Pressable onPress={send} accessibilityRole="button" accessibilityLabel="Send" style={styles.sendBtn}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>

      {/* Emoji panel fills the inset space at the very bottom. Same height source
          (`defaultHeight="keyboard"`) as the inset, so the swap is exact. */}
      {emojiOpen ? (
        <View style={styles.panelWrap}>
          <EmojiKeyboard
            onEmojiSelected={(e: EmojiType) => setText((t) => t + e.emoji)}
            defaultHeight="keyboard"
            categoryPosition="top"
            enableSearchBar
            enableRecentlyUsed
            recentsMode="frecency"
            enableFavorites
            // v0.7 demos: swipe left/right to change category (+ cross-fade).
            enableCategoryChangeGesture
            enableCategoryChangeAnimation
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff' },
  messages: { flex: 1 },
  messagesContent: { padding: 16, gap: 10 },
  hint: { fontSize: 15, color: '#6b7280', lineHeight: 22 },
  bubble: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 16, color: '#ffffff' },
  link: { fontSize: 15, color: '#2563eb', fontWeight: '600', marginTop: 8 },
  barWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    minHeight: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  panelWrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  dismissOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  iconBtn: { padding: 6 },
  icon: { fontSize: 24 },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sendBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  sendText: { fontSize: 15, fontWeight: '600', color: '#2563eb' },
});
