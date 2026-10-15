import { app, safeStorage } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';

export type DatabaseProvider = 'sqlite' | 'postgres' | 'supabase' | 'mysql' | 'turso';

export interface DatabaseConfig {
  provider: DatabaseProvider;
  filename?: string;
  connectionString?: string;
  authToken?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
}

const configFile = () => path.join(app.getPath('userData'), 'config.json');
const secretFile = () => path.join(app.getPath('userData'), 'database-secrets.enc');
const secretKeys = ['connectionString', 'authToken', 'password'] as const;

export async function loadDatabaseConfig(): Promise<DatabaseConfig> {
  let config: Partial<DatabaseConfig> = {};
  try {
    const parsed = JSON.parse(await fs.readFile(configFile(), 'utf8')) as { database?: Partial<DatabaseConfig> };
    config = parsed.database || {};
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  try {
    if (!safeStorage.isEncryptionAvailable()) throw new Error('A criptografia segura do sistema não está disponível.');
    const encrypted = await fs.readFile(secretFile());
    Object.assign(config, JSON.parse(safeStorage.decryptString(encrypted)) as Partial<DatabaseConfig>);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  return { provider: 'sqlite', ...config };
}

export async function getPublicDatabaseConfig() {
  const config = await loadDatabaseConfig();
  const result = { ...config, hasSecret: {} as Record<string, boolean> };
  for (const key of secretKeys) {
    result.hasSecret[key] = Boolean(config[key]);
    delete (result as Record<string, unknown>)[key];
  }
  return result;
}

export async function saveDatabaseConfig(input: DatabaseConfig) {
  const current = await loadDatabaseConfig();
  const merged = { ...current, ...input };
  for (const key of secretKeys) {
    if (!input[key]) merged[key] = current[key] as never;
  }
  const secrets = Object.fromEntries(secretKeys.flatMap(key => merged[key] ? [[key, merged[key]]] : []));
  if (Object.keys(secrets).length && !safeStorage.isEncryptionAvailable()) {
    throw new Error('A criptografia segura do sistema não está disponível. As credenciais não foram salvas.');
  }
  const root = path.dirname(configFile());
  await fs.mkdir(root, { recursive: true });
  const temporaryConfig = `${configFile()}.tmp`;
  const publicConfig = { ...merged } as Record<string, unknown>;
  for (const key of secretKeys) delete publicConfig[key];
  await fs.writeFile(temporaryConfig, JSON.stringify({ database: publicConfig }, null, 2), { mode: 0o600 });
  await fs.rename(temporaryConfig, configFile());
  if (Object.keys(secrets).length) {
    const temporarySecrets = `${secretFile()}.tmp`;
    await fs.writeFile(temporarySecrets, safeStorage.encryptString(JSON.stringify(secrets)), { mode: 0o600 });
    await fs.rename(temporarySecrets, secretFile());
  } else {
    await fs.rm(secretFile(), { force: true });
  }
  return getPublicDatabaseConfig();
}

export function validateDatabaseConfig(value: unknown): asserts value is DatabaseConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Configuração do banco inválida.');
  const config = value as Partial<DatabaseConfig>;
  if (!['sqlite', 'postgres', 'supabase', 'mysql', 'turso'].includes(String(config.provider))) throw new Error('Selecione um tipo de banco suportado.');
  for (const key of ['filename', 'connectionString', 'authToken', 'host', 'user', 'password', 'database'] as const) {
    const field = config[key];
    if (field !== undefined && (typeof field !== 'string' || field.length > 4096)) throw new Error(`Campo inválido: ${key}.`);
  }
  if (config.port !== undefined && (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535)) throw new Error('Porta inválida.');
}
