import { useMemo, useState, type ReactNode } from 'react';
import {
  Activity, ArrowDownUp, ArrowRight, Bell, CalendarDays, Check, CheckCheck, ChevronDown,
  ChevronLeft, ChevronRight, HelpCircle, Clock3, Command, Compass, Filter, LayoutDashboard,
  ListTodo, LogOut, MoreHorizontal, Plus, Search, Settings2, Shield, Sparkles, Target,
  Users, X, Zap, Moon, Sun,
} from 'lucide-react';

type Recurrence = 'Única' | 'Diária' | 'Semanal' | 'Mensal';
type Member = { id: string; name: string; initials: string; color: string };
type Subquest = { id: string; title: string; assignees: string[]; done: boolean };
type Quest = {
  id: string; title: string; description: string; group: string; due: string; dueDate: string;
  recurrence: Recurrence; status: 'Em andamento' | 'A fazer' | 'Concluída';
  assignees: string[]; subtasks: Subquest[]; color: string;
};

const people: Member[] = [
  { id: 'ana', name: 'Ana Costa', initials: 'AC', color: '#e9a377' },
  { id: 'bruno', name: 'Bruno Lima', initials: 'BL', color: '#7e97d5' },
  { id: 'carol', name: 'Carol Mendes', initials: 'CM', color: '#9d83c6' },
  { id: 'diego', name: 'Diego Rocha', initials: 'DR', color: '#68a99b' },
  { id: 'luiza', name: 'Luiza Alves', initials: 'LA', color: '#d77988' },
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
  { id: 'Calendário', icon: CalendarDays }, { id: 'Grupos', icon: Users },
];

