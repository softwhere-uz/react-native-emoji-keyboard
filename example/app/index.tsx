import {
  EmojiKeyboard,
  useEmojiKeyboardInset,
  type EmojiType,
} from '@softwhere-uz/react-native-emoji-keyboard';
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function ComposerScreen() {
  const [messages, setMessages] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Unified state: the emoji panel behaves like the keyboard for layout.
  const { keyboardVisible, keyboardHeight } = useEmojiKeyboardInset(emojiOpen);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [...m, t]);
    setText('');
  };

  // Swap the OS keyboard for the emoji panel (and back) at the same height.
  const toggleEmoji = () => {
    if (emojiOpen) {
      setEmojiOpen(false);
      inputRef.current?.focus();
    } else {
      Keyboard.dismiss();
      setEmojiOpen(true);
    }
  };

  // The keyboard OVERLAYS the app (iOS always; Android too under the now-standard
  // edge-to-edge, which doesn't resize the window), so lift the composer bar by
  // the keyboard height to keep it — and the input — visible above the keyboard.
  const barLift = keyboardVisible ? keyboardHeight : 0;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <Text style={styles.hint}>
            Type a message, then tap 😀 — the emoji picker replaces the keyboard at the same height,
            seamlessly. Tap ⌨️ to swap back.
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
      </ScrollView>

      {/* Composer bar — sits above the keyboard / emoji panel. */}
      <View style={[styles.bar, { marginBottom: barLift }]}>
        <Pressable
          onPress={toggleEmoji}
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
          onFocus={() => setEmojiOpen(false)}
          returnKeyType="send"
          onSubmitEditing={send}
        />
        <Pressable onPress={send} accessibilityRole="button" accessibilityLabel="Send" style={styles.sendBtn}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>

      {/* Emoji panel occupies exactly the keyboard's space when open. */}
      {emojiOpen ? (
        <EmojiKeyboard
          onEmojiSelected={(e: EmojiType) => setText((t) => t + e.emoji)}
          defaultHeight="keyboard"
          categoryPosition="top"
          enableSearchBar
          enableRecentlyUsed
        />
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
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
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
