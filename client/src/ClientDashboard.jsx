import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertCircle, ArrowDownUp, ArrowRight, ArrowUpRight, BarChart3, Bell, Building2, Check, CheckCircle2, ChevronDown, CircleHelp, Clock3, Eye, EyeOff, FilePlus2, LayoutDashboard, LockKeyhole, LogOut, Mail, Menu, MessageSquare, Search, Trash2, Users, X } from 'lucide-react'
import './ClientDashboard.css'

const apiUrl = import.meta.env.VITE_API_URL || '/api'
const navigation = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Issue register', icon: ArrowDownUp },
    { label: 'My reports', icon: MessageSquare },
    { label: 'Insights', icon: BarChart3 },
    { label: 'Campus spaces', icon: Building2 },
    { label: 'Contributors', icon: Users },
]
const spaceImages = [
    { src: '/sdmcet-campus.jpg', alt: 'Aerial view of SDMCET campus' },
    { src: '/sdmcet-library.jpg', alt: 'SDMCET students in the library' },
    { src: '/sdmcet-mechanical-lab.jpg', alt: 'Student working in an SDMCET engineering lab' },
    { src: '/sdmcet-campus-showcase.png', alt: 'SDMCET campus and student community' },
    { src: '/sdmcet-campus-main.jpg', alt: 'Students and campus life at SDMCET' },
]
const statuses = ['Open', 'In progress', 'Resolved']
const priorityOrder = { High: 0, Medium: 1, Low: 2 }
const initialForm = { title: '', description: '', category: 'Facilities', location: '', priority: 'Medium', reporter: '' }

function readSession() {
    try {
        return JSON.parse(localStorage.getItem('sdmcet-prototype-session') || 'null')
    } catch {
        return null
    }
}

