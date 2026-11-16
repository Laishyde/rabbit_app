import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, 
  SafeAreaView, Dimensions, StatusBar, ScrollView, Image, Platform, Vibration
} from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import Animated, { 
  useSharedValue, useAnimatedStyle, withSpring, runOnJS, 
  withRepeat, withTiming, withSequence, withDelay, Easing 
} from 'react-native-reanimated';
// @ts-ignore - expo-linear-gradient types will be available after npm install
import { LinearGradient } from 'expo-linear-gradient';

const GRID_SIZE = 5;
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const BOARD_PADDING = 20;
const CELL_MARGIN = 6;
const BOARD_WIDTH = SCREEN_WIDTH > 500 ? 440 : SCREEN_WIDTH - (BOARD_PADDING * 2);
const CELL_SIZE = (BOARD_WIDTH - (CELL_MARGIN * (GRID_SIZE + 1))) / GRID_SIZE;

const BACKEND_API_URL = "http://127.0.0.1:8000/api/process-voice";

interface WorldObject {
  name: string;
  x: number;
  y: number;
  emoji: string;
  passable: boolean;
  interactive: boolean;
  canJumpOver?: boolean;
}

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [narratorText, setNarratorText] = useState("Oi amiguinho! Sou o Velho Corujão. ajude o Algodão a encontrar a mamãe! Diga para onde ir! subir ou descer vamos lá ");
  const [userSpeechLog, setUserSpeechLog] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const isAgentSpeaking = useRef(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentX = useSharedValue(0);
  const currentY = useSharedValue(4);
  const owlY = useSharedValue(0);
  const rabbitScale = useSharedValue(1);
  
  // Parallax values
  const parallaxX = useSharedValue(0);
  const parallaxY = useSharedValue(0);
  
  // Ambient animation values
  const grassSway = useSharedValue(0);
  const leafFall = useSharedValue(0);
  const butterflyX = useSharedValue(0);
  const butterflyY = useSharedValue(0);
  const fireflyOpacity = useSharedValue(0);
  const cloudX = useSharedValue(0);
  const birdX = useSharedValue(0);
  
  // Character idle animations
  const rabbitBlink = useSharedValue(1);
  const rabbitBreathe = useSharedValue(1);
  const owlBlink = useSharedValue(1);
  const owlHeadTilt = useSharedValue(0);
  
  // Interactive object animations
  const carrotScale = useSharedValue(1);
  const carrotGlow = useSharedValue(0);
  const flowerScale = useSharedValue(1);
  const flowerSway = useSharedValue(0);
  const motherRabbitScale = useSharedValue(1);
  const goldenCarrotScale = useSharedValue(1);
  const goldenCarrotGlow = useSharedValue(1);
  const goldenCarrotFloat = useSharedValue(0);
  const whirlwindScale = useSharedValue(0);
  const whirlwindRotation = useSharedValue(0);
  
  // Walking animation values
  const rabbitHopY = useSharedValue(0);
  const rabbitWalkRotate = useSharedValue(0);
  const isWalking = useSharedValue(false);

  const [carrotVisible, setCarrotVisible] = useState(true);
  const [flowerVisible, setFlowerVisible] = useState(true);
  const [appleVisible, setAppleVisible] = useState(true);

  const [carrotX, setCarrotX] = useState(1);
  const [carrotY, setCarrotY] = useState(1);
  const [flowerX, setFlowerX] = useState(3);
  const [flowerY, setFlowerY] = useState(2);
  const [appleX, setAppleX] = useState(1);
  const [appleY, setAppleY] = useState(3);

  const [motherX, setMotherX] = useState(4);
  const [motherY, setMotherY] = useState(4);

  const [goldenCarrotX, setGoldenCarrotX] = useState(0); 
  const [goldenCarrotY, setGoldenCarrotY] = useState(0);
  const [goldenCarrotVisible, setGoldenCarrotVisible] = useState(true);
  const [hasGoldenCarrotFled, setHasGoldenCarrotFled] = useState(false); 

  useEffect(() => {
    // Owl floating animation
    owlY.value = withRepeat(withSequence(withTiming(-6, { duration: 1200 }), withTiming(0, { duration: 1200 })), -1, true);
    
    // Owl head tilt
    owlHeadTilt.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
    
    // Owl blink animation
    const blinkLoop = () => {
      owlBlink.value = withSequence(
        withTiming(0.1, { duration: 100 }),
        withTiming(1, { duration: 100 }),
        withDelay(3000, withTiming(0.1, { duration: 100 })),
        withTiming(1, { duration: 100 })
      );
    };
    blinkLoop();
    const blinkInterval = setInterval(blinkLoop, 5000);
    
    // Rabbit breathing animation
    rabbitBreathe.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
    
    // Rabbit blink animation
    const rabbitBlinkLoop = () => {
      rabbitBlink.value = withSequence(
        withTiming(0.1, { duration: 80 }),
        withTiming(1, { duration: 80 })
      );
    };
    rabbitBlinkLoop();
    const rabbitBlinkInterval = setInterval(rabbitBlinkLoop, 4000);
    
    // Grass swaying animation
    grassSway.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-5, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
    
    // Leaf falling animation
    leafFall.value = withRepeat(
      withSequence(
        withTiming(SCREEN_HEIGHT, { duration: 8000, easing: Easing.linear }),
        withTiming(-50, { duration: 0 })
      ),
      -1, false
    );
    
    // Butterfly floating animation
    butterflyX.value = withRepeat(
      withSequence(
        withTiming(100, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
    butterflyY.value = withRepeat(
      withSequence(
        withTiming(50, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
    
    // Firefly pulsing animation
    fireflyOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
    
    // Cloud drifting animation
    cloudX.value = withRepeat(
      withSequence(
        withTiming(SCREEN_WIDTH + 100, { duration: 20000, easing: Easing.linear }),
        withTiming(-100, { duration: 0 })
      ),
      -1, false
    );
    
    // Bird flying animation
    birdX.value = withRepeat(
      withSequence(
        withTiming(SCREEN_WIDTH + 50, { duration: 12000, easing: Easing.linear }),
        withTiming(-50, { duration: 0 })
      ),
      -1, false
    );
    
    // Interactive object animations
    // Carrot pulse animation
    carrotScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
    carrotGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
    
    // Flower sway animation
    flowerScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
    flowerSway.value = withRepeat(
      withSequence(
        withTiming(8, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-8, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
    
    // Mother rabbit gentle pulse
    motherRabbitScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
    
    // Golden carrot magical floating and glowing
    goldenCarrotScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
    goldenCarrotGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
    goldenCarrotFloat.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
    
    return () => {
      clearInterval(blinkInterval);
      clearInterval(rabbitBlinkInterval);
    };
  }, []);

  const worldObjects: Record<string, WorldObject> = useMemo(() => ({
    'CENOURA': { name: 'Cenoura', x: carrotX, y: carrotY, emoji: 'cenoura', passable: true, interactive: true },
    'FLOR': { name: 'Flor', x: flowerX, y: flowerY, emoji: 'flor', passable: true, interactive: true },
    'MAÇA': { name: 'Maçã', x: appleX, y: appleY, emoji: 'maça', passable: true, interactive: true },
    'MÃE': { name: 'Mãe Coelho', x: motherX, y: motherY, emoji: 'mae', passable: true, interactive: true },
    'ÁRVORE': { name: 'Árvore', x: 2, y: 2, emoji: 'arvore', passable: false, interactive: false },
    'CERCA': { name: 'Cerca', x: 3, y: 3, emoji: 'cerca', passable: false, interactive: false },
  }), [carrotX, carrotY, flowerX, flowerY, appleX, appleY, motherX, motherY]);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const isLoopingActive = useRef(false);

  // Dispara uma resposta tátil de erro e o som nativo de alerta (Buzina do dispositivo)
  const triggerBuzzerSound = () => {
    Vibration.vibrate([0, 150, 100, 150]);
    console.log("ALERTA DE COLISÃO DISPARADO: Buzina executada.");
  };

  // INTERPRETADOR ULTRA FLEXÍVEL PARA CRIANÇAS (Fallback caso o Backend erre)
  const parseChildSpeechToAction = (speech: string): string | null => {
    const text = speech.toLowerCase();
    let direction = "";
    let magnitude = 1;

    // Detectando a intenção de direção - mais permissivo
    if (text.includes("cima") || text.includes("sobe") || text.includes("suba") || text.includes("subir") || text.includes("acima") || text.includes("up")) {
      direction = "CIMA";
    } else if (text.includes("baixo") || text.includes("desce") || text.includes("desça") || text.includes("descer") || text.includes("abaixo") || text.includes("down")) {
      direction = "BAIXO";
    } else if (text.includes("esquerda") || text.includes("esq") || text.includes("atrás") || text.includes("volta") || text.includes("left")) {
      direction = "ESQUERDA";
    } else if (text.includes("direita") || text.includes("dir") || text.includes("frente") || text.includes("avança") || text.includes("avançar") || text.includes("lado") || text.includes("right")) {
      direction = "DIREITA";
    }

    // Se não achou direção nenhuma, não faz nada
    if (!direction) return null;

    // Detectando a quantidade de casas de forma infantil
    if (text.includes("duas") || text.includes("dois") || text.includes("2")) {
      magnitude = 2;
    } else if (text.includes("três") || text.includes("tres") || text.includes("3")) {
      magnitude = 3;
    } else if (text.includes("quatro") || text.includes("4")) {
      magnitude = 4;
    } else if (text.includes("cinco") || text.includes("5")) {
      magnitude = 5;
    } else if (text.includes("direto") || text.includes("tudo") || text.includes("corre")) {
      magnitude = 3;
    }

    return `${direction}_${magnitude}`;
  };

  // Função para filtrar e selecionar a melhor voz masculina para Velho Corujão
  const selectBestMaleVoice = (): SpeechSynthesisVoice | null => {
    if (!('speechSynthesis' in window)) return null;
    
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;

    // Prioridade 1: Microsoft Antonio Online (voz neural premium do Edge)
    const antonioOnline = voices.find(voice => 
      voice.name.includes('Antonio') && voice.name.includes('Online') && voice.lang.includes('pt-BR')
    );
    if (antonioOnline) return antonioOnline;

    // Prioridade 2: Google brasileiro (voz masculina padrão do Chrome)
    const googleBrasileiro = voices.find(voice => 
      voice.name.includes('Google') && voice.name.includes('brasileiro') && voice.lang.includes('pt-BR')
    );
    if (googleBrasileiro) return googleBrasileiro;

    // Prioridade 3: Qualquer voz masculina em português
    const maleVoice = voices.find(voice => 
      (voice.name.includes('Male') || voice.name.includes('Daniel') || voice.name.includes('Antonio')) &&
      voice.lang.includes('pt')
    );
    if (maleVoice) return maleVoice;

    // Prioridade 4: Qualquer voz em português brasileiro
    const ptBrVoice = voices.find(voice => voice.lang.includes('pt-BR'));
    if (ptBrVoice) return ptBrVoice;

    return null;
  };

  // Estado para armazenar a voz selecionada
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Handler para o evento onvoiceschanged (carregamento assíncrono das vozes)
  useEffect(() => {
    if (Platform.OS === 'web' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        selectedVoiceRef.current = selectBestMaleVoice();
        console.log('Vozes carregadas. Voz selecionada:', selectedVoiceRef.current?.name || 'Nenhuma');
      };

      // Tenta carregar vozes imediatamente
      loadVoices();

      // Configura o evento para quando as vozes forem carregadas
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (Platform.OS === 'web' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const safeSpeak = (text: string, callbackOnEnd: () => void) => {
    isAgentSpeaking.current = true;
    stopVoiceLoop(); 

    if (Platform.OS === 'web' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      
      // Configurações para Velho Corujão (idoso sábio)
      utterance.pitch = 0.82; // Tom mais grave/encorpado
      utterance.rate = 0.9;   // Fala mais pausada e sábia
      
      // Usa a voz selecionada se disponível
      if (selectedVoiceRef.current) {
        utterance.voice = selectedVoiceRef.current;
      }
      
      utterance.onend = () => { isAgentSpeaking.current = false; callbackOnEnd(); };
      utterance.onerror = () => { isAgentSpeaking.current = false; callbackOnEnd(); };
      window.speechSynthesis.speak(utterance);
    } else {
      Speech.stop();
      Speech.speak(text, {
        language: 'pt-BR',
        pitch: 0.82,
        rate: 0.9,
        onDone: () => { isAgentSpeaking.current = false; callbackOnEnd(); },
        onError: () => { isAgentSpeaking.current = false; callbackOnEnd(); }
      });
    }
  };

  const playBackendAudio = async (audioBase64: string, callbackOnEnd: () => void) => {
    isAgentSpeaking.current = true;
    stopVoiceLoop();
    
    try {
      // Decode base64 to binary
      const audioData = atob(audioBase64);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }
      
      // Create blob from array buffer
      const blob = new Blob([view], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);
      
      if (Platform.OS === 'web') {
        // Web: Use HTML5 Audio
        const audio = new (window as any).Audio(audioUrl);
        audio.onended = () => {
          isAgentSpeaking.current = false;
          URL.revokeObjectURL(audioUrl);
          callbackOnEnd();
        };
        audio.onerror = () => {
          isAgentSpeaking.current = false;
          URL.revokeObjectURL(audioUrl);
          callbackOnEnd();
        };
        audio.play();
      } else {
        // React Native: Use expo-av
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true },
          (status) => {
            if ('isLoaded' in status && status.isLoaded && status.didJustFinish) {
              isAgentSpeaking.current = false;
              URL.revokeObjectURL(audioUrl);
              callbackOnEnd();
            }
          }
        );
      }
    } catch (error) {
      console.error('Error playing backend audio:', error);
      isAgentSpeaking.current = false;
      callbackOnEnd();
    }
  };

  const handleStartGame = async () => {
    setGameStarted(true);
    try {
      const response = await Audio.requestPermissionsAsync();
      if (response.status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        });
      }
    } catch (e) {}

    safeSpeak(narratorText, () => { startVoiceLoop(); });
  };

  const startVoiceLoop = async () => {
    if (isAgentSpeaking.current) return; 
    isLoopingActive.current = true;
    setIsListening(true);
    resetSilenceTimeout();
    await runSingleRecord();
  };

  const stopVoiceLoop = async () => {
    isLoopingActive.current = false;
    setIsListening(false);
    clearSilenceTimeout();
    if (recordingRef.current) {
      try { await recordingRef.current.stopAndUnloadAsync(); } catch (e) {}
      recordingRef.current = null;
    }
  };

  const resetSilenceTimeout = () => {
    clearSilenceTimeout();
    silenceTimerRef.current = setTimeout(() => {
      if (isLoopingActive.current && !isProcessing && !isAgentSpeaking.current) {
        safeSpeak("Diga comandos como 'Sobe duas casas' ou 'Para baixo' para guiar o Algodão!", () => {
          startVoiceLoop();
        });
      }
    }, 9000); 
  };

  const clearSilenceTimeout = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const runSingleRecord = async () => {
    try {
      if (isAgentSpeaking.current) return;
      if (recordingRef.current) {
        try { await recordingRef.current.stopAndUnloadAsync(); } catch(e){}
        recordingRef.current = null;
      }

      console.log("🎙️ [FRONTEND] Iniciando gravação de áudio...");
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      console.log("🎙️ [FRONTEND] Gravação iniciada, aguardando 4.5 segundos...");
      
      await new Promise(resolve => setTimeout(resolve, 4500)); // Tempo ligeiramente menor para responder mais rápido

      if (!isLoopingActive.current || isAgentSpeaking.current) return;

      console.log("🎙️ [FRONTEND] Parando gravação...");
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      console.log("🎙️ [FRONTEND] Gravação parada, URI:", uri);

      if (uri) {
        await sendAudioToBackend(uri);
      } else if (isLoopingActive.current) {
        console.log("⚠️ [FRONTEND] URI vazia, reiniciando gravação...");
        runSingleRecord();
      }
    } catch (err) {
      console.error("❌ [FRONTEND] Erro na gravação:", err);
      if (isLoopingActive.current) runSingleRecord();
    }
  };

  const sendAudioToBackend = async (uri: string) => {
    setIsProcessing(true);
    clearSilenceTimeout();
    try {
      console.log("🎤 [FRONTEND] Iniciando envio de áudio...");
      console.log("🎤 [FRONTEND] URI do áudio:", uri);
      
      const responseAudio = await fetch(uri);
      const blob = await responseAudio.blob();
      
      console.log("🎤 [FRONTEND] Blob criado, tamanho:", blob.size, "bytes");
      console.log("🎤 [FRONTEND] Tipo do blob:", blob.type);

      const formData = new FormData();
      formData.append('file', blob, 'audio.m4a');

      console.log("🎤 [FRONTEND] Enviando para backend:", BACKEND_API_URL);
      const response = await fetch(BACKEND_API_URL, { method: 'POST', body: formData });
      console.log("🎤 [FRONTEND] Status da resposta:", response.status);
      
      if (!response.ok) {
        console.error("🎤 [FRONTEND] Erro na resposta do backend:", response.status);
        throw new Error();
      }
      
      const data = await response.json();
      console.log("🎤 [FRONTEND] Resposta do backend:", data);
      
      let speechLower = "";
      if (data.transcription) {
        setUserSpeechLog(data.transcription);
        speechLower = data.transcription.toLowerCase();
        resetSilenceTimeout();
      }

      // INTERPRETADOR FRONTEND (Salva a jogada caso o backend mande comandos vazios ou errados)
      const fallbackAction = parseChildSpeechToAction(speechLower);
      const finalAction = data.action || fallbackAction;

      if (data.narrator_response) {
        // CORREÇÃO RADICAL: Se o backend mandar uma despedida sem a criança pedir, o app limpa e ignora!
        // CRITICAL BUG FIX: Goodbye only allowed from child's voice input, never from AI response
        if (data.narrator_response.toLowerCase().includes("tchau") || data.narrator_response.toLowerCase().includes("boa noite") || data.narrator_response.toLowerCase().includes("adeus")) {
          const alertMsg = "Vamos continuar procurando o prêmio! Para onde vamos?";
          setNarratorText(alertMsg);
          if (finalAction) {
            handleMovement(finalAction);
          } else {
            safeSpeak(alertMsg, () => { startVoiceLoop(); });
          }
          return;
        }

        setNarratorText(data.narrator_response);
        
        // Play TTS audio from backend if available
        if (data.audio) {
          playBackendAudio(data.audio, () => {
            if (finalAction) {
              handleMovement(finalAction);
            } else {
              startVoiceLoop();
            }
          });
        } else {
          // Fallback to native TTS if no audio from backend
          if (finalAction) {
            handleMovement(finalAction);
          } else {
            safeSpeak(data.narrator_response, () => { startVoiceLoop(); });
          }
        }
      } else if (finalAction) {
        handleMovement(finalAction);
      } else {
        if (isLoopingActive.current) runSingleRecord();
      }

    } catch (error) {
      // Caso o servidor caia, o interpretador local do frontend ainda permite a criança jogar off-line!
      if (userSpeechLog) {
        const localAction = parseChildSpeechToAction(userSpeechLog);
        if (localAction) {
          handleMovement(localAction);
          return;
        }
      }
      if (isLoopingActive.current) runSingleRecord();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMovement = (action: string) => {
    let nextX = currentX.value;
    let nextY = currentY.value;

    const actionParts = action.split('_');
    const direction = actionParts[0];
    const magnitude = actionParts.length > 1 ? parseInt(actionParts[1]) : 1;

    let targetX = nextX;
    let targetY = nextY;

    if (direction === "CIMA") targetY = Math.max(0, currentY.value - magnitude);
    else if (direction === "BAIXO") targetY = Math.min(GRID_SIZE - 1, currentY.value + magnitude);
    else if (direction === "ESQUERDA") targetX = Math.max(0, currentX.value - magnitude);
    else if (direction === "DIREITA") targetX = Math.min(GRID_SIZE - 1, currentX.value + magnitude);

    let collisionDetected = false;
    Object.values(worldObjects).forEach(obj => {
        if (!obj.passable && obj.x === targetX && obj.y === targetY && !(actionParts.length > 2 && actionParts[2] === "PULO" && obj.canJumpOver)) {
            collisionDetected = true;
        }
    });

    // CORREÇÃO: Resposta imediata de erro com a buzina e fala exata solicitada
    if (collisionDetected) {
        triggerBuzzerSound(); 
        setNarratorText("Não, Algodão! Aí não é possível!");
        safeSpeak("Não, Algodão! Aí não é possível!", () => {
            startVoiceLoop();
        });
        return; 
    }

    // Enhanced walking animation with hopping motion
    isWalking.value = true;
    const jumpScale = magnitude > 1 ? 1.5 : 1.25;
    const hopHeight = magnitude > 1 ? -15 : -10;
    const walkDuration = 200 * magnitude;
    
    // Scale animation for jumping/hopping
    rabbitScale.value = withSequence(
      withTiming(jumpScale, { duration: walkDuration * 0.3, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: walkDuration * 0.7, easing: Easing.in(Easing.ease) })
    );
    
    // Hopping motion (vertical bounce)
    rabbitHopY.value = withSequence(
      withTiming(hopHeight, { duration: walkDuration * 0.3, easing: Easing.out(Easing.ease) }),
      withTiming(0, { duration: walkDuration * 0.7, easing: Easing.bounce })
    );
    
    // Slight rotation during movement for natural walking feel
    const rotationAngle = direction === "DIREITA" ? 5 : direction === "ESQUERDA" ? -5 : 0;
    rabbitWalkRotate.value = withSequence(
      withTiming(rotationAngle, { duration: walkDuration * 0.5, easing: Easing.inOut(Easing.ease) }),
      withTiming(0, { duration: walkDuration * 0.5, easing: Easing.inOut(Easing.ease) })
    );

    // Position movement with spring animation
    currentX.value = withSpring(targetX, { damping: 13, stiffness: 95 });
    currentY.value = withSpring(targetY, { damping: 13, stiffness: 95 }, (finished) => {
      if (finished) {
        isWalking.value = false;
        runOnJS(checkInteractionTrigger)(targetX, targetY);
      }
    });
  };

  const respawnItem = (itemKey: string) => {
    let newX: number | undefined, newY: number | undefined;
    let validPosition = false;
    let attempts = 0;

    while (!validPosition && attempts < 20) {
      newX = Math.floor(Math.random() * GRID_SIZE);
      newY = Math.floor(Math.random() * GRID_SIZE);
      attempts++;

      // Check if position is not occupied by obstacles or other items
      let occupied = false;
      Object.keys(worldObjects).forEach(key => {
        const obj = worldObjects[key];
        if (key !== itemKey && obj.x === newX && obj.y === newY) {
          occupied = true;
        }
      });

      // Check if position is not the same as rabbit's current position
      if (newX === currentX.value && newY === currentY.value) {
        occupied = true;
      }

      if (!occupied) {
        validPosition = true;
      }
    }

    if (validPosition) {
      if (itemKey === 'CENOURA') {
        setCarrotX(newX!);
        setCarrotY(newY!);
      } else if (itemKey === 'FLOR') {
        setFlowerX(newX!);
        setFlowerY(newY!);
      } else if (itemKey === 'MAÇA') {
        setAppleX(newX!);
        setAppleY(newY!);
      } else if (itemKey === 'MÃE') {
        setMotherX(newX!);
        setMotherY(newY!);
      }
    }
  };

  const checkInteractionTrigger = (x: number, y: number) => {
    if (goldenCarrotVisible) {
      if (x === goldenCarrotX && y === goldenCarrotY) {
        setGoldenCarrotVisible(false);
        setScore(prev => prev + 200);
        const victoryMsg = "Incrível! Você encurralou e pegou o prêmio! Você é o Coelho Mais Esperto do Canteiro! Que grande aventura, você conseguiu!";
        setNarratorText(victoryMsg);
        safeSpeak(victoryMsg, () => { startVoiceLoop(); });
        return;
      }

      const distX = Math.abs(x - goldenCarrotX);
      const distY = Math.abs(y - goldenCarrotY);

      if ((distX <= 1 && distY <= 1) && !hasGoldenCarrotFled) {
        setGoldenCarrotX(0); 
        setGoldenCarrotY(0);
        setHasGoldenCarrotFled(true);
        const fleeMsg = "Uau, o prêmio voou lá para o outro lado! Não desista, continue guiando o Algodão!";
        setNarratorText(fleeMsg);
        safeSpeak(fleeMsg, () => { startVoiceLoop(); });
        return;
      }
    }

    Object.keys(worldObjects).forEach(key => {
        const obj = worldObjects[key];
        if (obj.interactive && obj.x === x && obj.y === y) {
            let feedbackText = "";
            let pointsToAdd = 0;

            if (key === 'CENOURA' && carrotVisible) {
                setCarrotVisible(false);
                feedbackText = "Algodão vai comer um pouco dessa cenoura gostosa! Hummm!";
                pointsToAdd = 30;
                setTimeout(() => {
                    respawnItem('CENOURA');
                    setCarrotVisible(true);
                    const continueMsg = "Pronto! Agora vamos continuar a aventura!";
                    setNarratorText(continueMsg);
                    safeSpeak(continueMsg, () => { startVoiceLoop(); });
                }, 500);
            } else if (key === 'FLOR' && flowerVisible) {
                setFlowerVisible(false);
                feedbackText = "Que florzinha linda! O Algodão vai levar para a mamãe dele.";
                pointsToAdd = 20;
                setTimeout(() => {
                    respawnItem('FLOR');
                    setFlowerVisible(true);
                    const continueMsg = "A flor apareceu em outro lugar! Vamos continuar!";
                    setNarratorText(continueMsg);
                    safeSpeak(continueMsg, () => { startVoiceLoop(); });
                }, 500);
            } else if (key === 'MAÇA' && appleVisible) {
                setAppleVisible(false);
                feedbackText = "Algodão vai comer um pouco dessa maçã vermelha! Que delícia!";
                pointsToAdd = 25;
                setTimeout(() => {
                    respawnItem('MAÇA');
                    setAppleVisible(true);
                    const continueMsg = "Pronto! Agora vamos continuar a aventura!";
                    setNarratorText(continueMsg);
                    safeSpeak(continueMsg, () => { startVoiceLoop(); });
                }, 500);
            } else if (key === 'MÃE') {
                feedbackText = "O abraço da mamãe deixa o Algodão mais forte! Que força!";
                pointsToAdd = 100;
                
                // Trigger whirlwind animation
                whirlwindScale.value = withSequence(
                  withTiming(1.5, { duration: 500, easing: Easing.out(Easing.ease) }),
                  withTiming(0, { duration: 500, easing: Easing.in(Easing.ease) })
                );
                whirlwindRotation.value = withSequence(
                  withTiming(360, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                  withTiming(0, { duration: 0 })
                );
                
                setTimeout(() => {
                    respawnItem('MÃE');
                    const moveMsg = "A mamãe foi para outro lugar! Vamos encontrá-la!";
                    setNarratorText(moveMsg);
                    safeSpeak(moveMsg, () => { startVoiceLoop(); });
                }, 500);
            }

            if (feedbackText) {
                setScore(prev => prev + pointsToAdd);
                safeSpeak(feedbackText, () => { startVoiceLoop(); });
            }
        }
    });

    startVoiceLoop();
  };

  const animatedRabbitStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: currentX.value * (CELL_SIZE + CELL_MARGIN) + CELL_MARGIN },
      { translateY: currentY.value * (CELL_SIZE + CELL_MARGIN) + CELL_MARGIN + rabbitHopY.value },
      { scale: rabbitScale.value * rabbitBreathe.value },
      { rotate: `${rabbitWalkRotate.value}deg` },
      { scaleY: rabbitBlink.value }
    ],
  }));

  const animatedOwlStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: owlY.value },
      { rotate: `${owlHeadTilt.value}deg` },
      { scaleY: owlBlink.value }
    ],
  }));
  
  const animatedGrassStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${grassSway.value}deg` }],
  }));
  
  const animatedLeafStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: leafFall.value },
      { rotate: `${leafFall.value * 0.5}deg` }
    ],
  }));
  
  const animatedButterflyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: butterflyX.value },
      { translateY: butterflyY.value },
      { scale: 1 + Math.sin(butterflyX.value * 0.1) * 0.1 }
    ],
  }));
  
  const animatedFireflyStyle = useAnimatedStyle(() => ({
    opacity: fireflyOpacity.value,
  }));
  
  const animatedCloudStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cloudX.value }],
  }));
  
  const animatedBirdStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: birdX.value }],
  }));
  
  // Interactive object animated styles
  const animatedCarrotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: carrotScale.value }],
    opacity: 0.7 + (carrotGlow.value * 0.3),
  }));
  
  const animatedFlowerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: flowerScale.value },
      { rotate: `${flowerSway.value}deg` }
    ],
  }));
  
  const animatedMotherRabbitStyle = useAnimatedStyle(() => ({
    transform: [{ scale: motherRabbitScale.value }],
  }));
  
  const animatedGoldenCarrotStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: goldenCarrotScale.value },
      { translateY: goldenCarrotFloat.value }
    ],
    opacity: 0.8 + (goldenCarrotGlow.value * 0.2),
    shadowColor: '#FFD700',
    shadowOpacity: goldenCarrotGlow.value * 0.5,
    shadowRadius: 10,
  }));

  const animatedWhirlwindStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: whirlwindScale.value },
      { rotate: `${whirlwindRotation.value}deg` }
    ],
    opacity: whirlwindScale.value > 0 ? 0.8 : 0,
  }));

  if (!gameStarted) {
    return (
      <SafeAreaView style={styles.introContainer}>
        <LinearGradient
          colors={['#E8F5E9', '#C8E6C9', '#A5D6A7']}
          style={styles.forestBackground}
        >
          {/* Ambient animations for intro screen */}
          <Animated.View style={[styles.cloud, animatedCloudStyle]}>
            <Text style={styles.cloudEmoji}>☁️</Text>
          </Animated.View>
          <Animated.View style={[styles.butterfly, animatedButterflyStyle]}>
            <Text style={styles.butterflyEmoji}>🦋</Text>
          </Animated.View>
          <Animated.View style={[styles.leaf, animatedLeafStyle]}>
            <Text style={styles.leafEmoji}>🍃</Text>
          </Animated.View>
          
          <View style={styles.storybookCover}>
            <View style={styles.woodenPlank}>
              <Text style={styles.introTitle}>Algodão e o Bosque{"\n"}Interativo!</Text>
              <Text style={styles.introSubtitle}>Use sua voz para guiar o coelhinho</Text>
            </View>
            
            <View style={styles.forestScene}>
              <Animated.View style={[styles.grass, animatedGrassStyle]}>
                <Text style={styles.grassEmoji}>🌿</Text>
              </Animated.View>
              <Text style={styles.bigTree}>🌳</Text>
              <Animated.View style={[styles.owlIntro, animatedOwlStyle]}>
                <Text style={styles.bigOwl}>🦉</Text>
              </Animated.View>
              <Text style={styles.bigRabbit}>🐇</Text>
              <Text style={styles.flowers}>🌸🌼🌺</Text>
            </View>
            
            <TouchableOpacity style={styles.handPaintedButton} onPress={handleStartGame}>
              <LinearGradient
                colors={['#81C784', '#66BB6A', '#4CAF50']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.startButtonText}>📖 COMEÇAR AVENTURA!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <LinearGradient
        colors={['#F1F8E9', '#DCEDC8', '#C5E1A5']}
        style={styles.forestBackground}
      >
        {/* Parallax background layers */}
        <Animated.View style={[styles.parallaxLayer, styles.cloudLayer, animatedCloudStyle]}>
          <Text style={styles.cloudEmoji}>☁️</Text>
          <Text style={[styles.cloudEmoji, styles.cloud2Position]}>☁️</Text>
        </Animated.View>
        
        <Animated.View style={[styles.parallaxLayer, styles.birdLayer, animatedBirdStyle]}>
          <Text style={styles.birdEmoji}>🐦</Text>
        </Animated.View>
        
        {/* Ambient forest elements */}
        <Animated.View style={[styles.ambientLayer, styles.butterfly1, animatedButterflyStyle]}>
          <Text style={styles.butterflyEmoji}>🦋</Text>
        </Animated.View>
        <Animated.View style={[styles.ambientLayer, styles.butterfly2]}>
          <Text style={styles.butterflyEmoji}>🦋</Text>
        </Animated.View>
        <Animated.View style={[styles.ambientLayer, styles.firefly1, animatedFireflyStyle]}>
          <Text style={styles.fireflyEmoji}>✨</Text>
        </Animated.View>
        <Animated.View style={[styles.ambientLayer, styles.firefly2, animatedFireflyStyle]}>
          <Text style={styles.fireflyEmoji}>✨</Text>
        </Animated.View>
        <Animated.View style={[styles.ambientLayer, styles.leaf1, animatedLeafStyle]}>
          <Text style={styles.leafEmoji}>🍃</Text>
        </Animated.View>
        <Animated.View style={[styles.ambientLayer, styles.leaf2]}>
          <Text style={styles.leafEmoji}>🍂</Text>
        </Animated.View>
        
        {/* Header with wooden plank style */}
        <View style={styles.header}>
          <View style={styles.woodenHeader}>
            <View style={styles.phaseInfo}>
              <Text style={styles.headerTitle}>🌲 Bosque do Algodão</Text>
              <Text style={styles.targetName}>🏆 Seja o Coelho Mais Esperto do Canteiro ✨</Text>
            </View>
            <View style={styles.scoreBadge}>
              <LinearGradient
                colors={['#FFF9C4', '#FFF59D', '#FFF176']}
                style={styles.scoreGradient}
              >
                <Text style={styles.badgeText}>⭐ {score}</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Narrator area with storybook style */}
        <View style={styles.adventureNarratorZone}>
          <View style={styles.treeBranch}>
            <Text style={styles.branchEmoji}>🌿</Text>
          </View>
          <Animated.View style={[styles.owlOnBranch, animatedOwlStyle]}>
            <Text style={styles.owlEmoji}>🦉</Text>
          </Animated.View>
          <View style={styles.storybookBubble}>
            <View style={styles.leafDecoration}>
              <Text style={styles.leafEmoji}>🍃</Text>
            </View>
            <ScrollView contentContainerStyle={{ justifyContent: 'center', alignItems: 'center' }} showsVerticalScrollIndicator={false}>
              <Text style={styles.narratorText}>{narratorText}</Text>
            </ScrollView>
            <View style={styles.bubbleTriangle} />
          </View>
        </View>

        {/* Game board with forest path theme */}
        <View style={styles.boardWrapper}>
          <View style={styles.forestPath}>
            {/* Natural path cells */}
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
              const x = index % GRID_SIZE;
              const y = Math.floor(index / GRID_SIZE);
              
              let cellEmoji = null;
              let cellType = 'grass'; // grass, stone, wood
              let isInteractive = false;
              let animatedStyle = null;

              if (x === goldenCarrotX && y === goldenCarrotY && goldenCarrotVisible) {
                cellEmoji = 'premio';
                isInteractive = true;
                animatedStyle = animatedGoldenCarrotStyle;
              } else {
                Object.keys(worldObjects).forEach(key => {
                  const obj = worldObjects[key];
                  if (obj.x === x && obj.y === y) {
                    if (key === 'CENOURA' && !carrotVisible) return;
                    if (key === 'FLOR' && !flowerVisible) return;
                    if (key === 'MAÇA' && !appleVisible) return;
                    cellEmoji = obj.emoji;
                    
                    // Add animations for interactive objects
                    if (obj.interactive) {
                      isInteractive = true;
                      if (key === 'CENOURA') animatedStyle = animatedCarrotStyle;
                      if (key === 'FLOR') animatedStyle = animatedFlowerStyle;
                      if (key === 'MAÇA') animatedStyle = animatedCarrotStyle;
                      if (key === 'MÃE') animatedStyle = animatedMotherRabbitStyle;
                    }
                  }
                });
              }
              
              // Alternate cell types for visual variety
              if (!cellEmoji) {
                if ((x + y) % 3 === 0) cellType = 'stone';
                else if ((x + y) % 2 === 0) cellType = 'wood';
              }

              return (
                <View 
                  key={index} 
                  style={[
                    styles.naturalCell,
                    cellType === 'grass' && styles.grassCell,
                    cellType === 'stone' && styles.stoneCell,
                    cellType === 'wood' && styles.woodCell,
                    cellType === 'tree' && styles.treeCell,
                    isInteractive && styles.interactiveCell,
                    { left: x * (CELL_SIZE + CELL_MARGIN) + CELL_MARGIN, top: y * (CELL_SIZE + CELL_MARGIN) + CELL_MARGIN }
                  ]}
                >
                  {cellEmoji && (
                    isInteractive && animatedStyle ? (
                      <Animated.View style={animatedStyle}>
                        {cellEmoji === 'premio' ? (
                          <Image 
                            source={require('./assets/images/premio.png')} 
                            style={styles.itemImage}
                            resizeMode="contain"
                          />
                        ) : cellEmoji === 'cenoura' ? (
                          <Image 
                            source={require('./assets/images/cenoura.png')} 
                            style={styles.itemImage}
                            resizeMode="contain"
                          />
                        ) : cellEmoji === 'flor' ? (
                          <Image 
                            source={require('./assets/images/flor.png')} 
                            style={styles.itemImage}
                            resizeMode="contain"
                          />
                        ) : cellEmoji === 'maça' ? (
                          <Image 
                            source={require('./assets/images/maça.png')} 
                            style={styles.itemImage}
                            resizeMode="contain"
                          />
                        ) : cellEmoji === 'mae' ? (
                          <View style={{ position: 'relative' }}>
                            <Animated.View style={[styles.whirlwindOverlay, animatedWhirlwindStyle]}>
                              <Text style={styles.whirlwindEmoji}>🌀</Text>
                            </Animated.View>
                            <Image 
                              source={require('./assets/images/mamae.gif')} 
                              style={styles.itemImage}
                              resizeMode="contain"
                            />
                          </View>
                        ) : cellEmoji === 'arvore' ? (
                          <Image 
                            source={require('./assets/images/arvore.png')} 
                            style={styles.itemImage}
                            resizeMode="contain"
                          />
                        ) : cellEmoji === 'cerca' ? (
                          <Image 
                            source={require('./assets/images/cerca.png')} 
                            style={styles.itemImage}
                            resizeMode="contain"
                          />
                        ) : null}
                      </Animated.View>
                    ) : (
                      cellEmoji === 'arvore' ? (
                        <Image 
                          source={require('./assets/images/arvore.png')} 
                          style={styles.itemImage}
                          resizeMode="contain"
                        />
                      ) : cellEmoji === 'cerca' ? (
                        <Image 
                          source={require('./assets/images/cerca.png')} 
                          style={styles.itemImage}
                          resizeMode="contain"
                        />
                      ) : null
                    )
                  )}
                </View>
              );
            })}
            
            {/* Animated rabbit character */}
            <Animated.View style={[styles.rabbit, animatedRabbitStyle]}>
              <Image 
                source={require('./assets/images/algodao.gif')} 
                style={styles.rabbitGif}
                resizeMode="contain"
              />
            </Animated.View>
          </View>
        </View>

        {/* Footer with wooden plank style */}
        <View style={styles.footer}>
          <View style={styles.woodenPlankFooter}>
            <View style={styles.voiceLog}>
              <Text style={styles.voiceLogTitle}>👂 O que o Algodão ouviu:</Text>
              <Text style={styles.voiceLogText}>
                {userSpeechLog ? `"${userSpeechLog}"` : "🌿 Fale agora... (Ex: 'sobe duas')"}
              </Text>
            </View>

            <View style={[styles.storybookStatus, isListening ? styles.statusActive : styles.statusInactive]}>
              <LinearGradient
                colors={isListening ? ['#81C784', '#66BB6A'] : ['#FFAB91', '#FF8A65']}
                style={styles.statusGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.statusText}>
                  {isListening ? "🎙️ CORUJÃO ESTÁ OUVINDO VOCÊ" : "⚡ PROCESSANDO COMANDO..."}
                </Text>
                {isProcessing && <ActivityIndicator size="small" color="#FFF" style={{ marginLeft: 8 }} />}
              </LinearGradient>
            </View>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Intro screen styles
  introContainer: { flex: 1 },
  forestBackground: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  storybookCover: { width: '90%', maxWidth: 420, backgroundColor: '#FFF8E1', borderRadius: 32, padding: 28, alignItems: 'center', borderWidth: 4, borderColor: '#8D6E63', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
  woodenPlank: { width: '100%', backgroundColor: '#D7CCC8', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 3, borderColor: '#8D6E63' },
  introTitle: { fontSize: 28, fontWeight: 'bold', color: '#3E2723', textAlign: 'center', fontFamily: 'serif', textShadowColor: 'rgba(255,255,255,0.5)', textShadowOffset: { width: 1, height: 1 } },
  introSubtitle: { fontSize: 14, color: '#5D4037', marginTop: 8, fontWeight: '600', textAlign: 'center', fontStyle: 'italic' },
  forestScene: { width: '100%', height: 140, marginVertical: 20, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', position: 'relative' },
  bigTree: { fontSize: 60, position: 'absolute', left: 10 },
  owlIntro: { position: 'absolute', top: 10, right: 60 },
  bigOwl: { fontSize: 45 },
  bigRabbit: { fontSize: 50, position: 'absolute', bottom: 10, right: 20 },
  flowers: { fontSize: 30, position: 'absolute', bottom: 5, left: 20 },
  grass: { position: 'absolute', bottom: 0, left: 0 },
  grassEmoji: { fontSize: 25 },
  handPaintedButton: { width: '100%', marginTop: 10, borderRadius: 30, overflow: 'hidden', borderWidth: 3, borderColor: '#33691E', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  buttonGradient: { paddingVertical: 18, paddingHorizontal: 28, alignItems: 'center' },
  startButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 1, textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 1, height: 1 } },
  
  // Ambient animation elements
  cloud: { position: 'absolute', top: 40, right: 50 },
  cloudEmoji: { fontSize: 40, opacity: 0.8 },
  cloud2: { fontSize: 30, opacity: 0.6 },
  butterfly: { position: 'absolute', top: 200, left: 50 },
  butterflyEmoji: { fontSize: 28 },
  leaf: { position: 'absolute', top: 100, left: 80 },
  leafEmoji: { fontSize: 24 },
  
  // Main game styles
  container: { flex: 1, paddingHorizontal: 16 },
  parallaxLayer: { position: 'absolute', width: '100%', height: '100%' },
  cloudLayer: { top: 20, zIndex: 1 },
  cloud2Position: { top: 60, left: 100 },
  birdLayer: { top: 80, zIndex: 2 },
  birdEmoji: { fontSize: 32 },
  ambientLayer: { position: 'absolute', zIndex: 3 },
  butterfly1: { top: 150, left: 30 },
  butterfly2: { top: 250, right: 40 },
  firefly1: { top: 300, left: 60 },
  firefly2: { top: 350, right: 70 },
  fireflyEmoji: { fontSize: 20, color: '#FFD700' },
  leaf1: { top: 180, right: 50 },
  leaf2: { top: 220, left: 40 },
  
  // Header with wooden plank
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 8, zIndex: 10 },
  woodenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#D7CCC8', borderRadius: 20, padding: 12, borderWidth: 3, borderColor: '#8D6E63', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  phaseInfo: { alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#3E2723', fontFamily: 'serif' },
  targetName: { fontSize: 12, color: '#558B2F', fontWeight: '600', marginTop: 2, fontStyle: 'italic' },
  scoreBadge: { borderRadius: 20, borderWidth: 3, borderColor: '#F9A825', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  scoreGradient: { paddingVertical: 8, paddingHorizontal: 18 },
  badgeText: { fontSize: 16, color: '#3E2723', fontWeight: 'bold' },
  
  // Narrator area with storybook style
  adventureNarratorZone: { flexDirection: 'row', alignItems: 'center', marginVertical: 12, height: 100, zIndex: 10 },
  treeBranch: { width: 60, height: '100%', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  branchEmoji: { fontSize: 40 },
  owlOnBranch: { position: 'absolute', left: 15, top: 10, zIndex: 2 },
  owlEmoji: { fontSize: 38 },
  storybookBubble: { 
    flex: 1,
    height: '100%',
    backgroundColor: '#FFF3E0', 
    borderRadius: 24, 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderWidth: 3, 
    borderColor: '#FFCC80',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }
  },
  leafDecoration: { position: 'absolute', top: -15, right: -10 },
  narratorText: { fontSize: 13, color: '#E65100', lineHeight: 18, fontWeight: '600', textAlign: 'center', fontFamily: 'serif' },
  bubbleTriangle: {
    position: 'absolute',
    left: -10,
    top: '35%',
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: 'transparent',
    borderBottomWidth: 8,
    borderBottomColor: 'transparent',
    borderRightWidth: 12,
    borderRightColor: '#FFF3E0',
  },

  // Game board with forest path theme
  boardWrapper: { alignItems: 'center', justifyContent: 'center', flex: 1, marginVertical: 12, zIndex: 5 },
  forestPath: { width: BOARD_WIDTH, height: BOARD_WIDTH, backgroundColor: '#A5D6A7', borderRadius: 28, position: 'relative', overflow: 'hidden', borderWidth: 5, borderColor: '#66BB6A', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15, shadowOffset: { width: 0, height: 5 } },
  grassPatch: { position: 'absolute', zIndex: 1 },
  grass1: { bottom: 10, left: 10 },
  grass2: { top: 20, right: 15 },
  stonePatch: { position: 'absolute', bottom: 20, right: 20, zIndex: 1 },
  stoneEmoji: { fontSize: 22 },
  flowerPatch: { position: 'absolute', top: 15, left: 20, zIndex: 1 },
  flowerEmoji: { fontSize: 24 },
  
  // Natural cell styles
  naturalCell: { width: CELL_SIZE, height: CELL_SIZE, borderRadius: 16, position: 'absolute', justifyContent: 'center', alignItems: 'center', borderWidth: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  interactiveCell: { shadowColor: '#FFD700', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  grassCell: { backgroundColor: '#C8E6C9', borderColor: '#81C784' },
  stoneCell: { backgroundColor: '#E0E0E0', borderColor: '#BDBDBD' },
  woodCell: { backgroundColor: '#D7CCC8', borderColor: '#8D6E63' },
  treeCell: { backgroundColor: '#A1887F', borderColor: '#5D4037' },
  targetIcon: { fontSize: CELL_SIZE * 0.5 },
  itemImage: { width: CELL_SIZE * 0.7, height: CELL_SIZE * 0.7 },
  rabbit: { width: CELL_SIZE, height: CELL_SIZE, position: 'absolute', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  rabbitGif: { width: CELL_SIZE * 0.9, height: CELL_SIZE * 0.9 },
  whirlwindOverlay: { position: 'absolute', top: -10, left: -10, width: CELL_SIZE * 0.9, height: CELL_SIZE * 0.9, justifyContent: 'center', alignItems: 'center', zIndex: 15 },
  whirlwindEmoji: { fontSize: CELL_SIZE * 0.5 },

  // Footer with wooden plank
  footer: { marginBottom: 16, zIndex: 10 },
  woodenPlankFooter: { backgroundColor: '#D7CCC8', borderRadius: 24, padding: 16, borderWidth: 3, borderColor: '#8D6E63', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
  voiceLog: { backgroundColor: '#FFF8E1', borderRadius: 16, padding: 12, marginBottom: 10, borderWidth: 2, borderColor: '#FFCC80' },
  voiceLogTitle: { fontSize: 11, fontWeight: '700', color: '#E65100', textTransform: 'uppercase', letterSpacing: 0.5 },
  voiceLogText: { fontSize: 14, color: '#3E2723', marginTop: 4, fontWeight: '600', fontStyle: 'italic' },
  storybookStatus: { width: '100%', borderRadius: 24, overflow: 'hidden', borderWidth: 3, borderColor: '#33691E', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  statusActive: { borderColor: '#2E7D32' },
  statusInactive: { borderColor: '#D84315' },
  statusGradient: { paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  statusText: { color: '#FFF', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 },
});