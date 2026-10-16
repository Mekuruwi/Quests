import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import {
  Activity, ArrowDownUp, ArrowRight, Bell, CalendarDays, Check, CheckCheck, ChevronDown,
  ChevronLeft, ChevronRight, HelpCircle, Clock3, Compass, LayoutDashboard,
  ListTodo, MoreHorizontal, Plus, Search, Settings2, Shield, Sparkles, Target,
  Users, X, Zap, Moon, Sun, Database, KeyRound, Server, CheckCircle2, AlertCircle, Save, Loader2,
  Minus, Square, Copy, Palette, UserRound, Mail, Send, Monitor,
  RefreshCw, Download, RotateCw,
} from 'lucide-react';

type Recurrence = 'Única' | 'Diária' | 'Semanal' | 'Mensal';
type Member = { id: string; name: string; initials: string; color: string };
type Subquest = { id: string; title: string; assignees: string[]; done: boolean };
type Quest = {
  id: string; title: string; description: string; group: string; due: string; dueDate: string;
  recurrence: Recurrence; status: 'Em andamento' | 'A fazer' | 'Concluída';
  assignees: string[]; subtasks: Subquest[]; color: string; anchorDay?: number; weekdays?: number[];
};
const weekDays = [{ value: 1, label: 'Seg' }, { value: 2, label: 'Ter' }, { value: 3, label: 'Qua' }, { value: 4, label: 'Qui' }, { value: 5, label: 'Sex' }, { value: 6, label: 'Sáb' }, { value: 0, label: 'Dom' }];
const weekdayNames = weekDays.reduce<Record<number, string>>((names, day) => ({ ...names, [day.value]: day.label }), {});

const people: Member[] = [
  { id: 'ana', name: 'Ana Costa', initials: 'AC', color: '#e9a377' },
  { id: 'bruno', name: 'Bruno Lima', initials: 'BL', color: '#7e97d5' },
  { id: 'carol', name: 'Carol Mendes', initials: 'CM', color: '#9d83c6' },
  { id: 'diego', name: 'Diego Rocha', initials: 'DR', color: '#68a99b' },
  { id: 'luiza', name: 'Luiza Alves', initials: 'LA', color: '#d77988' },
];

const demoGroups: WorkspaceGroupView[] = [
  { id: 'marketing', title: 'Marketing', description: 'Campanhas, marca e crescimento', memberIds: ['ana', 'bruno', 'carol', 'luiza'], adminIds: ['ana'], color: 'peach' },
  { id: 'operations', title: 'Operações', description: 'Processos e qualidade do time', memberIds: ['carol', 'diego', 'ana'], adminIds: ['ana'], color: 'blue' },
  { id: 'content', title: 'Conteúdo', description: 'Planejamento e produção editorial', memberIds: ['luiza', 'ana', 'bruno'], adminIds: ['ana'], color: 'purple' },
];

const appearanceAccents = {
  violet: '#6557d2',
  blue: '#3977c5',
  green: '#27866c',
  rose: '#bb5477',
} as const;
type AppearanceAccent = keyof typeof appearanceAccents;

function readLocalProfile(): UserProfileView | null {
  const value = localStorage.getItem('questly.profile');
  if (!value) return null;
  try {
    const profile = JSON.parse(value) as Partial<UserProfileView>;
    if (typeof profile.name !== 'string' || typeof profile.nickname !== 'string' || typeof profile.email !== 'string') return null;
    return { name: profile.name, nickname: profile.nickname, email: profile.email, role: 'Master' };
  } catch {
    return null;
  }
}

const initialQuests: Quest[] = [
  { id: 'q1', title: 'Preparar apresentação do trimestre', description: 'Consolidar resultados e prioridades do time para a reunião de planejamento.', group: 'Marketing', due: 'Hoje, 16:00', dueDate: '2026-10-15', recurrence: 'Mensal', status: 'Em andamento', assignees: ['ana', 'bruno'], color: 'peach', subtasks: [
    { id: 's11', title: 'Reunir métricas das campanhas', assignees: ['ana', 'bruno'], done: true },
    { id: 's12', title: 'Montar slides de resultados', assignees: ['ana'], done: false },
    { id: 's13', title: 'Revisar com o time', assignees: ['bruno', 'carol'], done: false },
  ] },
  { id: 'q2', title: 'Revisar base de clientes', description: 'Validar novos cadastros e atualizar os dados pendentes.', group: 'Operações', due: 'Hoje, 17:30', dueDate: '2026-10-15', recurrence: 'Diária', status: 'Em andamento', assignees: ['carol'], color: 'blue', subtasks: [
    { id: 's21', title: 'Conferir cadastros novos', assignees: ['carol'], done: true },
    { id: 's22', title: 'Corrigir dados incompletos', assignees: ['carol', 'diego'], done: false },
  ] },
  { id: 'q3', title: 'Alinhar pauta da próxima semana', description: 'Escolher os temas e distribuir a preparação dos conteúdos.', group: 'Conteúdo', due: 'Amanhã', dueDate: '2026-10-16', recurrence: 'Semanal', status: 'A fazer', assignees: ['luiza', 'ana'], color: 'purple', subtasks: [
    { id: 's31', title: 'Reunir ideias do time', assignees: ['luiza'], done: false },
    { id: 's32', title: 'Priorizar temas', assignees: ['ana', 'luiza'], done: false },
  ] },
  { id: 'q4', title: 'Fechar relatório de desempenho', description: 'Atualizar o relatório mensal e compartilhar os aprendizados.', group: 'Marketing', due: 'Qua, 21 out', dueDate: '2026-10-21', recurrence: 'Mensal', status: 'Em andamento', assignees: ['bruno', 'diego'], color: 'green', subtasks: [
    { id: 's41', title: 'Atualizar dados do mês', assignees: ['bruno'], done: true },
    { id: 's42', title: 'Escrever principais aprendizados', assignees: ['diego'], done: false },
    { id: 's43', title: 'Compartilhar com liderança', assignees: ['bruno', 'diego'], done: false },
  ] },
  { id: 'q5', title: 'Organizar arquivos do projeto', description: 'Revisar documentos e mover arquivos antigos para o arquivo.', group: 'Operações', due: 'Sex, 23 out', dueDate: '2026-10-23', recurrence: 'Única', status: 'A fazer', assignees: ['carol', 'luiza'], color: 'yellow', subtasks: [] },
];

const nav = [
  { id: 'Início', icon: LayoutDashboard }, { id: 'Minhas quests', icon: ListTodo },
  { id: 'Calendário', icon: CalendarDays }, { id: 'Grupos', icon: Users }, { id: 'Relatórios', icon: Activity },
];

function dateForNextOccurrence(source: string, recurrence: Recurrence, anchorDay = Number(source.slice(-2)), weekdays: number[] = []) {
  const [year, month, day] = source.split('-').map(Number);
  let date = new Date(year, month - 1, day);
  const advance = () => {
    if (recurrence === 'Diária') date.setDate(date.getDate() + 1);
    else if (recurrence === 'Semanal') date.setDate(date.getDate() + 1);
    else if (recurrence === 'Mensal') {
      const targetMonth = date.getMonth() + 1;
      const targetYear = date.getFullYear() + Math.floor(targetMonth / 12);
      const normalizedMonth = targetMonth % 12;
      const finalDay = new Date(targetYear, normalizedMonth + 1, 0).getDate();
      date = new Date(targetYear, normalizedMonth, Math.min(anchorDay, finalDay));
    }
  };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const selectedWeekdays = recurrence === 'Semanal' ? (weekdays.length ? weekdays : [new Date(year, month - 1, day).getDay()]) : [];
  do {
    advance();
  } while ((date <= today && recurrence !== 'Única') || (recurrence === 'Semanal' && !selectedWeekdays.includes(date.getDay())));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function todayString() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function nextOccurrenceFrom(quest: Quest): Quest | undefined {
  if (quest.recurrence === 'Única') return undefined;
  const anchorDay = quest.anchorDay || Number(quest.dueDate.slice(-2));
  const dueDate = dateForNextOccurrence(quest.dueDate, quest.recurrence, anchorDay, quest.weekdays);
  return { ...quest, id: crypto.randomUUID(), dueDate, due: displayDate(dueDate), status: 'A fazer', anchorDay, subtasks: quest.subtasks.map(s => ({ ...s, id: crypto.randomUUID(), done: false })) };
}

function displayDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.getTime() === today.getTime()) return 'Hoje';
  if (date.getTime() === tomorrow.getTime()) return 'Amanhã';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date);
}

function Avatar({ id, size = 'sm', profile }: { id: string; size?: 'sm' | 'md'; profile?: UserProfileView }) {
  const source = people.find(p => p.id === id);
  const person = source && id === 'ana' && profile
    ? { ...source, name: profile.name, initials: profile.nickname.slice(0, 2).toUpperCase() }
    : source;
  if (!person) return null;
  return <span className={`avatar ${size}`} style={{ background: person.color }} title={person.name}>{person.initials}</span>;
}

function AvatarStack({ ids, max = 3, profile }: { ids: string[]; max?: number; profile?: UserProfileView }) {
  return <div className="avatar-stack">{ids.slice(0, max).map(id => <Avatar key={id} id={id} profile={profile} />)}{ids.length > max && <span className="avatar-extra">+{ids.length - max}</span>}</div>;
}

