import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { SnapViewer } from '@/src/components/chat/SnapViewer';
import { Avatar } from '@/src/components/ui';
import { useAuthStore, useConversationsStore } from '@/src/store';
import type { OpenedSnap } from '@/src/store/useConversationsStore';
import { colors, getEpaGradient, radii } from '@/src/theme/tokens';
import type { Message, MessageKind } from '@/src/types';

// Mismo tope que valida el backend: el body de la API llega a 25mb y base64
// engorda el archivo un tercio. Avisamos aquí para no subir en balde.
const MAX_MEDIA_BYTES = 18 * 1024 * 1024;

// Quince segundos de video pesan poco y siguen contando algo. Es la única
// palanca real para no chocar con el límite de tamaño del servidor.
const MAX_VIDEO_SECONDS = 15;

const MEDIA_WIDTH = 220;
const MEDIA_HEIGHT = 260;
const SNAP_BOX_SIZE = 150;

// El picker solo trae base64 de las imágenes. Para el video hay que leer el
// archivo local a mano; blob + FileReader evita meter otra dependencia.
async function readFileAsBase64(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.readAsDataURL(blob);
  });
}

// Cada video necesita su propio reproductor y `useVideoPlayer` es un hook, así
// que la burbuja de video tiene que ser un componente aparte.
function VideoBubble({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
  });

  return (
    <VideoView
      player={player}
      style={{ width: MEDIA_WIDTH, height: MEDIA_HEIGHT, borderRadius: 12, backgroundColor: '#000000' }}
      contentFit="cover"
      nativeControls
    />
  );
}

type SnapBubbleProps = {
  message: Message;
  isMine: boolean;
  busy: boolean;
  onOpen: () => void;
};

/**
 * Un Snap nunca enseña su contenido en la lista: solo un recuadro con estado.
 * El que está sin abrir late para que se note que hay algo esperando; los
 * demás quedan apagados y no responden al toque.
 */
