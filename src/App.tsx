import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity, ArrowDownUp, ArrowRight, Bell, CalendarDays, Check, CheckCheck, ChevronDown,
  ChevronLeft, ChevronRight, HelpCircle, Clock3, Compass, LayoutDashboard,
  ListTodo, LogOut, MoreHorizontal, Plus, Search, Settings2, Shield, Sparkles, Target,
  Users, X, Zap, Moon, Sun, Database, KeyRound, Server, CheckCircle2, AlertCircle, Save, Loader2,
} from 'lucide-react';

type Recurrence = 'Única' | 'Diária' | 'Semanal' | 'Mensal';
type Member = { id: string; name: string; initials: string; color: string };
type Subquest = { id: string; title: string; assignees: string[]; done: boolean };
type Quest = {
  id: string; title: string; description: string; group: string; due: string; dueDate: string;
  recurrence: Recurrence; status: 'Em andamento' | 'A fazer' | 'Concluída';
  assignees: string[]; subtasks: Subquest[]; color: string; anchorDay?: number;
};

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

function dateForNextOccurrence(source: string, recurrence: Recurrence, anchorDay = Number(source.slice(-2))) {
  const [year, month, day] = source.split('-').map(Number);
  let date = new Date(year, month - 1, day);
  const advance = () => {
    if (recurrence === 'Diária') date.setDate(date.getDate() + 1);
    else if (recurrence === 'Semanal') date.setDate(date.getDate() + 7);
    else if (recurrence === 'Mensal') {
      const targetMonth = date.getMonth() + 1;
      const targetYear = date.getFullYear() + Math.floor(targetMonth / 12);
      const normalizedMonth = targetMonth % 12;
      const finalDay = new Date(targetYear, normalizedMonth + 1, 0).getDate();
      date = new Date(targetYear, normalizedMonth, Math.min(anchorDay, finalDay));
    }
  };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  do { advance(); } while (date <= today && recurrence !== 'Única');
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function todayString() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function nextOccurrenceFrom(quest: Quest): Quest | undefined {
  if (quest.recurrence === 'Única') return undefined;
  const anchorDay = quest.anchorDay || Number(quest.dueDate.slice(-2));
  const dueDate = dateForNextOccurrence(quest.dueDate, quest.recurrence, anchorDay);
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

function Avatar({ id, size = 'sm' }: { id: string; size?: 'sm' | 'md' }) {
  const person = people.find(p => p.id === id);
  if (!person) return null;
  return <span className={`avatar ${size}`} style={{ background: person.color }} title={person.name}>{person.initials}</span>;
}

function AvatarStack({ ids, max = 3 }: { ids: string[]; max?: number }) {
  return <div className="avatar-stack">{ids.slice(0, max).map(id => <Avatar key={id} id={id} />)}{ids.length > max && <span className="avatar-extra">+{ids.length - max}</span>}</div>;
}

function App() {
  const [page, setPage] = useState('Início');
  const [quests, setQuests] = useState<Quest[]>(() => window.electronAPI ? [] : initialQuests);
  const [groups, setGroups] = useState<WorkspaceGroupView[]>(() => window.electronAPI ? [] : demoGroups);
  const [modal, setModal] = useState(false);
  const [groupModal, setGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<WorkspaceGroupView | null>(null);
  const [newQuestDate, setNewQuestDate] = useState<string | undefined>();
  const [detail, setDetail] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Todos os grupos');
  const [dueFilter, setDueFilter] = useState('Qualquer prazo');
  const [sortBy, setSortBy] = useState<'Prazo' | 'Nome'>('Prazo');
  const [notice, setNotice] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('questly.theme') === 'dark');
  const [role, setRole] = useState<'Master' | 'Admin'>('Master');
  const [databaseError, setDatabaseError] = useState('');
  useEffect(() => { localStorage.setItem('questly.theme', dark ? 'dark' : 'light'); }, [dark]);
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
  const accessibleGroups = role === 'Master' ? groups : groups.filter(group => group.adminIds.includes('ana'));
  const dueToday = openQuests.filter(q => q.dueDate === todayString()).length;
  const notifications = openQuests.filter(q => q.dueDate <= todayString()).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const completedCount = quests.filter(q => q.status === 'Concluída').length;
  const collaboratorCount = new Set(quests.flatMap(q => [...q.assignees, ...q.subtasks.flatMap(subquest => subquest.assignees)])).size;
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
        if (quest?.subtasks.filter(item => !item.done).length === 1) flash(quest.recurrence === 'Única' ? 'Quest concluída e salva no banco.' : `Quest concluída. A próxima ocorrência ${quest.recurrence.toLowerCase()} foi salva no banco.`);
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
  const createQuest = async (form: { title: string; group: string; recurrence: Recurrence; assignees: string[]; description: string; dueDate: string }) => {
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
  const completeWithoutSubquests = async (questId: string) => {
    if (window.electronAPI) {
      const quest = quests.find(item => item.id === questId);
      try { setQuests(await window.electronAPI.quests.complete({ occurrenceId: questId })); flash(quest?.recurrence === 'Única' ? 'Quest concluída e salva no banco.' : `Quest concluída. A próxima ocorrência ${quest?.recurrence.toLowerCase()} foi salva no banco.`); }
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

  return <div className={`app ${dark ? 'dark' : ''}`}>
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand-row"><div className="brand-mark"><Compass size={20} /></div>{!collapsed && <span className="brand-name">questly<span>.</span></span>}<button className="icon-button collapse-btn" onClick={() => setCollapsed(v => !v)} aria-label="Recolher menu">{collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}</button></div>
      {!collapsed && <div className="workspace-switch"><div className="workspace-avatar">S</div><div className="workspace-copy"><b>Studio Norte</b><small>Workspace</small></div><ChevronDown size={15} /></div>}
      <div className="nav-label">WORKSPACE</div>
      <nav className="side-nav">{nav.map(item => { const Icon = item.icon; return <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => setPage(item.id)} title={collapsed ? item.id : undefined}><Icon size={18} /><span>{!collapsed && item.id}</span>{item.id === 'Minhas quests' && !collapsed && <span className="nav-count">{myQuests.length}</span>}</button>; })}</nav>
      {!collapsed && <><div className="nav-label groups-label">SEUS GRUPOS {role === 'Master' && <button onClick={() => { setEditingGroup(null); setGroupModal(true); }} title="Criar grupo"><Plus size={14} /></button>}</div><div className="group-nav">{accessibleGroups.map(group => <button key={group.id} onClick={() => { setPage('Minhas quests'); setFilter(group.title); }}><i className={`group-dot ${group.color}-dot`} />{group.title}<span>{quests.filter(quest => quest.group === group.title && quest.status !== 'Concluída').length}</span></button>)}{!accessibleGroups.length && <small className="group-empty">Nenhum grupo</small>}</div></>}
      <div className="sidebar-bottom"><button className="nav-item" onClick={() => setPage('Configurações')}><Settings2 size={18}/>{!collapsed && 'Configurações'}</button><div className="profile"><div className="profile-avatar">AC</div>{!collapsed && <><div className="profile-copy"><b>Ana Costa</b><small>{role} · <button onClick={() => setRole(role === 'Master' ? 'Admin' : 'Master')}>trocar demo</button></small></div><button className="icon-button" title="Sair" onClick={() => flash('A autenticação será conectada ao provedor do workspace.')}><LogOut size={16}/></button></>}</div></div>
    </aside>

    <main className="main-panel">
      <header className="topbar"><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14}/><b>{page}</b><span className="demo-badge">{window.electronAPI ? 'ELECTRON' : 'DEMONSTRAÇÃO'}</span></div><div className="top-actions"><button className="icon-button" title="Ajuda" onClick={() => flash('Use Configurações para conectar o banco e consulte docs/agents.md para as regras do fluxo.') }><HelpCircle size={18}/></button><button className="icon-button" title={dark ? 'Tema claro' : 'Tema escuro'} onClick={() => setDark(value => !value)}>{dark ? <Sun size={17}/> : <Moon size={17}/>}</button><div className="notification-wrap"><button className="icon-button notification-btn" title={`Notificações: ${notifications.length}`} aria-label={`Notificações: ${notifications.length}`} aria-expanded={showNotifications} onClick={() => setShowNotifications(value => !value)}><Bell size={18}/>{notifications.length > 0 && <i/>}</button>{showNotifications && <div className="notification-popover"><b>Alertas de prazo</b>{notifications.length ? notifications.slice(0, 8).map(quest => <button key={quest.id} onClick={() => { setShowNotifications(false); setDetail(quest.id); }}><span>{quest.dueDate < todayString() ? 'Vencida' : 'Hoje'}</span><strong>{quest.title}</strong><small>{quest.group} · {quest.due}</small></button>) : <p>Nenhuma quest vencida ou com prazo para hoje.</p>}</div>}</div><span className="top-divider"/><div className="top-user"><span className="profile-avatar small">AC</span><ChevronDown size={14}/></div></div></header>
      <div className="content">
        {databaseError && <div className="settings-alert"><AlertCircle size={17}/><span>{databaseError} Abra Configurações para verificar a conexão.</span><button className="text-button" onClick={() => setPage('Configurações')}>Configurar</button></div>}
        {page === 'Início' && <>
          <div className="welcome-row"><div><div className="eyebrow"><Sparkles size={14}/> {new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toLocaleUpperCase('pt-BR')}</div><h1>Bom dia, Ana <span>☀️</span></h1><p>Um passo de cada vez. Veja o que merece sua atenção hoje.</p></div><button className="primary-button" onClick={() => openCreateQuest()}><Plus size={17}/> Nova quest</button></div>
          <section className="stats-grid">
            <StatCard icon={<Target size={17}/>} label="Quests em andamento" value={String(openQuests.length)} note="em todos os seus grupos" tone="lavender" />
            <StatCard icon={<Clock3 size={17}/>} label="Para hoje" value={String(dueToday)} note={dueToday ? 'ocorrências com prazo de hoje' : 'nenhum prazo para hoje'} tone="peach" />
            <StatCard icon={<CheckCheck size={17}/>} label="Quests concluídas" value={String(completedCount)} note="no histórico deste banco" tone="mint" />
            <StatCard icon={<Users size={17}/>} label="Pessoas colaborando" value={String(collaboratorCount)} note="responsáveis registrados" tone="blue" />
          </section>

          <section className="work-section"><div className="section-heading"><div><div className="title-with-icon"><Zap size={17}/><h2>Seu foco de hoje</h2><span className="pill-count">2</span></div><p>Pequenas entregas que movem o trabalho.</p></div><button className="text-button" onClick={() => setPage('Minhas quests')}>Ver todas <ArrowRight size={15}/></button></div>
            <div className="focus-list">{myQuests.slice(0, 2).map(q => <QuestRow key={q.id} quest={q} onOpen={() => setDetail(q.id)} onCheck={id => void toggleSubquest(q.id, id)} />)}{!myQuests.length && <div className="empty-state compact">Nenhuma quest aberta para você.</div>}</div>
          </section>

          <section className="work-section all-quests"><div className="section-heading"><div><div className="title-with-icon"><ListTodo size={17}/><h2>Quests do workspace</h2><span className="pill-count">{openQuests.length}</span></div><p>Uma visão compartilhada do que está acontecendo.</p></div><button className="text-button" onClick={() => setPage('Minhas quests')}>Abrir quadro <ArrowRight size={15}/></button></div>
            <div className="toolbar"><div className="search-box"><Search size={15}/><input placeholder="Buscar quest..." value={query} onChange={e => setQuery(e.target.value)} /><kbd>⌘ K</kbd></div><select value={filter} onChange={e => setFilter(e.target.value)}><option>Todos os grupos</option>{accessibleGroups.map(group => <option key={group.id}>{group.title}</option>)}</select><select value={dueFilter} onChange={e => setDueFilter(e.target.value)}><option>Qualquer prazo</option><option>Vencidas</option><option>Hoje</option><option>Próximas</option><option>Concluídas</option></select><button className="filter-button" onClick={() => setSortBy(value => value === 'Prazo' ? 'Nome' : 'Prazo')}><ArrowDownUp size={15}/> {sortBy}</button></div>
            <div className="quest-table"><div className="table-head"><span>QUEST</span><span>GRUPO</span><span>RESPONSÁVEIS</span><span>PRAZO</span><span>PROGRESSO</span><span/></div>{filtered.slice(0, 4).map(q => <QuestTableRow key={q.id} quest={q} onOpen={() => setDetail(q.id)} />)}{!filtered.length && <div className="empty-state">Ainda não há quests neste banco. Crie a primeira para começar.</div>}</div>
          </section>
          <div className="bottom-note"><div className="note-icon"><Activity size={16}/></div><span><b>{completedCount ? 'As entregas concluídas ficam no histórico.' : 'Comece criando uma quest para o seu time.'}</b> {completedCount} {completedCount === 1 ? 'quest concluída' : 'quests concluídas'} neste banco.</span><button className="text-button" onClick={() => setPage('Relatórios')}>Ver atividade <ArrowRight size={14}/></button></div>
        </>}
        {page === 'Minhas quests' && <>
          <div className="page-title-row"><div><div className="eyebrow">SUAS ENTREGAS</div><h1>Minhas quests</h1><p>Acompanhe tarefas atribuídas a você e aos seus grupos.</p></div><button className="primary-button" onClick={() => openCreateQuest()}><Plus size={17}/> Nova quest</button></div>
          <div className="toolbar page-toolbar"><div className="search-box"><Search size={15}/><input placeholder="Buscar quest..." value={query} onChange={e => setQuery(e.target.value)} /></div><select value={filter} onChange={e => setFilter(e.target.value)}><option>Todos os grupos</option>{accessibleGroups.map(group => <option key={group.id}>{group.title}</option>)}</select><select value={dueFilter} onChange={e => setDueFilter(e.target.value)}><option>Qualquer prazo</option><option>Vencidas</option><option>Hoje</option><option>Próximas</option><option>Concluídas</option></select><button className="filter-button" onClick={() => setSortBy(value => value === 'Prazo' ? 'Nome' : 'Prazo')}><ArrowDownUp size={15}/> {sortBy}</button></div>
          <div className="quest-list">{myFiltered.map(q => <QuestRow key={q.id} quest={q} onOpen={() => setDetail(q.id)} onCheck={id => void toggleSubquest(q.id, id)} />)}{!myFiltered.length && <div className="empty-state">Nenhuma quest atribuída encontrada. Crie uma quest ou ajuste os filtros.</div>}</div>
        </>}
        {page === 'Calendário' && <CalendarPage quests={quests} onOpen={id => setDetail(id)} onCreate={date => openCreateQuest(date)} />}
        {page === 'Grupos' && <GroupsPage groups={accessibleGroups} quests={quests} role={role} onAdd={() => { setEditingGroup(null); setGroupModal(true); }} onEdit={group => { setEditingGroup(group); setGroupModal(true); }} />}
        {page === 'Configurações' && <DatabaseSettingsPage />}
        {page === 'Relatórios' && <ReportsPage quests={quests} groups={groups} />}
      </div>
    </main>

    {modal && <QuestModal groups={accessibleGroups} dueDate={newQuestDate} onClose={() => setModal(false)} onCreate={createQuest}/>}
    {groupModal && <GroupModal group={editingGroup} onClose={() => { setGroupModal(false); setEditingGroup(null); }} onSave={saveGroup} />}
    {current && <QuestDetail quest={current} members={groups.find(group => group.title === current.group)?.memberIds || []} onClose={() => setDetail(null)} onComplete={() => completeWithoutSubquests(current.id)} onCheck={id => void toggleSubquest(current.id, id)} onAddSubquest={(title, assignees) => {
      if (window.electronAPI) { void window.electronAPI.quests.addSubquest({ occurrenceId: current.id, title, assignees }).then(setQuests).catch(error => flash(error instanceof Error ? error.message : 'Falha ao criar subquest.')); return; }
      setQuests(prev => prev.map(q => q.id === current.id ? { ...q, subtasks: [...q.subtasks, { id: crypto.randomUUID(), title, assignees, done: false }], status: 'Em andamento' } : q));
    }} />}
    {notice && <div className="toast"><Check size={16}/>{notice}</div>}
  </div>;
}

function StatCard({ icon, label, value, note, tone }: { icon: ReactNode; label: string; value: string; note: ReactNode; tone: string }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>;
}

function Progress({ quest }: { quest: Quest }) {
  const done = quest.subtasks.filter(s => s.done).length;
  const total = quest.subtasks.length;
  return <div className="progress-cell"><div className="progress-track"><i style={{ width: `${total ? done / total * 100 : 0}%` }}/></div><small>{done}/{total || '—'}</small></div>;
}

function QuestRow({ quest, onOpen, onCheck }: { quest: Quest; onOpen: () => void; onCheck: (id: string) => void }) {
  const next = quest.subtasks.find(s => !s.done);
  return <div className="focus-card"><button className="task-check" onClick={() => next ? onCheck(next.id) : onOpen()} title="Concluir próxima subquest">{next ? <span/> : <Check size={14}/>}</button><div className="focus-main"><button className="quest-title-button" onClick={onOpen}>{quest.title}</button><div className="focus-meta"><span className={`group-tag ${quest.color}`}>{quest.group}</span><span className="dot-separator">·</span><span><CalendarDays size={13}/>{quest.due}</span><span className="dot-separator">·</span><span>{quest.recurrence.toLowerCase()}</span></div></div><div className="focus-progress"><Progress quest={quest}/></div><AvatarStack ids={quest.assignees}/><button className="icon-button row-more" onClick={onOpen}><MoreHorizontal size={17}/></button></div>;
}

function QuestTableRow({ quest, onOpen }: { quest: Quest; onOpen: () => void }) {
  return <button className="table-row" onClick={onOpen}><span className="table-title"><i className={`quest-marker ${quest.color}`}/><span><b>{quest.title}</b><small>{quest.recurrence} <span>·</span> {quest.status}</small></span></span><span><span className={`group-tag ${quest.color}`}>{quest.group}</span></span><span><AvatarStack ids={quest.assignees}/></span><span className="due-text">{quest.due}</span><span><Progress quest={quest}/></span><span className="row-arrow"><ChevronRight size={16}/></span></button>;
}

function GroupsPage({ groups, quests, role, onAdd, onEdit }: { groups: WorkspaceGroupView[]; quests: Quest[]; role: string; onAdd: () => void; onEdit: (group: WorkspaceGroupView) => void }) {
  return <>
    <div className="page-title-row"><div><div className="eyebrow">PESSOAS E COLABORAÇÃO</div><h1>Grupos</h1><p>{window.electronAPI ? 'Organize quests e participantes por grupo. As alterações são compartilhadas pelo banco conectado.' : 'Demonstração local: as alterações ficam nesta sessão do navegador.'}</p></div>{role === 'Master' && <button className="primary-button" onClick={onAdd}><Plus size={17}/> Novo grupo</button>}</div>
    <div className="groups-grid">{groups.map(group => {
      const groupQuests = quests.filter(quest => quest.group === group.title);
      const canManage = role === 'Master' || group.adminIds.includes('ana');
      return <div className="group-card" key={group.id}><div className={`group-symbol ${group.color}`}><Users size={19}/></div>
        {canManage && <button className="icon-button group-menu" title={`Editar ${group.title}`} onClick={() => onEdit(group)}><MoreHorizontal size={18}/></button>}
        <h3>{group.title}</h3><p>{group.description || 'Sem descrição.'}</p>
        <div className="group-card-stats"><span><b>{group.memberIds.length}</b> pessoas</span><span><b>{groupQuests.filter(quest => quest.status !== 'Concluída').length}</b> quests abertas</span></div>
        <div className="group-card-bottom"><AvatarStack ids={group.memberIds}/>{canManage && <button onClick={() => onEdit(group)}>Gerenciar grupo <ArrowRight size={14}/></button>}</div>
        {!!group.adminIds.length && <small className="group-admin-line">Admins: {group.adminIds.map(id => people.find(person => person.id === id)?.name || id).join(', ')}</small>}
      </div>;
    })}{!groups.length && <div className="empty-state group-empty-state"><Users size={22}/><b>Nenhum grupo cadastrado</b><span>Crie um grupo para organizar pessoas e começar a criar quests.</span>{role === 'Master' && <button className="primary-button" onClick={onAdd}><Plus size={16}/> Criar primeiro grupo</button>}</div>}</div>
    <div className="settings-note"><Shield size={15}/><p><b>Identidades demonstrativas.</b> Os membros e papéis são cadastros de demonstração; login e autorização individual ainda não estão implementados.</p></div>
  </>;
}

function GroupModal({ group, onClose, onSave }: { group: WorkspaceGroupView | null; onClose: () => void; onSave: (group: Omit<WorkspaceGroupView, 'id'>, id?: string) => void }) {
  const [title, setTitle] = useState(group?.title || '');
  const [description, setDescription] = useState(group?.description || '');
  const [memberIds, setMemberIds] = useState(group?.memberIds || []);
  const [adminIds, setAdminIds] = useState(group?.adminIds || []);
  const [color, setColor] = useState(group?.color || 'blue');
  const toggleMember = (id: string) => setMemberIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  const toggleAdmin = (id: string) => {
    if (!memberIds.includes(id)) setMemberIds(current => [...current, id]);
    setAdminIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  };
  return <div className="overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><form className="modal group-modal" onSubmit={event => { event.preventDefault(); onSave({ title: title.trim(), description: description.trim(), memberIds, adminIds: adminIds.filter(id => memberIds.includes(id)), color }, group?.id); }}>
    <div className="modal-head"><div><div className="eyebrow">PESSOAS E COLABORAÇÃO</div><h2>{group ? 'Gerenciar grupo' : 'Novo grupo'}</h2><p>Escolha participantes e responsáveis de demonstração.</p></div><button type="button" className="icon-button" onClick={onClose}><X size={19}/></button></div>
    <div className="modal-body"><label className="field-label">Nome do grupo<input autoFocus maxLength={120} value={title} onChange={event => setTitle(event.target.value)} placeholder="Ex.: Produto" disabled={Boolean(group)}/>{group && <small className="field-hint">O nome é mantido para preservar o vínculo das quests existentes.</small>}</label>
      <label className="field-label">Descrição<textarea maxLength={1000} rows={3} value={description} onChange={event => setDescription(event.target.value)} placeholder="Qual é o foco deste grupo?"/></label>
      <div className="field-label">Pessoas do grupo<div className="people-picker">{people.map(person => <button type="button" key={person.id} className={`person-chip ${memberIds.includes(person.id) ? 'selected' : ''}`} onClick={() => toggleMember(person.id)}><Avatar id={person.id}/>{person.name.split(' ')[0]}{memberIds.includes(person.id) && <Check size={13}/>}</button>)}</div></div>
      <div className="field-label">Admins do grupo<div className="people-picker">{people.filter(person => memberIds.includes(person.id)).map(person => <button type="button" key={person.id} className={`person-chip ${adminIds.includes(person.id) ? 'selected' : ''}`} onClick={() => toggleAdmin(person.id)}><Shield size={13}/>{person.name.split(' ')[0]}</button>)}{!memberIds.length && <small className="field-hint">Adicione uma pessoa primeiro.</small>}</div></div>
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

function QuestModal({ groups, dueDate: initialDueDate, onClose, onCreate }: { groups: WorkspaceGroupView[]; dueDate?: string; onClose: () => void; onCreate: (form: { title: string; group: string; recurrence: Recurrence; assignees: string[]; description: string; dueDate: string }) => void }) {
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [dueDate, setDueDate] = useState(initialDueDate || todayString());
  const [group, setGroup] = useState(groups[0]?.title || ''); const [recurrence, setRecurrence] = useState<Recurrence>('Única'); const [assignees, setAssignees] = useState<string[]>(groups[0]?.memberIds.slice(0, 1) || []);
  const availableMembers = groups.find(item => item.title === group)?.memberIds || [];
  useEffect(() => {
    setAssignees(current => {
      const valid = current.filter(id => availableMembers.includes(id));
      return valid.length ? valid : availableMembers.slice(0, 1);
    });
  }, [group, groups]);
  return <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div className="modal"><div className="modal-head"><div><div className="eyebrow">NOVA ENTREGA</div><h2>Criar uma quest</h2><p>Defina o objetivo e as pessoas responsáveis.</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></div><div className="modal-body"><label className="field-label">Nome da quest<input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex.: Preparar reunião de planejamento"/></label><label className="field-label">Descrição <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="O que precisa ser feito?" rows={3}/></label><div className="field-grid"><label className="field-label">Grupo<select value={group} onChange={e => setGroup(e.target.value)}>{groups.map(item => <option key={item.id} value={item.title}>{item.title}</option>)}</select></label><label className="field-label">Repetição<select value={recurrence} onChange={e => setRecurrence(e.target.value as Recurrence)}><option>Única</option><option>Diária</option><option>Semanal</option><option>Mensal</option></select></label></div><label className="field-label">Primeiro prazo<input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></label><div className="field-label">Responsáveis da quest<div className="people-picker">{people.filter(person => availableMembers.includes(person.id)).map(person => <button type="button" key={person.id} className={`person-chip ${assignees.includes(person.id) ? 'selected' : ''}`} onClick={() => setAssignees(prev => prev.includes(person.id) ? prev.filter(id => id !== person.id) : [...prev, person.id])}><Avatar id={person.id}/>{person.name.split(' ')[0]}{assignees.includes(person.id) && <Check size={13}/>}</button>)}</div><small className="field-hint">A participação no grupo não atribui automaticamente as subquests.</small></div></div><div className="modal-foot"><button className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={!title.trim() || !assignees.length || !dueDate || !group} onClick={() => onCreate({ title: title.trim(), description: description.trim(), group, recurrence, assignees, dueDate })}><Plus size={16}/> Criar quest</button></div></div></div>;
}

function QuestDetail({ quest, members, onClose, onComplete, onCheck, onAddSubquest }: { quest: Quest; members: string[]; onClose: () => void; onComplete: () => void; onCheck: (id: string) => void; onAddSubquest: (title: string, assignees: string[]) => void }) {
  const [adding, setAdding] = useState(false); const [title, setTitle] = useState(''); const [assignees, setAssignees] = useState<string[]>(members.slice(0, 1));
  const done = quest.subtasks.filter(s => s.done).length;
  return <div className="overlay detail-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><aside className="detail-panel"><div className="detail-top"><span className="eyebrow">DETALHE DA QUEST</span><button className="icon-button" onClick={onClose}><X size={19}/></button></div><div className={`detail-banner ${quest.color}`}><span className="group-tag">{quest.group}</span></div><h2 className="detail-title">{quest.title}</h2><p className="detail-description">{quest.description || 'Sem descrição adicionada.'}</p><div className="detail-info-grid"><div><small>STATUS</small><b><i className="status-dot"/>{quest.status}</b></div><div><small>PRAZO</small><b><CalendarDays size={14}/>{quest.due}</b></div><div><small>RECORRÊNCIA</small><b><Clock3 size={14}/>{quest.recurrence}</b></div></div><div className="detail-section"><div className="detail-section-head"><div><h3>Subquests</h3><p>{done} de {quest.subtasks.length} concluídas · cada item pode ter mais de um responsável</p></div>{quest.status !== 'Concluída' && <button className="icon-button" title="Adicionar subquest" onClick={() => setAdding(true)}><Plus size={17}/></button>}</div><div className="detail-progress"><i style={{ width: `${quest.subtasks.length ? done / quest.subtasks.length * 100 : 0}%` }}/></div><div className="subquest-list">{quest.subtasks.map(s => <div className={`subquest ${s.done ? 'done' : ''}`} key={s.id}><button className="subquest-check" disabled={s.done || quest.status === 'Concluída'} onClick={() => onCheck(s.id)}>{s.done && <Check size={13}/>}</button><span className="subquest-copy"><b>{s.title}</b><small>Atribuída a</small></span><AvatarStack ids={s.assignees}/></div>)}</div>{!quest.subtasks.length && <div className="empty-subquests">Adicione etapas menores para dividir essa entrega.</div>}{adding && <form className="add-subquest-form" onSubmit={e => { e.preventDefault(); if (title.trim() && assignees.length) onAddSubquest(title.trim(), assignees); setTitle(''); setAdding(false); }}><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nome da subquest"/><div className="subquest-assignees">{people.filter(person => members.includes(person.id)).map(person => <button type="button" key={person.id} className={`person-chip ${assignees.includes(person.id) ? 'selected' : ''}`} onClick={() => setAssignees(prev => prev.includes(person.id) ? prev.filter(id => id !== person.id) : [...prev, person.id])}><Avatar id={person.id}/>{person.name.split(' ')[0]}</button>)}</div><div className="add-subquest-actions"><button className="secondary-button" type="button" onClick={() => setAdding(false)}>Cancelar</button><button className="primary-button" type="submit" disabled={!title.trim() || !assignees.length}><Check size={14}/> Adicionar subquest</button></div></form>}</div><div className="detail-section people-section"><h3>Pessoas nesta quest</h3><div className="detail-people">{quest.assignees.map(id => <div key={id}><Avatar id={id}/><span>{people.find(p => p.id === id)?.name}</span></div>)}</div></div><div className="recurrence-note"><Sparkles size={16}/><span>{quest.recurrence === 'Única' ? 'Quest única: não haverá nova ocorrência.' : `Ao concluir todas as subquests, a próxima ocorrência ${quest.recurrence.toLowerCase()} é criada automaticamente.`}</span></div><div className="detail-footer">{!quest.subtasks.length && quest.status !== 'Concluída' ? <button className="primary-button" onClick={onComplete}><Check size={14}/> Concluir quest</button> : <button className="secondary-button" onClick={onClose}>Fechar</button>}<span><Shield size={14}/> {window.electronAPI ? 'Conectado ao banco configurado' : 'Dados de demonstração'}</span></div></aside></div>;
}

export default App;