function App() {
  const [profile, setProfile] = useState<UserProfileView | null>(() => window.electronAPI ? null : readLocalProfile());
  const [profileLoading, setProfileLoading] = useState(Boolean(window.electronAPI));
  const [profileError, setProfileError] = useState('');
  const [page, setPage] = useState('Início');
  const [quests, setQuests] = useState<Quest[]>(() => window.electronAPI ? [] : initialQuests);
  const [groups, setGroups] = useState<WorkspaceGroupView[]>(() => window.electronAPI ? [] : demoGroups);
  const [modal, setModal] = useState(false);
  const [groupModal, setGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<WorkspaceGroupView | null>(null);
  const [newQuestDate, setNewQuestDate] = useState<string | undefined>();
  const [inviteGroup, setInviteGroup] = useState<WorkspaceGroupView | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Todos os grupos');
  const [dueFilter, setDueFilter] = useState('Qualquer prazo');
  const [sortBy, setSortBy] = useState<'Prazo' | 'Nome'>('Prazo');
  const [notice, setNotice] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('questly.theme') === 'dark');
  const [accent, setAccent] = useState<AppearanceAccent>(() => {
    const saved = localStorage.getItem('questly.accent');
    return saved === 'blue' || saved === 'green' || saved === 'rose' ? saved : 'violet';
  });
  const [databaseError, setDatabaseError] = useState('');
  const [updateStatus, setUpdateStatus] = useState<AppUpdateStatus>({
    version: '—',
    status: 'unsupported',
    message: 'Atualizações estão disponíveis somente no app instalado.',
  });
  useEffect(() => { localStorage.setItem('questly.theme', dark ? 'dark' : 'light'); }, [dark]);
  useEffect(() => { localStorage.setItem('questly.accent', accent); }, [accent]);
  useEffect(() => {
    if (!window.electronAPI) return;
    const unsubscribe = window.electronAPI.updates.onStatus(setUpdateStatus);
    window.electronAPI.updates.getStatus()
      .then(setUpdateStatus)
      .catch(error => setUpdateStatus({
        version: '—',
        status: 'error',
        message: error instanceof Error ? error.message : 'Não foi possível carregar o estado das atualizações.',
      }));
    return unsubscribe;
  }, []);
  useEffect(() => {
    if (!window.electronAPI) return;
    window.electronAPI.profile.get()
      .then(setProfile)
      .catch(error => setProfileError(error instanceof Error ? error.message : 'Não foi possível carregar seu perfil local.'))
      .finally(() => setProfileLoading(false));
  }, []);
  useEffect(() => {
    if (!window.electronAPI) return;
    const load = () => Promise.all([window.electronAPI!.quests.list(), window.electronAPI!.groups.list()])
      .then(([rows, savedGroups]) => { setQuests(rows); setGroups(savedGroups); setDatabaseError(''); })
      .catch(error => setDatabaseError(error instanceof Error ? error.message : 'Não foi possível carregar os dados do banco.'));
    void load();
    window.addEventListener('database-connected', load);
    return () => window.removeEventListener('database-connected', load);
  }, []);
  const current = quests.find(q => q.id === detail);
  const openQuests = quests.filter(q => q.status !== 'Concluída');
  const myQuests = quests.filter(q => (q.assignees.includes('ana') || q.subtasks.some(item => item.assignees.includes('ana'))) && q.status !== 'Concluída');
  const role = 'Master';
  const accessibleGroups = groups;
  const dueToday = openQuests.filter(q => q.dueDate === todayString()).length;
  const notifications = openQuests.filter(q => q.dueDate <= todayString()).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const completedCount = quests.filter(q => q.status === 'Concluída').length;
  const collaboratorCount = new Set(quests.flatMap(q => [...q.assignees, ...q.subtasks.flatMap(subquest => subquest.assignees)])).size;
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Bom dia' : currentHour < 18 ? 'Boa tarde' : 'Boa noite';
  const greetingIcon = currentHour < 18 ? '☀️' : '🌙';
  const filtered = useMemo(() => quests.filter(q =>
    (dueFilter === 'Concluídas' ? q.status === 'Concluída' : q.status !== 'Concluída') &&
    (filter === 'Todos os grupos' || q.group === filter) &&
    (dueFilter !== 'Vencidas' || q.dueDate < todayString()) &&
    (dueFilter !== 'Hoje' || q.dueDate === todayString()) &&
    (dueFilter !== 'Próximas' || q.dueDate > todayString()) &&
    `${q.title} ${q.description} ${q.group}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sortBy === 'Prazo' ? a.dueDate.localeCompare(b.dueDate) : a.title.localeCompare(b.title, 'pt-BR')),
  [quests, filter, query, dueFilter, sortBy]);
  const myFiltered = filtered.filter(quest => quest.assignees.includes('ana') || quest.subtasks.some(item => item.assignees.includes('ana')));

  const flash = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 3200); };
  const openCreateQuest = (dueDate?: string) => {
    if (!accessibleGroups.length) { setPage('Grupos'); flash('Crie ou selecione um grupo administrado antes de adicionar uma quest.'); return; }
    setNewQuestDate(dueDate);
    setModal(true);
  };
  const toggleSubquest = async (questId: string, subId: string) => {
    if (window.electronAPI) {
      const quest = quests.find(item => item.id === questId);
      try {
        setQuests(await window.electronAPI.quests.completeSubquest({ occurrenceId: questId, subquestId: subId }));
        if (quest?.subtasks.filter(item => !item.done).length === 1) {
          flash(quest.recurrence === 'Única' ? 'Quest concluída e salva no banco.' : `Quest concluída. A próxima ocorrência ${quest.recurrence.toLowerCase()} foi salva no banco.`);
        }
      } catch (error) { flash(error instanceof Error ? error.message : 'Falha ao salvar a subquest.'); }
      return;
    }
    setQuests(previous => {
      let nextOccurrence: Quest | undefined;
      const updated = previous.map(q => {
        if (q.id !== questId) return q;
        const subtasks = q.subtasks.map(s => s.id === subId ? { ...s, done: !s.done } : s);
        const completed = subtasks.length > 0 && subtasks.every(s => s.done);
        if (completed && q.status !== 'Concluída') {
          nextOccurrence = nextOccurrenceFrom(q);
          flash(q.recurrence === 'Única' ? 'Quest concluída! Boa missão ✨' : `Quest concluída! Próxima ocorrência ${q.recurrence.toLowerCase()} criada automaticamente.`);
        }
        return { ...q, subtasks, status: completed ? 'Concluída' : q.status };
      });
      return nextOccurrence ? [nextOccurrence, ...updated] : updated;
    });
  };
  const createQuest = async (form: { title: string; group: string; recurrence: Recurrence; assignees: string[]; description: string; dueDate: string; weekdays: number[] }) => {
    const quest: Quest = { ...form, id: crypto.randomUUID(), due: displayDate(form.dueDate), status: 'A fazer', subtasks: [], color: 'blue' };
    if (window.electronAPI) {
      try { setQuests(await window.electronAPI.quests.create(form)); setModal(false); flash('Quest criada e salva no banco.'); }
      catch (error) { flash(error instanceof Error ? error.message : 'Falha ao criar quest no banco.'); }
      return;
    }
    setQuests(prev => [quest, ...prev]); setModal(false); flash('Quest criada. Adicione subquests pelo detalhe da tarefa.');
  };
  const saveGroup = async (group: Omit<WorkspaceGroupView, 'id'>, id?: string) => {
    if (window.electronAPI) {
      try {
        setGroups(await window.electronAPI.groups.save({ ...(id ? { id } : {}), group }));
        setGroupModal(false); setEditingGroup(null); flash(id ? 'Grupo atualizado no banco.' : 'Grupo criado no banco.');
      } catch (error) { flash(error instanceof Error ? error.message : 'Falha ao salvar o grupo.'); }
      return;
    }
    const saved = { ...group, id: id || crypto.randomUUID() };
    setGroups(previous => id ? previous.map(item => item.id === id ? saved : item) : [...previous, saved]);
    setGroupModal(false); setEditingGroup(null); flash(id ? 'Grupo atualizado.' : 'Grupo criado.');
  };
  const saveProfile = async (input: { name: string; nickname: string; email: string }) => {
    setProfileError('');
    try {
      const saved = window.electronAPI ? await window.electronAPI.profile.save(input) : { ...input, role: 'Master' as const };
      if (!window.electronAPI) localStorage.setItem('questly.profile', JSON.stringify(saved));
      setProfile(saved);
      flash('Perfil salvo. Seu espaço está pronto.');
      return true;
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Não foi possível salvar seu perfil.');
      return false;
    }
  };
  const composeInvite = async (request: { email: string; group: string; quest?: string }) => {
    try {
      if (window.electronAPI) await window.electronAPI.invites.compose(request);
      else {
        const subject = encodeURIComponent('Convite para colaborar no Questly');
        const body = encodeURIComponent(`${profile?.name} convidou você para colaborar em ${request.quest ? `“${request.quest}” no grupo “${request.group}”` : `“${request.group}”`} no Questly. O acesso individual será habilitado quando o login do workspace estiver disponível.`);
        window.location.href = `mailto:${encodeURIComponent(request.email)}?subject=${subject}&body=${body}`;
      }
      setInviteGroup(null);
      flash('Rascunho do convite aberto no seu aplicativo de e-mail.');
    } catch (error) {
      flash(error instanceof Error ? error.message : 'Não foi possível abrir o convite no aplicativo de e-mail.');
    }
  };
  const checkUpdates = async () => {
    if (!window.electronAPI) return;
    try { setUpdateStatus(await window.electronAPI.updates.check()); }
    catch (error) {
      setUpdateStatus(current => ({
        ...current,
        status: 'error',
        message: error instanceof Error ? error.message : 'Não foi possível verificar atualizações.',
      }));
    }
  };
  const downloadUpdate = async () => {
    if (!window.electronAPI) return;
    try { setUpdateStatus(await window.electronAPI.updates.download()); }
    catch (error) {
      setUpdateStatus(current => ({
        ...current,
        status: 'error',
        message: error instanceof Error ? error.message : 'Não foi possível baixar a atualização.',
      }));
    }
  };
  const installUpdate = async () => {
    if (!window.electronAPI) return;
    try { await window.electronAPI.updates.install(); }
    catch (error) {
      setUpdateStatus(current => ({
        ...current,
        status: 'error',
        message: error instanceof Error ? error.message : 'Não foi possível instalar a atualização.',
      }));
    }
  };
  const completeWithoutSubquests = async (questId: string) => {
    if (window.electronAPI) {
      const quest = quests.find(item => item.id === questId);
      try {
        setQuests(await window.electronAPI.quests.complete({ occurrenceId: questId }));
        flash(quest?.recurrence === 'Única' ? 'Quest concluída e salva no banco.' : `Quest concluída. A próxima ocorrência ${quest?.recurrence.toLowerCase()} foi salva no banco.`);
      }
      catch (error) { flash(error instanceof Error ? error.message : 'Falha ao concluir quest.'); }
      return;
    }
    setQuests(previous => {
      const quest = previous.find(item => item.id === questId);
      if (!quest || quest.subtasks.length || quest.status === 'Concluída') return previous;
      const nextOccurrence = nextOccurrenceFrom(quest);
      flash(quest.recurrence === 'Única' ? 'Quest concluída! Boa missão ✨' : `Quest concluída! Próxima ocorrência ${quest.recurrence.toLowerCase()} criada automaticamente.`);
      const updated = previous.map(item => item.id === questId ? { ...item, status: 'Concluída' as const } : item);
      return nextOccurrence ? [nextOccurrence, ...updated] : updated;
    });
  };

  if (profileLoading) return <div className={`app ${dark ? 'dark' : ''} accent-${accent}`}><WindowTitleBar/><div className="profile-loading"><Loader2 className="spin" size={20}/>Carregando seu espaço...</div></div>;
  if (!profile) return <div className={`app ${dark ? 'dark' : ''} accent-${accent}`}><WindowTitleBar/><ProfileSetupPage error={profileError} onSave={saveProfile}/></div>;

  return <div className={`app ${dark ? 'dark' : ''} accent-${accent}`}>
    <WindowTitleBar/>
    <div className="app-shell">
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand-row"><div className="brand-mark"><Compass size={20} /></div>{!collapsed && <span className="brand-name">questly<span>.</span></span>}<button className="icon-button collapse-btn" onClick={() => setCollapsed(v => !v)} aria-label="Recolher menu">{collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}</button></div>
      {!collapsed && <div className="workspace-switch"><div className="workspace-avatar">S</div><div className="workspace-copy"><b>Studio Norte</b><small>Workspace</small></div><ChevronDown size={15} /></div>}
      <div className="nav-label">WORKSPACE</div>
      <nav className="side-nav">{nav.map(item => { const Icon = item.icon; return <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => setPage(item.id)} title={collapsed ? item.id : undefined}><Icon size={18} /><span>{!collapsed && item.id}</span>{item.id === 'Minhas quests' && !collapsed && <span className="nav-count">{myQuests.length}</span>}</button>; })}</nav>
      {!collapsed && <><div className="nav-label groups-label">SEUS GRUPOS {role === 'Master' && <button onClick={() => { setEditingGroup(null); setGroupModal(true); }} title="Criar grupo"><Plus size={14} /></button>}</div><div className="group-nav">{accessibleGroups.map(group => <button key={group.id} onClick={() => { setPage('Minhas quests'); setFilter(group.title); }}><i className={`group-dot ${group.color}-dot`} />{group.title}<span>{quests.filter(quest => quest.group === group.title && quest.status !== 'Concluída').length}</span></button>)}{!accessibleGroups.length && <small className="group-empty">Nenhum grupo</small>}</div></>}
      <div className="sidebar-bottom"><button className={`nav-item ${page === 'Configurações' ? 'active' : ''}`} onClick={() => setPage('Configurações')}><Settings2 size={18}/>{!collapsed && 'Configurações'}</button><div className="profile"><div className="profile-avatar">{profile.nickname.slice(0, 2).toUpperCase()}</div>{!collapsed && <><div className="profile-copy"><b>{profile.nickname}</b><small>{role} · {profile.email}</small></div></>}</div></div>
    </aside>

    <main className="main-panel">
      <header className="topbar"><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14}/><b>{page}</b><span className="demo-badge">{window.electronAPI ? 'ELECTRON' : 'DEMONSTRAÇÃO'}</span></div><div className="top-actions"><button className="icon-button" title="Ajuda" onClick={() => flash('Use Configurações para conectar o banco e consulte docs/agents.md para as regras do fluxo.') }><HelpCircle size={18}/></button><button className="icon-button" title={dark ? 'Tema claro' : 'Tema escuro'} onClick={() => setDark(value => !value)}>{dark ? <Sun size={17}/> : <Moon size={17}/>}</button><div className="notification-wrap"><button className="icon-button notification-btn" title={`Notificações: ${notifications.length}`} aria-label={`Notificações: ${notifications.length}`} aria-expanded={showNotifications} onClick={() => setShowNotifications(value => !value)}><Bell size={18}/>{notifications.length > 0 && <i/>}</button>{showNotifications && <div className="notification-popover"><b>Alertas de prazo</b>{notifications.length ? notifications.slice(0, 8).map(quest => <button key={quest.id} onClick={() => { setShowNotifications(false); setDetail(quest.id); }}><span>{quest.dueDate < todayString() ? 'Vencida' : 'Hoje'}</span><strong>{quest.title}</strong><small>{quest.group} · {quest.due}</small></button>) : <p>Nenhuma quest vencida ou com prazo para hoje.</p>}</div>}</div>      <span className="top-divider"/><div className="top-user"><span className="profile-avatar small">{profile.nickname.slice(0, 2).toUpperCase()}</span><ChevronDown size={14}/></div></div></header>
      <div className="content">
        {databaseError && <div className="settings-alert"><AlertCircle size={17}/><span>{databaseError} Abra Configurações para verificar a conexão.</span><button className="text-button" onClick={() => setPage('Configurações')}>Configurar</button></div>}
        {page === 'Início' && <>
          <div className="welcome-row"><div><div className="eyebrow"><Sparkles size={14}/> {new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toLocaleUpperCase('pt-BR')}</div><h1>{greeting}, {profile.nickname} <span>{greetingIcon}</span></h1><p>Um passo de cada vez. Veja o que merece sua atenção hoje.</p></div><button className="primary-button" onClick={() => openCreateQuest()}><Plus size={17}/> Nova quest</button></div>
          <MissionBanner openCount={openQuests.length} dueToday={dueToday} completedCount={completedCount} onOpen={() => setPage('Minhas quests')} />
          <section className="stats-grid">
            <StatCard icon={<Target size={17}/>} label="Quests em andamento" value={String(openQuests.length)} note="em todos os seus grupos" tone="lavender" />
            <StatCard icon={<Clock3 size={17}/>} label="Para hoje" value={String(dueToday)} note={dueToday ? 'ocorrências com prazo de hoje' : 'nenhum prazo para hoje'} tone="peach" />
            <StatCard icon={<CheckCheck size={17}/>} label="Quests concluídas" value={String(completedCount)} note="no histórico deste banco" tone="mint" />
            <StatCard icon={<Users size={17}/>} label="Pessoas colaborando" value={String(collaboratorCount)} note="responsáveis registrados" tone="blue" />
          </section>

          <section className="work-section"><div className="section-heading"><div><div className="title-with-icon"><Zap size={17}/><h2>Seu foco de hoje</h2><span className="pill-count">2</span></div><p>Pequenas entregas que movem o trabalho.</p></div><button className="text-button" onClick={() => setPage('Minhas quests')}>Ver todas <ArrowRight size={15}/></button></div>
            <div className="focus-list">{myQuests.slice(0, 2).map(q => <QuestRow key={q.id} quest={q} profile={profile} onOpen={() => setDetail(q.id)} onCheck={id => void toggleSubquest(q.id, id)} />)}{!myQuests.length && <div className="empty-state compact">Nenhuma quest aberta para você.</div>}</div>
          </section>

          <section className="work-section all-quests"><div className="section-heading"><div><div className="title-with-icon"><ListTodo size={17}/><h2>Quests do workspace</h2><span className="pill-count">{openQuests.length}</span></div><p>Uma visão compartilhada do que está acontecendo.</p></div><button className="text-button" onClick={() => setPage('Minhas quests')}>Abrir quadro <ArrowRight size={15}/></button></div>
            <div className="toolbar"><div className="search-box"><Search size={15}/><input placeholder="Buscar quest..." value={query} onChange={e => setQuery(e.target.value)} /><kbd>⌘ K</kbd></div><select value={filter} onChange={e => setFilter(e.target.value)}><option>Todos os grupos</option>{accessibleGroups.map(group => <option key={group.id}>{group.title}</option>)}</select><select value={dueFilter} onChange={e => setDueFilter(e.target.value)}><option>Qualquer prazo</option><option>Vencidas</option><option>Hoje</option><option>Próximas</option><option>Concluídas</option></select><button className="filter-button" onClick={() => setSortBy(value => value === 'Prazo' ? 'Nome' : 'Prazo')}><ArrowDownUp size={15}/> {sortBy}</button></div>
            <div className="quest-table"><div className="table-head"><span>QUEST</span><span>GRUPO</span><span>RESPONSÁVEIS</span><span>PRAZO</span><span>PROGRESSO</span><span/></div>{filtered.slice(0, 4).map(q => <QuestTableRow key={q.id} quest={q} profile={profile} onOpen={() => setDetail(q.id)} />)}{!filtered.length && <div className="empty-state">Ainda não há quests neste banco. Crie a primeira para começar.</div>}</div>
          </section>
          <div className="bottom-note"><div className="note-icon"><Activity size={16}/></div><span><b>{completedCount ? 'As entregas concluídas ficam no histórico.' : 'Comece criando uma quest para o seu time.'}</b> {completedCount} {completedCount === 1 ? 'quest concluída' : 'quests concluídas'} neste banco.</span><button className="text-button" onClick={() => setPage('Relatórios')}>Ver atividade <ArrowRight size={14}/></button></div>
        </>}
        {page === 'Minhas quests' && <>
          <div className="page-title-row"><div><div className="eyebrow">SUAS ENTREGAS</div><h1>Minhas quests</h1><p>Acompanhe tarefas atribuídas a você e aos seus grupos.</p></div><button className="primary-button" onClick={() => openCreateQuest()}><Plus size={17}/> Nova quest</button></div>
          <div className="toolbar page-toolbar"><div className="search-box"><Search size={15}/><input placeholder="Buscar quest..." value={query} onChange={e => setQuery(e.target.value)} /></div><select value={filter} onChange={e => setFilter(e.target.value)}><option>Todos os grupos</option>{accessibleGroups.map(group => <option key={group.id}>{group.title}</option>)}</select><select value={dueFilter} onChange={e => setDueFilter(e.target.value)}><option>Qualquer prazo</option><option>Vencidas</option><option>Hoje</option><option>Próximas</option><option>Concluídas</option></select><button className="filter-button" onClick={() => setSortBy(value => value === 'Prazo' ? 'Nome' : 'Prazo')}><ArrowDownUp size={15}/> {sortBy}</button></div>
          <div className="quest-list">{myFiltered.map(q => <QuestRow key={q.id} quest={q} profile={profile} onOpen={() => setDetail(q.id)} onCheck={id => void toggleSubquest(q.id, id)} />)}{!myFiltered.length && <div className="empty-state">Nenhuma quest atribuída encontrada. Crie uma quest ou ajuste os filtros.</div>}</div>
        </>}
        {page === 'Calendário' && <CalendarPage quests={quests} onOpen={id => setDetail(id)} onCreate={date => openCreateQuest(date)} />}
        {page === 'Grupos' && <GroupsPage groups={accessibleGroups} quests={quests} role={role} profile={profile} onAdd={() => { setEditingGroup(null); setGroupModal(true); }} onEdit={group => { setEditingGroup(group); setGroupModal(true); }} onInvite={group => setInviteGroup(group)} />}
        {page === 'Configurações' && <SettingsPage profile={profile} profileError={profileError} onSaveProfile={saveProfile} dark={dark} setDark={setDark} accent={accent} setAccent={setAccent} updateStatus={updateStatus} onCheckUpdates={checkUpdates} onDownloadUpdate={downloadUpdate} onInstallUpdate={installUpdate} />}
        {page === 'Relatórios' && <ReportsPage quests={quests} groups={groups} />}
      </div>
    </main>

    {modal && <QuestModal groups={accessibleGroups} profile={profile} dueDate={newQuestDate} onClose={() => setModal(false)} onCreate={createQuest}/>}
    {groupModal && <GroupModal group={editingGroup} profile={profile} onClose={() => { setGroupModal(false); setEditingGroup(null); }} onSave={saveGroup} />}
    {inviteGroup && <InviteModal group={inviteGroup} quests={quests.filter(quest => quest.group === inviteGroup.title && quest.status !== 'Concluída')} onClose={() => setInviteGroup(null)} onSend={composeInvite}/>}
    {current && <QuestDetail quest={current} members={groups.find(group => group.title === current.group)?.memberIds || []} profile={profile} onClose={() => setDetail(null)} onComplete={() => completeWithoutSubquests(current.id)} onCheck={id => void toggleSubquest(current.id, id)} onAddSubquest={(title, assignees) => {
      if (window.electronAPI) { void window.electronAPI.quests.addSubquest({ occurrenceId: current.id, title, assignees }).then(setQuests).catch(error => flash(error instanceof Error ? error.message : 'Falha ao criar subquest.')); return; }
      setQuests(prev => prev.map(q => q.id === current.id ? { ...q, subtasks: [...q.subtasks, { id: crypto.randomUUID(), title, assignees, done: false }], status: 'Em andamento' } : q));
    }} />}
    {notice && <div className="toast"><Check size={16}/>{notice}</div>}
    </div>
  </div>;
}

function WindowTitleBar() {
  const [maximized, setMaximized] = useState(true);
  useEffect(() => {
    const api = window.electronAPI?.window;
    if (!api) return;
    void api.isMaximized().then(setMaximized);
    return api.onMaximizedChange(setMaximized);
  }, []);
  if (!window.electronAPI) return null;
  return <div className="window-titlebar" onDoubleClick={event => {
    if (event.target instanceof Element && event.target.closest('button')) return;
    void window.electronAPI?.window.toggleMaximize();
  }}>
    <div className="window-title-brand"><span className="brand-mark"><Compass size={14}/></span><b>questly</b><span>·</span></div>
    <div className="window-controls">
      <button aria-label="Minimizar janela" title="Minimizar" onClick={() => void window.electronAPI?.window.minimize()}><Minus size={15}/></button>
      <button aria-label={maximized ? 'Restaurar janela' : 'Maximizar janela'} title={maximized ? 'Restaurar' : 'Maximizar'} onClick={() => void window.electronAPI?.window.toggleMaximize()}>{maximized ? <Copy size={12}/> : <Square size={13}/>}</button>
      <button className="window-close" aria-label="Fechar janela" title="Fechar" onClick={() => void window.electronAPI?.window.close()}><X size={16}/></button>
    </div>
  </div>;
}

function ProfileSetupPage({ error, onSave }: { error: string; onSave: (profile: { name: string; nickname: string; email: string }) => Promise<boolean> }) {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    await onSave({ name, nickname, email });
    setBusy(false);
  };
  return <main className="profile-setup">
    <form className="profile-setup-card" onSubmit={event => void submit(event)}>
      <div className="setup-brand"><div className="brand-mark"><Compass size={22}/></div><span>questly<span>.</span></span></div>
      <div className="eyebrow">PRIMEIRO ACESSO</div><h1>Crie seu espaço</h1>
      <p>Seu perfil será o Master deste espaço. Depois, você poderá convidar pessoas para colaborar em grupos e quests.</p>
      <label className="field-label">Nome completo<input autoFocus required maxLength={120} value={name} onChange={event => setName(event.target.value)} placeholder="Como devemos chamar você?"/></label>
      <label className="field-label">Nickname<input required maxLength={40} value={nickname} onChange={event => setNickname(event.target.value)} placeholder="Nome exibido no app"/></label>
      <label className="field-label">E-mail<input required type="email" maxLength={254} value={email} onChange={event => setEmail(event.target.value)} placeholder="voce@exemplo.com"/></label>
      {error && <div className="connection-message error"><AlertCircle size={16}/>{error}</div>}
      <div className="setup-role"><Shield size={15}/><span><b>Master do espaço</b> · responsável por configurar e organizar os fluxos.</span></div>
      <button className="primary-button setup-submit" type="submit" disabled={busy || !name.trim() || !nickname.trim() || !email.trim()}>{busy ? <Loader2 className="spin" size={16}/> : <ArrowRight size={16}/>} Criar meu espaço</button>
      <small>O perfil é salvo nesta instalação. Login e sincronização de identidade ainda não estão disponíveis.</small>
    </form>
  </main>;
}

function SettingsPage({ profile, profileError, onSaveProfile, dark, setDark, accent, setAccent, updateStatus, onCheckUpdates, onDownloadUpdate, onInstallUpdate }: {
  profile: UserProfileView;
  profileError: string;
  onSaveProfile: (profile: { name: string; nickname: string; email: string }) => Promise<boolean>;
  dark: boolean;
  setDark: (dark: boolean) => void;
  accent: AppearanceAccent;
  setAccent: (accent: AppearanceAccent) => void;
  updateStatus: AppUpdateStatus;
  onCheckUpdates: () => void;
  onDownloadUpdate: () => void;
  onInstallUpdate: () => void;
}) {
  const [section, setSection] = useState<'appearance' | 'profile' | 'database' | 'updates'>('appearance');
  const [name, setName] = useState(profile.name);
  const [nickname, setNickname] = useState(profile.nickname);
  const [email, setEmail] = useState(profile.email);
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setSaved('');
    if (await onSaveProfile({ name, nickname, email })) setSaved('Perfil atualizado.');
    setBusy(false);
  };
  return <div className="settings-page"><div className="page-title-row"><div><div className="eyebrow">PREFERÊNCIAS DO ESPAÇO</div><h1>Configurações</h1><p>Personalize a aparência, seu perfil Master e a conexão do workspace.</p></div></div>
    <div className="settings-layout"><nav className="settings-nav">
      <button className={section === 'appearance' ? 'active' : ''} onClick={() => setSection('appearance')}><Palette size={16}/> Aparência</button>
      <button className={section === 'profile' ? 'active' : ''} onClick={() => setSection('profile')}><UserRound size={16}/> Meu perfil</button>
      <button className={section === 'database' ? 'active' : ''} onClick={() => setSection('database')}><Database size={16}/> Banco de dados</button>
      <button className={section === 'updates' ? 'active' : ''} onClick={() => setSection('updates')}><RefreshCw size={16}/> Atualizações</button>
    </nav><section className="settings-section">
      {section === 'appearance' && <div className="settings-card appearance-card"><div className="settings-card-head"><div className="settings-icon"><Palette size={18}/></div><div><h2>Aparência</h2><p>Escolha o tema e a cor de destaque do Questly.</p></div></div>
        <h3 className="settings-section-label">Tema</h3><div className="theme-options">
          <button className={`theme-option ${!dark ? 'selected' : ''}`} onClick={() => setDark(false)}><span className="theme-preview light-preview"><i/><i/><i/></span><b>Claro</b>{!dark && <Check size={14}/>}</button>
          <button className={`theme-option ${dark ? 'selected' : ''}`} onClick={() => setDark(true)}><span className="theme-preview dark-preview"><i/><i/><i/></span><b>Escuro</b>{dark && <Check size={14}/>}</button>
        </div>
        <h3 className="settings-section-label">Cor de destaque</h3><div className="accent-options">{(Object.keys(appearanceAccents) as AppearanceAccent[]).map(item => <button key={item} className={`accent-option ${accent === item ? 'selected' : ''}`} style={{ '--swatch': appearanceAccents[item] } as CSSProperties} aria-label={`Tema ${item}`} onClick={() => setAccent(item)}><i/>{item === 'violet' ? 'Violeta' : item === 'blue' ? 'Azul' : item === 'green' ? 'Verde' : 'Rosa'}{accent === item && <Check size={13}/>}</button>)}</div>
        <div className="appearance-note"><Monitor size={15}/> Preferências visuais ficam salvas neste computador.</div>
      </div>}
      {section === 'profile' && <form className="settings-card profile-settings-card" onSubmit={event => void save(event)}><div className="settings-card-head"><div className="settings-icon"><UserRound size={18}/></div><div><h2>Meu perfil</h2><p>Identidade local do proprietário deste espaço.</p></div><span className="master-badge"><Shield size={12}/> MASTER</span></div>
        <label className="field-label">Nome completo<input required maxLength={120} value={name} onChange={event => setName(event.target.value)}/></label>
        <label className="field-label">Nickname<input required maxLength={40} value={nickname} onChange={event => setNickname(event.target.value)}/></label>
        <label className="field-label">E-mail<input required type="email" maxLength={254} value={email} onChange={event => setEmail(event.target.value)}/></label>
        {profileError && <div className="connection-message error"><AlertCircle size={15}/>{profileError}</div>}
        {saved && <div className="connection-message success"><CheckCircle2 size={15}/>{saved}</div>}
        <div className="profile-settings-foot"><small>O perfil não substitui login/autenticação individual.</small><button type="submit" className="primary-button" disabled={busy}>{busy ? <Loader2 className="spin" size={14}/> : <Save size={14}/>} Salvar perfil</button></div>
      </form>}
      {section === 'database' && <DatabaseSettingsPage/>}
      {section === 'updates' && <div className="settings-card update-settings-card">
        <div className="settings-card-head"><div className="settings-icon"><RefreshCw size={18}/></div><div><h2>Atualizações</h2><p>Versão do app e novas melhorias do Questly.</p></div></div>
        <div className="update-version-row"><span>Versão instalada</span><b>{updateStatus.version}</b></div>
        {updateStatus.availableVersion && <div className="update-version-row"><span>Nova versão</span><b>{updateStatus.availableVersion}</b></div>}
        <div className={`update-status ${updateStatus.status === 'error' ? 'error' : updateStatus.status === 'available' || updateStatus.status === 'downloaded' ? 'success' : ''}`}>
          {updateStatus.status === 'checking' || updateStatus.status === 'downloading'
            ? <RefreshCw className="spin" size={16}/>
            : updateStatus.status === 'available' || updateStatus.status === 'downloaded' || updateStatus.status === 'not-available'
              ? <CheckCircle2 size={16}/>
              : updateStatus.status === 'error' ? <AlertCircle size={16}/> : <Monitor size={16}/>}
          <span>{updateStatus.status === 'idle' ? 'Pronto para verificar atualizações.'
            : updateStatus.status === 'checking' ? 'Verificando se há uma nova versão...'
              : updateStatus.status === 'available' ? 'Uma nova versão está disponível para baixar.'
                : updateStatus.status === 'not-available' ? 'Você está usando a versão mais recente.'
                  : updateStatus.status === 'downloading' ? `Baixando atualização${typeof updateStatus.percent === 'number' ? ` · ${Math.round(updateStatus.percent)}%` : '...'}`
                    : updateStatus.status === 'downloaded' ? 'Atualização baixada. Reinicie o Questly para instalar.'
                      : updateStatus.message || 'Não foi possível consultar atualizações.'}</span>
        </div>
        {updateStatus.status === 'downloading' && <div className="update-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(updateStatus.percent || 0)}><i style={{ width: `${Math.max(0, Math.min(100, updateStatus.percent || 0))}%` }}/></div>}
        <div className="update-actions">
          {updateStatus.status === 'available'
            ? <button className="primary-button" onClick={onDownloadUpdate}><Download size={15}/> Baixar atualização</button>
            : updateStatus.status === 'downloaded'
              ? <button className="primary-button" onClick={onInstallUpdate}><RotateCw size={15}/> Reiniciar e instalar</button>
              : <button className="primary-button" onClick={onCheckUpdates} disabled={!window.electronAPI || updateStatus.status === 'checking' || updateStatus.status === 'downloading'}><RefreshCw className={updateStatus.status === 'checking' ? 'spin' : ''} size={15}/> Verificar atualizações</button>}
        </div>
        <div className="appearance-note"><Monitor size={15}/> O app instalado também verifica atualizações ao iniciar. Builds de desenvolvimento não consultam releases.</div>
      </div>}
    </section></div>
  </div>;
}

function InviteModal({ group, quests, onClose, onSend }: { group: WorkspaceGroupView; quests: Quest[]; onClose: () => void; onSend: (request: { email: string; group: string; quest?: string }) => void }) {
  const [email, setEmail] = useState('');
  const [questId, setQuestId] = useState('');
  const quest = quests.find(item => item.id === questId);
  return <div className="overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><form className="modal invite-modal" onSubmit={event => { event.preventDefault(); onSend({ email: email.trim(), group: group.title, ...(quest ? { quest: quest.title } : {}) }); }}>
    <div className="modal-head"><div><div className="eyebrow">CONVITE PARA COLABORAR</div><h2>Convidar para {group.title}</h2><p>O convite será aberto como rascunho no aplicativo de e-mail.</p></div><button type="button" className="icon-button" aria-label="Fechar" onClick={onClose}><X size={19}/></button></div>
    <div className="modal-body"><label className="field-label">E-mail da pessoa<input autoFocus required type="email" maxLength={254} value={email} onChange={event => setEmail(event.target.value)} placeholder="pessoa@exemplo.com"/></label>
      <label className="field-label">Escopo do convite<select value={questId} onChange={event => setQuestId(event.target.value)}><option value="">Grupo inteiro · {group.title}</option>{quests.map(item => <option key={item.id} value={item.id}>Quest · {item.title}</option>)}</select></label>
      <div className="settings-alert"><Shield size={16}/><span>O e-mail é apenas um convite informativo. A pessoa não recebe acesso até que login e permissões individuais sejam implementados.</span></div>
    </div><div className="modal-foot"><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button type="submit" className="primary-button" disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}><Send size={15}/> Abrir e-mail</button></div>
  </form></div>;
}

function StatCard({ icon, label, value, note, tone }: { icon: ReactNode; label: string; value: string; note: ReactNode; tone: string }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>;
}

function MissionBanner({ openCount, dueToday, completedCount, onOpen }: { openCount: number; dueToday: number; completedCount: number; onOpen: () => void }) {
  return <section className="mission-banner" aria-label="Resumo das missões">
    <div className="mission-banner-copy">
      <div className="mission-banner-kicker"><Sparkles size={13}/> CENTRAL DE MISSÕES <span>•</span> SEU WORKSPACE</div>
      <h2>Pronto para a próxima<br/><span>grande missão?</span></h2>
      <p>Escolha um objetivo, reúna seu time e avance uma etapa de cada vez.</p>
      <div className="mission-banner-stats">
        <span><i className="mission-status-dot active"/> <b>{openCount}</b> {openCount === 1 ? 'missão ativa' : 'missões ativas'}</span>
        <span><i className="mission-status-dot today"/> <b>{dueToday}</b> para hoje</span>
        <span><CheckCircle2 size={14}/> <b>{completedCount}</b> concluídas</span>
      </div>
      <button className="mission-banner-button" onClick={onOpen}>Explorar missões <ArrowRight size={15}/></button>
    </div>
    <div className="mission-banner-art" aria-hidden="true">
      <div className="mission-orbit orbit-one"/><div className="mission-orbit orbit-two"/>
      <span className="mission-star star-one"><Sparkles size={18}/></span>
      <span className="mission-star star-two"><Sparkles size={12}/></span>
      <span className="mission-star star-three"><i/></span>
      <div className="mission-compass"><Compass size={76} strokeWidth={1.1}/><span><Target size={26}/></span></div>
      <span className="mission-art-label">QUESTLY<br/><b>DIÁRIO DE AVENTURA</b></span>
    </div>
  </section>;
}

function Progress({ quest }: { quest: Quest }) {
  const done = quest.subtasks.filter(s => s.done).length;
  const total = quest.subtasks.length;
  return <div className="progress-cell"><div className="progress-track"><i style={{ width: `${total ? done / total * 100 : 0}%` }}/></div><small>{done}/{total || '—'}</small></div>;
}

function QuestRow({ quest, profile, onOpen, onCheck }: { quest: Quest; profile?: UserProfileView; onOpen: () => void; onCheck: (id: string) => void }) {
  const next = quest.subtasks.find(s => !s.done);
  return <div className="focus-card"><button className="task-check" onClick={() => next ? onCheck(next.id) : onOpen()} title="Concluir próxima subquest">{next ? <span/> : <Check size={14}/>}</button><div className="focus-main"><button className="quest-title-button" onClick={onOpen}>{quest.title}</button><div className="focus-meta"><span className={`group-tag ${quest.color}`}>{quest.group}</span><span className="dot-separator">·</span><span><CalendarDays size={13}/>{quest.due}</span><span className="dot-separator">·</span><span>{quest.recurrence.toLowerCase()}</span></div></div><div className="focus-progress"><Progress quest={quest}/></div><AvatarStack ids={quest.assignees} profile={profile}/><button className="icon-button row-more" onClick={onOpen}><MoreHorizontal size={17}/></button></div>;
}

function QuestTableRow({ quest, profile, onOpen }: { quest: Quest; profile?: UserProfileView; onOpen: () => void }) {
  return <button className="table-row" onClick={onOpen}><span className="table-title"><i className={`quest-marker ${quest.color}`}/><span><b>{quest.title}</b><small>{quest.recurrence} <span>·</span> {quest.status}</small></span></span><span><span className={`group-tag ${quest.color}`}>{quest.group}</span></span><span><AvatarStack ids={quest.assignees} profile={profile}/></span><span className="due-text">{quest.due}</span><span><Progress quest={quest}/></span><span className="row-arrow"><ChevronRight size={16}/></span></button>;
}

function GroupsPage({ groups, quests, role, profile, onAdd, onEdit, onInvite }: { groups: WorkspaceGroupView[]; quests: Quest[]; role: string; profile: UserProfileView; onAdd: () => void; onEdit: (group: WorkspaceGroupView) => void; onInvite: (group: WorkspaceGroupView) => void }) {
  return <>
    <div className="page-title-row"><div><div className="eyebrow">PESSOAS E COLABORAÇÃO</div><h1>Grupos</h1><p>{window.electronAPI ? 'Organize quests e participantes por grupo. As alterações são compartilhadas pelo banco conectado.' : 'Demonstração local: as alterações ficam nesta sessão do navegador.'}</p></div>{role === 'Master' && <button className="primary-button" onClick={onAdd}><Plus size={17}/> Novo grupo</button>}</div>
    <div className="groups-grid">{groups.map(group => {
      const groupQuests = quests.filter(quest => quest.group === group.title);
      const canManage = role === 'Master' || group.adminIds.includes('ana');
      return <div className="group-card" key={group.id}><div className={`group-symbol ${group.color}`}><Users size={19}/></div>
        {canManage && <button className="icon-button group-menu" title={`Editar ${group.title}`} onClick={() => onEdit(group)}><MoreHorizontal size={18}/></button>}
        <h3>{group.title}</h3><p>{group.description || 'Sem descrição.'}</p>
        <div className="group-card-stats"><span><b>{group.memberIds.length}</b> pessoas</span><span><b>{groupQuests.filter(quest => quest.status !== 'Concluída').length}</b> quests abertas</span></div>
        <div className="group-card-bottom"><AvatarStack ids={group.memberIds} profile={profile}/>{canManage && <div className="group-card-actions"><button type="button" className="group-action-button invite" onClick={() => onInvite(group)}><Mail size={13}/> Convidar</button><button type="button" className="group-action-button manage" onClick={() => onEdit(group)}>Gerenciar <ArrowRight size={14}/></button></div>}</div>
        {!!group.adminIds.length && <small className="group-admin-line">Admins: {group.adminIds.map(id => id === 'ana' ? profile.name : people.find(person => person.id === id)?.name || id).join(', ')}</small>}
      </div>;
    })}{!groups.length && <div className="empty-state group-empty-state"><Users size={22}/><b>Nenhum grupo cadastrado</b><span>Crie um grupo para organizar pessoas e começar a criar quests.</span>{role === 'Master' && <button className="primary-button" onClick={onAdd}><Plus size={16}/> Criar primeiro grupo</button>}</div>}</div>
    <div className="settings-note"><Shield size={15}/><p><b>Identidades demonstrativas.</b> Os membros e papéis são cadastros de demonstração; login e autorização individual ainda não estão implementados.</p></div>
  </>;
}

function GroupModal({ group, profile, onClose, onSave }: { group: WorkspaceGroupView | null; profile: UserProfileView; onClose: () => void; onSave: (group: Omit<WorkspaceGroupView, 'id'>, id?: string) => void }) {
  const [title, setTitle] = useState(group?.title || '');
  const [description, setDescription] = useState(group?.description || '');
  const [memberIds, setMemberIds] = useState(group?.memberIds || []);
  const [adminIds, setAdminIds] = useState(group?.adminIds || []);
  const [color, setColor] = useState(group?.color || 'blue');
  const displayedPeople = people.map(person => person.id === 'ana' ? { ...person, name: profile.name, initials: profile.nickname.slice(0, 2).toUpperCase() } : person);
  const toggleMember = (id: string) => {
    const removing = memberIds.includes(id);
    setMemberIds(current => removing ? current.filter(value => value !== id) : [...current, id]);
    if (removing) setAdminIds(current => current.filter(value => value !== id));
  };
  const toggleAdmin = (id: string) => {
    if (!memberIds.includes(id)) setMemberIds(current => [...current, id]);
    setAdminIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  };
  return <div className="overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><form className="modal group-modal" onSubmit={event => { event.preventDefault(); onSave({ title: title.trim(), description: description.trim(), memberIds, adminIds: adminIds.filter(id => memberIds.includes(id)), color }, group?.id); }}>
    <div className="modal-head"><div><div className="eyebrow">PESSOAS E COLABORAÇÃO</div><h2>{group ? 'Gerenciar grupo' : 'Novo grupo'}</h2><p>Escolha participantes e responsáveis de demonstração.</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="Fechar"><X size={19}/></button></div>
    <div className="modal-body"><label className="field-label">Nome do grupo<input autoFocus maxLength={120} value={title} onChange={event => setTitle(event.target.value)} placeholder="Ex.: Produto" disabled={Boolean(group)}/>{group && <small className="field-hint">O nome é mantido para preservar o vínculo das quests existentes.</small>}</label>
      <label className="field-label">Descrição<textarea maxLength={1000} rows={3} value={description} onChange={event => setDescription(event.target.value)} placeholder="Qual é o foco deste grupo?"/></label>
      <div className="field-label">Pessoas do grupo<div className="people-picker">{displayedPeople.map(person => <button type="button" key={person.id} className={`person-chip ${memberIds.includes(person.id) ? 'selected' : ''}`} aria-pressed={memberIds.includes(person.id)} title={`${memberIds.includes(person.id) ? 'Remover' : 'Adicionar'} ${person.name} ${memberIds.includes(person.id) ? 'do' : 'ao'} grupo`} onClick={() => toggleMember(person.id)}><Avatar id={person.id} profile={profile}/>{person.name.split(' ')[0]}{memberIds.includes(person.id) && <Check size={13}/>}</button>)}</div><small className="field-hint">Clique em uma pessoa selecionada para removê-la deste grupo. Isso não altera responsáveis de quests já criadas.</small></div>
      <div className="field-label">Admins do grupo<div className="people-picker">{displayedPeople.filter(person => memberIds.includes(person.id)).map(person => <button type="button" key={person.id} className={`person-chip ${adminIds.includes(person.id) ? 'selected' : ''}`} aria-pressed={adminIds.includes(person.id)} title={`${adminIds.includes(person.id) ? 'Remover administração de' : 'Tornar admin'} ${person.name}`} onClick={() => toggleAdmin(person.id)}><Shield size={13}/>{person.name.split(' ')[0]}</button>)}{!memberIds.length && <small className="field-hint">Adicione uma pessoa primeiro.</small>}</div></div>
      <label className="field-label">Cor<select value={color} onChange={event => setColor(event.target.value)}><option value="peach">Pêssego</option><option value="blue">Azul</option><option value="purple">Roxo</option><option value="green">Verde</option><option value="yellow">Amarelo</option></select></label>
    </div><div className="modal-foot"><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button type="submit" className="primary-button" disabled={!title.trim() || !memberIds.length}><Save size={15}/> Salvar grupo</button></div>
  </form></div>;
}

function CalendarPage({ quests, onOpen, onCreate }: { quests: Quest[]; onOpen: (id: string) => void; onCreate: (date: string) => void }) {
  const [month, setMonth] = useState(() => { const date = new Date(); return new Date(date.getFullYear(), date.getMonth(), 1); });
  const firstWeekday = (month.getDay() + 6) % 7;
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - firstWeekday);
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start); date.setDate(start.getDate() + index);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(month);
  return <section className="calendar-page"><div className="page-title-row"><div><div className="eyebrow">PLANEJAMENTO</div><h1>Calendário</h1><p>Veja prazos e ocorrências. Selecione um dia para agendar uma quest.</p></div><button className="primary-button" onClick={() => onCreate(todayString())}><Plus size={16}/> Nova quest</button></div>
    <div className="calendar-toolbar"><div><button className="icon-button" aria-label="Mês anterior" onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))}><ChevronLeft size={18}/></button><button className="icon-button" aria-label="Próximo mês" onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))}><ChevronRight size={18}/></button><h2>{monthLabel}</h2></div><button className="secondary-button" onClick={() => { const now = new Date(); setMonth(new Date(now.getFullYear(), now.getMonth(), 1)); }}>Hoje</button></div>
    <div className="calendar-grid">{['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => <div className="calendar-weekday" key={day}>{day}</div>)}{days.map(day => {
      const due = quests.filter(quest => quest.dueDate === day);
      const inMonth = day.slice(0, 7) === `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
      return <div className={`calendar-day ${inMonth ? '' : 'outside'} ${day === todayString() ? 'today' : ''}`} key={day}>
        <div className="calendar-day-head"><span>{Number(day.slice(-2))}</span><button title="Criar quest neste dia" onClick={() => onCreate(day)}><Plus size={14}/></button></div>
        <div className="calendar-events">{due.slice(0, 3).map(quest => <button key={quest.id} className={`calendar-event ${quest.status === 'Concluída' ? 'completed' : ''}`} title={`${quest.title} · ${quest.group}`} onClick={() => onOpen(quest.id)}><i className={`group-dot ${quest.color}-dot`}/>{quest.title}</button>)}{due.length > 3 && <small>+{due.length - 3} mais</small>}</div>
      </div>;
    })}</div>
  </section>;
}

