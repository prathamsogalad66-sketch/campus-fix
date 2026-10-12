import { useEffect, useMemo, useState } from 'react'
import {
    Activity,
    AlertCircle,
    ArrowDownUp,
    ArrowRight,
    ArrowUpRight,
    Bell,
    BookOpen,
    Building,
    Building2,
    Check,
    CheckCircle2,
    ChevronDown,
    CircleHelp,
    Clock3,
    Droplets,
    Eye,
    EyeOff,
    FilePlus2,
    HardHat,
    KeyRound,
    LayoutDashboard,
    Lock,
    LockKeyhole,
    LogOut,
    Mail,
    Menu,
    MessageSquare,
    Phone,
    RefreshCw,
    Search,
    Shield,
    ShieldAlert,
    Sparkles,
    Trash2,
    Truck,
    UserCheck,
    Users,
    Wrench,
    X,
    Zap,
} from 'lucide-react'
import './ClientDashboard.css'

const apiUrl = import.meta.env.VITE_API_URL || '/api'

// Master passcodes for admin access (only known to the administrator)
const MASTER_ADMIN_PASSCODES = ['sdm@admin2026', 'admin123', 'admin@sdmcet']

function checkAdminToken() {
    try {
        return localStorage.getItem('sdmcet-admin-token') === 'verified-admin-token'
    } catch {
        return false
    }
}

const CAMPUS_WORKERS = [
    { name: 'Ramesh Kumar', trade: 'Electrician', phone: '+91 98451 23401', icon: Zap },
    { name: 'Suresh Patil', trade: 'Plumber', phone: '+91 98452 34512', icon: Droplets },
    { name: 'Anand Deshpande', trade: 'IT & Network Tech', phone: '+91 98453 45623', icon: Activity },
    { name: 'Kumar Naik', trade: 'Carpenter & Furniture', phone: '+91 98454 56734', icon: Wrench },
    { name: 'Sunita Hiremath', trade: 'Housekeeping & Sanitation', phone: '+91 98455 67845', icon: Sparkles },
    { name: 'Prakash Joshi', trade: 'Civil & Maintenance', phone: '+91 98456 78956', icon: Building },
]

const CATEGORIES = [
    { name: 'Facilities', icon: Building2 },
    { name: 'Electrical', icon: Zap },
    { name: 'Plumbing', icon: Droplets },
    { name: 'IT support', icon: Activity },
    { name: 'Sanitation', icon: Sparkles },
    { name: 'Safety', icon: Shield },
    { name: 'Academics', icon: BookOpen },
    { name: 'Transport', icon: Truck },
    { name: 'Furniture', icon: Wrench },
]

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
const STATUSES = ['Open', 'In progress', 'Resolved']
const priorityOrder = { Urgent: 0, High: 1, Medium: 2, Low: 3 }

const studentNavigation = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'My reports', icon: MessageSquare },
    { label: 'Report a problem', icon: FilePlus2 },
    { label: 'Campus guidelines', icon: CircleHelp },
]

const adminNavigation = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'All issues register', icon: ArrowDownUp },
    { label: 'Worker dispatch', icon: HardHat },
    { label: 'Campus spaces', icon: Building2 },
    { label: 'Student directory', icon: Users },
]

const spaceImages = [
    { src: '/sdmcet-campus.jpg', alt: 'Aerial view of SDMCET campus' },
    { src: '/sdmcet-library.jpg', alt: 'SDMCET students in the library' },
    { src: '/sdmcet-mechanical-lab.jpg', alt: 'Student working in an SDMCET engineering lab' },
    { src: '/sdmcet-campus-showcase.png', alt: 'SDMCET campus and student community' },
    { src: '/sdmcet-campus-main.jpg', alt: 'Students and campus life at SDMCET' },
]

const initialForm = {
    title: '',
    description: '',
    category: 'Facilities',
    location: '',
    priority: 'Medium',
    reporter: '',
    reporterEmail: '',
}

function readSession() {
    try {
        const stored = JSON.parse(localStorage.getItem('sdmcet-prototype-session') || 'null')
        if (stored) {
            // Guard: If stored role is admin but admin token is missing, downgrade to student
            const isAuthorized = checkAdminToken()
            return {
                ...stored,
                role: stored.role === 'admin' && !isAuthorized ? 'student' : stored.role || 'student',
            }
        }
        return null
    } catch {
        return null
    }
}

