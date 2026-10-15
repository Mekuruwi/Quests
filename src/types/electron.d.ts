export {};

declare global {
  type DatabaseProvider = 'sqlite' | 'postgres' | 'supabase' | 'mysql' | 'turso';
  interface DatabaseConfigInput {
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
  interface DatabaseConfigView extends Omit<DatabaseConfigInput, 'connectionString' | 'authToken' | 'password'> {
    hasSecret: { connectionString: boolean; authToken: boolean; password: boolean };
  }
  interface QuestRecordView {
    id: string; title: string; description: string; group: string; recurrence: 'Única' | 'Diária' | 'Semanal' | 'Mensal';
    assignees: string[]; dueDate: string; due: string; status: 'A fazer' | 'Em andamento' | 'Concluída'; color: string;
    subtasks: Array<{ id: string; title: string; assignees: string[]; done: boolean }>;
  }
  interface WorkspaceGroupView {
    id: string; title: string; description: string; memberIds: string[]; adminIds: string[]; color: string;
  }
  interface Window {
    electronAPI?: {
      database: {
        getConfig: () => Promise<DatabaseConfigView>;
        saveConfig: (config: DatabaseConfigInput) => Promise<DatabaseConfigView>;
        testConnection: (config: DatabaseConfigInput) => Promise<{ connected: boolean; provider: DatabaseProvider }>;
      };
      quests: {
        list: () => Promise<QuestRecordView[]>;
        create: (quest: { title: string; description: string; group: string; recurrence: 'Única' | 'Diária' | 'Semanal' | 'Mensal'; assignees: string[]; dueDate: string }) => Promise<QuestRecordView[]>;
        addSubquest: (request: { occurrenceId: string; title: string; assignees: string[] }) => Promise<QuestRecordView[]>;
        completeSubquest: (request: { occurrenceId: string; subquestId: string }) => Promise<QuestRecordView[]>;
        complete: (request: { occurrenceId: string }) => Promise<QuestRecordView[]>;
      };
      groups: {
        list: () => Promise<WorkspaceGroupView[]>;
        save: (request: { id?: string; group: Omit<WorkspaceGroupView, 'id'> }) => Promise<WorkspaceGroupView[]>;
      };
    };
  }
}
