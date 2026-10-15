import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import knex from 'knex';
import { createClient } from '@libsql/client';
import {
  getPublicDatabaseConfig,
  loadDatabaseConfig,
  saveDatabaseConfig,
  validateDatabaseConfig,
} from './databaseConfig';
import {
  addSubquest,
  completeQuestWithoutSubquests,
  completeSubquest,
  connectQuestDatabase,
  createQuest,
  isQuestDatabaseConnected,
  listGroups,
  listQuests,
  saveGroup,
} from './questRepository';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: '#f7f8fb',
    webPreferences: {
      preload: path.join(app.getAppPath(), 'electron', 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const devUrl = process.env.VITE_DEV_SERVER_URL;
    const allowed = devUrl
      ? new URL(url).origin === new URL(devUrl).origin
      : url.startsWith('file:') && path.resolve(fileURLToPath(url)) === path.resolve(app.getAppPath(), 'dist/index.html');
    if (!allowed) event.preventDefault();
  });
  if (process.env.VITE_DEV_SERVER_URL) void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  else void mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  mainWindow.on('closed', () => { mainWindow = null; });
}

function handle(channel: string, callback: (payload?: unknown) => unknown) {
  ipcMain.handle(channel, (event, payload) => {
    if (!mainWindow || event.sender.id !== mainWindow.webContents.id || event.senderFrame !== event.sender.mainFrame) {
      throw new Error('Origem inválida para chamada do aplicativo.');
    }
    return callback(payload);
  });
}

handle('database:getConfig', () => getPublicDatabaseConfig());
handle('database:saveConfig', async value => {
  validateDatabaseConfig(value);
  const saved = await saveDatabaseConfig(value);
  await connectQuestDatabase(await loadDatabaseConfig());
  return saved;
});
handle('database:testConnection', async value => {
  validateDatabaseConfig(value);
  const current = await loadDatabaseConfig();
  const requested = value as Partial<Awaited<ReturnType<typeof loadDatabaseConfig>>>;
  const config = { ...current, ...requested };
  for (const key of ['connectionString', 'authToken', 'password'] as const) {
    if (!requested[key]) config[key] = current[key];
  }
  return testConnection(config);
});
handle('quests:list', async () => { await ensureQuestDatabase(); return listQuests(); });
handle('quests:create', async value => { await ensureQuestDatabase(); return createQuest(assertQuestInput(value)); });
handle('quests:addSubquest', value => {
  const request = value as { occurrenceId?: unknown; title?: unknown; assignees?: unknown } | null;
  if (!request || typeof request.occurrenceId !== 'string' || typeof request.title !== 'string' || !Array.isArray(request.assignees) || !request.assignees.every(id => typeof id === 'string')) {
    throw new Error('Dados da subquest inválidos.');
  }
  return ensureQuestDatabase().then(() => addSubquest(request.occurrenceId as string, (request.title as string).trim(), request.assignees as string[]));
});
handle('quests:completeSubquest', value => {
  const request = value as { occurrenceId?: unknown; subquestId?: unknown } | null;
  if (!request || typeof request.occurrenceId !== 'string' || typeof request.subquestId !== 'string') throw new Error('Identificação da subquest inválida.');
  return ensureQuestDatabase().then(() => completeSubquest(request.occurrenceId as string, request.subquestId as string));
});
handle('quests:complete', value => {
  const request = value as { occurrenceId?: unknown } | null;
  if (!request || typeof request.occurrenceId !== 'string') throw new Error('Identificação da quest inválida.');
  return ensureQuestDatabase().then(() => completeQuestWithoutSubquests(request.occurrenceId as string));
});
handle('groups:list', async () => { await ensureQuestDatabase(); return listGroups(); });
handle('groups:save', async value => {
  const request = value as { id?: unknown; group?: unknown } | null;
  if (!request || (request.id !== undefined && (typeof request.id !== 'string' || !request.id.trim() || request.id.length > 36))) throw new Error('Identificação do grupo inválida.');
  const group = assertGroupInput(request.group);
  await ensureQuestDatabase();
  return saveGroup(group, request.id as string | undefined);
});