function ReportsPage({ quests, groups }: { quests: Quest[]; groups: WorkspaceGroupView[] }) {
  const completed = quests.filter(quest => quest.status === 'Concluída');
  const overdue = quests.filter(quest => quest.status !== 'Concluída' && quest.dueDate < todayString());
  const completionRate = quests.length ? Math.round(completed.length / quests.length * 100) : 0;
  return <div className="reports-page"><div className="page-title-row"><div><div className="eyebrow">VISÃO DO WORKSPACE</div><h1>Relatórios</h1><p>Resumo calculado a partir das ocorrências disponíveis no banco.</p></div><span className="local-pill"><Activity size={14}/> {quests.length} ocorrências</span></div>
    <div className="stats-grid report-stats"><StatCard icon={<ListTodo size={17}/>} label="Abertas" value={String(quests.length - completed.length)} note="ocorrências em andamento" tone="lavender"/><StatCard icon={<Clock3 size={17}/>} label="Vencidas" value={String(overdue.length)} note="prazo anterior a hoje" tone="peach"/><StatCard icon={<CheckCheck size={17}/>} label="Concluídas" value={String(completed.length)} note="histórico preservado" tone="mint"/><StatCard icon={<Target size={17}/>} label="Conclusão" value={`${completionRate}%`} note="concluídas do total listado" tone="blue"/></div>
    <section className="report-card"><div className="section-heading"><div><div className="title-with-icon"><Users size={17}/><h2>Atividade por grupo</h2></div><p>Quests abertas e concluídas por grupo.</p></div></div>
      {groups.map(group => {
        const items = quests.filter(quest => quest.group === group.title);
        const done = items.filter(quest => quest.status === 'Concluída').length;
        const percent = items.length ? Math.round(done / items.length * 100) : 0;
        return <div className="report-group" key={group.id}><div className="report-group-title"><i className={`group-dot ${group.color}-dot`}/><b>{group.title}</b><span>{done}/{items.length} concluídas</span></div><div className="report-track"><i style={{ width: `${percent}%` }}/></div></div>;
      })}
      {!groups.length && <div className="empty-state">Crie um grupo para começar a acompanhar resultados.</div>}
    </section>
  </div>;
}

