import { safeStorage } from 'electron';
import { getSetting, setSetting } from '../db/settings';
import { getDb } from '../db/client';

export function setSecret(key: string, value: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    // Fallback or throw error? PRD says OS-native encryption.
    // In dev on some platforms it might be unavailable.
    throw new Error('SAFE_STORAGE_UNAVAILABLE');
  }
  const encrypted = safeStorage.encryptString(value).toString('base64');
  setSetting(getDb(), `secret:${key}`, encrypted);
}

export function getSecret(key: string): string | null {
  const encrypted = getSetting(getDb(), `secret:${key}`);
  if (!encrypted) return null;
  
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('SAFE_STORAGE_UNAVAILABLE');
  }
  
  return safeStorage.decryptString(Buffer.from(encrypted, 'base64'));
}

export function hasSecret(key: string): boolean {
  return !!getSetting(getDb(), `secret:${key}`);
}
