import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { app } from 'electron';
import knexFactory, { type Knex } from 'knex';
import { createClient, type Client, type InValue, type Transaction } from '@libsql/client';
import type { DatabaseConfig } from './databaseConfig';

export interface QuestInput {
  title: string;
  description: string;
  group: string;
  recurrence: 'Única' | 'Diária' | 'Semanal' | 'Mensal';
  assignees: string[];
  dueDate: string;
  weekdays?: number[];
}

export interface QuestRecord extends QuestInput {
  id: string;
  due: string;
  status: 'A fazer' | 'Em andamento' | 'Concluída';
  subtasks: Array<{ id: string; title: string; assignees: string[]; done: boolean }>;
  color: string;
}

export interface WorkspaceGroup {
  id: string;
  title: string;
  description: string;
  memberIds: string[];
  adminIds: string[];
  color: string;
}

let db: Knex | null = null;
let turso: Client | null = null;
let activeProvider: DatabaseConfig['provider'] | null = null;
let connecting: Promise<{ connected: true; provider: DatabaseConfig['provider'] }> | null = null;

export async function connectQuestDatabase(config: DatabaseConfig) {
  if (connecting) await connecting.catch(() => undefined);
  const task = connectQuestDatabaseInternal(config);
  connecting = task;
  try { return await task; }
  finally { if (connecting === task) connecting = null; }
}

async function connectQuestDatabaseInternal(config: DatabaseConfig): Promise<{ connected: true; provider: DatabaseConfig['provider'] }> {
  await disconnectQuestDatabase();
  if (config.provider === 'turso') {
    if (!config.connectionString || !config.authToken) throw new Error('Turso exige URL e token de acesso.');
    turso = createClient({ url: config.connectionString, authToken: config.authToken });
    await turso.execute('SELECT 1');
  } else {
    const client = config.provider === 'mysql' ? 'mysql2' : config.provider === 'sqlite' ? 'better-sqlite3' : 'pg';
    const connection = config.provider === 'sqlite'
      ? config.filename || path.join(app.getPath('userData'), 'quests.db')
      : config.connectionString || {
        host: config.host,
        port: config.port || (config.provider === 'mysql' ? 3306 : 5432),
        user: config.user,
        password: config.password,
        database: config.database,
        ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
      };
    db = knexFactory({ client, connection, useNullAsDefault: client === 'better-sqlite3' });
    await db.raw('select 1');
  }
  activeProvider = config.provider;
  await ensureSchema();
  return { connected: true, provider: config.provider };
}

export async function disconnectQuestDatabase() {
  if (db) await db.destroy();
  if (turso) turso.close();
  db = null; turso = null; activeProvider = null;
}

export function isQuestDatabaseConnected() { return Boolean(db || turso); }