function formatDate(value) {
    if (!value) return 'Not available'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? 'Not available' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function relativeDate(value) {
    if (!value) return 'Date unavailable'
    const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
}

function initials(name = '') {
    return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?'
}

function App() {
    const [user, setUser] = useState(readSession)
    const currentUser = user?.name || ''
    const [issues, setIssues] = useState([])
    const [activePage, setActivePage] = useState('Overview')
    const [activeStatus, setActiveStatus] = useState('All')
    const [dateRange, setDateRange] = useState('all')
    const [selectedId, setSelectedId] = useState(null)
    const [search, setSearch] = useState('')
    const [searchOpen, setSearchOpen] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [mobileNav, setMobileNav] = useState(false)
    const [notice, setNotice] = useState('')
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState(initialForm)

    const signIn = ({ name, email }) => {
        const session = { name: name.trim() || email.split('@')[0].replace(/[._-]+/g, ' '), email }
        localStorage.setItem('sdmcet-prototype-session', JSON.stringify(session))
        setUser(session)
        setForm({ ...initialForm, reporter: session.name })
    }

    const signOut = () => {
        localStorage.removeItem('sdmcet-prototype-session')
        setUser(null)
        setShowProfileMenu(false)
        setActivePage('Overview')
    }

    useEffect(() => {
        const controller = new AbortController()
        fetch(`${apiUrl}/issues`, { signal: controller.signal })
            .then((response) => {
                if (!response.ok) throw new Error('The issue service returned an error.')
                return response.json()
            })
            .then((data) => {
                setIssues(data)
                setSelectedId(data[0]?._id || null)
            })
            .catch((error) => {
                if (error.name !== 'AbortError') setNotice(`${error.message} Start the server to load campus issues.`)
            })
        return () => controller.abort()
    }, [])

    const visibleIssues = useMemo(() => {
        const query = search.trim().toLowerCase()
        const cutoff = dateRange === 'all' ? null : Date.now() - Number(dateRange) * 86400000
        return issues.filter((issue) => {
            const matchesPage = activePage !== 'My reports' || issue.reporter?.toLowerCase() === currentUser.toLowerCase()
            const matchesStatus = activeStatus === 'All' || issue.status === activeStatus
            const created = issue.createdAt ? new Date(issue.createdAt).getTime() : null
            const matchesDate = !cutoff || !created || created >= cutoff
            const matchesSearch = !query || [issue.title, issue.description, issue.category, issue.location, issue.priority, issue.status, issue.reporter, issue._id].some((value) => String(value || '').toLowerCase().includes(query))
            return matchesPage && matchesStatus && matchesDate && matchesSearch
        }).sort((a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    }, [activePage, activeStatus, dateRange, issues, search])

    const selectedIssue = visibleIssues.find((issue) => issue._id === selectedId) || visibleIssues[0] || null
    const contributors = useMemo(() => {
        const people = new Map()
        issues.forEach((issue) => {
            const name = issue.reporter || 'Anonymous'
            const person = people.get(name) || { name, reports: 0, resolved: 0, open: 0, votes: 0 }
            person.reports += 1
            person.resolved += issue.status === 'Resolved' ? 1 : 0
            person.open += issue.status === 'Open' ? 1 : 0
            person.votes += Number(issue.votes || 0)
            people.set(name, person)
        })
        return [...people.values()].sort((a, b) => b.reports - a.reports || a.name.localeCompare(b.name))
    }, [issues])
    const spaces = useMemo(() => {
        const places = new Map()
        issues.forEach((issue) => {
            const name = issue.location || 'Unspecified location'
            const place = places.get(name) || { name, reports: 0, open: 0, high: 0, categories: new Set() }
            place.reports += 1
            place.open += issue.status !== 'Resolved' ? 1 : 0
            place.high += issue.priority === 'High' ? 1 : 0
            place.categories.add(issue.category || 'Other')
            places.set(name, place)
        })
        return [...places.values()].sort((a, b) => b.reports - a.reports || a.name.localeCompare(b.name))
    }, [issues])
    const categories = useMemo(() => {
        const counts = new Map()
        issues.forEach((issue) => counts.set(issue.category || 'Other', (counts.get(issue.category || 'Other') || 0) + 1))
        return [...counts.entries()].sort((a, b) => b[1] - a[1])
    }, [issues])
    const resolvedCount = issues.filter((issue) => issue.status === 'Resolved').length
    const openCount = issues.filter((issue) => issue.status === 'Open').length
    const inProgressCount = issues.filter((issue) => issue.status === 'In progress').length
    const notices = issues.filter((issue) => issue.status === 'Resolved').slice(0, 4)

    const navigate = (page) => {
        setActivePage(page)
        setMobileNav(false)
    }

    const createIssue = async (event) => {
        event.preventDefault()
        setSaving(true)
        try {
            const response = await fetch(`${apiUrl}/issues`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, reporter: currentUser }) })
            const created = await response.json()
            if (!response.ok) throw new Error(created.message || 'Could not submit the report.')
            setIssues((current) => [created, ...current])
            setSelectedId(created._id)
            setShowForm(false)
            setForm({ ...initialForm, reporter: currentUser })
            setActivePage('My reports')
            setActiveStatus('All')
            setNotice('Your report was added to the campus queue.')
        } catch (error) {
            setNotice(error.message || 'Could not submit the report.')
        } finally {
            setSaving(false)
        }
    }

    const updateStatus = async (issue, status) => {
        const previous = issue.status
        setIssues((current) => current.map((item) => item._id === issue._id ? { ...item, status } : item))
        try {
            const response = await fetch(`${apiUrl}/issues/${issue._id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
            if (!response.ok) throw new Error('Status could not be saved. Please try again.')
            const updated = await response.json()
            setIssues((current) => current.map((item) => item._id === issue._id ? { ...item, ...updated } : item))
            setNotice(`Issue marked ${status.toLowerCase()}.`)
        } catch (error) {
            setIssues((current) => current.map((item) => item._id === issue._id ? { ...item, status: previous } : item))
            setNotice(error.message || 'Status could not be saved.')
        }
    }

    const deleteIssue = async (issue) => {
        try {
            const response = await fetch(`${apiUrl}/issues/${issue._id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reporter: currentUser }),
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.message || 'Could not remove the report.')
            setIssues((current) => current.filter((item) => item._id !== issue._id))
            setSelectedId((current) => current === issue._id ? null : current)
            setNotice('Your report was removed.')
        } catch (error) {
            setNotice(error.message || 'Could not remove the report.')
        }
    }

    const stats = [
        { label: 'Total reports', value: issues.length, icon: Activity, note: 'Across campus', tone: 'teal' },
        { label: 'Need attention', value: openCount, icon: AlertCircle, note: 'Open reports', tone: 'coral' },
        { label: 'In progress', value: inProgressCount, icon: Clock3, note: 'Being worked on', tone: 'blue' },
        { label: 'Resolved', value: resolvedCount, icon: CheckCircle2, note: 'Closed reports', tone: 'green' },
    ]

    if (!user) return <LoginScreen onSignIn={signIn} />

    return (
        <div className="app-shell">
            <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
                <a className="brand" href="#overview" onClick={(event) => { event.preventDefault(); navigate('Overview') }}><img src="/sdmcet-crest.jpg" alt="SDMCET crest" /><span className="brand-product-name">SDMCampusFix</span></a>
                <p className="workspace-label">WORKSPACE</p>
                <nav className="side-nav" aria-label="Main navigation">
                    {navigation.slice(0, 4).map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${activePage === label ? 'active' : ''}`} style={{ backgroundColor: activePage === label ? '#303522' : '#14160f' }} onClick={() => navigate(label)}><Icon size={18} />{label}{label === 'My reports' && <span className="nav-count">{issues.filter((issue) => issue.reporter?.toLowerCase() === currentUser.toLowerCase()).length}</span>}</button>)}
                </nav>
                <p className="workspace-label second">MANAGE</p>
                <nav className="side-nav" aria-label="Campus directory">
                    {navigation.slice(4).map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${activePage === label ? 'active' : ''}`} style={{ backgroundColor: activePage === label ? '#303522' : '#14160f' }} onClick={() => navigate(label)}><Icon size={18} />{label}</button>)}
                </nav>
                <div className="sidebar-bottom"><div className="help-box"><CircleHelp size={18} /><div><strong>Need help?</strong><small>Campus support team</small></div><ArrowUpRight size={15} /></div><div className="profile"><div className="avatar">{initials(currentUser)}</div><div><strong>{currentUser}</strong><small>{user.email}</small></div></div></div>
            </aside>

            <main className="main-area">
                <header className="topbar">
                    <button className="menu-button icon-button" onClick={() => setMobileNav((open) => !open)} aria-label="Toggle navigation"><Menu size={20} /></button>
                    <div className="breadcrumb"><span>SDMCET Dharwad</span><span>/</span><strong>{activePage}</strong></div>
                    <div className="top-actions">
                        {searchOpen && <label className="search-field"><Search size={16} /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reports, spaces, people..." /><button onClick={() => { setSearch(''); setSearchOpen(false) }} aria-label="Close search"><X size={15} /></button></label>}
                        <button className={`icon-button ${searchOpen ? 'action-active' : ''}`} onClick={() => setSearchOpen((open) => !open)} aria-label="Search"><Search size={19} /></button>
                        <div className="notification-wrap"><button className="icon-button notification" onClick={() => setShowNotifications((open) => !open)} aria-label="Notifications"><Bell size={19} />{notices.length > 0 && <i />}</button>{showNotifications && <div className="notification-popover"><strong>Recent resolutions</strong>{notices.length ? notices.map((issue) => <button key={issue._id} onClick={() => { setSelectedId(issue._id); navigate('Overview'); setShowNotifications(false) }}><Check size={14} /><span>{issue.title}<small>{relativeDate(issue.updatedAt || issue.createdAt)}</small></span></button>) : <p>No updates yet.</p>}</div>}</div>
                        <div className="profile-menu-wrap"><button className="top-avatar" onClick={() => setShowProfileMenu((open) => !open)} aria-label="Open account menu">{initials(currentUser)}</button>{showProfileMenu && <div className="profile-popover"><div className="profile-popover-user"><span className="avatar">{initials(currentUser)}</span><span><strong>{currentUser}</strong><small>{user.email}</small></span></div><button className="signout-button" onClick={signOut}><LogOut size={16} /> Sign out</button></div>}</div>
                    </div>
                </header>

                <div className="content">
                    {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss"><X size={16} /></button></div>}
                    <section className="page-heading">
                        <div className="heading-copy"><p className="eyebrow">SDMCET DHARWAD / {new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase()}</p><h1>{activePage === 'Overview' ? `Welcome, ${currentUser}` : activePage}</h1><p className="subtitle">{activePage === 'Overview' ? 'A clearer picture of what needs attention across campus.' : pageSubtitle(activePage)}</p></div>
                        <button className="primary-button" onClick={() => setShowForm(true)}><FilePlus2 size={17} /> Report a problem</button>
                    </section>

                    {activePage === 'Overview' && <>
                        <section className="campus-banner" aria-label="Campus today">
                            <img src="/sdmcet-campus.jpg" alt="Aerial view of SDMCET Dharwad campus" />
                            <div className="campus-banner-copy"><span className="banner-kicker">SDMCET / DHARWAD</span><h2>Small fixes. A stronger campus.</h2><p>{openCount} open reports need a little attention today.</p></div>
                            <div className="banner-index"><span>01</span><i>FIELD NOTES</i></div>
                        </section>
                        <section className="stats-grid" aria-label="Campus issue summary">{stats.map(({ label, value, icon: Icon, note, tone }) => <div className="stat-card" key={label}><div className={`stat-icon ${tone}`}><Icon size={19} /></div><div className="stat-copy"><span>{label}</span><strong>{value}</strong><small>{note}</small></div></div>)}</section>
                        <section className="dashboard-grid"><div className="issues-panel"><div className="section-head"><div><h2>Campus issues</h2><p>Choose a report to inspect the full record.</p></div><button className="text-button" onClick={() => navigate('Issue register')}>Full register <ArrowUpRight size={15} /></button></div><StatusFilters active={activeStatus} onChange={setActiveStatus} issues={issues} /><div className="issue-list">{visibleIssues.slice(0, 7).map((issue) => <button className={`issue-row ${selectedId === issue._id ? 'chosen' : ''}`} key={issue._id} onClick={() => setSelectedId(issue._id)}><span className={`issue-status ${statusClass(issue.status)}`} /><span className="issue-summary"><strong>{issue.title}</strong><span>{issue.category} <i>·</i> {issue.location}</span></span><span className={`priority ${String(issue.priority).toLowerCase()}`}>{issue.priority}</span><span className="issue-votes"><ArrowUpRight size={14} />{issue.votes || 0}</span></button>)}{visibleIssues.length === 0 && <EmptyState text="No issues match these filters." />}</div></div><IssueDetails issue={selectedIssue} onStatus={updateStatus} onDelete={deleteIssue} currentUser={currentUser} /></section>
                    </>}

                    {(activePage === 'My reports' || activePage === 'Issue register') && <><div className="toolbar-row"><StatusFilters active={activeStatus} onChange={setActiveStatus} issues={issues.filter((issue) => activePage !== 'My reports' || issue.reporter?.toLowerCase() === currentUser.toLowerCase())} /><label className="select-control">Reported <select value={dateRange} onChange={(event) => setDateRange(event.target.value)}><option value="all">Any time</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select><ChevronDown size={14} /></label></div><IssuesTable issues={visibleIssues} onSelect={setSelectedId} selectedId={selectedId} /><IssueDetails issue={selectedIssue} onStatus={updateStatus} onDelete={deleteIssue} currentUser={currentUser} compact /></>}

                    {activePage === 'Insights' && <><section className="stats-grid insight-stats">{stats.map(({ label, value, icon: Icon, note, tone }) => <div className="stat-card" key={label}><div className={`stat-icon ${tone}`}><Icon size={19} /></div><div className="stat-copy"><span>{label}</span><strong>{value}</strong><small>{note}</small></div></div>)}</section><div className="insights-grid"><section className="data-panel"><div className="section-head"><div><h2>Reports by category</h2><p>Distribution across campus services.</p></div></div>{categories.length ? <div className="bar-list">{categories.map(([category, count], index) => <div className="bar-row" key={category}><div><span>{category}</span><strong>{count}</strong></div><div className="bar-track"><span className={`bar-fill bar-${index % 5}`} style={{ width: `${Math.max(5, count / issues.length * 100)}%` }} /></div></div>)}</div> : <EmptyState text="Category insights appear when reports are submitted." />}</section><section className="data-panel"><div className="section-head"><div><h2>Status overview</h2><p>Progress of all reported issues.</p></div></div><div className="status-breakdown">{statuses.map((status) => { const count = issues.filter((issue) => issue.status === status).length; return <button key={status} onClick={() => { setActiveStatus(status); navigate('Issue register') }}><span className={`issue-status ${statusClass(status)}`} /><span>{status}</span><strong>{count}</strong><small>{issues.length ? Math.round(count / issues.length * 100) : 0}%</small></button> })}</div><div className="resolution-note"><CheckCircle2 size={17} /><span>{issues.length ? `${Math.round(resolvedCount / issues.length * 100)}% of all campus reports are resolved.` : 'Resolution rate will appear when reports are submitted.'}</span></div></section></div></>}

                    {activePage === 'Campus spaces' && <><div className="toolbar-row"><p className="table-caption">{spaces.length} reported {spaces.length === 1 ? 'space' : 'spaces'} · ordered by report volume</p></div><section className="space-grid">{spaces.map((space, index) => <button className="space-card" key={space.name} onClick={() => { setSearch(space.name); navigate('Issue register') }}><span className="space-photo"><img src={spaceImages[index % spaceImages.length].src} alt={spaceImages[index % spaceImages.length].alt} loading="lazy" /><span className="space-photo-count">{space.reports} {space.reports === 1 ? 'report' : 'reports'}</span></span><span className="space-card-content"><strong>{space.name}</strong><span className="space-card-categories">{[...space.categories].join(' · ')}</span><span className="space-card-foot"><span>{space.open} unresolved</span><span>{space.high} high priority <ArrowUpRight size={14} /></span></span></span></button>)}{spaces.length === 0 && <EmptyState text="No campus spaces have reports yet." />}</section></>}

                    {activePage === 'Contributors' && <><div className="toolbar-row"><p className="table-caption">{contributors.length} {contributors.length === 1 ? 'contributor' : 'contributors'} · community members reporting campus issues</p></div><section className="data-panel table-panel"><div className="table-scroll"><table><thead><tr><th>Contributor</th><th>Total reports</th><th>Open</th><th>Resolved</th><th>Community votes</th></tr></thead><tbody>{contributors.map((person) => <tr key={person.name}><td><strong className="person-name"><span className="person-avatar">{initials(person.name)}</span>{person.name}</strong></td><td>{person.reports}</td><td>{person.open}</td><td><span className="number-good">{person.resolved}</span></td><td>{person.votes}</td></tr>)}</tbody></table>{contributors.length === 0 && <EmptyState text="Contributors appear after the first report." />}</div></section></>}
                </div>
            </main>

            {showForm && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowForm(false)}><form className="report-modal" onSubmit={createIssue}><div className="modal-head"><div><p className="eyebrow">NEW REPORT</p><h2>Help improve campus</h2></div><button type="button" onClick={() => setShowForm(false)} aria-label="Close"><X size={19} /></button></div><label>Problem title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="What needs fixing?" required /></label><label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Add useful details for the campus team..." rows="4" required /></label><div className="form-row"><label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Facilities</option><option>IT support</option><option>Academics</option><option>Safety</option><option>Transport</option></select></label><label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></label></div><label>Location<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Building, room, or area" required /></label><label>Your name<input value={form.reporter} onChange={(event) => setForm({ ...form, reporter: event.target.value })} placeholder="Your name" required /></label><button className="primary-button submit" type="submit" disabled={saving}>{saving ? 'Submitting...' : <><FilePlus2 size={17} /> Submit report</>}</button></form></div>}
        </div>
    )
}