async function ensureQuestDatabase() {
  if (!isQuestDatabaseConnected()) await connectQuestDatabase(await loadDatabaseConfig());
}

function assertQuestInput(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Dados da quest inválidos.');
  const request = value as Record<string, unknown>;
  if (typeof request.title !== 'string' || !request.title.trim() || request.title.length > 240) throw new Error('Informe um nome de quest com até 240 caracteres.');
  if (!['Única', 'Diária', 'Semanal', 'Mensal'].includes(String(request.recurrence))) throw new Error('Frequência de recorrência inválida.');
  if (typeof request.group !== 'string' || !request.group.trim() || !Array.isArray(request.assignees) || !request.assignees.length || !request.assignees.every(id => typeof id === 'string')) throw new Error('Grupo ou pessoas responsáveis inválidos.');
  if (typeof request.dueDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(request.dueDate)) throw new Error('Data de vencimento inválida.');
  if (typeof request.description !== 'string' || request.description.length > 4000) throw new Error('Descrição inválida.');
  return request as unknown as import('./questRepository').QuestInput;
}

function assertGroupInput(value: unknown): Omit<import('./questRepository').WorkspaceGroup, 'id'> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Dados do grupo inválidos.');
  const request = value as Record<string, unknown>;
  const stringArray = (field: unknown) => Array.isArray(field) && field.every(item => typeof item === 'string' && item.trim().length > 0 && item.length <= 120);
  if (typeof request.title !== 'string' || !request.title.trim() || request.title.length > 120) throw new Error('Informe um nome de grupo com até 120 caracteres.');
  if (typeof request.description !== 'string' || request.description.length > 1000) throw new Error('Descrição do grupo inválida.');
  if (!stringArray(request.memberIds) || !stringArray(request.adminIds)) throw new Error('Membros do grupo inválidos.');
  if (!(request.adminIds as string[]).every(id => (request.memberIds as string[]).includes(id))) throw new Error('Administradores precisam fazer parte do grupo.');
  if (!['peach', 'blue', 'purple', 'green', 'yellow'].includes(String(request.color))) throw new Error('Cor do grupo inválida.');
  return {
    title: request.title.trim(), description: request.description.trim(),
    memberIds: [...new Set(request.memberIds as string[])], adminIds: [...new Set(request.adminIds as string[])],
    color: String(request.color),
  };
}

async function testConnection(config: Awaited<ReturnType<typeof loadDatabaseConfig>>) {
  if (config.provider === 'turso') {
    if (!config.connectionString || !config.authToken) throw new Error('Informe a URL do banco e o token do Turso.');
    const client = createClient({ url: config.connectionString, authToken: config.authToken });
    try { await client.execute('select 1'); } finally { client.close(); }
    return { connected: true, provider: config.provider };
  }
  const dialect = config.provider === 'mysql' ? 'mysql2' : config.provider === 'sqlite' ? 'better-sqlite3' : 'pg';
  const connection = config.provider === 'sqlite'
    ? (config.filename || path.join(app.getPath('userData'), 'quests.db'))
    : config.connectionString || {
      host: config.host,
      port: config.port || (config.provider === 'mysql' ? 3306 : 5432),
      user: config.user,
      password: config.password,
      database: config.database,
      ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
    };
  if (config.provider !== 'sqlite' && !config.connectionString && (!config.host || !config.user || !config.database)) {
    throw new Error('Informe host, usuário e nome do banco.');
  }
  const database = knex({ client: dialect, connection, useNullAsDefault: dialect === 'better-sqlite3' });
  try { await database.raw('select 1'); } finally { await database.destroy(); }
  return { connected: true, provider: config.provider };
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