async function ensureSchema() {
  if (turso) {
    await turso.batch([
      'CREATE TABLE IF NOT EXISTS workspace_groups (id TEXT PRIMARY KEY, title TEXT NOT NULL UNIQUE, description TEXT NOT NULL DEFAULT \'\', color TEXT NOT NULL, created_at TEXT NOT NULL)',
      'CREATE TABLE IF NOT EXISTS group_memberships (group_id TEXT NOT NULL, person_id TEXT NOT NULL, role TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(group_id, person_id))',
      'CREATE TABLE IF NOT EXISTS quest_definitions (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT \'\', group_name TEXT NOT NULL, recurrence TEXT NOT NULL, assignee_ids TEXT NOT NULL, weekdays_json TEXT NOT NULL DEFAULT \'[]\', color TEXT NOT NULL, created_at TEXT NOT NULL)',
      'CREATE TABLE IF NOT EXISTS quest_occurrences (id TEXT PRIMARY KEY, definition_id TEXT NOT NULL, due_date TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(definition_id, due_date))',
      'CREATE TABLE IF NOT EXISTS subquests (id TEXT PRIMARY KEY, occurrence_id TEXT NOT NULL, title TEXT NOT NULL, assignee_ids TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)',
      'CREATE TABLE IF NOT EXISTS activity_log (id TEXT PRIMARY KEY, occurrence_id TEXT NOT NULL, action TEXT NOT NULL, created_at TEXT NOT NULL)',
    ], 'write');
    const columns = await turso.execute('PRAGMA table_info(quest_definitions)');
    if (!columns.rows.some(column => column.name === 'weekdays_json')) {
      await turso.execute("ALTER TABLE quest_definitions ADD COLUMN weekdays_json TEXT NOT NULL DEFAULT '[]'");
    }
    return;
  }
  if (!db) throw new Error('Banco de dados não conectado.');
  await db.schema.createTable('workspace_groups', table => {
    table.string('id', 36).primary(); table.string('title', 120).notNullable().unique(); table.text('description').notNullable().defaultTo('');
    table.string('color', 16).notNullable(); table.string('created_at', 32).notNullable();
  }).catch(error => { if (!String(error).toLowerCase().includes('already exists')) throw error; });
  await db.schema.createTable('group_memberships', table => {
    table.string('group_id', 36).notNullable().index(); table.string('person_id', 120).notNullable();
    table.string('role', 16).notNullable(); table.string('created_at', 32).notNullable(); table.primary(['group_id', 'person_id']);
  }).catch(error => { if (!String(error).toLowerCase().includes('already exists')) throw error; });
  await db.schema.createTable('quest_definitions', table => {
    table.string('id', 36).primary(); table.text('title').notNullable(); table.text('description').notNullable().defaultTo('');
    table.text('group_name').notNullable(); table.string('recurrence', 16).notNullable(); table.text('assignee_ids').notNullable();
    table.text('weekdays_json').notNullable().defaultTo('[]');
    table.string('color', 16).notNullable(); table.string('created_at', 32).notNullable();
  }).catch(error => { if (!String(error).toLowerCase().includes('already exists')) throw error; });
  await db.schema.createTable('quest_occurrences', table => {
    table.string('id', 36).primary(); table.string('definition_id', 36).notNullable().index(); table.string('due_date', 10).notNullable();
    table.string('status', 20).notNullable(); table.string('created_at', 32).notNullable(); table.unique(['definition_id', 'due_date']);
  }).catch(error => { if (!String(error).toLowerCase().includes('already exists')) throw error; });
  await db.schema.createTable('subquests', table => {
    table.string('id', 36).primary(); table.string('occurrence_id', 36).notNullable().index(); table.text('title').notNullable();
    table.text('assignee_ids').notNullable(); table.boolean('done').notNullable().defaultTo(false); table.string('created_at', 32).notNullable();
  }).catch(error => { if (!String(error).toLowerCase().includes('already exists')) throw error; });
  await db.schema.createTable('activity_log', table => {
    table.string('id', 36).primary(); table.string('occurrence_id', 36).notNullable().index(); table.text('action').notNullable(); table.string('created_at', 32).notNullable();
  }).catch(error => { if (!String(error).toLowerCase().includes('already exists')) throw error; });
  if (!(await db.schema.hasColumn('quest_definitions', 'weekdays_json'))) await db.schema.alterTable('quest_definitions', table => {
    table.text('weekdays_json').notNullable().defaultTo('[]');
  });
}

function requireDatabase() {
  if (!db && !turso) throw new Error('Configure e conecte um banco de dados nas Configurações.');
}

function json<T>(value: unknown, fallback: T): T {
  try { return JSON.parse(String(value)) as T; } catch { return fallback; }
}

function formatDue(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day); const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.getTime() === today.getTime()) return 'Hoje';
  if (date.getTime() === tomorrow.getTime()) return 'Amanhã';
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).format(date);
}

export async function listGroups(): Promise<WorkspaceGroup[]> {
  requireDatabase();
  const groups = turso
    ? (await turso.execute('SELECT id, title, description, color FROM workspace_groups ORDER BY title')).rows as unknown as Array<Record<string, unknown>>
    : await db!('workspace_groups').select('id', 'title', 'description', 'color').orderBy('title') as Array<Record<string, unknown>>;
  const memberships = turso
    ? (await turso.execute('SELECT group_id, person_id, role FROM group_memberships')).rows as unknown as Array<Record<string, unknown>>
    : await db!('group_memberships').select('group_id', 'person_id', 'role') as Array<Record<string, unknown>>;
  return groups.map(group => {
    const members = memberships.filter(item => String(item.group_id) === String(group.id));
    return {
      id: String(group.id), title: String(group.title), description: String(group.description || ''),
      color: String(group.color), memberIds: members.map(item => String(item.person_id)),
      adminIds: members.filter(item => item.role === 'admin').map(item => String(item.person_id)),
    };
  });
}