function LoginScreen({ onSignIn }) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const submit = (event) => {
        event.preventDefault()
        onSignIn({ name, email })
    }

    return (
        <main className="login-shell">
            <section className="login-showcase">
                <header className="login-brand-row"><div className="login-brand-lockup"><img src="/sdmcet-crest.jpg" alt="SDMCET crest" /><span className="login-brand-name">SDMCampusFix</span></div><span>STUDENT CAMPUS SERVICES</span></header>
                <div className="login-story"><p className="login-kicker">SDMCET / DHARWAD</p><h1>A campus that<br />works better for everyone.</h1><p>Report, track, and resolve the things that make campus life better.</p></div>
                <div className="login-photo-grid" aria-label="Life at SDMCET Dharwad">
                    <img className="login-photo-campus" src="/sdmcet-campus.jpg" alt="Aerial view of the SDMCET campus" />
                    <img className="login-photo-lab" src="/sdmcet-mechanical-lab.jpg" alt="Student working in an engineering workshop" />
                    <img className="login-photo-library" src="/sdmcet-library.jpg" alt="Students reading in the campus library" />
                    <img className="login-photo-community" src="/sdmcet-gallery-4.jpg" alt="SDMCET student community" />
                </div>
                <footer className="login-footnote"><span>EST. 1979</span><span>KALAGHATAGI ROAD, DHARWAD</span></footer>
            </section>
            <section className="login-panel">
                <div className="login-panel-top"><span className="prototype-badge">PROTOTYPE ACCESS</span></div>
                <div className="login-card">
                    <p className="login-kicker">CAMPUS COMMUNITY</p>
                    <h2>Sign in</h2>
                    <p className="login-intro">Continue to the SDMCET campus service desk.</p>
                    <form className="login-form" onSubmit={submit}>
                        <label>Your name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Ananya Rao" required /></label>
                        <label>Campus email<span className="login-input"><Mail size={17} /><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@sdmcet.ac.in" required /></span></label>
                        <label>Password<span className="login-input"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>
                        <p className="prototype-note">Prototype sign-in: credentials are not verified or stored. Use any email and password to preview.</p>
                        <button className="login-submit" type="submit">Continue to dashboard <ArrowRight size={17} /></button>
                    </form>
                    <p className="login-support">Need access? Contact the SDMCET campus support team.</p>
                </div>
                <div className="login-legal">SDMCampusFix <span>·</span> SDMCET DHARWAD</div>
            </section>
        </main>
    )
}

