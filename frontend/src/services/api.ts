import axios from 'axios';
import { Platform } from 'react-native';

/*
 * CONFIGURAÇÃO DE URL DA API
 * ==========================
 * 
 * Ambiente de Desenvolvimento Web:
 * - Usa automaticamente http://localhost:8000
 * 
 * Ambiente de Produção ou Dispositivos Móveis:
 * - Usa a variável de ambiente EXPO_PUBLIC_API_URL
 * - Configure no arquivo .env: EXPO_PUBLIC_API_URL=https://seu-backend.vercel.app
 * 
 * TESTE EMERGENCIAL NO EXPO GO (Android/iOS):
 * - Antes do deploy na Vercel, se precisar testar no dispositivo físico:
 * - Substitua a linha da variável de ambiente por: 'http://192.168.X.X:8000'
 * - Onde 192.168.X.X é o IP da sua máquina na rede local
 * - Para descobrir seu IP: Windows (ipconfig), Mac/Linux (ifconfig ou ip addr)
 */

const getApiBaseUrl = (): string => {
  // Se estiver em desenvolvimento e rodando na Web
  if (__DEV__ && Platform.OS === 'web') {
    return 'http://localhost:8000';
  }

  // Produção ou dispositivos móveis: usa variável de ambiente
  // Fallback para localhost se a variável não estiver definida
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
};

const BASE_URL = getApiBaseUrl(); 

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});