export async function saveGroup(input: Omit<WorkspaceGroup, 'id'>, groupId?: string): Promise<WorkspaceGroup[]> {
  requireDatabase();
  const id = groupId || randomUUID();
  const createdAt = new Date().toISOString();
  const group = { id, title: input.title, description: input.description, color: input.color, created_at: createdAt };
  const memberships = [...new Set(input.memberIds)].map(personId => ({
    group_id: id, person_id: personId, role: input.adminIds.includes(personId) ? 'admin' : 'member', created_at: createdAt,
  }));
  if (db) {
    await db.transaction(async transaction => {
      if (groupId) {
        const existing = await transaction('workspace_groups').where({ id }).first();
        if (!existing) throw new Error('O grupo não existe mais.');
        await transaction('workspace_groups').where({ id }).update({ title: group.title, description: group.description, color: group.color });
        await transaction('group_memberships').where({ group_id: id }).delete();
      } else {
        await transaction('workspace_groups').insert(group);
      }
      if (memberships.length) await transaction('group_memberships').insert(memberships);
    });
  } else {
    const transaction = await turso!.transaction('write');
    try {
      if (groupId) {
        const existing = await transaction.execute({ sql: 'SELECT id FROM workspace_groups WHERE id=?', args: [id] });
        if (!existing.rows.length) throw new Error('O grupo não existe mais.');
        await transaction.execute({ sql: 'UPDATE workspace_groups SET title=?, description=?, color=? WHERE id=?', args: [group.title, group.description, group.color, id] });
        await transaction.execute({ sql: 'DELETE FROM group_memberships WHERE group_id=?', args: [id] });
      } else {
        await transaction.execute({ sql: 'INSERT INTO workspace_groups (id,title,description,color,created_at) VALUES (?,?,?,?,?)', args: [group.id, group.title, group.description, group.color, group.created_at] });
      }
      for (const membership of memberships) {
        await transaction.execute({ sql: 'INSERT INTO group_memberships (group_id,person_id,role,created_at) VALUES (?,?,?,?)', args: [membership.group_id, membership.person_id, membership.role, membership.created_at] });
      }
      await transaction.commit();
    } catch (error) { await transaction.rollback(); throw error; }
  }
  return listGroups();
}

export async function listQuests(): Promise<QuestRecord[]> {
  requireDatabase();
  const rows = turso
    ? (await turso.execute('SELECT o.id, o.due_date, o.status, d.title, d.description, d.group_name, d.recurrence, d.assignee_ids, d.weekdays_json, d.color FROM quest_occurrences o JOIN quest_definitions d ON d.id = o.definition_id ORDER BY o.due_date, d.title')).rows as unknown as Array<Record<string, unknown>>
    : await db!('quest_occurrences as o').join('quest_definitions as d', 'd.id', 'o.definition_id').select('o.id', 'o.due_date', 'o.status', 'd.title', 'd.description', 'd.group_name', 'd.recurrence', 'd.assignee_ids', 'd.weekdays_json', 'd.color').orderBy('o.due_date').orderBy('d.title') as Array<Record<string, unknown>>;
  const results: QuestRecord[] = [];
  for (const row of rows) {
    const subRows = turso
      ? (await turso.execute({ sql: 'SELECT id, title, assignee_ids, done FROM subquests WHERE occurrence_id = ? ORDER BY created_at, id', args: [String(row.id)] })).rows as unknown as Array<Record<string, unknown>>
      : await db!('subquests').select('id', 'title', 'assignee_ids', 'done').where({ occurrence_id: String(row.id) }).orderBy('created_at') as Array<Record<string, unknown>>;
    const dueDate = String(row.due_date);
    results.push({
      id: String(row.id), title: String(row.title), description: String(row.description || ''), group: String(row.group_name),
      recurrence: String(row.recurrence) as QuestRecord['recurrence'], assignees: json<string[]>(row.assignee_ids, []),
      weekdays: json<number[]>(row.weekdays_json, []),
      dueDate, due: formatDue(dueDate), status: String(row.status) as QuestRecord['status'], color: String(row.color || 'blue'),
      subtasks: subRows.map(sub => ({ id: String(sub.id), title: String(sub.title), assignees: json<string[]>(sub.assignee_ids, []), done: Boolean(Number(sub.done)) || sub.done === true })),
    });
  }
  return results;
}