function DatabaseSettingsPage() {
  const [config, setConfig] = useState<DatabaseConfigInput>({ provider: 'sqlite', filename: '' });
  const [secrets, setSecrets] = useState({ connectionString: '', authToken: '', password: '' });
  const [hasSecret, setHasSecret] = useState({ connectionString: false, authToken: false, password: false });
  const [busy, setBusy] = useState<'load' | 'save' | 'test' | null>('load');
  const [message, setMessage] = useState('');
  const [connected, setConnected] = useState<boolean | null>(null);
  const [electronAvailable, setElectronAvailable] = useState(true);
  useEffect(() => {
    const api = window.electronAPI;
    if (!api) { setElectronAvailable(false); setBusy(null); return; }
    api.database.getConfig().then(view => {
      setConfig(current => ({ ...current, ...view, hasSecret: undefined } as DatabaseConfigInput));
      setHasSecret(view.hasSecret); setBusy(null);
    }).catch(error => { setMessage(error instanceof Error ? error.message : 'Não foi possível ler as configurações.'); setBusy(null); });
  }, []);
  const setField = <K extends keyof DatabaseConfigInput>(key: K, value: DatabaseConfigInput[K]) => setConfig(previous => ({ ...previous, [key]: value }));
  const save = async () => {
    if (!window.electronAPI) return;
    setBusy('save'); setMessage('');
    try {
      const result = await window.electronAPI.database.saveConfig({ ...config, ...Object.fromEntries(Object.entries(secrets).filter(([, value]) => value)) });
      setHasSecret(result.hasSecret); setSecrets({ connectionString: '', authToken: '', password: '' }); setMessage('Conexão salva neste computador e pronta para usar.'); setConnected(null); window.dispatchEvent(new Event('database-connected'));
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível salvar a configuração.'); }
    finally { setBusy(null); }
  };
  const test = async () => {
    if (!window.electronAPI) return;
    setBusy('test'); setMessage(''); setConnected(null);
    try { await window.electronAPI.database.testConnection({ ...config, ...Object.fromEntries(Object.entries(secrets).filter(([, value]) => value)) }); setConnected(true); setMessage('Conexão estabelecida com sucesso.'); }
    catch (error) { setConnected(false); setMessage(error instanceof Error ? error.message : 'Falha ao conectar ao banco.'); }
    finally { setBusy(null); }
  };
  return <div className="settings-page"><div className="page-title-row"><div><div className="eyebrow">CONFIGURAÇÃO LOCAL</div><h1>Banco de dados</h1><p>Escolha o banco compartilhado. A conexão e a chave ficam configuradas nesta instalação do app.</p></div><span className="local-pill"><KeyRound size={13}/> ESTE COMPUTADOR</span></div>
    {!electronAvailable && <div className="settings-alert"><AlertCircle size={17}/><span>Abra o app pelo Electron com <b>npm start</b> para configurar o banco. Esta página no navegador não tem acesso às credenciais locais.</span></div>}
    <div className="settings-card"><div className="settings-card-head"><div className="settings-icon"><Database size={18}/></div><div><h2>Provedor de conexão</h2><p>As credenciais são protegidas pelo armazenamento seguro do sistema operacional.</p></div></div>
      <label className="field-label settings-field">Tipo de banco<select value={config.provider} onChange={event => setConfig({ provider: event.target.value as DatabaseProvider, ssl: false })}><option value="sqlite">SQLite — arquivo local</option><option value="postgres">PostgreSQL</option><option value="supabase">Supabase — PostgreSQL</option><option value="mysql">MySQL / MariaDB</option><option value="turso">Turso / libSQL</option></select></label>
      {config.provider === 'sqlite' && <label className="field-label settings-field">Arquivo do banco<input value={config.filename || ''} onChange={event => setField('filename', event.target.value)} placeholder="Vazio usa o arquivo padrão do app"/><small className="field-hint">Para compartilhar dados entre computadores, escolha um provedor remoto.</small></label>}
      {['postgres', 'supabase', 'mysql'].includes(config.provider) && <>
        <label className="field-label settings-field">String de conexão (opcional)<input type="password" autoComplete="new-password" value={secrets.connectionString} onChange={event => setSecrets(previous => ({ ...previous, connectionString: event.target.value }))} placeholder={hasSecret.connectionString ? 'Chave salva (deixe vazio para manter)' : 'postgresql://usuário:senha@host:5432/banco'} /><small className="field-hint">Pode conter host, usuário, senha e nome do banco. Será criptografada localmente.</small></label>
        {!secrets.connectionString && <div className="settings-subtitle">Ou informe os campos separados</div>}
        <div className="settings-fields-grid"><label className="field-label">Host<input value={config.host || ''} onChange={event => setField('host', event.target.value)} placeholder="db.exemplo.com" /></label><label className="field-label">Porta<input type="number" value={config.port || (config.provider === 'mysql' ? 3306 : 5432)} onChange={event => setField('port', Number(event.target.value))} /></label><label className="field-label">Banco<input value={config.database || ''} onChange={event => setField('database', event.target.value)} placeholder="quests" /></label><label className="field-label">Usuário<input value={config.user || ''} onChange={event => setField('user', event.target.value)} /></label><label className="field-label span-two">Senha<input type="password" autoComplete="new-password" value={secrets.password} onChange={event => setSecrets(previous => ({ ...previous, password: event.target.value }))} placeholder={hasSecret.password ? 'Chave salva (deixe vazio para manter)' : 'Senha do banco'} /></label></div>
        <label className="ssl-option"><input type="checkbox" checked={Boolean(config.ssl)} onChange={event => setField('ssl', event.target.checked)} /> Exigir conexão SSL/TLS</label>
      </>}
      {config.provider === 'turso' && <><label className="field-label settings-field">URL do banco<input value={secrets.connectionString} onChange={event => setSecrets(previous => ({ ...previous, connectionString: event.target.value }))} placeholder={hasSecret.connectionString ? 'URL salva (deixe vazio para manter)' : 'libsql://seu-banco.turso.io'} /></label><label className="field-label settings-field">Token de acesso<input type="password" autoComplete="new-password" value={secrets.authToken} onChange={event => setSecrets(previous => ({ ...previous, authToken: event.target.value }))} placeholder={hasSecret.authToken ? 'Token salvo (deixe vazio para manter)' : 'Token do Turso'} /></label></>}
      {message && <div className={`connection-message ${connected === true ? 'success' : connected === false ? 'error' : ''}`}>{connected === true ? <CheckCircle2 size={16}/> : connected === false ? <AlertCircle size={16}/> : <Check size={15}/>}<span>{message}</span></div>}
      <div className="settings-card-foot"><span><Server size={14}/> A credencial é armazenada apenas neste computador.</span><div><button className="secondary-button" disabled={!electronAvailable || busy !== null} onClick={() => void test()}>{busy === 'test' ? <Loader2 className="spin" size={14}/> : <Zap size={14}/>} Testar conexão</button><button className="primary-button" disabled={!electronAvailable || busy !== null} onClick={() => void save()}>{busy === 'save' ? <Loader2 className="spin" size={14}/> : <Save size={14}/>} Salvar conexão</button></div></div>
    </div><div className="settings-note"><Shield size={15}/><p><b>O acesso ao banco substitui hospedagem de um servidor do app.</b> Cada instalação conecta diretamente ao serviço escolhido. Configure uma credencial de banco com os privilégios mínimos necessários e proteja o acesso ao computador.</p></div>
  </div>;
}

function QuestModal({ groups, profile, dueDate: initialDueDate, onClose, onCreate }: { groups: WorkspaceGroupView[]; profile: UserProfileView; dueDate?: string; onClose: () => void; onCreate: (form: { title: string; group: string; recurrence: Recurrence; assignees: string[]; description: string; dueDate: string; weekdays: number[] }) => void }) {
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [dueDate, setDueDate] = useState(initialDueDate || todayString());
  const [group, setGroup] = useState(groups[0]?.title || ''); const [recurrence, setRecurrence] = useState<Recurrence>('Única'); const [assignees, setAssignees] = useState<string[]>(groups[0]?.memberIds.slice(0, 1) || []);
  const [weekdays, setWeekdays] = useState<number[]>(() => {
    const [year, month, day] = (initialDueDate || todayString()).split('-').map(Number);
    return [new Date(year, month - 1, day).getDay()];
  });
  const availableMembers = groups.find(item => item.title === group)?.memberIds || [];
  const displayedPeople = people.map(person => person.id === 'ana' ? { ...person, name: profile.name, initials: profile.nickname.slice(0, 2).toUpperCase() } : person);
  useEffect(() => {
    setAssignees(current => {
      const valid = current.filter(id => availableMembers.includes(id));
      return valid.length ? valid : availableMembers.slice(0, 1);
    });
  }, [group, groups]);
  const toggleWeekday = (day: number) => setWeekdays(current => current.includes(day) ? current.filter(item => item !== day) : [...current, day]);
  return <div className="overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal">
      <div className="modal-head"><div><div className="eyebrow">NOVA ENTREGA</div><h2>Criar uma quest</h2><p>Defina o objetivo e as pessoas responsáveis.</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="Fechar"><X size={19}/></button></div>
      <div className="modal-body">
        <label className="field-label">Nome da quest<input autoFocus value={title} onChange={event => setTitle(event.target.value)} placeholder="Ex.: Preparar reunião de planejamento"/></label>
        <label className="field-label">Descrição <textarea value={description} onChange={event => setDescription(event.target.value)} placeholder="O que precisa ser feito?" rows={3}/></label>
        <div className="field-grid">
          <label className="field-label">Grupo<select value={group} onChange={event => setGroup(event.target.value)}>{groups.map(item => <option key={item.id} value={item.title}>{item.title}</option>)}</select></label>
          <label className="field-label">Repetição<select value={recurrence} onChange={event => setRecurrence(event.target.value as Recurrence)}><option>Única</option><option>Diária</option><option>Semanal</option><option>Mensal</option></select></label>
        </div>
        <label className="field-label">Primeiro prazo<input type="date" value={dueDate} onChange={event => setDueDate(event.target.value)}/></label>
        {recurrence === 'Semanal' && <div className="field-label">Repetir nos dias
          <div className="weekday-picker">{weekDays.map(day => <button type="button" key={day.value} className={`weekday-option ${weekdays.includes(day.value) ? 'selected' : ''}`} aria-pressed={weekdays.includes(day.value)} onClick={() => toggleWeekday(day.value)}>{day.label}</button>)}</div>
          <small className="field-hint">A primeira ocorrência usa o prazo escolhido; depois, repete nos dias selecionados.</small>
        </div>}
        <div className="field-label">Responsáveis da quest
          <div className="people-picker">{displayedPeople.filter(person => availableMembers.includes(person.id)).map(person => <button type="button" key={person.id} className={`person-chip ${assignees.includes(person.id) ? 'selected' : ''}`} onClick={() => setAssignees(previous => previous.includes(person.id) ? previous.filter(id => id !== person.id) : [...previous, person.id])}><Avatar id={person.id} profile={profile}/>{person.name.split(' ')[0]}{assignees.includes(person.id) && <Check size={13}/>}</button>)}</div>
          <small className="field-hint">A participação no grupo não atribui automaticamente as subquests.</small>
        </div>
      </div>
      <div className="modal-foot"><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button type="button" className="primary-button" disabled={!title.trim() || !assignees.length || !dueDate || !group || recurrence === 'Semanal' && !weekdays.length} onClick={() => onCreate({ title: title.trim(), description: description.trim(), group, recurrence, assignees, dueDate, weekdays })}><Plus size={16}/> Criar quest</button></div>
    </div>
  </div>;
}

function QuestDetail({ quest, members, profile, onClose, onComplete, onCheck, onAddSubquest }: { quest: Quest; members: string[]; profile: UserProfileView; onClose: () => void; onComplete: () => void; onCheck: (id: string) => void; onAddSubquest: (title: string, assignees: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [assignees, setAssignees] = useState<string[]>(members.slice(0, 1));
  const done = quest.subtasks.filter(subquest => subquest.done).length;
  const displayedPeople = people.map(person => person.id === 'ana' ? { ...person, name: profile.name, initials: profile.nickname.slice(0, 2).toUpperCase() } : person);
  return <div className="overlay detail-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="detail-panel">
      <div className="detail-top"><span className="eyebrow">DETALHE DA QUEST</span><button className="icon-button" onClick={onClose}><X size={19}/></button></div>
      <div className={`detail-banner ${quest.color}`}><span className="group-tag">{quest.group}</span></div>
      <h2 className="detail-title">{quest.title}</h2><p className="detail-description">{quest.description || 'Sem descrição adicionada.'}</p>
      <div className="detail-info-grid"><div><small>STATUS</small><b><i className="status-dot"/>{quest.status}</b></div><div><small>PRAZO</small><b><CalendarDays size={14}/>{quest.due}</b></div><div><small>RECORRÊNCIA</small><b><Clock3 size={14}/>{quest.recurrence}{quest.recurrence === 'Semanal' && quest.weekdays?.length ? ` · ${quest.weekdays.slice().sort((a, b) => weekDays.findIndex(day => day.value === a) - weekDays.findIndex(day => day.value === b)).map(day => weekdayNames[day]).join(', ')}` : ''}</b></div></div>
      <div className="detail-section">
        <div className="detail-section-head"><div><h3>Subquests</h3><p>{done} de {quest.subtasks.length} concluídas · cada item pode ter mais de um responsável</p></div>{quest.status !== 'Concluída' && <button className="icon-button" title="Adicionar subquest" onClick={() => setAdding(true)}><Plus size={17}/></button>}</div>
        <div className="detail-progress"><i style={{ width: `${quest.subtasks.length ? done / quest.subtasks.length * 100 : 0}%` }}/></div>
        <div className="subquest-list">{quest.subtasks.map(subquest => <div className={`subquest ${subquest.done ? 'done' : ''}`} key={subquest.id}>
          <button className="subquest-check" disabled={subquest.done || quest.status === 'Concluída'} onClick={() => onCheck(subquest.id)}>{subquest.done && <Check size={13}/>}</button>
          <span className="subquest-copy"><b>{subquest.title}</b><small>Atribuída a</small></span><AvatarStack ids={subquest.assignees} profile={profile}/>
        </div>)}</div>
        {!quest.subtasks.length && <div className="empty-subquests">Adicione etapas menores para dividir essa entrega.</div>}
        {adding && <form className="add-subquest-form" onSubmit={event => { event.preventDefault(); if (title.trim() && assignees.length) onAddSubquest(title.trim(), assignees); setTitle(''); setAdding(false); }}>
          <input value={title} onChange={event => setTitle(event.target.value)} placeholder="Nome da subquest"/>
          <div className="subquest-assignees">{displayedPeople.filter(person => members.includes(person.id)).map(person => <button type="button" key={person.id} className={`person-chip ${assignees.includes(person.id) ? 'selected' : ''}`} onClick={() => setAssignees(previous => previous.includes(person.id) ? previous.filter(id => id !== person.id) : [...previous, person.id])}><Avatar id={person.id} profile={profile}/>{person.name.split(' ')[0]}</button>)}</div>
          <div className="add-subquest-actions"><button className="secondary-button" type="button" onClick={() => setAdding(false)}>Cancelar</button><button className="primary-button" type="submit" disabled={!title.trim() || !assignees.length}><Check size={14}/> Adicionar subquest</button></div>
        </form>}
      </div>
      <div className="detail-section people-section"><h3>Pessoas nesta quest</h3><div className="detail-people">{quest.assignees.map(id => <div key={id}><Avatar id={id} profile={profile}/><span>{displayedPeople.find(person => person.id === id)?.name}</span></div>)}</div></div>
      <div className="recurrence-note"><Sparkles size={16}/><span>{quest.recurrence === 'Única' ? 'Quest única: não haverá nova ocorrência.' : quest.recurrence === 'Semanal' && quest.weekdays?.length ? `Ao concluir todas as subquests, a próxima ocorrência será criada nos dias ${quest.weekdays.slice().sort((a, b) => weekDays.findIndex(day => day.value === a) - weekDays.findIndex(day => day.value === b)).map(day => weekdayNames[day]).join(', ')}.` : `Ao concluir todas as subquests, a próxima ocorrência ${quest.recurrence.toLowerCase()} é criada automaticamente.`}</span></div>
      <div className="detail-footer">{!quest.subtasks.length && quest.status !== 'Concluída' ? <button className="primary-button" onClick={onComplete}><Check size={14}/> Concluir quest</button> : <button className="secondary-button" onClick={onClose}>Fechar</button>}<span><Shield size={14}/> {window.electronAPI ? 'Conectado ao banco configurado' : 'Dados de demonstração'}</span></div>
    </aside>
  </div>;
}

export default App;