function SnapBubble({ message, isMine, busy, onOpen }: SnapBubbleProps) {
  const isVideo = message.kind === 'video';
  const mediaLabel = isVideo ? 'Video' : 'Foto';
  const pending = !isMine && !message.viewedByMe;
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!pending) return;
    // Late en bucle mientras no lo abran. Al abrirlo el componente deja de
    // estar en este estado y la animación se corta sola.
    pulse.value = withRepeat(withTiming(1.05, { duration: 850 }), -1, true);
    return () => {
      pulse.value = 1;
    };
  }, [pending, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  if (pending) {
    return (
      <Animated.View className="self-start mb-2" style={pulseStyle}>
        <Pressable onPress={onOpen} disabled={busy} style={{ opacity: busy ? 0.6 : 1 }}>
          <LinearGradient
            colors={getEpaGradient()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: SNAP_BOX_SIZE,
              height: SNAP_BOX_SIZE,
              borderRadius: radii.md,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 12,
            }}
          >
            <MaterialIcons name={isVideo ? 'videocam' : 'photo-camera'} size={34} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 15, marginTop: 10 }}>
              Toca para ver
            </Text>
            <Text style={{ color: '#FFFFFF', fontSize: 12, opacity: 0.85, marginTop: 2 }}>{mediaLabel}</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  // Enviada y todavía sin abrir por el otro lado; en cualquier otro caso ya se
  // consumió y no hay vuelta atrás para nadie, tampoco para quien la mandó.
  const status = isMine && !message.openedByOthers ? 'Enviada' : 'Abierta';

  return (
    <View
      className={isMine ? 'self-end mb-2' : 'self-start mb-2'}
      style={{
        width: SNAP_BOX_SIZE,
        height: SNAP_BOX_SIZE,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: colors['surface-container'],
        borderWidth: 1,
        borderColor: colors['outline-variant'],
      }}
    >
      <MaterialIcons
        name={isVideo ? 'videocam-off' : 'visibility-off'}
        size={30}
        color={colors['on-surface-variant']}
      />
      <Text
        className="text-on-surface-variant"
        style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, marginTop: 10 }}
      >
        {status}
      </Text>
      <Text className="text-on-surface-variant" style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
        {mediaLabel}
      </Text>
    </View>
  );
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUserId = useAuthStore((state) => state.currentUser?.id);
  const conversations = useConversationsStore((state) => state.conversations);
  const messagesByConversation = useConversationsStore((state) => state.messagesByConversation);
  const fetchMessages = useConversationsStore((state) => state.fetchMessages);
  const fetchConversations = useConversationsStore((state) => state.fetchConversations);
  const sendMessage = useConversationsStore((state) => state.sendMessage);
  const sendMediaMessage = useConversationsStore((state) => state.sendMediaMessage);
  const openSnap = useConversationsStore((state) => state.openSnap);
  const markRead = useConversationsStore((state) => state.markRead);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<Exclude<MessageKind, 'texto'> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);
  const [openingSnapId, setOpeningSnapId] = useState<string | null>(null);
  const [viewingSnap, setViewingSnap] = useState<OpenedSnap | null>(null);
  const listRef = useRef<FlatList<Message>>(null);

  const conversation = conversations.find((item) => item.id === id);
  const messages = messagesByConversation[id ?? ''] ?? [];
  const busy = sending || uploadingKind !== null || openingSnapId !== null;

  useEffect(() => {
    if (!id || !currentUserId) return;
    fetchMessages(id);
    markRead(id);
    // Sin websockets todavía: mientras el chat está abierto, refrescamos
    // cada pocos segundos para que los mensajes nuevos y el estado "en
    // línea" de la otra persona aparezcan solos, sin recargar la página.
    const interval = setInterval(() => {
      fetchMessages(id);
      markRead(id);
      fetchConversations(currentUserId);
    }, 3000);
    return () => clearInterval(interval);
  }, [id, currentUserId, fetchMessages, markRead, fetchConversations]);

  function scrollToEnd() {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }

  async function handleSend() {
    if (!text.trim() || busy || !id) return;
    setSending(true);
    setError(null);
    try {
      await sendMessage(id, text.trim());
      setText('');
      scrollToEnd();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el mensaje');
    } finally {
      setSending(false);
    }
  }

  // Todo lo que sale de la cámara es un Snap; lo que sale de la galería se
  // queda en el chat. Es la única diferencia entre los dos botones.
  async function uploadAsset(asset: ImagePicker.ImagePickerAsset, ephemeral: boolean) {
    if (!id) return;

    const kind: Exclude<MessageKind, 'texto'> = asset.type === 'video' ? 'video' : 'imagen';
    const isVideo = kind === 'video';

    if (asset.fileSize !== undefined && asset.fileSize > MAX_MEDIA_BYTES) {
      setError(isVideo ? 'El video es muy pesado, graba uno más corto' : 'La foto es muy pesada, prueba con otra');
      return;
    }

    setUploadingKind(kind);
    setError(null);
    try {
      const mediaBase64 = asset.base64 ?? (await readFileAsBase64(asset.uri));
      await sendMediaMessage(id, {
        kind,
        mediaBase64,
        mimeType: asset.mimeType ?? (isVideo ? 'video/mp4' : 'image/jpeg'),
        // Lo que haya escrito antes de adjuntar viaja como pie de foto.
        text: text.trim() || undefined,
        ephemeral,
      });
      setText('');
      scrollToEnd();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el archivo');
    } finally {
      setUploadingKind(null);
    }
  }

  async function handleCapture() {
    // Una subida a la vez: dos videos en paralelo tumban la conexión y dejan
    // el indicador mintiendo sobre cuál va.
    if (busy || !id) return;

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Epa necesita la cámara para mandar un Snap');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.4,
      videoMaxDuration: MAX_VIDEO_SECONDS,
      base64: true,
    });

    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return;
    await uploadAsset(asset, true);
  }

  async function handleAttach() {
    if (busy || !id) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Epa necesita acceso a tus fotos para poder mandarlas');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.4,
      videoMaxDuration: MAX_VIDEO_SECONDS,
      base64: true,
    });

    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return;
    await uploadAsset(asset, false);
  }

  async function handleOpenSnap(message: Message) {
    if (!id || openingSnapId !== null) return;
    setOpeningSnapId(message.id);
    setError(null);
    try {
      // El store ya deja la burbuja apagada al volver, así que el refresco de
      // los 3s no la puede resucitar mientras el visor está abierto.
      setViewingSnap(await openSnap(id, message.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ese Snap ya no está disponible');
    } finally {
      setOpeningSnapId(null);
    }
  }

  function renderBubble(item: Message) {
    const isMine = item.senderId === currentUserId;
    const caption = item.text.trim();

    if (item.ephemeral && item.kind !== 'texto') {
      return (
        <View className={isMine ? 'self-end' : 'self-start'} style={{ maxWidth: '80%' }}>
          <SnapBubble
            message={item}
            isMine={isMine}
            busy={openingSnapId !== null}
            onOpen={() => handleOpenSnap(item)}
          />
          {caption.length > 0 && (
            <Text
              className={`text-on-surface-variant mb-2 ${isMine ? 'text-right' : ''}`}
              style={{ fontSize: 13 }}
            >
              {caption}
            </Text>
          )}
        </View>
      );
    }

    if (item.kind !== 'texto' && item.mediaUrl) {
      const mediaUrl = item.mediaUrl;
      return (
        <View
          className={`rounded-md p-1 mb-2 ${isMine ? 'self-end bg-primary' : 'self-start bg-surface-container'}`}
          style={{ maxWidth: '80%' }}
        >
          {item.kind === 'imagen' ? (
            <Pressable onPress={() => setZoomedPhoto(mediaUrl)}>
              <Image
                source={{ uri: mediaUrl }}
                style={{ width: MEDIA_WIDTH, height: MEDIA_HEIGHT, borderRadius: 12 }}
                resizeMode="cover"
              />
            </Pressable>
          ) : (
            <VideoBubble uri={mediaUrl} />
          )}
          {caption.length > 0 && (
            <Text
              className={`px-2 pt-2 pb-1 ${isMine ? 'text-on-primary' : 'text-on-surface'}`}
              style={{ fontSize: 14 }}
            >
              {caption}
            </Text>
          )}
        </View>
      );
    }

    return (
      <View
        className={`rounded-md px-4 py-3 mb-2 ${isMine ? 'self-end bg-primary' : 'self-start bg-surface-container'}`}
        style={{ maxWidth: '80%' }}
      >
        <Text className={isMine ? 'text-on-primary' : 'text-on-surface'}>{item.text}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="flex-row items-center px-margin-mobile py-3">
        <Pressable onPress={() => router.back()} accessibilityLabel="Volver" className="mr-2 p-1">
          <MaterialIcons name="arrow-back" size={22} color={colors['on-surface']} />
        </Pressable>
        <Avatar uri={conversation?.avatarUrl} size={36} online={conversation?.online} />
        <View className="ml-2 flex-1">
          <View className="flex-row items-center">
            <Text
              className="text-on-surface shrink"
              style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }}
              numberOfLines={1}
            >
              {conversation?.title ?? 'Chat'}
            </Text>
            {conversation !== undefined && conversation.streakCount > 0 && (
              <View
                className="flex-row items-center rounded-full ml-2"
                style={{ backgroundColor: colors['surface-container'], paddingHorizontal: 8, paddingVertical: 2 }}
              >
                <MaterialIcons name="local-fire-department" size={14} color={colors.primary} />
                <Text
                  className="text-primary"
                  style={{ fontFamily: 'Inter_700Bold', fontSize: 12, marginLeft: 2 }}
                >
                  {conversation.streakCount}
                </Text>
              </View>
            )}
          </View>
          {conversation?.type === 'directa' && (
            <Text
              style={{
                fontSize: 12,
                color: conversation.online ? '#22C55E' : colors['on-surface-variant'],
              }}
            >
              {conversation.online ? 'En línea' : 'Desconectado'}
            </Text>
          )}
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => renderBubble(item)}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <Text className="text-on-surface-variant text-center mt-10">
            Échale un epa — todavía no hay mensajes aquí.
          </Text>
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {uploadingKind && (
          <View className="flex-row items-center px-margin-mobile pb-1">
            <ActivityIndicator size="small" color={colors.primary} />
            <Text className="text-on-surface-variant ml-2" style={{ fontSize: 13 }}>
              {uploadingKind === 'video' ? 'Subiendo el video...' : 'Subiendo la foto...'}
            </Text>
          </View>
        )}
        {error && (
          <Text className="text-error px-margin-mobile pb-1" style={{ fontSize: 13 }}>
            {error}
          </Text>
        )}
        <View className="flex-row items-center px-margin-mobile py-3 gap-2">
          <Pressable
            onPress={handleCapture}
            disabled={busy}
            accessibilityLabel="Mandar un Snap con la cámara"
            style={{ opacity: busy ? 0.5 : 1 }}
          >
            <LinearGradient
              colors={getEpaGradient()}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 44, height: 44, borderRadius: radii.full, alignItems: 'center', justifyContent: 'center' }}
            >
              <MaterialIcons name="photo-camera" size={20} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
          <Pressable
            onPress={handleAttach}
            disabled={busy}
            accessibilityLabel="Adjuntar foto o video de la galería"
            className="items-center justify-center rounded-full"
            style={{
              width: 44,
              height: 44,
              backgroundColor: colors['surface-container'],
              opacity: busy ? 0.5 : 1,
            }}
          >
            <MaterialIcons name="photo-library" size={20} color={colors['on-surface']} />
          </Pressable>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={colors['on-surface-variant']}
            className="flex-1 bg-surface-container rounded-full px-4 py-3 text-on-surface"
            style={{ fontFamily: 'Inter_400Regular', fontSize: 14 }}
            multiline
          />
          <Pressable
            onPress={handleSend}
            disabled={!text.trim() || busy}
            accessibilityLabel="Enviar mensaje"
            className="bg-primary items-center justify-center rounded-full"
            style={{ width: 44, height: 44, opacity: !text.trim() || busy ? 0.5 : 1 }}
          >
            <MaterialIcons name="send" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {viewingSnap && (
        <SnapViewer
          mediaUrl={viewingSnap.mediaUrl}
          kind={viewingSnap.kind}
          onClose={() => setViewingSnap(null)}
        />
      )}

      <Modal visible={zoomedPhoto !== null} transparent animationType="fade" onRequestClose={() => setZoomedPhoto(null)}>
        <Pressable
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.94)' }}
          onPress={() => setZoomedPhoto(null)}
        >
          {zoomedPhoto && (
            <Image source={{ uri: zoomedPhoto }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />
          )}
          <Text className="text-white mt-4" style={{ fontSize: 13, opacity: 0.7 }}>
            Toca para cerrar
          </Text>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