export async function createQuest(input: QuestInput) {
  requireDatabase();
  const definitionId = randomUUID(); const occurrenceId = randomUUID(); const createdAt = new Date().toISOString();
  const definition = { id: definitionId, title: input.title, description: input.description, group_name: input.group, recurrence: input.recurrence, assignee_ids: JSON.stringify(input.assignees), weekdays_json: JSON.stringify(input.recurrence === 'Semanal' ? input.weekdays || [] : []), color: 'blue', created_at: createdAt };
  const occurrence = { id: occurrenceId, definition_id: definitionId, due_date: input.dueDate, status: 'A fazer', created_at: createdAt };
  if (db) await db.transaction(async transaction => { await transaction('quest_definitions').insert(definition); await transaction('quest_occurrences').insert(occurrence); await transaction('activity_log').insert({ id: randomUUID(), occurrence_id: occurrenceId, action: 'Quest criada', created_at: createdAt }); });
  else await turso!.batch([
    { sql: 'INSERT INTO quest_definitions (id,title,description,group_name,recurrence,assignee_ids,weekdays_json,color,created_at) VALUES (?,?,?,?,?,?,?,?,?)', args: Object.values(definition) },
    { sql: 'INSERT INTO quest_occurrences (id,definition_id,due_date,status,created_at) VALUES (?,?,?,?,?)', args: Object.values(occurrence) },
    { sql: 'INSERT INTO activity_log (id,occurrence_id,action,created_at) VALUES (?,?,?,?)', args: [randomUUID(), occurrenceId, 'Quest criada', createdAt] },
  ], 'write');
  return listQuests();
}

export async function addSubquest(occurrenceId: string, title: string, assignees: string[]) {
  requireDatabase(); const createdAt = new Date().toISOString();
  const item = { id: randomUUID(), occurrence_id: occurrenceId, title, assignee_ids: JSON.stringify(assignees), done: false, created_at: createdAt };
  const write = async (executor: Knex | Knex.Transaction) => {
    await executor('subquests').insert(item); await executor('quest_occurrences').where({ id: occurrenceId }).update({ status: 'Em andamento' });
    await executor('activity_log').insert({ id: randomUUID(), occurrence_id: occurrenceId, action: 'Subquest adicionada', created_at: createdAt });
  };
  if (db) await db.transaction(write);
  else await turso!.batch([
    { sql: 'INSERT INTO subquests (id,occurrence_id,title,assignee_ids,done,created_at) VALUES (?,?,?,?,?,?)', args: [item.id, item.occurrence_id, item.title, item.assignee_ids, 0, item.created_at] },
    { sql: "UPDATE quest_occurrences SET status = 'Em andamento' WHERE id = ?", args: [occurrenceId] },
    { sql: 'INSERT INTO activity_log (id,occurrence_id,action,created_at) VALUES (?,?,?,?)', args: [randomUUID(), occurrenceId, 'Subquest adicionada', createdAt] },
  ], 'write');
  return listQuests();
}