function dateForNextOccurrence(source: string, recurrence: Recurrence) {
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
      date = new Date(targetYear, normalizedMonth, Math.min(day, finalDay));
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
  const dueDate = dateForNextOccurrence(quest.dueDate, quest.recurrence);
  return { ...quest, id: crypto.randomUUID(), dueDate, due: displayDate(dueDate), status: 'A fazer', subtasks: quest.subtasks.map(s => ({ ...s, id: crypto.randomUUID(), done: false })) };
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
  const [quests, setQuests] = useState(initialQuests);
  const [modal, setModal] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Todos os grupos');
  const [notice, setNotice] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [role, setRole] = useState<'Master' | 'Admin'>('Master');
  const current = quests.find(q => q.id === detail);
  const openQuests = quests.filter(q => q.status !== 'Concluída');
  const myQuests = quests.filter(q => q.assignees.includes('ana') && q.status !== 'Concluída');
  const filtered = useMemo(() => quests.filter(q => q.status !== 'Concluída' &&
    (filter === 'Todos os grupos' || q.group === filter) &&
    `${q.title} ${q.description} ${q.group}`.toLowerCase().includes(query.toLowerCase())), [quests, filter, query]);

  const flash = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 3200); };
  const toggleSubquest = (questId: string, subId: string) => {
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
  const createQuest = (form: { title: string; group: string; recurrence: Recurrence; assignees: string[]; description: string; dueDate: string }) => {
    const quest: Quest = { ...form, id: crypto.randomUUID(), due: displayDate(form.dueDate), status: 'A fazer', subtasks: [], color: 'blue' };
    setQuests(prev => [quest, ...prev]); setModal(false); flash('Quest criada. Adicione subquests pelo detalhe da tarefa.');
  };
  const completeWithoutSubquests = (questId: string) => {
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
      {!collapsed && <><div className="nav-label groups-label">SEUS GRUPOS <button onClick={() => setPage('Grupos')} title="Gerenciar grupos"><Plus size={14} /></button></div><div className="group-nav"><button onClick={() => { setPage('Minhas quests'); setFilter('Marketing'); }}><i className="group-dot peach-dot" />Marketing<span>8</span></button><button onClick={() => { setPage('Minhas quests'); setFilter('Operações'); }}><i className="group-dot blue-dot" />Operações<span>5</span></button><button onClick={() => { setPage('Minhas quests'); setFilter('Conteúdo'); }}><i className="group-dot purple-dot" />Conteúdo<span>3</span></button></div></>}
      <div className="sidebar-bottom"><button className="nav-item" onClick={() => setPage('Configurações')}><Settings2 size={18}/>{!collapsed && 'Configurações'}</button><div className="profile"><div className="profile-avatar">AC</div>{!collapsed && <><div className="profile-copy"><b>Ana Costa</b><small>{role} · <button onClick={() => setRole(role === 'Master' ? 'Admin' : 'Master')}>trocar demo</button></small></div><button className="icon-button" title="Sair" onClick={() => flash('A autenticação será conectada ao provedor do workspace.')}><LogOut size={16}/></button></>}</div></div>
    </aside>

    <main className="main-panel">
      <header className="topbar"><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14}/><b>{page}</b><span className="demo-badge">DEMONSTRAÇÃO</span></div><div className="top-actions"><button className="icon-button" title="Ajuda"><HelpCircle size={18}/></button><button className="icon-button" title={dark ? 'Tema claro' : 'Tema escuro'} onClick={() => setDark(value => !value)}>{dark ? <Sun size={17}/> : <Moon size={17}/>}</button><button className="icon-button notification-btn" title="Notificações" onClick={() => flash('Você está em dia com as notificações.')}><Bell size={18}/><i/></button><span className="top-divider"/><div className="top-user"><span className="profile-avatar small">AC</span><ChevronDown size={14}/></div></div></header>
      <div className="content">
        {page === 'Início' && <>
          <div className="welcome-row"><div><div className="eyebrow"><Sparkles size={14}/> QUARTA-FEIRA, 15 DE OUTUBRO</div><h1>Bom dia, Ana <span>☀️</span></h1><p>Um passo de cada vez. Veja o que merece sua atenção hoje.</p></div><button className="primary-button" onClick={() => setModal(true)}><Plus size={17}/> Nova quest</button></div>
          <section className="stats-grid">
            <StatCard icon={<Target size={17}/>} label="Quests em andamento" value={String(openQuests.length)} note="em todos os seus grupos" tone="lavender" />
            <StatCard icon={<Clock3 size={17}/>} label="Para hoje" value="2" note="1 tarefa depende de você" tone="peach" />
            <StatCard icon={<CheckCheck size={17}/>} label="Concluídas esta semana" value="12" note={<><span className="trend-up">↗ 18%</span> em relação à anterior</>} tone="mint" />
            <StatCard icon={<Users size={17}/>} label="Pessoas colaborando" value="8" note="em 3 grupos ativos" tone="blue" />
          </section>

          <section className="work-section"><div className="section-heading"><div><div className="title-with-icon"><Zap size={17}/><h2>Seu foco de hoje</h2><span className="pill-count">2</span></div><p>Pequenas entregas que movem o trabalho.</p></div><button className="text-button" onClick={() => setPage('Minhas quests')}>Ver todas <ArrowRight size={15}/></button></div>
            <div className="focus-list">{myQuests.slice(0, 2).map(q => <QuestRow key={q.id} quest={q} onOpen={() => setDetail(q.id)} onCheck={id => toggleSubquest(q.id, id)} />)}</div>
          </section>

          <section className="work-section all-quests"><div className="section-heading"><div><div className="title-with-icon"><ListTodo size={17}/><h2>Quests do workspace</h2><span className="pill-count">{openQuests.length}</span></div><p>Uma visão compartilhada do que está acontecendo.</p></div><button className="text-button" onClick={() => setPage('Minhas quests')}>Abrir quadro <ArrowRight size={15}/></button></div>
            <div className="toolbar"><div className="search-box"><Search size={15}/><input placeholder="Buscar quest..." value={query} onChange={e => setQuery(e.target.value)} /><kbd>⌘ K</kbd></div><select value={filter} onChange={e => setFilter(e.target.value)}><option>Todos os grupos</option><option>Marketing</option><option>Operações</option><option>Conteúdo</option></select><button className="filter-button" onClick={() => flash('Filtros adicionais em breve.')}><Filter size={15}/> Filtros</button><button className="icon-button" onClick={() => flash('Ordenação: prazo mais próximo primeiro.')} title="Ordenar"><ArrowDownUp size={16}/></button></div>
            <div className="quest-table"><div className="table-head"><span>QUEST</span><span>GRUPO</span><span>RESPONSÁVEIS</span><span>PRAZO</span><span>PROGRESSO</span><span/></div>{filtered.slice(0, 4).map(q => <QuestTableRow key={q.id} quest={q} onOpen={() => setDetail(q.id)} />)}</div>
          </section>
          <div className="bottom-note"><div className="note-icon"><Activity size={16}/></div><span><b>Seu time está em ritmo constante.</b> 4 quests foram concluídas nos últimos 7 dias.</span><button className="text-button" onClick={() => setPage('Relatórios')}>Ver atividade <ArrowRight size={14}/></button></div>
        </>}
        {page === 'Minhas quests' && <>
          <div className="page-title-row"><div><div className="eyebrow">SUAS ENTREGAS</div><h1>Minhas quests</h1><p>Acompanhe tarefas atribuídas a você e aos seus grupos.</p></div><button className="primary-button" onClick={() => setModal(true)}><Plus size={17}/> Nova quest</button></div>
          <div className="toolbar page-toolbar"><div className="search-box"><Search size={15}/><input placeholder="Buscar quest..." value={query} onChange={e => setQuery(e.target.value)} /></div><select value={filter} onChange={e => setFilter(e.target.value)}><option>Todos os grupos</option><option>Marketing</option><option>Operações</option><option>Conteúdo</option></select><button className="filter-button"><Filter size={15}/> Filtros</button></div>
          <div className="quest-list">{filtered.map(q => <QuestRow key={q.id} quest={q} onOpen={() => setDetail(q.id)} onCheck={id => toggleSubquest(q.id, id)} />)}</div>
        </>}
        {page === 'Calendário' && <PlaceholderPage icon={<CalendarDays/>} title="Calendário" description="Veja as próximas ocorrências das quests do seu workspace." action="Nova quest" onAction={() => setModal(true)} />}
        {page === 'Grupos' && <GroupsPage onAdd={() => flash('Convites e gestão de pessoas serão conectados à autenticação.')} />}
        {page === 'Configurações' && <PlaceholderPage icon={<Shield/>} title="Configurações do workspace" description="Identidade, acesso e conexão com o banco compartilhado." action="Ver configuração de acesso" onAction={() => flash('Configure o provedor Google e o banco antes de habilitar o acesso multiusuário.')} />}
        {page === 'Relatórios' && <PlaceholderPage icon={<Activity/>} title="Atividade do time" description="Acompanhe quests concluídas, prazos e participação por grupo." action="Voltar ao início" onAction={() => setPage('Início')} />}
      </div>
    </main>

    {modal && <QuestModal onClose={() => setModal(false)} onCreate={createQuest}/>}
    {current && <QuestDetail quest={current} onClose={() => setDetail(null)} onComplete={() => completeWithoutSubquests(current.id)} onCheck={id => toggleSubquest(current.id, id)} onAddSubquest={(title, assignees) => {
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

function GroupsPage({ onAdd }: { onAdd: () => void }) {
  const groups = [{ title: 'Marketing', sub: 'Campanhas, marca e crescimento', count: 4, quests: 8, color: 'peach', members: ['ana', 'bruno', 'carol', 'luiza'] }, { title: 'Operações', sub: 'Processos e qualidade do time', count: 3, quests: 5, color: 'blue', members: ['carol', 'diego', 'ana'] }, { title: 'Conteúdo', sub: 'Planejamento e produção editorial', count: 3, quests: 3, color: 'purple', members: ['luiza', 'ana', 'bruno'] }];
  return <><div className="page-title-row"><div><div className="eyebrow">PESSOAS E COLABORAÇÃO</div><h1>Grupos</h1><p>Admins podem cuidar de mais de um grupo. Cada grupo organiza suas quests e pessoas.</p></div><button className="primary-button" onClick={onAdd}><Plus size={17}/> Novo grupo</button></div><div className="groups-grid">{groups.map(g => <div className="group-card" key={g.title}><div className={`group-symbol ${g.color}`}><Users size={19}/></div><button className="icon-button group-menu"><MoreHorizontal size={18}/></button><h3>{g.title}</h3><p>{g.sub}</p><div className="group-card-stats"><span><b>{g.count}</b> pessoas</span><span><b>{g.quests}</b> quests abertas</span></div><div className="group-card-bottom"><AvatarStack ids={g.members}/><button onClick={onAdd}>Gerenciar grupo <ArrowRight size={14}/></button></div></div>)}</div></>;
}

function PlaceholderPage({ icon, title, description, action, onAction }: { icon: ReactNode; title: string; description: string; action: string; onAction: () => void }) {
  return <div className="placeholder-page"><div className="placeholder-icon">{icon}</div><div className="eyebrow">STUDIO NORTE</div><h1>{title}</h1><p>{description}</p><button className="secondary-button" onClick={onAction}>{action}<ArrowRight size={15}/></button><div className="placeholder-hint"><Command size={14}/> O protótipo está sendo montado por etapas.</div></div>;
}

function QuestModal({ onClose, onCreate }: { onClose: () => void; onCreate: (form: { title: string; group: string; recurrence: Recurrence; assignees: string[]; description: string; dueDate: string }) => void }) {
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [dueDate, setDueDate] = useState(todayString());
  const [group, setGroup] = useState('Marketing'); const [recurrence, setRecurrence] = useState<Recurrence>('Única'); const [assignees, setAssignees] = useState<string[]>(['ana']);
  return <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div className="modal"><div className="modal-head"><div><div className="eyebrow">NOVA ENTREGA</div><h2>Criar uma quest</h2><p>Defina o objetivo e convide as pessoas certas.</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></div><div className="modal-body"><label className="field-label">Nome da quest<input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex.: Preparar reunião de planejamento"/></label><label className="field-label">Descrição <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="O que precisa ser feito?" rows={3}/></label><div className="field-grid"><label className="field-label">Grupo<select value={group} onChange={e => setGroup(e.target.value)}><option>Marketing</option><option>Operações</option><option>Conteúdo</option></select></label><label className="field-label">Repetição<select value={recurrence} onChange={e => setRecurrence(e.target.value as Recurrence)}><option>Única</option><option>Diária</option><option>Semanal</option><option>Mensal</option></select></label></div><label className="field-label">Primeiro prazo<input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></label><div className="field-label">Pessoas no grupo<div className="people-picker">{people.map(p => <button type="button" key={p.id} className={`person-chip ${assignees.includes(p.id) ? 'selected' : ''}`} onClick={() => setAssignees(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}><Avatar id={p.id}/>{p.name.split(' ')[0]}{assignees.includes(p.id) && <Check size={13}/>}</button>)}</div><small className="field-hint">A quest aparece para o grupo. Você pode atribuir pessoas diferentes em cada subquest.</small></div></div><div className="modal-foot"><button className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={!title.trim() || !assignees.length || !dueDate} onClick={() => onCreate({ title: title.trim(), description: description.trim(), group, recurrence, assignees, dueDate })}><Plus size={16}/> Criar quest</button></div></div></div>;
}

function QuestDetail({ quest, onClose, onComplete, onCheck, onAddSubquest }: { quest: Quest; onClose: () => void; onComplete: () => void; onCheck: (id: string) => void; onAddSubquest: (title: string, assignees: string[]) => void }) {
  const [adding, setAdding] = useState(false); const [title, setTitle] = useState(''); const [assignees, setAssignees] = useState<string[]>(['ana']);
  const done = quest.subtasks.filter(s => s.done).length;
  return <div className="overlay detail-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><aside className="detail-panel"><div className="detail-top"><span className="eyebrow">DETALHE DA QUEST</span><button className="icon-button" onClick={onClose}><X size={19}/></button></div><div className={`detail-banner ${quest.color}`}><span className="group-tag">{quest.group}</span><button className="icon-button"><MoreHorizontal size={18}/></button></div><h2 className="detail-title">{quest.title}</h2><p className="detail-description">{quest.description || 'Sem descrição adicionada.'}</p><div className="detail-info-grid"><div><small>STATUS</small><b><i className="status-dot"/>{quest.status}</b></div><div><small>PRAZO</small><b><CalendarDays size={14}/>{quest.due}</b></div><div><small>RECORRÊNCIA</small><b><Clock3 size={14}/>{quest.recurrence}</b></div></div><div className="detail-section"><div className="detail-section-head"><div><h3>Subquests</h3><p>{done} de {quest.subtasks.length} concluídas · cada item pode ter mais de um responsável</p></div><button className="icon-button" title="Adicionar subquest" onClick={() => setAdding(true)}><Plus size={17}/></button></div><div className="detail-progress"><i style={{ width: `${quest.subtasks.length ? done / quest.subtasks.length * 100 : 0}%` }}/></div><div className="subquest-list">{quest.subtasks.map(s => <div className={`subquest ${s.done ? 'done' : ''}`} key={s.id}><button className="subquest-check" disabled={s.done || quest.status === 'Concluída'} onClick={() => onCheck(s.id)}>{s.done && <Check size={13}/>}</button><span className="subquest-copy"><b>{s.title}</b><small>Atribuída a</small></span><AvatarStack ids={s.assignees}/></div>)}</div>{!quest.subtasks.length && <div className="empty-subquests">Adicione etapas menores para dividir essa entrega.</div>}{adding && <form className="add-subquest-form" onSubmit={e => { e.preventDefault(); if (title.trim() && assignees.length) onAddSubquest(title.trim(), assignees); setTitle(''); setAdding(false); }}><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nome da subquest"/><div className="subquest-assignees">{people.map(person => <button type="button" key={person.id} className={`person-chip ${assignees.includes(person.id) ? 'selected' : ''}`} onClick={() => setAssignees(prev => prev.includes(person.id) ? prev.filter(id => id !== person.id) : [...prev, person.id])}><Avatar id={person.id}/>{person.name.split(' ')[0]}</button>)}</div><div className="add-subquest-actions"><button className="secondary-button" type="button" onClick={() => setAdding(false)}>Cancelar</button><button className="primary-button" type="submit" disabled={!title.trim() || !assignees.length}><Check size={14}/> Adicionar subquest</button></div></form>}</div><div className="detail-section people-section"><h3>Pessoas nesta quest</h3><div className="detail-people">{quest.assignees.map(id => <div key={id}><Avatar id={id}/><span>{people.find(p => p.id === id)?.name}</span></div>)}<button onClick={() => {}}><Plus size={15}/> Adicionar</button></div></div><div className="recurrence-note"><Sparkles size={16}/><span>{quest.recurrence === 'Única' ? 'Quest única: não haverá nova ocorrência.' : `Ao concluir todas as subquests, a próxima ocorrência ${quest.recurrence.toLowerCase()} é criada automaticamente.`}</span></div><div className="detail-footer">{!quest.subtasks.length && quest.status !== 'Concluída' ? <button className="primary-button" onClick={onComplete}><Check size={14}/> Concluir quest</button> : <button className="secondary-button" onClick={onClose}>Fechar</button>}<span><Shield size={14}/> Demonstração: sem conexão ao workspace</span></div></aside></div>;
}

export default App;
