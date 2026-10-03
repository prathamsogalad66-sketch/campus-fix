import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowUpRight, BarChart3, Bell, Building2, CheckCircle2, ChevronDown, CircleHelp, Clock3, FilePlus2, LayoutDashboard, Menu, MessageSquare, MoreHorizontal, Search, ShieldCheck, Users, X } from 'lucide-react'
import './App.css'

function App() {
  const [issues, setIssues] = useState([])
  const [activeFilter, setActiveFilter] = useState('All issues')
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ title: '', description: '', category: 'Facilities', location: '', priority: 'Medium', reporter: '' })

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    fetch(`${apiUrl}/issues`)
      .then((response) => {
        if (!response.ok) throw new Error('The issue service returned an error.')
        return response.json()
      })
      .then((data) => { setIssues(data); setSelectedIssue(data[0] || null) })
      .catch((error) => setNotice(`${error.message} Start the server to load campus issues.`))
  }, [])

  const filters = ['All issues', 'Open', 'In progress', 'Resolved']
  const filteredIssues = useMemo(() => activeFilter === 'All issues' ? issues : issues.filter((issue) => issue.status === activeFilter), [activeFilter, issues])
  const stats = [
    { label: 'Total reports', value: issues.length || 24, change: '+12%', icon: BarChart3, tone: 'blue' },
    { label: 'Open issues', value: issues.filter((issue) => issue.status === 'Open').length || 12, change: 'Needs attention', icon: AlertCircle, tone: 'orange' },
    { label: 'Resolved this month', value: issues.filter((issue) => issue.status === 'Resolved').length || 8, change: '+18%', icon: CheckCircle2, tone: 'green' },
    { label: 'Active contributors', value: 142, change: '+24 new', icon: Users, tone: 'violet' },
  ]

  const createIssue = async (event) => {
    event.preventDefault()
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const response = await fetch(`${apiUrl}/issues`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const created = await response.json()
      if (!response.ok) throw new Error(created.message)
      setIssues((current) => [created, ...current])
      setSelectedIssue(created)
      setShowForm(false)
      setForm({ title: '', description: '', category: 'Facilities', location: '', priority: 'Medium', reporter: '' })
      setNotice('Your report was added to the campus queue.')
    } catch (error) { setNotice(error.message || 'Could not submit the report.') }
  }

  const updateStatus = async (status) => {
    if (!selectedIssue) return
    setIssues((current) => current.map((issue) => issue._id === selectedIssue._id ? { ...issue, status } : issue))
    setSelectedIssue((current) => ({ ...current, status }))
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    await fetch(`${apiUrl}/issues/${selectedIssue._id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }).catch(() => { })
  }

  return (
    <div className="app-shell">
      <aside className={mobileNav ? 'sidebar open' : 'sidebar'}>
        <div className="brand"><span className="brand-mark"><ShieldCheck size={20} /></span><span>campus<span>fix</span></span></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          <button className="nav-item active"><LayoutDashboard size={18} /> Overview</button>
          <button className="nav-item"><MessageSquare size={18} /> My reports <span className="nav-count">3</span></button>
          <button className="nav-item"><BarChart3 size={18} /> Insights</button>
        </nav>
        <div className="workspace-label second">MANAGE</div>
        <nav>
          <button className="nav-item"><Building2 size={18} /> Campus spaces</button>
          <button className="nav-item"><Users size={18} /> Contributors</button>
        </nav>
        <div className="sidebar-bottom"><div className="help-box"><CircleHelp size={18} /><div><strong>Need help?</strong><small>Visit the support center</small></div><ArrowUpRight size={15} /></div><div className="profile"><div className="avatar">AP</div><div><strong>Alex Parker</strong><small>Student account</small></div><MoreHorizontal size={17} /></div></div>
      </aside>
      <main className="main-area">
        <header className="topbar"><button className="menu-button" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle navigation"><Menu size={20} /></button><div className="breadcrumb"><span>Workspace</span><span>/</span><strong>Overview</strong></div><div className="top-actions"><button className="icon-button" aria-label="Search"><Search size={19} /></button><button className="icon-button notification" aria-label="Notifications"><Bell size={19} /><i /></button><div className="top-avatar">AP</div></div></header>
        <div className="content">
          {notice && <div className="notice"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss"><X size={16} /></button></div>}
          <section className="page-heading"><div className="heading-copy"><p className="eyebrow">THURSDAY, SEPTEMBER 10, 2026</p><h1>Good morning, Alex <span>✦</span></h1><p className="subtitle">Keep your campus moving forward, one fix at a time.</p></div><div className="heading-visual"><img src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=700&q=85" alt="University campus building" /><span>Campus, made better</span></div><button className="primary-button" onClick={() => setShowForm(true)}><FilePlus2 size={17} /> Report a problem</button></section>
          <section className="stats-grid">{stats.map(({ label, value, change, icon: Icon, tone }) => <div className="stat-card" key={label}><div className={`stat-icon ${tone}`}><Icon size={19} /></div><div className="stat-copy"><span>{label}</span><strong>{value}</strong><small className={tone === 'orange' ? 'muted' : 'positive'}>{change}</small></div><MoreHorizontal className="stat-more" size={18} /></div>)}</section>
          <section className="dashboard-grid"><div className="issues-panel"><div className="section-head"><div><h2>Campus issues</h2><p>Track and follow up on reported problems.</p></div><button className="filter-button">Last 30 days <ChevronDown size={15} /></button></div><div className="filter-tabs">{filters.map((filter) => <button className={activeFilter === filter ? 'selected' : ''} onClick={() => setActiveFilter(filter)} key={filter}>{filter}{filter === 'All issues' && <span>{issues.length || 24}</span>}</button>)}</div><div className="issue-list">{filteredIssues.map((issue) => <button className={`issue-row ${selectedIssue?._id === issue._id ? 'chosen' : ''}`} key={issue._id} onClick={() => setSelectedIssue(issue)}><div className={`issue-status ${issue.status.toLowerCase().replace(' ', '-')}`} /><div className="issue-summary"><strong>{issue.title}</strong><span><span className="category-dot" />{issue.category} <i>•</i> {issue.location}</span></div><div className={`priority ${issue.priority.toLowerCase()}`}>{issue.priority}</div><div className="issue-votes"><ArrowUpRight size={14} />{issue.votes || 0}</div></button>)}</div><button className="view-all">View all issues <ArrowUpRight size={15} /></button></div><aside className="detail-panel">{selectedIssue ? <><div className="detail-head"><span>ISSUE DETAILS</span><button aria-label="More options"><MoreHorizontal size={18} /></button></div><div className="detail-title"><div className={`large-status ${selectedIssue.status.toLowerCase().replace(' ', '-')}`}><AlertCircle size={19} /></div><div><h2>{selectedIssue.title}</h2><span>Reported by {selectedIssue.reporter}</span></div></div><div className="detail-tags"><span className={`priority ${selectedIssue.priority.toLowerCase()}`}>{selectedIssue.priority} priority</span><span className="detail-date"><Clock3 size={14} /> 2 days ago</span></div><p className="detail-description">{selectedIssue.description}</p><div className="detail-meta"><div><span>LOCATION</span><strong>{selectedIssue.location}</strong></div><div><span>CATEGORY</span><strong>{selectedIssue.category}</strong></div></div><div className="status-control"><span>STATUS</span><select value={selectedIssue.status} onChange={(event) => updateStatus(event.target.value)}><option>Open</option><option>In progress</option><option>Resolved</option></select></div><div className="detail-footer"><div className="mini-avatars"><span>MK</span><span>JL</span><span>+{selectedIssue.votes || 0}</span></div><span>following this issue</span></div></> : <div className="empty-state">Select an issue to see details.</div>}</aside></section>
        </div>
      </main>
      {showForm && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowForm(false)}><form className="report-modal" onSubmit={createIssue}><div className="modal-head"><div><p className="eyebrow">NEW REPORT</p><h2>Help improve campus</h2></div><button type="button" onClick={() => setShowForm(false)} aria-label="Close"><X size={19} /></button></div><label>Problem title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="What needs fixing?" required /></label><label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Add useful details for the campus team..." rows="4" required /></label><div className="form-row"><label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Facilities</option><option>IT support</option><option>Academics</option><option>Safety</option><option>Transport</option></select></label><label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></label></div><label>Location<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Building, room, or area" required /></label><label>Your name <span className="optional">(optional)</span><input value={form.reporter} onChange={(event) => setForm({ ...form, reporter: event.target.value })} placeholder="Anonymous" /></label><button className="primary-button submit" type="submit"><FilePlus2 size={17} /> Submit report</button></form></div>}
    </div>
  )
}

export default App