export async function completeSubquest(occurrenceId: string, subquestId: string) {
  requireDatabase();
  if (db) {
    await db.transaction(async transaction => {
      await transaction('subquests').where({ id: subquestId, occurrence_id: occurrenceId }).update({ done: true });
      const outstanding = await transaction('subquests').where({ occurrence_id: occurrenceId, done: false }).count({ count: '*' }).first();
      if (Number(outstanding?.count || 0) > 0) return;
      await completeOccurrenceInKnex(transaction, occurrenceId);
    });
  } else {
    const transaction = await turso!.transaction('write');
    try {
      await transaction.execute({ sql: 'UPDATE subquests SET done = 1 WHERE id = ? AND occurrence_id = ?', args: [subquestId, occurrenceId] });
      const outstanding = await transaction.execute({ sql: 'SELECT COUNT(*) AS count FROM subquests WHERE occurrence_id = ? AND done = 0', args: [occurrenceId] });
      if (Number(outstanding.rows[0]?.count || 0) === 0) await completeOccurrenceInTurso(occurrenceId, transaction);
      await transaction.commit();
    } catch (error) { await transaction.rollback(); throw error; }
  }
  return listQuests();
}

export async function completeQuestWithoutSubquests(occurrenceId: string) {
  requireDatabase();
  if (db) {
    await db.transaction(async transaction => {
      const count = Number((await transaction('subquests').where({ occurrence_id: occurrenceId }).count({ count: '*' }).first())?.count || 0);
      if (count) throw new Error('Conclua todas as subquests antes de concluir a quest.');
      await completeOccurrenceInKnex(transaction, occurrenceId);
    });
  } else {
    const transaction = await turso!.transaction('write');
    try {
      const count = Number((await transaction.execute({ sql: 'SELECT COUNT(*) AS count FROM subquests WHERE occurrence_id = ?', args: [occurrenceId] })).rows[0]?.count || 0);
      if (count) throw new Error('Conclua todas as subquests antes de concluir a quest.');
      await completeOccurrenceInTurso(occurrenceId, transaction);
      await transaction.commit();
    } catch (error) { await transaction.rollback(); throw error; }
  }
  return listQuests();
}

async function completeOccurrenceInKnex(transaction: Knex.Transaction, occurrenceId: string) {
  const occurrence = await transaction('quest_occurrences').where({ id: occurrenceId }).first();
  if (!occurrence || occurrence.status === 'Concluída') return;
  const definition = await transaction('quest_definitions').where({ id: occurrence.definition_id }).first();
  await transaction('quest_occurrences').where({ id: occurrenceId }).update({ status: 'Concluída' });
  const createdAt = new Date().toISOString();
  await transaction('activity_log').insert({ id: randomUUID(), occurrence_id: occurrenceId, action: 'Quest concluída', created_at: createdAt });
  await makeNextKnex(transaction, occurrence, definition, createdAt);
}

async function makeNextKnex(transaction: Knex.Transaction, occurrence: Record<string, unknown>, definition: Record<string, unknown>, createdAt: string) {
  const recurrence = String(definition.recurrence);
  if (recurrence === 'Única') return;
  const anchor = await transaction('quest_occurrences').where({ definition_id: definition.id }).min({ anchor_date: 'due_date' }).first();
  const anchorDay = Number(String(anchor?.anchor_date || occurrence.due_date).slice(-2));
  const nextDate = nextDueDate(String(occurrence.due_date), recurrence as QuestInput['recurrence'], anchorDay, json<number[]>(definition.weekdays_json, []));
  const existing = await transaction('quest_occurrences').where({ definition_id: definition.id, due_date: nextDate }).first();
  if (existing) return;
  const occurrenceId = randomUUID();
  await transaction('quest_occurrences').insert({ id: occurrenceId, definition_id: definition.id, due_date: nextDate, status: 'A fazer', created_at: createdAt });
  const priorSubquests = await transaction('subquests').where({ occurrence_id: occurrence.id }).select('title', 'assignee_ids');
  if (priorSubquests.length) await transaction('subquests').insert(priorSubquests.map(sub => ({ id: randomUUID(), occurrence_id: occurrenceId, title: sub.title, assignee_ids: sub.assignee_ids, done: false, created_at: createdAt })));
  await transaction('activity_log').insert({ id: randomUUID(), occurrence_id: occurrenceId, action: 'Nova ocorrência recorrente criada', created_at: createdAt });
}

