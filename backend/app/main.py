from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from app.config import get_groq_client
from app.services.groq_service import transcribe_audio, process_command
from app.services.game_logic import validate_move, get_rabbit_state
from app.services.tts_service import text_to_speech
from app.utils.audio_helpers import process_audio_bytes

app = FastAPI(title="Algodão Game API")

# CORS configurado corretamente para o Expo Web / Mobile
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Algodão Game API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# ==========================================================
# 🟢 NOVA ROTA UNIFICADA QUE O SEU FRONTEND AGORA VAI ACESSAR
# ==========================================================
@app.post("/api/process-voice")
async def process_voice_endpoint(file: UploadFile = File(...)):
    """Rota centralizada para receber o áudio, transcrever e gerar o comando de IA"""
    print(f"\n{'='*60}", flush=True)
    print(f"📥 [BACKEND] Iniciando processamento de requisição", flush=True)
    print(f"📥 [BACKEND] Arquivo recebido: {file.filename}", flush=True)
    print(f"📥 [BACKEND] Content-Type: {file.content_type}", flush=True)
    try:
        # 1. Ler os bytes do áudio enviado pelo Expo
        audio_bytes = await file.read()
        print(f"📦 [BACKEND] Tamanho do áudio recebido: {len(audio_bytes)} bytes ({len(audio_bytes)/1024:.2f} KB)", flush=True)
        print(f"📦 [BACKEND] Tipo de arquivo: {file.content_type if file.content_type else 'desconhecido'}", flush=True)

        # 2. Processar e ajustar os bytes se necessário (Framerates/Formatos)
        print("🔧 [BACKEND] Processando bytes de áudio...", flush=True)
        processed_audio = process_audio_bytes(audio_bytes)
        print(f"🔧 [BACKEND] Áudio processado com sucesso", flush=True)
        
        # 3. Mandar para o Groq Whisper Transcrever
        print("🎙️ [GROQ WHISPER] Enviando áudio para transcrição...", flush=True)
        transcription = transcribe_audio(processed_audio)
        print(f"📝 [GROQ WHISPER] Texto transcrito: \"{transcription}\"", flush=True)
        print(f"📝 [GROQ WHISPER] Tamanho do texto transcrito: {len(transcription)} caracteres", flush=True)

        if not transcription or len(transcription.strip()) == 0:
            print("⚠️ [AVISO] Transcrição veio vazia. O usuário talvez não tenha falado alto.", flush=True)
            return {
                "transcription": "",
                "action": "NENHUMA",
                "narrator_response": "Não consegui te ouvir direito, amiguinho. Pode repetir?"
            }

        # 4. Mandar o texto para o Llama 3 interpretar a intenção do jogo (Velho Corujão)
        print("🧠 [GROQ LLM] Processando intenção do comando com Velho Corujão...", flush=True)
        result = process_command(transcription)
        print(f"⚙️ [GROQ LLM] Ação gerada: {result.get('action', 'NENHUMA')}", flush=True)
        print(f"⚙️ [GROQ LLM] Resposta do narrador: \"{result.get('narrator_response', '')}\"", flush=True)
        
        # 5. Gerar áudio da resposta do narrador usando TTS
        narrator_response = result.get("narrator_response", "Comando recebido!")
        print("🔊 [TTS] Gerando áudio da resposta do Velho Corujão...", flush=True)
        audio_base64 = None
        try:
            audio_bytes = text_to_speech(narrator_response)
            print(f"🔊 [TTS] Áudio gerado com sucesso: {len(audio_bytes)} bytes", flush=True)
            import base64
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        except Exception as tts_error:
            print(f"⚠️ [TTS] Falha ao gerar áudio (usando fallback): {str(tts_error)}", flush=True)
            print(f"⚠️ [TTS] O frontend usará TTS nativo como fallback", flush=True)
        
        print(f"✅ [BACKEND] Processamento concluído com sucesso", flush=True)
        print(f"{'='*60}\n", flush=True)

        # O 'result' esperado da IA (Velho Corujão) deve conter: {"transcription": "...", "action": "CIMA_1/...", "narrator_response": "..."}
        return {
            "transcription": result.get("transcription", transcription),
            "action": result.get("action", "NENHUMA"),
            "narrator_response": narrator_response,
            "audio": audio_base64  # Será None se TTS falhar, frontend usará fallback
        }

    except Exception as e:
        print(f"❌ [ERRO CRÍTICO NO SERVER]: {str(e)}", flush=True)
        print(f"❌ [TIPO DE ERRO]: {type(e).__name__}", flush=True)
        import traceback
        print(f"❌ [STACK TRACE]:", flush=True)
        traceback.print_exc()
        print(f"{'='*60}\n", flush=True)
        return {"error": str(e), "transcription": "Falha no processamento", "action": "NENHUMA"}

# --- Mantendo suas rotas antigas caso precise delas separadamente ---
@app.post("/transcribe")
async def transcribe_endpoint(audio: UploadFile = File(...)):
    try:
        audio_bytes = await audio.read()
        processed_audio = process_audio_bytes(audio_bytes)
        transcription = transcribe_audio(processed_audio)
        return {"transcription": transcription}
    except Exception as e:
        return {"error": str(e)}

@app.post("/command")
async def command_endpoint(transcription: str):
    try:
        result = process_command(transcription)
        return result
    except Exception as e:
        return {"error": str(e)}

@app.post("/move")
async def move_endpoint(direction: str, current_position: dict):
    try:
        validation = validate_move(direction, current_position)
        return validation
    except Exception as e:
        return {"error": str(e)}

@app.get("/rabbit-state")
async def rabbit_state_endpoint():
    try:
        state = get_rabbit_state()
        return state
    except Exception as e:
        return {"error": str(e)}
