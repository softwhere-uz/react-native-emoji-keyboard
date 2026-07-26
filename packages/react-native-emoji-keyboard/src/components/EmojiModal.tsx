/**
 * `EmojiModal` — a bottom-sheet surface wrapping arbitrary content (typically
 * `<EmojiKeyboard/>`). Backdrop fade + slide-up, a knob you can drag down to
 * dismiss, and reduced-motion support.
 *
 * Built on RN's built-in `Modal` + `Animated` + `PanResponder`, so it needs NO
 * extra dependency and runs on iOS / Android / web with zero host setup.
 * `react-native-reanimated` + `react-native-gesture-handler` are declared as
 * OPTIONAL peers: a future worklet-driven variant can use them for buttery
 * gesture physics, but this baseline never requires them and never breaks when
 * they are absent (nor does it need a `GestureHandlerRootView`).
 */
import * as React from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import type { DimensionValue, LayoutChangeEvent } from 'react-native';

import type { RecursivePartial, Theme } from '../types';
import { darkTheme, defaultTheme, ThemeProvider, useTheme } from '../theme';
import { useReducedMotion } from './useReducedMotion';

export type EmojiModalProps = {
  /** Whether the sheet is open (controlled). */
  open: boolean;
  /** Fired when the user dismisses (backdrop tap, drag-down, or hardware back). */
  onClose: () => void;
  /** Sheet content — usually `<EmojiKeyboard />`. */
  children: React.ReactNode;
  /** Sheet height: a number (px) or percent string. Defaults to `'55%'`. */
  height?: number | string;
  /** Base color scheme for the backdrop/sheet. `'auto'` follows the OS. */
  colorScheme?: 'light' | 'dark' | 'auto';
  /** Partial color-token overrides, merged over the chosen base. */
  theme?: RecursivePartial<Theme>;
  /** Tap the backdrop to dismiss. Defaults to `true`. */
  closeOnBackdropPress?: boolean;
  /** Drag-down distance (px) past which release dismisses. Defaults to `80`. */
  dismissThreshold?: number;
};

/** Resolve a `number | string` height into a RN `DimensionValue`. */
function toHeight(value: number | string | undefined, fallback: DimensionValue): DimensionValue {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    if (/^\d+(\.\d+)?%$/.test(value.trim())) return value.trim() as DimensionValue;
    const n = Number.parseFloat(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

const IN_DURATION = 240;
const OUT_DURATION = 200;

function EmojiModalBody({
  open,
  onClose,
  children,
  height = '55%',
  closeOnBackdropPress = true,
  dismissThreshold = 80,
}: EmojiModalProps): React.ReactElement | null {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();

  // Keep the Modal mounted through the close animation.
  const [rendered, setRendered] = React.useState(open);
  // 0 = fully closed (off-screen), 1 = fully open. Drives translateY + backdrop.
  const progress = React.useRef(new Animated.Value(0)).current;
  // Measured sheet height, for the off-screen slide distance.
  const [sheetHeight, setSheetHeight] = React.useState(400);
  const sheetHeightRef = React.useRef(sheetHeight);
  sheetHeightRef.current = sheetHeight;

  const onSheetLayout = React.useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) setSheetHeight(h);
  }, []);

  // Mount when opening; animate out then unmount when closing.
  React.useEffect(() => {
    if (open) {
      setRendered(true);
      return;
    }
    if (!rendered) return;
    if (reduceMotion) {
      setRendered(false);
      return;
    }
    Animated.timing(progress, {
      toValue: 0,
      duration: OUT_DURATION,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) setRendered(false);
    });
    // rendered/reduceMotion are read for the close path only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Animate in once mounted.
  React.useEffect(() => {
    if (!rendered) return;
    progress.setValue(0);
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    Animated.timing(progress, {
      toValue: 1,
      duration: IN_DURATION,
      useNativeDriver: false,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rendered]);

  const springOpen = React.useCallback(() => {
    Animated.timing(progress, { toValue: 1, duration: 160, useNativeDriver: false }).start();
  }, [progress]);

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_e, g) => {
          if (g.dy <= 0) return;
          const next = Math.max(0, 1 - g.dy / Math.max(1, sheetHeightRef.current));
          progress.setValue(next);
        },
        onPanResponderRelease: (_e, g) => {
          if (g.dy > dismissThreshold || g.vy > 1.2) onClose();
          else springOpen();
        },
        onPanResponderTerminate: () => springOpen(),
      }),
    [dismissThreshold, onClose, progress, springOpen]
  );

  if (!rendered) return null;

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetHeight, 0],
    extrapolate: 'clamp',
  });

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.fill}>
        <Animated.View style={[styles.backdrop, { backgroundColor: theme.backdrop, opacity: progress }]}>
          <Pressable
            style={styles.fill}
            accessibilityLabel="Close"
            onPress={closeOnBackdropPress ? onClose : undefined}
          />
        </Animated.View>

        <Animated.View
          onLayout={onSheetLayout}
          style={[
            styles.sheet,
            { height: toHeight(height, '55%'), backgroundColor: theme.container, transform: [{ translateY }] },
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.handleArea}>
            <View style={[styles.knob, { backgroundColor: theme.knob }]} />
          </View>
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/**
 * Bottom-sheet emoji surface. Wraps the body in a `ThemeProvider` with a light
 * or dark base chosen from `colorScheme` (`'auto'` follows the OS).
 */
export function EmojiModal(props: EmojiModalProps): React.ReactElement {
  const systemScheme = useColorScheme();
  const scheme = props.colorScheme ?? 'light';
  const effective = scheme === 'auto' ? (systemScheme ?? 'light') : scheme;
  const baseTheme = effective === 'dark' ? darkTheme : defaultTheme;

  return (
    <ThemeProvider theme={props.theme} baseTheme={baseTheme}>
      <EmojiModalBody {...props} />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  handleArea: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  knob: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  content: {
    flex: 1,
  },
});

EmojiModal.displayName = 'EmojiModal';