function pageSubtitle(page) {
    return ({ 'Issue register': 'Browse every reported issue and all of its details.', 'My reports': 'Every report you have shared with the campus team.', Insights: 'Understand issue volume, category mix, and resolution progress.', 'Campus spaces': 'See where campus reports are being raised.', Contributors: 'Recognize the people helping improve campus.' })[page]
}

function statusClass(status = '') {
    return status.toLowerCase().replace(' ', '-')
}

function StatusFilters({ active, onChange, issues }) {
    const filters = ['All', ...statuses]
    return <div className="filter-tabs" role="tablist" aria-label="Filter issues by status">{filters.map((filter) => <button role="tab" aria-selected={active === filter} className={active === filter ? 'selected' : ''} onClick={() => onChange(filter)} key={filter}>{filter}<span>{filter === 'All' ? issues.length : issues.filter((issue) => issue.status === filter).length}</span></button>)}</div>
}

function IssuesTable({ issues, onSelect, selectedId }) {
    return <section className="data-panel table-panel"><div className="table-scroll"><table className="issue-table"><thead><tr><th>Issue</th><th>Description</th><th>Category</th><th>Location</th><th>Priority</th><th>Status</th><th>Reporter</th><th>Votes</th><th>Created</th><th>Updated</th><th>Record ID</th></tr></thead><tbody>{issues.map((issue) => <tr key={issue._id} className={selectedId === issue._id ? 'row-selected' : ''} onClick={() => onSelect(issue._id)}><td><strong>{issue.title}</strong></td><td className="description-cell">{issue.description}</td><td>{issue.category}</td><td>{issue.location}</td><td><span className={`priority ${String(issue.priority).toLowerCase()}`}>{issue.priority}</span></td><td><span className={`status-pill ${statusClass(issue.status)}`}>{issue.status}</span></td><td>{issue.reporter || 'Anonymous'}</td><td>{issue.votes || 0}</td><td>{formatDate(issue.createdAt)}</td><td>{formatDate(issue.updatedAt)}</td><td className="id-cell">{issue._id}</td></tr>)}</tbody></table>{issues.length === 0 && <EmptyState text="No reports found. Try another filter or submit a new report." />}</div></section>
}

