# 🐰 Algodão Game

Um jogo interativo infantil com controle por voz onde você ajuda o coelhinho Algodão a se mover pelo bosque!

## 📋 Descrição

O Algodão Game é um aplicativo móvel educativo que permite que crianças controlem um personagem (o coelho Algodão) através de comandos de voz em português. O jogo usa inteligência artificial para processar os comandos de voz e movimentar o coelho em uma grade 10x10.

## 🏗️ Estrutura do Projeto

```
meu-projeto-algodao/
├── .gitignore
├── README.md
│
├── backend/                  # 🐍 BACKEND (Python + FastAPI + Groq)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # Ponto de entrada do FastAPI
│   │   ├── config.py         # Gerenciamento de variáveis de ambiente
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── groq_service.py # Integração com Whisper e Llama 3
│   │   │   └── game_logic.py   # Validação de movimentos e estado do coelho
│   │   └── utils/
│   │       └── audio_helpers.py # Tratamento de bytes de áudio
│   ├── requirements.txt      # Dependências do Python
│   └── vercel.json           # Configuração de deploy Serverless
│
└── frontend-mobile/          # ⚛️ FRONTEND (Expo + React Native + Reanimated)
    ├── assets/               # Imagens e recursos
    │   └── images/
    │       └── algodao.png
    ├── src/
    │   ├── components/       # Componentes visuais
    │   │   ├── GameGrid.tsx  # Grade onde o coelho se move
    │   │   ├── Header.tsx    # Barra de progresso e estatísticas
    │   │   └── AudioButton.tsx # Botão de gravação de voz
    │   ├── hooks/            # Hooks personalizados
    │   │   ├── useAudioRecorder.ts # Gravação de áudio
    │   │   └── useSpeech.ts    # Síntese de voz
    │   ├── services/         # Conexões com API
    │   │   └── api.ts        # Configuração do Axios
    │   └── theme/            # Tema visual
    │       └── colors.ts     # Paleta de cores estilo Peter Rabbit
    ├── App.tsx               # Componente raiz
    ├── app.json              # Configurações do Expo
    ├── package.json          # Dependências JavaScript/TypeScript
    └── tailwind.config.js    # Configuração do TailwindCSS
```

## 🚀 Como Executar

### Backend (Python + FastAPI)

1. **Instalar dependências:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Configurar variáveis de ambiente:**
```bash
# Criar arquivo .env
GROQ_API_KEY=sua_chave_groq_aqui
GROQ_MODEL=llama3-8b-8192
```

3. **Executar servidor:**
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

4. **Deploy na Vercel:**
```bash
vercel deploy
```

### Frontend (Expo + React Native)

1. **Instalar dependências:**
```bash
cd frontend-mobile
npm install
```

2. **Configurar variáveis de ambiente:**
```bash
# Criar arquivo .env
EXPO_PUBLIC_API_URL=http://localhost:8000
```

3. **Executar aplicativo:**
```bash
# Para iOS
npm run ios

# Para Android
npm run android

# Para web
npm run web
```

## 🎮 Como Jogar

1. Toque no botão "🎤 Falar" para começar a gravar
2. Diga um comando em português:
   - **"cima"** ou **"para cima"** - move o coelho para cima
   - **"baixo"** ou **"para baixo"** - move o coelho para baixo
   - **"esquerda"** ou **"para a esquerda"** - move o coelho para a esquerda
   - **"direita"** ou **"para a direita"** - move o coelho para a direita
   - **"pular"** - faz o coelho pular
   - **"comer"** - faz o coelho comer uma cenoura
3. O coelho se moverá e o narrador confirmará a ação

## 🛠️ Tecnologias Utilizadas

### Backend
- **FastAPI**: Framework web moderno e rápido para Python
- **Groq**: API para transcrição de áudio (Whisper) e processamento de linguagem natural (Llama 3)
- **Uvicorn**: Servidor ASGI para rodar o FastAPI
- **Python Multipart**: Para upload de arquivos de áudio

### Frontend
- **Expo**: Plataforma para desenvolvimento de aplicativos React Native
- **React Native**: Framework para desenvolvimento mobile
- **React Native Reanimated**: Animações suaves e performáticas
- **Expo AV**: Para gravação e reprodução de áudio
- **Expo Speech**: Para síntese de voz (narrador)
- **Axios**: Cliente HTTP para comunicação com a API
- **NativeWind**: TailwindCSS para React Native
- **TypeScript**: Tipagem estática para JavaScript

## 🎨 Tema Visual

O projeto utiliza uma paleta de cores inspirada no estilo Peter Rabbit, com tons pastéis suaves:
- Verde bosque (#81C784)
- Laranja quente (#FFB74D) para o coelho
- Azul céu (#81D4FA)
- Tons de terra para texto (#5D4037)

## 📝 API Endpoints

### Backend API

- `GET /` - Status da API
- `GET /health` - Health check
- `POST /transcribe` - Transcreve áudio usando Groq Whisper
- `POST /command` - Processa comando de voz usando Groq Llama 3
- `POST /move` - Valida e processa movimento do coelho
- `GET /rabbit-state` - Retorna estado atual do coelho

## 🔧 Configurações Adicionais

### Permissões de Microfone

O app requer permissão de microfone para funcionar. As permissões já estão configuradas no `app.json`:
- iOS: `NSMicrophoneUsageDescription`
- Android: `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`

### Groq API

Para usar a API do Groq, você precisa:
1. Criar uma conta em [groq.com](https://groq.com)
2. Obter uma API key
3. Configurar a variável de ambiente `GROQ_API_KEY`

## 📱 Deploy

### Backend (Vercel)
O backend está configurado para deploy na Vercel como função serverless. O arquivo `vercel.json` contém as configurações necessárias.

### Frontend (Expo)
O frontend pode ser distribuído através do Expo:
- **Development Build**: `eas build --profile development`
- **Preview Build**: `eas build --profile preview`
- **Production Build**: `eas build --profile production`

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📄 Licença

Este projeto é open source e está disponível sob a licença MIT.

## 🎯 Próximos Passos

- [ ] Adicionar mais comandos de voz
- [ ] Implementar níveis de dificuldade
- [ ] Adicionar sons e efeitos visuais
- [ ] Criar sistema de pontuação
- [ ] Adicionar multiplayer
- [ ] ImplementarAchievements

---

Desenvolvido com ❤️ para crianças aprenderem brincando!
npm run export:web
npx serve dist -p 3000