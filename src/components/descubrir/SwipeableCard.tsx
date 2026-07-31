import { Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;

type SwipeableCardProps = {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
};

// Gesto de arrastre estilo tarjetas apilables: a la derecha = conectar
// (sumar a planes), a la izquierda = descartar. Sin corazones ni "match" —
// el ícono y la copy siguen siendo de comunidad, solo el gesto es el mismo
// patrón de tarjetas deslizables.
export function SwipeableCard({ children, onSwipeLeft, onSwipeRight }: SwipeableCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.15;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 220 }, (finished) => {
          if (finished) runOnJS(onSwipeRight)();
        });
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 220 }, (finished) => {
          if (finished) runOnJS(onSwipeLeft)();
        });
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${(translateX.value / SCREEN_WIDTH) * 18}deg` },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>{children}</Animated.View>
    </GestureDetector>
  );
}