async function completeOccurrenceInTurso(occurrenceId: string, transaction: Transaction) {
  const occurrenceResult = await transaction.execute({ sql: 'SELECT o.id,o.definition_id,o.due_date,o.status,d.recurrence,d.weekdays_json FROM quest_occurrences o JOIN quest_definitions d ON d.id=o.definition_id WHERE o.id=?', args: [occurrenceId] });
  const occurrence = occurrenceResult.rows[0] as unknown as Record<string, unknown> | undefined;
  if (!occurrence || occurrence.status === 'Concluída') return;
  const createdAt = new Date().toISOString();
  await transaction.execute({ sql: "UPDATE quest_occurrences SET status='Concluída' WHERE id=?", args: [occurrenceId] });
  await transaction.execute({ sql: 'INSERT INTO activity_log (id,occurrence_id,action,created_at) VALUES (?,?,?,?)', args: [randomUUID(), occurrenceId, 'Quest concluída', createdAt] });
  if (occurrence.recurrence !== 'Única') {
    const anchor = await transaction.execute({ sql: 'SELECT MIN(due_date) AS anchor_date FROM quest_occurrences WHERE definition_id=?', args: [String(occurrence.definition_id)] });
    const anchorDay = Number(String(anchor.rows[0]?.anchor_date || occurrence.due_date).slice(-2));
    const dueDate = nextDueDate(String(occurrence.due_date), String(occurrence.recurrence) as QuestInput['recurrence'], anchorDay, json<number[]>(occurrence.weekdays_json, []));
    const definitionId = String(occurrence.definition_id); const nextId = randomUUID();
    const prior = await transaction.execute({ sql: 'SELECT title,assignee_ids FROM subquests WHERE occurrence_id=?', args: [occurrenceId] });
    await transaction.execute({ sql: 'INSERT OR IGNORE INTO quest_occurrences (id,definition_id,due_date,status,created_at) VALUES (?,?,?,?,?)', args: [nextId, definitionId, dueDate, 'A fazer', createdAt] });
    const next = await transaction.execute({ sql: 'SELECT id FROM quest_occurrences WHERE definition_id=? AND due_date=?', args: [definitionId, dueDate] });
    const nextOccurrenceId = String(next.rows[0]?.id || nextId);
    const alreadyHasSubquests = await transaction.execute({ sql: 'SELECT COUNT(*) AS count FROM subquests WHERE occurrence_id=?', args: [nextOccurrenceId] });
    if (Number(alreadyHasSubquests.rows[0]?.count || 0) === 0) {
      for (const sub of prior.rows) await transaction.execute({ sql: 'INSERT INTO subquests (id,occurrence_id,title,assignee_ids,done,created_at) VALUES (?,?,?,?,?,?)', args: [randomUUID(), nextOccurrenceId, sub.title, sub.assignee_ids, 0, createdAt] });
      await transaction.execute({ sql: 'INSERT INTO activity_log (id,occurrence_id,action,created_at) VALUES (?,?,?,?)', args: [randomUUID(), nextOccurrenceId, 'Nova ocorrência recorrente criada', createdAt] });
    }
  }
}

function nextDueDate(source: string, recurrence: QuestInput['recurrence'], anchorDay = Number(source.slice(-2)), weekdays: number[] = []) {
  const [year, month, day] = source.split('-').map(Number);
  let date = new Date(year, month - 1, day); const today = new Date(); today.setHours(0, 0, 0, 0);
  const advance = () => {
    if (recurrence === 'Diária') date.setDate(date.getDate() + 1);
    else if (recurrence === 'Semanal') date.setDate(date.getDate() + 1);
    else {
      const targetMonth = date.getMonth() + 1; const targetYear = date.getFullYear() + Math.floor(targetMonth / 12); const normalizedMonth = targetMonth % 12;
      date = new Date(targetYear, normalizedMonth, Math.min(anchorDay, new Date(targetYear, normalizedMonth + 1, 0).getDate()));
    }
  };
  const selectedWeekdays = recurrence === 'Semanal' ? (weekdays.length ? weekdays : [new Date(year, month - 1, day).getDay()]) : [];
  do {
    advance();
  } while (date <= today || (recurrence === 'Semanal' && !selectedWeekdays.includes(date.getDay())));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
