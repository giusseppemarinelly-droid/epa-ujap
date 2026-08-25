import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Modal, Pressable, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useVideoPlayer, VideoView } from 'expo-video';

import { radii } from '@/src/theme/tokens';
import type { MessageKind } from '@/src/types';

// Lo que dura una foto en pantalla. Ocho segundos alcanzan para mirarla con
// calma sin que deje de sentirse efímero.
const PHOTO_DURATION_MS = 8000;

// Si el video tarda en reportar su duración, la cuenta arranca con el tope de
// grabación para que nunca se quede sin límite. Se corrige al cargar.
const VIDEO_FALLBACK_MS = 17000;

// Por debajo de esto una pulsación es un toque (cerrar); por encima es
// mantener presionado (pausar), igual que en Snapchat.
const TAP_THRESHOLD_MS = 220;

type SnapViewerProps = {
  mediaUrl: string;
  kind: MessageKind;
  onClose: () => void;
};

/**
 * Visor a pantalla completa de un Snap. Se monta solo cuando hay algo que
 * mostrar y se desmonta al cerrarse: el contenido ya no existe en ningún
 * estado, así que no hay forma de volver a abrirlo.
 */
export function SnapViewer({ mediaUrl, kind, onClose }: SnapViewerProps) {
  const isVideo = kind === 'video';
  const progress = useSharedValue(1);
  const totalMs = useRef(isVideo ? VIDEO_FALLBACK_MS : PHOTO_DURATION_MS);
  const pressStartedAt = useRef(0);
  const closed = useRef(false);
  const [remaining, setRemaining] = useState(Math.ceil(totalMs.current / 1000));

  const player = useVideoPlayer(isVideo ? mediaUrl : null, (instance) => {
    instance.loop = false;
    instance.play();
  });

  // Cerrar solo puede pasar una vez: la animación y el gesto pueden llegar casi
  // a la par y el segundo aviso dispararía un `setState` sobre algo desmontado.
  const finish = useCallback(() => {
    if (closed.current) return;
    closed.current = true;
    onClose();
  }, [onClose]);

  const runCountdown = useCallback(
    (durationMs: number) => {
      progress.value = withTiming(0, { duration: durationMs, easing: Easing.linear }, (done) => {
        if (done) runOnJS(finish)();
      });
    },
    [finish, progress]
  );

  useEffect(() => {
    runCountdown(totalMs.current);
    return () => cancelAnimation(progress);
  }, [progress, runCountdown]);

  useEffect(() => {
    if (!isVideo) return;

    // La duración real solo se conoce cuando el video termina de cargar, así
    // que la cuenta se reajusta en ese momento en vez de al montar.
    const loaded = player.addListener('sourceLoad', ({ duration }) => {
      if (!Number.isFinite(duration) || duration <= 0) return;
      cancelAnimation(progress);
      totalMs.current = duration * 1000;
      progress.value = 1;
      runCountdown(totalMs.current);
    });
    const ended = player.addListener('playToEnd', finish);

    return () => {
      loaded.remove();
      ended.remove();
    };
  }, [finish, isVideo, player, progress, runCountdown]);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((progress.value * totalMs.current) / 1000)));
    }, 200);
    return () => clearInterval(timer);
  }, [progress]);

  function handlePressIn() {
    pressStartedAt.current = Date.now();
    cancelAnimation(progress);
    if (isVideo) player.pause();
  }

  function handlePressOut() {
    if (Date.now() - pressStartedAt.current < TAP_THRESHOLD_MS) {
      finish();
      return;
    }
    if (isVideo) player.play();
    runCountdown(progress.value * totalMs.current);
  }

  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <Modal visible transparent={false} animationType="fade" onRequestClose={finish} statusBarTranslucent>
      <Pressable
        className="flex-1"
        style={{ backgroundColor: '#000000' }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {isVideo ? (
          <VideoView
            player={player}
            style={{ flex: 1, backgroundColor: '#000000' }}
            contentFit="contain"
            nativeControls={false}
          />
        ) : (
          <Image source={{ uri: mediaUrl }} style={{ flex: 1, width: '100%' }} resizeMode="contain" />
        )}

        <View
          className="absolute left-0 right-0 flex-row items-center"
          style={{ top: 48, paddingHorizontal: 16 }}
          pointerEvents="none"
        >
          <View
            className="flex-1 overflow-hidden"
            style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)' }}
          >
            <Animated.View style={[{ height: 4, borderRadius: 2, backgroundColor: '#FFFFFF' }, barStyle]} />
          </View>
          <View
            className="items-center justify-center ml-3"
            style={{
              minWidth: 32,
              height: 32,
              borderRadius: radii.full,
              paddingHorizontal: 8,
              backgroundColor: 'rgba(0,0,0,0.55)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.35)',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 13 }}>{remaining}</Text>
          </View>
        </View>

        <View className="absolute left-0 right-0 items-center" style={{ bottom: 40 }} pointerEvents="none">
          <Text style={{ color: '#FFFFFF', fontSize: 13, opacity: 0.75 }}>
            Toca para cerrar · mantén presionado para pausar
          </Text>
        </View>
      </Pressable>
    </Modal>
  );
}
