import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface UserProfile {
  name: string;
  nickname: string;
  email: string;
  role: 'Master';
}

const profileFile = () => path.join(app.getPath('userData'), 'user-profile.json');

export async function loadUserProfile(): Promise<UserProfile | null> {
  try {
    const value = JSON.parse(await fs.readFile(profileFile(), 'utf8')) as Partial<UserProfile>;
    if (typeof value.name !== 'string' || typeof value.nickname !== 'string' || typeof value.email !== 'string') {
      throw new Error('O perfil local está inválido. Edite ou recrie o perfil nas configurações.');
    }
    return { name: value.name, nickname: value.nickname, email: value.email, role: 'Master' };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

export async function saveUserProfile(value: unknown): Promise<UserProfile> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Dados do perfil inválidos.');
  const input = value as Record<string, unknown>;
  if (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 120) {
    throw new Error('Informe seu nome completo (até 120 caracteres).');
  }
  if (typeof input.nickname !== 'string' || !input.nickname.trim() || input.nickname.trim().length > 40) {
    throw new Error('Informe um nickname com até 40 caracteres.');
  }
  if (typeof input.email !== 'string' || input.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    throw new Error('Informe um e-mail válido.');
  }
  const profile: UserProfile = {
    name: input.name.trim(),
    nickname: input.nickname.trim(),
    email: input.email.trim().toLowerCase(),
    role: 'Master',
  };
  const root = path.dirname(profileFile());
  await fs.mkdir(root, { recursive: true });
  const temporaryFile = `${profileFile()}.tmp`;
  await fs.writeFile(temporaryFile, JSON.stringify(profile, null, 2), { mode: 0o600 });
  await fs.rename(temporaryFile, profileFile());
  return profile;
}