function IssueDetails({ issue, onStatus, onDelete, currentUser, compact = false }) {
    const [pendingDeleteId, setPendingDeleteId] = useState(null)
    if (!issue) return <section className={`detail-panel ${compact ? 'compact' : ''}`}><EmptyState text="Select an issue to see every detail." /></section>
    const canDelete = issue.reporter?.trim().toLowerCase() === currentUser?.trim().toLowerCase()
    const confirmDelete = pendingDeleteId === issue._id
    return <aside className={`detail-panel ${compact ? 'compact' : ''}`}><div className="detail-head"><span>ISSUE DETAILS</span><span className={`status-pill ${statusClass(issue.status)}`}>{issue.status}</span></div><div className="detail-title"><div className={`large-status ${statusClass(issue.status)}`}><AlertCircle size={19} /></div><div><h2>{issue.title}</h2><span>Reported by {issue.reporter || 'Anonymous'}</span></div></div><div className="detail-tags"><span className={`priority ${String(issue.priority).toLowerCase()}`}>{issue.priority} priority</span><span className="detail-date"><Clock3 size={14} />{relativeDate(issue.createdAt)}</span></div><p className="detail-description">{issue.description}</p><dl className="detail-meta"><div><dt>LOCATION</dt><dd>{issue.location}</dd></div><div><dt>CATEGORY</dt><dd>{issue.category}</dd></div><div><dt>VOTES</dt><dd>{issue.votes || 0}</dd></div><div><dt>RECORD ID</dt><dd className="id-cell">{issue._id}</dd></div><div><dt>CREATED</dt><dd>{formatDate(issue.createdAt)}</dd></div><div><dt>LAST UPDATED</dt><dd>{formatDate(issue.updatedAt)}</dd></div></dl><label className="status-control"><span>UPDATE STATUS</span><select value={issue.status} onChange={(event) => onStatus(issue, event.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>{canDelete && (confirmDelete ? <div className="delete-confirm" role="alertdialog" aria-label="Confirm report removal"><strong>Remove this report?</strong><p>This cannot be undone.</p><div><button type="button" onClick={() => setPendingDeleteId(null)}>Keep report</button><button type="button" className="confirm-remove" onClick={() => { setPendingDeleteId(null); onDelete(issue) }}>Remove report</button></div></div> : <button type="button" className="delete-report-button" onClick={() => setPendingDeleteId(issue._id)}><Trash2 size={15} /> Remove my report</button>)}</aside>
}

function EmptyState({ text }) {
    return <div className="empty-state"><span><ArrowDownUp size={18} /></span><p>{text}</p></div>
}

export default App