function formatDate(value) {
    if (!value) return 'Not available'
    const date = new Date(value)
    return Number.isNaN(date.getTime())
        ? 'Not available'
        : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function relativeDate(value) {
    if (!value) return 'Date unavailable'
    const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
}

function initials(name = '') {
    return (
        name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase() || '?'
    )
}

function statusClass(status = '') {
    return status.toLowerCase().replace(' ', '-')
}

function App() {
    const [user, setUser] = useState(readSession)
    const [isAdminAuthorized, setIsAdminAuthorized] = useState(checkAdminToken)
    const [showAdminUnlockModal, setShowAdminUnlockModal] = useState(false)
    const [adminPasscode, setAdminPasscode] = useState('')
    const [adminPasscodeError, setAdminPasscodeError] = useState('')

    const [issues, setIssues] = useState([])
    const [activePage, setActivePage] = useState('Overview')
    const [activeStatus, setActiveStatus] = useState('All')
    const [activePriority, setActivePriority] = useState('All')
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

    // Admin edit state
    const [adminForm, setAdminForm] = useState({
        priority: 'Medium',
        assignedWorker: 'Unassigned',
        status: 'Open',
        adminNotes: '',
    })

    const isStudent = user?.role === 'student'
    const isAdmin = user?.role === 'admin'
    const currentUser = user?.name || ''
    const currentEmail = user?.email || ''

    // Check URL parameters for direct admin entrance
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const adminQuery = params.get('admin') || params.get('portal') || params.get('key')
        if (adminQuery) {
            if (MASTER_ADMIN_PASSCODES.includes(adminQuery)) {
                // Direct verified unlock via secret URL parameter
                localStorage.setItem('sdmcet-admin-token', 'verified-admin-token')
                setIsAdminAuthorized(true)
                const adminSession = {
                    name: 'Campus Facility Head',
                    email: 'admin@sdmcet.ac.in',
                    role: 'admin',
                }
                localStorage.setItem('sdmcet-prototype-session', JSON.stringify(adminSession))
                setUser(adminSession)
                setNotice('Admin credentials verified. Welcome to Admin Control Centre.')
            } else if (adminQuery === 'true' || adminQuery === 'admin') {
                setShowAdminUnlockModal(true)
            }
        }
    }, [])

    // Sign in handler (Public students)
    const signIn = ({ name, email }) => {
        const session = {
            name: name.trim() || email.split('@')[0].replace(/[._-]+/g, ' '),
            email: email.trim().toLowerCase(),
            role: 'student',
        }
        localStorage.setItem('sdmcet-prototype-session', JSON.stringify(session))
        setUser(session)
        setActivePage('Overview')
        setSelectedId(null)
        setForm({ ...initialForm, reporter: session.name, reporterEmail: session.email })
    }

    // Admin unlock verification
    const handleAdminUnlock = (e) => {
        if (e) e.preventDefault()
        if (MASTER_ADMIN_PASSCODES.includes(adminPasscode.trim())) {
            localStorage.setItem('sdmcet-admin-token', 'verified-admin-token')
            setIsAdminAuthorized(true)
            setShowAdminUnlockModal(false)
            setAdminPasscode('')
            setAdminPasscodeError('')

            const adminSession = {
                name: 'Campus Facility Head',
                email: 'admin@sdmcet.ac.in',
                role: 'admin',
            }
            localStorage.setItem('sdmcet-prototype-session', JSON.stringify(adminSession))
            setUser(adminSession)
            setActivePage('Overview')
            setSelectedId(null)
            setNotice('Admin access granted. Welcome to Admin Control Centre.')
        } else {
            setAdminPasscodeError('Invalid Admin Passcode. Access denied.')
        }
    }

    // Role switcher (ONLY AVAILABLE TO AUTHORIZED ADMIN)
    const switchRole = () => {
        if (!isAdminAuthorized) {
            setNotice('Restricted: Admin authorization required.')
            setShowAdminUnlockModal(true)
            return
        }
        const nextRole = isStudent ? 'admin' : 'student'
        const nextName = nextRole === 'admin' ? 'Campus Facility Head' : 'suprita'
        const nextEmail = nextRole === 'admin' ? 'admin@sdmcet.ac.in' : 'suprita@gmail.com'
        const nextSession = { name: nextName, email: nextEmail, role: nextRole }
        localStorage.setItem('sdmcet-prototype-session', JSON.stringify(nextSession))
        setUser(nextSession)
        setActivePage('Overview')
        setSelectedId(null)
        setNotice(`Switched to ${nextRole === 'admin' ? 'Admin Portal' : 'Student Portal'} view.`)
    }

    const signOut = () => {
        localStorage.removeItem('sdmcet-prototype-session')
        localStorage.removeItem('sdmcet-admin-token')
        setUser(null)
        setIsAdminAuthorized(false)
        setShowProfileMenu(false)
        setActivePage('Overview')
    }

    const fetchIssues = () => {
        fetch(`${apiUrl}/issues`)
            .then((res) => {
                if (!res.ok) throw new Error('Could not load campus issues.')
                return res.json()
            })
            .then((data) => {
                setIssues(data)
                if (data.length > 0 && !selectedId) {
                    setSelectedId(data[0]._id)
                }
            })
            .catch((err) => {
                setNotice(`${err.message} Server may be offline.`)
            })
    }

    useEffect(() => {
        fetchIssues()
    }, [])

    // STRICT USER PRIVACY FILTER:
    // Students only ever see reports they submitted themselves.
    // Admin sees every report across the entire campus.
    const roleScopedIssues = useMemo(() => {
        if (!user) return []
        if (isStudent) {
            return issues.filter((issue) => {
                const matchesEmail = issue.reporterEmail && currentEmail && issue.reporterEmail.toLowerCase() === currentEmail.toLowerCase()
                const matchesName = issue.reporter && currentUser && issue.reporter.toLowerCase() === currentUser.toLowerCase()
                return matchesEmail || matchesName
            })
        }
        return issues
    }, [issues, user, isStudent, currentEmail, currentUser])

    // Filtered issues based on search, status & priority
    const visibleIssues = useMemo(() => {
        const query = search.trim().toLowerCase()
        return roleScopedIssues
            .filter((issue) => {
                const matchesStatus = activeStatus === 'All' || issue.status === activeStatus
                const matchesPriority = activePriority === 'All' || issue.priority === activePriority
                const matchesSearch =
                    !query ||
                    [
                        issue.title,
                        issue.description,
                        issue.category,
                        issue.location,
                        issue.priority,
                        issue.status,
                        issue.reporter,
                        issue.reporterEmail,
                        issue.assignedWorker,
                    ].some((val) => String(val || '').toLowerCase().includes(query))

                return matchesStatus && matchesPriority && matchesSearch
            })
            .sort(
                (a, b) =>
                    (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4) ||
                    new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
            )
    }, [roleScopedIssues, activeStatus, activePriority, search])

    const selectedIssue =
        visibleIssues.find((issue) => issue._id === selectedId) ||
        roleScopedIssues.find((issue) => issue._id === selectedId) ||
        visibleIssues[0] ||
        roleScopedIssues[0] ||
        null

    useEffect(() => {
        if (selectedIssue) {
            setAdminForm({
                priority: selectedIssue.priority || 'Medium',
                assignedWorker: selectedIssue.assignedWorker || 'Unassigned',
                status: selectedIssue.status || 'Open',
                adminNotes: selectedIssue.adminNotes || '',
            })
        }
    }, [selectedIssue?._id])

    // Submit new problem
    const createIssue = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const payload = {
                ...form,
                reporter: currentUser,
                reporterEmail: currentEmail,
            }
            const res = await fetch(`${apiUrl}/issues`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const created = await res.json()
            if (!res.ok) throw new Error(created.message || 'Could not submit report.')

            setIssues((curr) => [created, ...curr])
            setSelectedId(created._id)
            setShowForm(false)
            setForm(initialForm)
            setActivePage('My reports')
            setActiveStatus('All')
            setNotice('Your problem has been registered! Admin will review and assign a technician.')
        } catch (error) {
            setNotice(error.message || 'Failed to submit the issue.')
        } finally {
            setSaving(false)
        }
    }

    // Admin save updates
    const saveAdminAssignment = async (e) => {
        if (e) e.preventDefault()
        if (!selectedIssue) return
        setSaving(true)
        try {
            const res = await fetch(`${apiUrl}/issues/${selectedIssue._id}/assign`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(adminForm),
            })
            const updated = await res.json()
            if (!res.ok) throw new Error(updated.message || 'Failed to update work assignment.')

            setIssues((curr) => curr.map((item) => (item._id === selectedIssue._id ? { ...item, ...updated } : item)))
            setNotice(`Work updated: Priority set to ${adminForm.priority}, assigned to ${adminForm.assignedWorker}.`)
        } catch (error) {
            setNotice(error.message || 'Could not save assignment.')
        } finally {
            setSaving(false)
        }
    }

    // Delete issue
    const deleteIssue = async (issue) => {
        try {
            const res = await fetch(`${apiUrl}/issues/${issue._id}`, {
                method: 'DELETE',
            })
            if (!res.ok) throw new Error('Could not delete report.')

            setIssues((curr) => curr.filter((item) => item._id !== issue._id))
            setSelectedId(null)
            setNotice('Report has been deleted.')
        } catch (error) {
            setNotice(error.message || 'Failed to delete report.')
        }
    }

    // Stats
    const totalCount = roleScopedIssues.length
    const openCount = roleScopedIssues.filter((i) => i.status === 'Open').length
    const inProgressCount = roleScopedIssues.filter((i) => i.status === 'In progress').length
    const resolvedCount = roleScopedIssues.filter((i) => i.status === 'Resolved').length

    // Worker workload
    const workersWithTasks = useMemo(() => {
        return CAMPUS_WORKERS.map((worker) => {
            const active = issues.filter(
                (i) => i.assignedWorker?.includes(worker.name) && i.status !== 'Resolved'
            ).length
            const completed = issues.filter(
                (i) => i.assignedWorker?.includes(worker.name) && i.status === 'Resolved'
            ).length
            return { ...worker, activeTasks: active, completedTasks: completed }
        })
    }, [issues])

    const spaces = useMemo(() => {
        const places = new Map()
        issues.forEach((issue) => {
            const name = issue.location || 'Unspecified location'
            const place = places.get(name) || { name, reports: 0, open: 0, high: 0, categories: new Set() }
            place.reports += 1
            place.open += issue.status !== 'Resolved' ? 1 : 0
            place.high += issue.priority === 'High' || issue.priority === 'Urgent' ? 1 : 0
            place.categories.add(issue.category || 'Other')
            places.set(name, place)
        })
        return [...places.values()].sort((a, b) => b.reports - a.reports)
    }, [issues])

    const contributors = useMemo(() => {
        const people = new Map()
        issues.forEach((issue) => {
            const name = issue.reporter || 'Anonymous'
            const person = people.get(name) || {
                name,
                email: issue.reporterEmail || 'Not provided',
                reports: 0,
                resolved: 0,
                open: 0,
            }
            person.reports += 1
            person.resolved += issue.status === 'Resolved' ? 1 : 0
            person.open += issue.status === 'Open' ? 1 : 0
            people.set(name, person)
        })
        return [...people.values()].sort((a, b) => b.reports - a.reports)
    }, [issues])

    const navigate = (page) => {
        if (page === 'Report a problem') {
            setShowForm(true)
            return
        }
        setActivePage(page)
        setMobileNav(false)
    }

    if (!user) {
        return (
            <>
                <LoginScreen
                    onSignIn={signIn}
                    onOpenAdminModal={() => {
                        setAdminPasscodeError('')
                        setShowAdminUnlockModal(true)
                    }}
                />
                {showAdminUnlockModal && (
                    <AdminPasscodeModal
                        passcode={adminPasscode}
                        setPasscode={setAdminPasscode}
                        error={adminPasscodeError}
                        onSubmit={handleAdminUnlock}
                        onClose={() => {
                            setShowAdminUnlockModal(false)
                            setAdminPasscodeError('')
                        }}
                    />
                )}
            </>
        )
    }

    const currentNav = isStudent ? studentNavigation : adminNavigation

    return (
        <div className="app-shell">
            {/* ===================== SIDEBAR ===================== */}
            <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
                <a
                    className="brand"
                    href="#overview"
                    onClick={(e) => {
                        e.preventDefault()
                        navigate('Overview')
                    }}
                >
                    <img src="/sdmcet-crest.jpg" alt="SDMCET crest" />
                    <div>
                        <span className="brand-product-name">SDMCampusFix</span>
                        <div style={{ marginTop: '4px' }}>
                            <span className={`role-badge ${user.role}`}>
                                {isStudent ? 'Student Portal' : 'Admin Centre'}
                            </span>
                        </div>
                    </div>
                </a>

                <p className="workspace-label">
                    {isStudent ? 'STUDENT WORKSPACE' : 'ADMINISTRATION'}
                </p>

                <nav className="side-nav" aria-label="Main navigation">
                    {currentNav.map(({ label, icon: Icon }) => (
                        <button
                            key={label}
                            className={`nav-item ${activePage === label ? 'active' : ''}`}
                            style={{ backgroundColor: activePage === label ? '#303522' : '#14160f' }}
                            onClick={() => navigate(label)}
                        >
                            <Icon size={18} />
                            {label}
                            {label === 'My reports' && isStudent && (
                                <span className="nav-count">{roleScopedIssues.length}</span>
                            )}
                            {label === 'All issues register' && isAdmin && (
                                <span className="nav-count">{issues.length}</span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-bottom">
                    <div className="help-box">
                        <CircleHelp size={18} />
                        <div>
                            <strong>{isStudent ? 'Campus Helpdesk' : 'Estates Office'}</strong>
                            <small>{isStudent ? 'Facility & Maintenance' : 'Admin Hotline: Ext 204'}</small>
                        </div>
                        <ArrowUpRight size={15} />
                    </div>

                    <div className="profile">
                        <div className="avatar">{initials(currentUser)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {currentUser}
                            </strong>
                            <small style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user.email}
                            </small>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ===================== MAIN AREA ===================== */}
            <main className="main-area">
                {/* Modern Topbar */}
                <header className="topbar">
                    <button
                        className="menu-button icon-button"
                        onClick={() => setMobileNav((open) => !open)}
                        aria-label="Toggle navigation"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="breadcrumb">
                        <span>SDMCET Dharwad</span>
                        <span>/</span>
                        <strong className={`role-badge ${user.role}`} style={{ marginRight: '6px' }}>
                            {isStudent ? 'Student' : 'Admin'}
                        </strong>
                        <span>/</span>
                        <strong>{activePage}</strong>
                    </div>

                    <div className="top-actions">
                        {/* ROLE SWITCHER: ONLY VISIBLE IF USER HAS ADMIN AUTHORIZATION */}
                        {isAdminAuthorized && (
                            <button
                                className="role-switcher-btn"
                                onClick={switchRole}
                                title={isStudent ? 'Return to Admin Centre' : 'Preview Student View'}
                            >
                                {isStudent ? (
                                    <>
                                        <Shield size={14} style={{ color: '#efc15e' }} />
                                        <span>Return to Admin Centre</span>
                                    </>
                                ) : (
                                    <>
                                        <UserCheck size={14} style={{ color: '#79d799' }} />
                                        <span>Preview Student View</span>
                                    </>
                                )}
                            </button>
                        )}

                        {/* Search toggle */}
                        {searchOpen && (
                            <label className="search-field">
                                <Search size={16} />
                                <input
                                    autoFocus
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={
                                        isStudent
                                            ? 'Search your reports...'
                                            : 'Search all campus reports, students, workers...'
                                    }
                                />
                                <button
                                    onClick={() => {
                                        setSearch('')
                                        setSearchOpen(false)
                                    }}
                                    aria-label="Close search"
                                >
                                    <X size={15} />
                                </button>
                            </label>
                        )}
                        <button
                            className={`icon-button ${searchOpen ? 'action-active' : ''}`}
                            onClick={() => setSearchOpen((open) => !open)}
                            aria-label="Search"
                        >
                            <Search size={19} />
                        </button>

                        {/* Notifications */}
                        <div className="notification-wrap">
                            <button
                                className="icon-button notification"
                                onClick={() => setShowNotifications((o) => !o)}
                                aria-label="Notifications"
                            >
                                <Bell size={19} />
                                {resolvedCount > 0 && <i />}
                            </button>
                            {showNotifications && (
                                <div className="notification-popover">
                                    <strong>{isStudent ? 'Your Resolved Issues' : 'Campus Resolved Reports'}</strong>
                                    {roleScopedIssues.filter((i) => i.status === 'Resolved').length ? (
                                        roleScopedIssues
                                            .filter((i) => i.status === 'Resolved')
                                            .slice(0, 4)
                                            .map((issue) => (
                                                <button
                                                    key={issue._id}
                                                    onClick={() => {
                                                        setSelectedId(issue._id)
                                                        setShowNotifications(false)
                                                    }}
                                                >
                                                    <Check size={14} />
                                                    <span>
                                                        {issue.title}
                                                        <small>{relativeDate(issue.updatedAt || issue.createdAt)}</small>
                                                    </span>
                                                </button>
                                            ))
                                    ) : (
                                        <p>No resolutions yet.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Profile menu */}
                        <div className="profile-menu-wrap">
                            <button
                                className="top-avatar"
                                onClick={() => setShowProfileMenu((o) => !o)}
                                aria-label="Account menu"
                            >
                                {initials(currentUser)}
                            </button>
                            {showProfileMenu && (
                                <div className="profile-popover">
                                    <div className="profile-popover-user">
                                        <span className="avatar">{initials(currentUser)}</span>
                                        <span>
                                            <strong>{currentUser}</strong>
                                            <small>{user.email}</small>
                                            <span
                                                className={`role-badge ${user.role}`}
                                                style={{ display: 'inline-block', marginTop: '4px' }}
                                            >
                                                {isStudent ? 'Student Account' : 'Admin / Estates Officer'}
                                            </span>
                                        </span>
                                    </div>
                                    <button className="signout-button" onClick={signOut}>
                                        <LogOut size={16} /> Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="content">
                    {notice && (
                        <div className="notice" role="status">
                            <span>{notice}</span>
                            <button onClick={() => setNotice('')} aria-label="Dismiss">
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Page Heading */}
                    <section className="page-heading">
                        <div className="heading-copy">
                            <p className="eyebrow">
                                SDMCET DHARWAD /{' '}
                                {new Intl.DateTimeFormat('en', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                })
                                    .format(new Date())
                                    .toUpperCase()}
                            </p>
                            <h1>
                                {isStudent
                                    ? activePage === 'Overview'
                                        ? `Welcome, ${currentUser}`
                                        : activePage
                                    : activePage === 'Overview'
                                        ? `Admin Control Centre`
                                        : activePage}
                            </h1>
                            <p className="subtitle">
                                {isStudent
                                    ? activePage === 'Overview'
                                        ? 'Address campus issues you face and track technician progress in real-time.'
                                        : 'Track only your submitted issues. College-wide admin logs are protected.'
                                    : activePage === 'Overview'
                                        ? 'Review all campus complaints, assign priority, and allocate tasks to maintenance workers.'
                                        : 'Campus maintenance directory and issue allocation control.'}
                            </p>
                        </div>

                        {/* Primary Action Button */}
                        {isStudent ? (
                            <button className="primary-button" onClick={() => setShowForm(true)}>
                                <FilePlus2 size={17} /> Report a problem
                            </button>
                        ) : (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="role-switcher-btn" onClick={fetchIssues} title="Refresh data">
                                    <RefreshCw size={14} /> Refresh reports
                                </button>
                                <button className="primary-button" onClick={() => setShowForm(true)}>
                                    <FilePlus2 size={17} /> Log issue
                                </button>
                            </div>
                        )}
                    </section>

                    {/* STUDENT PRIVACY NOTICE */}
                    {isStudent && (
                        <div className="student-privacy-card">
                            <Shield size={20} style={{ color: '#4ade80', flexShrink: 0 }} />
                            <div>
                                <strong>Student Privacy Protected:</strong> You are viewing only the issues you have reported. The campus administrator assigns priority and dispatches workers to solve them.
                            </div>
                        </div>
                    )}

                    {/* ADMIN BADGE NOTICE */}
                    {isAdmin && (
                        <div
                            className="student-privacy-card"
                            style={{ background: '#251c14', borderColor: '#5c4323', color: '#fcd34d' }}
                        >
                            <ShieldAlert size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />
                            <div>
                                <strong>Admin Privileges Active:</strong> You have full visibility of all {issues.length} campus reports. Select any issue to assign priority, designate respected workers, and post resolution updates.
                            </div>
                        </div>
                    )}

                    {/* MODERN STATS GRID */}
                    <section className="stats-grid" aria-label="Campus issue summary">
                        <div className="stat-card">
                            <div className="stat-icon teal">
                                <Activity size={19} />
                            </div>
                            <div className="stat-copy">
                                <span>{isStudent ? 'My Total Reports' : 'Total Campus Reports'}</span>
                                <strong>{totalCount}</strong>
                                <small>{isStudent ? 'Submitted by you' : 'Across all campus blocks'}</small>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon coral">
                                <AlertCircle size={19} />
                            </div>
                            <div className="stat-copy">
                                <span>Need Attention</span>
                                <strong>{openCount}</strong>
                                <small>
                                    <span className="pulse-dot open" />
                                    {isStudent ? 'Awaiting review' : 'Unassigned / Open'}
                                </small>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon blue">
                                <Clock3 size={19} />
                            </div>
                            <div className="stat-copy">
                                <span>In Progress</span>
                                <strong>{inProgressCount}</strong>
                                <small>
                                    <span className="pulse-dot in-progress" />
                                    {isStudent ? 'Technician assigned' : 'Work allocated'}
                                </small>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon green">
                                <CheckCircle2 size={19} />
                            </div>
                            <div className="stat-copy">
                                <span>Resolved</span>
                                <strong>{resolvedCount}</strong>
                                <small>
                                    <span className="pulse-dot resolved" />
                                    {isStudent ? 'Closed fixes' : 'Fixed by staff'}
                                </small>
                            </div>
                        </div>
                    </section>

                    {/* ===================== OVERVIEW & ISSUE REGISTER ===================== */}
                    {(activePage === 'Overview' ||
                        activePage === 'My reports' ||
                        activePage === 'All issues register') && (
                            <>
                                {activePage === 'Overview' && (
                                    <section className="campus-banner" aria-label="Campus today">
                                        <img src="/sdmcet-campus.jpg" alt="Aerial view of SDMCET Dharwad campus" />
                                        <div className="campus-banner-copy">
                                            <span className="banner-kicker">SDMCET / DHARWAD</span>
                                            <h2>
                                                {isStudent
                                                    ? 'Small fixes. A stronger campus.'
                                                    : 'Campus Infrastructure & Facility Management'}
                                            </h2>
                                            <p>
                                                {isStudent
                                                    ? `${openCount} of your submitted reports are pending review.`
                                                    : `${openCount} open reports require priority review and worker dispatch.`}
                                            </p>
                                        </div>
                                        <div className="banner-index">
                                            <span>{isStudent ? '01' : 'ADM'}</span>
                                            <i>{isStudent ? 'STUDENT DESK' : 'CONTROL CENTRE'}</i>
                                        </div>
                                    </section>
                                )}

                                {/* FILTER CONTROLS */}
                                <div className="toolbar-row" style={{ marginTop: '20px', flexWrap: 'wrap', gap: '10px' }}>
                                    <div className="filter-tabs" role="tablist">
                                        {['All', ...STATUSES].map((st) => {
                                            const cnt =
                                                st === 'All'
                                                    ? roleScopedIssues.length
                                                    : roleScopedIssues.filter((i) => i.status === st).length
                                            return (
                                                <button
                                                    key={st}
                                                    className={activeStatus === st ? 'selected' : ''}
                                                    onClick={() => setActiveStatus(st)}
                                                >
                                                    {st}
                                                    <span>{cnt}</span>
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {isAdmin && (
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <label className="select-control" style={{ margin: 0 }}>
                                                Priority
                                                <select
                                                    value={activePriority}
                                                    onChange={(e) => setActivePriority(e.target.value)}
                                                >
                                                    <option value="All">All Priorities</option>
                                                    {PRIORITIES.map((p) => (
                                                        <option key={p} value={p}>
                                                            {p}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={14} />
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {/* DASHBOARD GRID: ISSUES LIST + DETAILS PANEL */}
                                <section className="dashboard-grid" style={{ marginTop: '16px' }}>
                                    <div className="issues-panel">
                                        <div className="section-head">
                                            <div>
                                                <h2>{isStudent ? 'My Reported Issues' : 'All Campus Issues'}</h2>
                                                <p>
                                                    {isStudent
                                                        ? 'Showing problems you submitted. Click to see technician and resolution updates.'
                                                        : 'Showing all reports submitted by students across SDMCET campus.'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="issue-list">
                                            {visibleIssues.map((issue) => (
                                                <button
                                                    key={issue._id}
                                                    className={`issue-row ${selectedIssue?._id === issue._id ? 'chosen' : ''}`}
                                                    onClick={() => setSelectedId(issue._id)}
                                                >
                                                    <span className={`issue-status ${statusClass(issue.status)}`} />
                                                    <span className="issue-summary">
                                                        <strong>{issue.title}</strong>
                                                        <span>
                                                            {issue.category} <i>·</i> {issue.location}
                                                            {isAdmin && (
                                                                <small style={{ color: '#a0a693', marginLeft: '6px' }}>
                                                                    by {issue.reporter}
                                                                </small>
                                                            )}
                                                        </span>
                                                    </span>

                                                    {/* Worker pill */}
                                                    <span
                                                        className={`worker-assignment-pill ${!issue.assignedWorker || issue.assignedWorker === 'Unassigned'
                                                            ? 'unassigned'
                                                            : ''
                                                            }`}
                                                    >
                                                        <Wrench size={11} />
                                                        {issue.assignedWorker && issue.assignedWorker !== 'Unassigned'
                                                            ? issue.assignedWorker.split('(')[0].trim()
                                                            : 'Unassigned'}
                                                    </span>

                                                    <span className={`priority ${String(issue.priority).toLowerCase()}`}>
                                                        {issue.priority === 'Urgent' && <span className="pulse-dot urgent" />}
                                                        {issue.priority}
                                                    </span>

                                                    <span className="issue-votes">
                                                        <ArrowUpRight size={14} />
                                                        {issue.votes || 0}
                                                    </span>
                                                </button>
                                            ))}

                                            {visibleIssues.length === 0 && (
                                                <div className="user-only-empty">
                                                    <AlertCircle size={28} style={{ color: '#eab308', margin: '0 auto' }} />
                                                    <h3>
                                                        {isStudent
                                                            ? 'You have not reported any issues yet.'
                                                            : 'No campus issues match your filter.'}
                                                    </h3>
                                                    <p>
                                                        {isStudent
                                                            ? 'Click "Report a problem" above to address any maintenance, electrical, or IT issues you encounter on campus.'
                                                            : 'All reports submitted by campus students will appear here.'}
                                                    </p>
                                                    {isStudent && (
                                                        <button
                                                            className="primary-button"
                                                            style={{ margin: '0 auto' }}
                                                            onClick={() => setShowForm(true)}
                                                        >
                                                            <FilePlus2 size={16} /> Report a problem now
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ISSUE DETAIL & ADMIN ACTION PANEL */}
                                    <IssueDetailsPanel
                                        issue={selectedIssue}
                                        user={user}
                                        isAdmin={isAdmin}
                                        isStudent={isStudent}
                                        adminForm={adminForm}
                                        setAdminForm={setAdminForm}
                                        onSaveAdmin={saveAdminAssignment}
                                        onDelete={deleteIssue}
                                        saving={saving}
                                    />
                                </section>
                            </>
                        )}

                    {/* ===================== WORKER DISPATCH TAB (ADMIN ONLY) ===================== */}
                    {activePage === 'Worker dispatch' && isAdmin && (
                        <div>
                            <div className="toolbar-row">
                                <p className="table-caption">
                                    SDMCET Campus Maintenance Staff · Assign work orders according to specialization
                                </p>
                            </div>

                            <div className="worker-card-grid">
                                {workersWithTasks.map((worker) => (
                                    <div className="worker-card" key={worker.name}>
                                        <div className="worker-card-head">
                                            <div className="worker-avatar">
                                                <worker.icon size={20} />
                                            </div>
                                            <div className="worker-info">
                                                <strong>{worker.name}</strong>
                                                <small>{worker.trade}</small>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#8d947f' }}>
                                            <Phone size={13} />
                                            <span>{worker.phone}</span>
                                        </div>

                                        <div className="worker-stats">
                                            <span>
                                                Active tasks: <strong>{worker.activeTasks}</strong>
                                            </span>
                                            <span>
                                                Completed: <strong style={{ color: '#4ade80' }}>{worker.completedTasks}</strong>
                                            </span>
                                        </div>

                                        {/* Assigned issues list for this worker */}
                                        <div style={{ marginTop: '8px', borderTop: '1px solid #2b301f', paddingTop: '8px' }}>
                                            <span style={{ fontSize: '11px', color: '#9ea392', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                Currently assigned:
                                            </span>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                                                {issues
                                                    .filter(
                                                        (i) =>
                                                            i.assignedWorker?.includes(worker.name) &&
                                                            i.status !== 'Resolved'
                                                    )
                                                    .slice(0, 3)
                                                    .map((issue) => (
                                                        <div
                                                            key={issue._id}
                                                            style={{
                                                                fontSize: '11px',
                                                                padding: '4px 6px',
                                                                background: '#14160f',
                                                                borderRadius: '4px',
                                                                color: '#e2ddca',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                            }}
                                                        >
                                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                                                                {issue.title}
                                                            </span>
                                                            <span className={`priority ${String(issue.priority).toLowerCase()}`} style={{ fontSize: '9px', padding: '1px 4px' }}>
                                                                {issue.priority}
                                                            </span>
                                                        </div>
                                                    ))}
                                                {issues.filter(
                                                    (i) =>
                                                        i.assignedWorker?.includes(worker.name) &&
                                                        i.status !== 'Resolved'
                                                ).length === 0 && (
                                                        <span style={{ fontSize: '11px', color: '#747a66', fontStyle: 'italic' }}>
                                                            No active tasks pending. Available for dispatch.
                                                        </span>
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ===================== CAMPUS SPACES TAB ===================== */}
                    {activePage === 'Campus spaces' && (
                        <>
                            <div className="toolbar-row">
                                <p className="table-caption">
                                    {spaces.length} reported spaces · ordered by complaint volume across SDMCET
                                </p>
                            </div>
                            <section className="space-grid">
                                {spaces.map((space, index) => (
                                    <button
                                        className="space-card"
                                        key={space.name}
                                        onClick={() => {
                                            setSearch(space.name)
                                            navigate(isStudent ? 'My reports' : 'All issues register')
                                        }}
                                    >
                                        <span className="space-photo">
                                            <img
                                                src={spaceImages[index % spaceImages.length].src}
                                                alt={spaceImages[index % spaceImages.length].alt}
                                                loading="lazy"
                                            />
                                            <span className="space-photo-count">
                                                {space.reports} {space.reports === 1 ? 'report' : 'reports'}
                                            </span>
                                        </span>
                                        <span className="space-card-content">
                                            <strong>{space.name}</strong>
                                            <span className="space-card-categories">
                                                {[...space.categories].join(' · ')}
                                            </span>
                                            <span className="space-card-foot">
                                                <span>{space.open} unresolved</span>
                                                <span>
                                                    {space.high} high priority <ArrowUpRight size={14} />
                                                </span>
                                            </span>
                                        </span>
                                    </button>
                                ))}
                            </section>
                        </>
                    )}

                    {/* ===================== STUDENT DIRECTORY TAB (ADMIN ONLY) ===================== */}
                    {activePage === 'Student directory' && isAdmin && (
                        <>
                            <div className="toolbar-row">
                                <p className="table-caption">
                                    {contributors.length} registered students reporting campus issues · contact directory
                                </p>
                            </div>
                            <section className="data-panel table-panel">
                                <div className="table-scroll">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Student Name</th>
                                                <th>Email ID</th>
                                                <th>Total Reports</th>
                                                <th>Open Reports</th>
                                                <th>Resolved</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {contributors.map((person) => (
                                                <tr key={person.name}>
                                                    <td>
                                                        <strong className="person-name">
                                                            <span className="person-avatar">{initials(person.name)}</span>
                                                            {person.name}
                                                        </strong>
                                                    </td>
                                                    <td style={{ color: '#a0a693' }}>{person.email}</td>
                                                    <td>{person.reports}</td>
                                                    <td>{person.open}</td>
                                                    <td>
                                                        <span className="number-good">{person.resolved}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </>
                    )}

                    {/* ===================== CAMPUS GUIDELINES TAB (STUDENT ONLY) ===================== */}
                    {activePage === 'Campus guidelines' && isStudent && (
                        <div style={{ maxWidth: '800px', margin: '20px auto' }}>
                            <section className="data-panel" style={{ padding: '24px' }}>
                                <div className="section-head">
                                    <div>
                                        <h2>SDMCET Campus Maintenance Guidelines</h2>
                                        <p>How the CampusFix service desk handles your reported issues</p>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gap: '16px', marginTop: '16px', color: '#c5c2b4', fontSize: '13px', lineHeight: 1.6 }}>
                                    <div>
                                        <strong style={{ color: '#efc15e', display: 'block', fontSize: '14px', marginBottom: '4px' }}>
                                            1. Submit Your Issue
                                        </strong>
                                        Provide the exact location (e.g. Mechanical Block 2nd floor, LH-204) and description.
                                    </div>
                                    <div>
                                        <strong style={{ color: '#efc15e', display: 'block', fontSize: '14px', marginBottom: '4px' }}>
                                            2. Administrative Review & Priority Allocation
                                        </strong>
                                        The campus facilities head reviews incoming reports and categorizes priority as Urgent, High, Medium, or Low.
                                    </div>
                                    <div>
                                        <strong style={{ color: '#efc15e', display: 'block', fontSize: '14px', marginBottom: '4px' }}>
                                            3. Worker Assignment
                                        </strong>
                                        The job is assigned to the designated campus technician (Electrician Ramesh, Plumber Suresh, IT Anand, Carpenter Kumar, Sanitation Sunita).
                                    </div>
                                    <div>
                                        <strong style={{ color: '#efc15e', display: 'block', fontSize: '14px', marginBottom: '4px' }}>
                                            4. Resolution & Verification
                                        </strong>
                                        Once the technician completes the repair, the admin updates the status to Resolved and posts completion remarks visible on your dashboard.
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </main>

            {/* ===================== NEW ISSUE REPORT MODAL ===================== */}
            {showForm && (
                <div
                    className="modal-backdrop"
                    onMouseDown={(e) => e.target === e.currentTarget && setShowForm(false)}
                >
                    <form className="report-modal" onSubmit={createIssue} style={{ maxWidth: '580px' }}>
                        <div className="modal-head">
                            <div>
                                <p className="eyebrow">CAMPUS FIX SERVICE DESK</p>
                                <h2>Address a Campus Problem</h2>
                            </div>
                            <button type="button" onClick={() => setShowForm(false)} aria-label="Close">
                                <X size={19} />
                            </button>
                        </div>

                        <label>
                            Problem title
                            <input
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="e.g. Broken water tap in C-Block washroom"
                                required
                            />
                        </label>

                        {/* Interactive Category Chips */}
                        <div style={{ marginTop: '10px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#9ea392', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                                Select Campus Category
                            </label>
                            <div className="category-chip-grid">
                                {CATEGORIES.map((cat) => (
                                    <button
                                        type="button"
                                        key={cat.name}
                                        className={`category-chip ${form.category === cat.name ? 'active' : ''}`}
                                        onClick={() => setForm({ ...form, category: cat.name })}
                                    >
                                        <cat.icon size={14} style={{ color: form.category === cat.name ? '#f0c767' : '#8d947f' }} />
                                        <span>{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Urgency Priority Buttons */}
                        <div style={{ marginTop: '4px', marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#9ea392', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                                Urgency Level
                            </label>
                            <div className="segmented-btn-group">
                                {PRIORITIES.map((p) => (
                                    <button
                                        type="button"
                                        key={p}
                                        className={`segmented-btn ${form.priority === p ? `active ${p.toLowerCase()}` : ''}`}
                                        onClick={() => setForm({ ...form, priority: p })}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <label>
                            Location (Campus building, floor, room)
                            <input
                                value={form.location}
                                onChange={(e) => setForm({ ...form, location: e.target.value })}
                                placeholder="e.g. Mech Block, 2nd Floor, Room 204"
                                required
                            />
                        </label>

                        <label>
                            Detailed description
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Describe the issue in detail to help the technician repair it..."
                                rows="3"
                                required
                            />
                        </label>

                        <div className="form-row">
                            <label>
                                Reporter name
                                <input
                                    value={currentUser}
                                    readOnly
                                    style={{ background: '#171912', color: '#9ea392' }}
                                />
                            </label>
                            <label>
                                Reporter email
                                <input
                                    value={currentEmail}
                                    readOnly
                                    style={{ background: '#171912', color: '#9ea392' }}
                                />
                            </label>
                        </div>

                        <button className="primary-button submit" type="submit" disabled={saving}>
                            {saving ? 'Submitting to Queue...' : <><FilePlus2 size={17} /> Submit problem report</>}
                        </button>
                    </form>
                </div>
            )}

            {/* ===================== ADMIN PASSCODE UNLOCK MODAL ===================== */}
            {showAdminUnlockModal && (
                <AdminPasscodeModal
                    passcode={adminPasscode}
                    setPasscode={setAdminPasscode}
                    error={adminPasscodeError}
                    onSubmit={handleAdminUnlock}
                    onClose={() => {
                        setShowAdminUnlockModal(false)
                        setAdminPasscodeError('')
                    }}
                />
            )}
        </div>
    )
}

/* =========================================================================
   ISSUE DETAILS & LIFECYCLE PROGRESS PANEL
   ========================================================================= */
function IssueDetailsPanel({
    issue,
    user,
    isAdmin,
    isStudent,
    adminForm,
    setAdminForm,
    onSaveAdmin,
    onDelete,
    saving,
}) {
    const [pendingDeleteId, setPendingDeleteId] = useState(null)

    if (!issue) {
        return (
            <aside className="detail-panel">
                <div className="empty-state">
                    <span>
                        <ArrowDownUp size={18} />
                    </span>
                    <p>Select a report to inspect details and status.</p>
                </div>
            </aside>
        )
    }

    const canDelete =
        isAdmin ||
        issue.reporter?.trim().toLowerCase() === user?.name?.trim().toLowerCase() ||
        issue.reporterEmail?.trim().toLowerCase() === user?.email?.trim().toLowerCase()

    // Lifecycle steps
    const hasWorker = issue.assignedWorker && issue.assignedWorker !== 'Unassigned'
    const isResolved = issue.status === 'Resolved'
    const isInProgress = issue.status === 'In progress' || isResolved

    return (
        <aside className="detail-panel">
            <div className="detail-head">
                <span>ISSUE DETAILS</span>
                <span className={`status-pill ${statusClass(issue.status)}`}>
                    <span className={`pulse-dot ${statusClass(issue.status)}`} />
                    {issue.status}
                </span>
            </div>

            <div className="detail-title">
                <div className={`large-status ${statusClass(issue.status)}`}>
                    <AlertCircle size={19} />
                </div>
                <div>
                    <h2>{issue.title}</h2>
                    <span>
                        Reported by <strong>{issue.reporter || 'Anonymous'}</strong>
                        {isAdmin && issue.reporterEmail && ` (${issue.reporterEmail})`}
                    </span>
                </div>
            </div>

            {/* VISUAL 4-STEP LIFECYCLE PROGRESS TRACKER */}
            <div className="lifecycle-stepper">
                <div className="stepper-header">
                    <span>Resolution Lifecycle</span>
                    <span style={{ color: '#efc15e', fontWeight: 700 }}>
                        {isResolved ? '100% Completed' : isInProgress ? 'In Progress' : 'Under Review'}
                    </span>
                </div>
                <div className="stepper-track">
                    <div className="stepper-step completed">
                        <div className="step-node">
                            <Check size={14} />
                        </div>
                        <span className="step-title">Submitted</span>
                    </div>

                    <div className={`stepper-step ${issue.priority || hasWorker ? 'completed' : 'current'}`}>
                        <div className="step-node">
                            {issue.priority ? <Check size={14} /> : '2'}
                        </div>
                        <span className="step-title">Priority Set</span>
                    </div>

                    <div className={`stepper-step ${hasWorker ? (isResolved ? 'completed' : 'current') : ''}`}>
                        <div className="step-node">
                            {hasWorker && isResolved ? <Check size={14} /> : '3'}
                        </div>
                        <span className="step-title">Technician</span>
                    </div>

                    <div className={`stepper-step ${isResolved ? 'completed' : ''}`}>
                        <div className="step-node">
                            {isResolved ? <Check size={14} /> : '4'}
                        </div>
                        <span className="step-title">Resolved</span>
                    </div>
                </div>
            </div>

            <div className="detail-tags">
                <span className={`priority ${String(issue.priority).toLowerCase()}`}>
                    {issue.priority === 'Urgent' && <span className="pulse-dot urgent" />}
                    {issue.priority} priority
                </span>
                <span className="detail-date">
                    <Clock3 size={14} />
                    {relativeDate(issue.createdAt)}
                </span>
            </div>

            <p className="detail-description">{issue.description}</p>

            <dl className="detail-meta">
                <div>
                    <dt>LOCATION</dt>
                    <dd>{issue.location}</dd>
                </div>
                <div>
                    <dt>CATEGORY</dt>
                    <dd>{issue.category}</dd>
                </div>
                <div>
                    <dt>ASSIGNED WORKER</dt>
                    <dd style={{ color: hasWorker ? '#efc15e' : '#9fa691', fontWeight: hasWorker ? 700 : 500 }}>
                        {hasWorker ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <HardHat size={14} /> {issue.assignedWorker}
                            </span>
                        ) : (
                            'Unassigned'
                        )}
                    </dd>
                </div>
                <div>
                    <dt>STATUS</dt>
                    <dd>{issue.status}</dd>
                </div>
                <div>
                    <dt>DATE FILED</dt>
                    <dd>{formatDate(issue.createdAt)}</dd>
                </div>
                <div>
                    <dt>RECORD ID</dt>
                    <dd className="id-cell">{issue._id}</dd>
                </div>
            </dl>

            {/* Display Admin Notes to Student */}
            {issue.adminNotes && (
                <div className="admin-notes-display">
                    <strong>
                        <Check size={13} style={{ display: 'inline', marginRight: '4px' }} />
                        Admin & Maintenance Update:
                    </strong>
                    <p style={{ margin: 0 }}>{issue.adminNotes}</p>
                </div>
            )}

            {/* ================= ADMIN ACTION CONTROLS ================= */}
            {isAdmin ? (
                <form className="admin-assign-panel" onSubmit={onSaveAdmin}>
                    <div className="admin-assign-header">
                        <strong>
                            <Wrench size={14} /> Admin Assignment Controls
                        </strong>
                        <span className="role-badge admin" style={{ fontSize: '9px', padding: '1px 6px' }}>
                            Admin Only
                        </span>
                    </div>

                    {/* 1. ASSIGN PRIORITY (Segmented Buttons) */}
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#9ea392', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                            1. Assign Priority
                        </label>
                        <div className="segmented-btn-group">
                            {PRIORITIES.map((p) => (
                                <button
                                    type="button"
                                    key={p}
                                    className={`segmented-btn ${adminForm.priority === p ? `active ${p.toLowerCase()}` : ''}`}
                                    onClick={() => setAdminForm({ ...adminForm, priority: p })}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. UPDATE STATUS (Segmented Buttons) */}
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#9ea392', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                            2. Work Status
                        </label>
                        <div className="status-segmented-group">
                            {['Open', 'In progress', 'Resolved'].map((st) => (
                                <button
                                    type="button"
                                    key={st}
                                    className={`status-segment-btn ${adminForm.status === st ? 'active' : ''}`}
                                    onClick={() => setAdminForm({ ...adminForm, status: st })}
                                >
                                    <span className={`pulse-dot ${statusClass(st)}`} />
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. ASSIGN RESPECTED WORKER */}
                    <div className="admin-field" style={{ marginBottom: '12px' }}>
                        <label>3. Assign Respected Worker</label>
                        <select
                            value={adminForm.assignedWorker}
                            onChange={(e) => setAdminForm({ ...adminForm, assignedWorker: e.target.value })}
                        >
                            <option value="Unassigned">-- Choose Campus Technician --</option>
                            {CAMPUS_WORKERS.map((w) => (
                                <option key={w.name} value={`${w.name} (${w.trade})`}>
                                    {w.name} - {w.trade}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 4. ADMIN WORK NOTES / REMARKS */}
                    <div className="admin-field">
                        <label>4. Work Order Notes (Visible to Student)</label>
                        <textarea
                            rows="2"
                            value={adminForm.adminNotes}
                            onChange={(e) => setAdminForm({ ...adminForm, adminNotes: e.target.value })}
                            placeholder="e.g. Technician dispatched; spares collected from campus stores; fix by 3 PM."
                        />
                    </div>

                    <button className="admin-save-btn" type="submit" disabled={saving}>
                        {saving ? (
                            'Saving changes...'
                        ) : (
                            <>
                                <CheckCircle2 size={15} /> Save Priority & Worker Allocation
                            </>
                        )}
                    </button>
                </form>
            ) : (
                <div style={{ marginTop: '16px', padding: '12px', background: '#171912', borderRadius: '6px', border: '1px solid #2b301f', fontSize: '12px', color: '#9da38e' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ecdca3', fontWeight: 600, marginBottom: '4px' }}>
                        <HardHat size={14} /> Technician Status:
                    </div>
                    {hasWorker ? (
                        <span>
                            Assigned to <strong style={{ color: '#fff' }}>{issue.assignedWorker}</strong>. Priority set to{' '}
                            <strong style={{ color: '#f59e0b' }}>{issue.priority}</strong>.
                        </span>
                    ) : (
                        <span>Awaiting worker assignment by the campus facility office.</span>
                    )}
                </div>
            )}

            {/* DELETE BUTTON */}
            {canDelete &&
                (pendingDeleteId === issue._id ? (
                    <div className="delete-confirm" role="alertdialog">
                        <strong>Remove this report?</strong>
                        <p>This action cannot be undone.</p>
                        <div>
                            <button type="button" onClick={() => setPendingDeleteId(null)}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="confirm-remove"
                                onClick={() => {
                                    setPendingDeleteId(null)
                                    onDelete(issue)
                                }}
                            >
                                Confirm Remove
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        className="delete-report-button"
                        onClick={() => setPendingDeleteId(issue._id)}
                    >
                        <Trash2 size={15} /> {isAdmin ? 'Delete Issue (Admin)' : 'Cancel My Report'}
                    </button>
                ))}
        </aside>
    )
}

/* =========================================================================
   PUBLIC STUDENT LOGIN SCREEN (STRICTLY FOR PUBLIC & STUDENTS)
   ========================================================================= */
function LoginScreen({ onSignIn, onOpenAdminModal }) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const submit = (e) => {
        e.preventDefault()
        onSignIn({ name, email })
    }

    return (
        <main className="login-shell">
            <section className="login-showcase">
                <header className="login-brand-row">
                    <div className="login-brand-lockup">
                        <img src="/sdmcet-crest.jpg" alt="SDMCET crest" />
                        <span className="login-brand-name">SDMCampusFix</span>
                    </div>
                    <span>CAMPUS FACILITY MANAGEMENT</span>
                </header>

                <div className="login-story">
                    <p className="login-kicker">SDMCET / DHARWAD</p>
                    <h1>
                        A campus that
                        <br />
                        works better for everyone.
                    </h1>
                    <p>
                        Report, track, and resolve campus infrastructure and maintenance issues with direct technician dispatch.
                    </p>

                    {/* Modern Showcase Feature Badges */}
                    <div className="showcase-features-row">
                        <span className="showcase-feature-pill">
                            <Zap size={13} style={{ color: '#f0c767' }} /> Real-Time Tracking
                        </span>
                        <span className="showcase-feature-pill">
                            <HardHat size={13} style={{ color: '#4ade80' }} /> Direct Worker Dispatch
                        </span>
                        <span className="showcase-feature-pill">
                            <Shield size={13} style={{ color: '#38bdf8' }} /> Student Privacy Separation
                        </span>
                    </div>
                </div>

                <div className="login-photo-grid" aria-label="Life at SDMCET Dharwad">
                    <img className="login-photo-campus" src="/sdmcet-campus.jpg" alt="Aerial view of the SDMCET campus" />
                    <img className="login-photo-lab" src="/sdmcet-mechanical-lab.jpg" alt="Engineering workshop" />
                    <img className="login-photo-library" src="/sdmcet-library.jpg" alt="Campus library" />
                    <img className="login-photo-community" src="/sdmcet-gallery-4.jpg" alt="SDMCET community" />
                </div>

                <footer className="login-footnote">
                    <span>EST. 1979</span>
                    <span>KALAGHATAGI ROAD, DHARWAD</span>
                </footer>
            </section>

            <section className="login-panel">
                <div className="login-panel-top">
                    <span className="prototype-badge">STUDENT SERVICE DESK</span>
                </div>

                <div className="login-card">
                    <p className="login-kicker">CAMPUS COMMUNITY</p>
                    <h2>Student Sign In</h2>
                    <p className="login-intro">
                        Sign in to address issues you face on campus and track repair progress.
                    </p>

                    <form className="login-form" onSubmit={submit}>
                        <label>
                            Your name
                            <input
                                autoComplete="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. suprita"
                                required
                            />
                        </label>

                        <label>
                            Campus email
                            <span className="login-input">
                                <Mail size={17} />
                                <input
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="suprita@gmail.com"
                                    required
                                />
                            </span>
                        </label>

                        <label>
                            Password
                            <span className="login-input">
                                <LockKeyhole size={17} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </span>
                        </label>

                        <button className="login-submit" type="submit">
                            Continue to Student Dashboard <ArrowRight size={17} />
                        </button>
                    </form>

                    {/* Discreet Staff/Admin Access for the Administrator only */}
                    <div style={{ textAlign: 'center', marginTop: '12px' }}>
                        <button
                            type="button"
                            className="admin-discrete-gate"
                            onClick={onOpenAdminModal}
                            title="Authorized facility staff login"
                        >
                            <Lock size={12} /> Estates Staff Access
                        </button>
                    </div>
                </div>

                <div className="login-legal">SDMCampusFix · SDMCET DHARWAD</div>
            </section>
        </main>
    )
}

/* =========================================================================
   SECURE ADMIN PASSCODE MODAL (ONLY ACCESSIBLE VIA PASSCODE)
   ========================================================================= */
function AdminPasscodeModal({ passcode, setPasscode, error, onSubmit, onClose }) {
    const [showKey, setShowKey] = useState(false)

    return (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="admin-passcode-modal">
                <div className="admin-passcode-head">
                    <div>
                        <strong>
                            <Shield size={18} style={{ color: '#eab308' }} /> Estates Admin Gate
                        </strong>
                        <p>Authorized maintenance & facility personnel only.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={onSubmit}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#a0a693', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>
                        Master Admin Security Key
                    </label>

                    <div style={{ position: 'relative' }}>
                        <input
                            type={showKey ? 'text' : 'password'}
                            autoFocus
                            value={passcode}
                            onChange={(e) => setPasscode(e.target.value)}
                            placeholder="Enter Master Security Key..."
                            className="admin-passcode-input"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '14px',
                                background: 'transparent',
                                border: 'none',
                                color: '#999',
                                cursor: 'pointer',
                            }}
                        >
                            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    {error && (
                        <div style={{ color: '#f87171', fontSize: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}

                    <button className="admin-unlock-btn" type="submit">
                        <KeyRound size={15} /> Authenticate & Open Admin Portal
                    </button>
                </form>
            </div>
        </div>
    )
}

export default App
