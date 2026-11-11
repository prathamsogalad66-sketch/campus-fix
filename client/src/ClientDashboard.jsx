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
    Camera,
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
    Image as ImageIcon,
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
    ThumbsUp,
    Trash2,
    Truck,
    UserCheck,
    Users,
    Wrench,
    X,
    Zap,
} from 'lucide-react'
import './ClientDashboard.css'

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '')
const apiUrl = configuredApiUrl
    ? `${configuredApiUrl.replace(/\/api$/i, '')}/api`
    : '/api'

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
    { name: 'Ramesh Kumar', trade: 'Electrician', phone: '+91 8123751706', icon: Zap },
    { name: 'Suresh Patil', trade: 'Plumber', phone: '+91 77953 69555', icon: Droplets },
    { name: 'Anand Deshpande', trade: 'IT & Network Tech', phone: '+91 98453 45623', icon: Activity },
    { name: 'Kumar Naik', trade: 'Carpenter & Furniture', phone: '+91 98454 56734', icon: Wrench },
    { name: 'Sunita Hiremath', trade: 'Housekeeping & Sanitation', phone: '+91 98455 67845', icon: Sparkles },
    { name: 'Prakash Joshi', trade: 'Civil & Maintenance', phone: '+91 63660 21757', icon: Building },
]

function getWorkerDetails(assignedWorkerString) {
    if (!assignedWorkerString || assignedWorkerString === 'Unassigned') return null
    return CAMPUS_WORKERS.find((w) => assignedWorkerString.includes(w.name)) || null
}

function buildWhatsAppUrl(workerPhone, issue, formOverrides = {}) {
    const rawDigits = String(workerPhone || '').replace(/\D/g, '')
    const targetPhone = rawDigits.startsWith('91') && rawDigits.length > 10 ? rawDigits : `91${rawDigits.replace(/^0+/, '')}`

    const priority = formOverrides.priority || issue.priority || 'Medium'
    const adminNotes = formOverrides.adminNotes !== undefined ? formOverrides.adminNotes : (issue.adminNotes || '')
    const location = issue.location || 'SDMCET Campus'
    const title = issue.title || 'Campus Issue'
    const category = issue.category || 'General Maintenance'
    const reporter = issue.reporter || 'Student'
    const description = issue.description || ''

    const priorityEmoji = {
        Urgent: '🚨 URGENT',
        High: '🔴 HIGH',
        Medium: '🟡 MEDIUM',
        Low: '🟢 LOW',
    }[priority] || priority

    const text = [
        `🏫 *SDMCET CAMPUS FIX — WORK ORDER DISPATCH*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `📍 *LOCATION:* ${location}`,
        `🔧 *PROBLEM:* ${title}`,
        `⚡ *PRIORITY:* ${priorityEmoji}`,
        `📂 *TRADE/CATEGORY:* ${category}`,
        `👤 *REPORTED BY:* ${reporter}`,
        ``,
        `📋 *PROBLEM DETAILS:*`,
        `${description}`,
        ``,
        `📝 *ADMIN INSTRUCTIONS & NOTES:*`,
        `${adminNotes || 'Please attend immediately and report completion to Estates Office.'}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `👉 *Action Required:* Please proceed to the location immediately and correct the problem.`,
        `— SDMCET Estates & Maintenance Office`,
    ].join('\n')

    return `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(text)}`
}


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

// Client-side image compression for lightweight MongoDB storage
function compressImage(file, maxWidth = 900, quality = 0.65) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            return reject(new Error('Selected file is not an image.'))
        }
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (e) => {
            const img = new Image()
            img.src = e.target.result
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let width = img.width
                let height = img.height
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width)
                    width = maxWidth
                }
                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')
                ctx.drawImage(img, 0, 0, width, height)
                resolve(canvas.toDataURL('image/jpeg', quality))
            }
            img.onerror = () => reject(new Error('Failed to load image.'))
        }
        reader.onerror = () => reject(new Error('Failed to read file.'))
    })
}

const initialForm = {
    title: '',
    description: '',
    category: 'Facilities',
    location: '',
    priority: 'Medium',
    reporter: '',
    reporterEmail: '',
    photoBefore: '',
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
    const [storageMode, setStorageMode] = useState('checking')
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState('')
    const [form, setForm] = useState(initialForm)

    // Admin edit state
    const [adminForm, setAdminForm] = useState({
        priority: 'Medium',
        assignedWorker: 'Unassigned',
        status: 'Open',
        adminNotes: '',
    })
    const [dispatchSuccessModal, setDispatchSuccessModal] = useState(null)
    const [autoNotifyWhatsApp, setAutoNotifyWhatsApp] = useState(true)

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
        fetch(`${apiUrl}/health`)
            .then((res) => {
                if (!res.ok) throw new Error('Could not check the API storage status.')
                return res.json()
            })
            .then((data) => setStorageMode(data.storageMode || 'mongodb'))
            .catch(() => setStorageMode('unavailable'))
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
        if (e && e.preventDefault) e.preventDefault()
        setFormError('')

        // Explicit validation with clear user messaging
        const titleTrimmed = form.title ? form.title.trim() : ''
        const locationTrimmed = form.location ? form.location.trim() : ''
        const descTrimmed = form.description ? form.description.trim() : ''

        if (!titleTrimmed) {
            setFormError('Please enter a problem title above.')
            const el = document.getElementById('report-title-input')
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                el.focus()
            }
            return
        }

        if (!locationTrimmed) {
            setFormError('Please enter the campus location.')
            const el = document.getElementById('report-location-input')
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                el.focus()
            }
            return
        }

        if (!descTrimmed) {
            setFormError('Please describe the problem details.')
            const el = document.getElementById('report-desc-input')
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                el.focus()
            }
            return
        }

        setSaving(true)
        try {
            const payload = {
                ...form,
                title: titleTrimmed,
                location: locationTrimmed,
                description: descTrimmed,
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
            setFormError('')
            setActivePage('My reports')
            setActiveStatus('All')
            setNotice('Your problem has been registered! Admin will review and assign a technician.')
        } catch (error) {
            setFormError(error.message || 'Failed to submit the issue. Please try again.')
            setNotice(error.message || 'Failed to submit the issue.')
        } finally {
            setSaving(false)
        }
    }

    // Admin save updates
    const saveAdminAssignment = async (e, options = {}) => {
        if (e && e.preventDefault) e.preventDefault()
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

            const assignedWorkerDetails = getWorkerDetails(adminForm.assignedWorker)
            if (assignedWorkerDetails) {
                const waUrl = updated.whatsappUrl || buildWhatsAppUrl(assignedWorkerDetails.phone, { ...selectedIssue, ...adminForm })

                // Auto-open WhatsApp in a new tab/window
                if (options.shouldOpenWhatsApp !== false && autoNotifyWhatsApp) {
                    try {
                        window.open(waUrl, '_blank')
                    } catch (err) {
                        console.warn('Could not auto-open WhatsApp:', err)
                    }
                }

                // Show Dispatch Confirmation Modal with 1-click actions
                setDispatchSuccessModal({
                    worker: assignedWorkerDetails,
                    issue: { ...selectedIssue, ...adminForm },
                    whatsappUrl: waUrl,
                })

                setNotice(`Work updated! WhatsApp dispatch ticket generated for ${assignedWorkerDetails.name} (${assignedWorkerDetails.phone}).`)
            } else {
                setNotice(`Work updated: Priority set to ${adminForm.priority}, assigned to ${adminForm.assignedWorker}.`)
            }
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

    // Upvote / "Me Too" duplicate ticket suppression
    const handleUpvote = async (issueId, e) => {
        if (e && e.stopPropagation) e.stopPropagation()
        try {
            const userIdentifier = user?.email || user?.name || 'student'
            const res = await fetch(`${apiUrl}/issues/${issueId}/upvote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: userIdentifier, userName: user?.name || '' }),
            })
            const updated = await res.json()
            if (!res.ok) throw new Error(updated.message || 'Could not register upvote.')

            setIssues((curr) => curr.map((item) => (item._id === issueId ? { ...item, ...updated } : item)))
            setNotice('👍 Upvote counted! SDMCET estates office notified of additional affected student.')
        } catch (error) {
            setNotice(error.message || 'Could not upvote.')
        }
    }

    // Upload resolution proof photo directly to MongoDB
    const handleUploadAfterPhoto = async (issueId, base64Photo) => {
        setSaving(true)
        try {
            const res = await fetch(`${apiUrl}/issues/${issueId}/photo`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photoAfter: base64Photo }),
            })
            const updated = await res.json()
            if (!res.ok) throw new Error(updated.message || 'Could not upload resolution photo.')

            setIssues((curr) => curr.map((item) => (item._id === issueId ? { ...item, ...updated } : item)))
            setNotice('📸 Resolution proof photo uploaded and stored in MongoDB!')
        } catch (error) {
            setNotice(error.message || 'Failed to upload photo.')
        } finally {
            setSaving(false)
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
                            <div className="search-container">
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
                                {search.trim() && (
                                    <div className="search-results" role="status">
                                        <strong>
                                            {visibleIssues.length
                                                ? `${visibleIssues.length} matching report${visibleIssues.length === 1 ? '' : 's'}`
                                                : `No reports found for "${search.trim()}"`}
                                        </strong>
                                        {visibleIssues.slice(0, 5).map((issue) => (
                                            <button
                                                key={issue._id}
                                                onClick={() => {
                                                    setSelectedId(issue._id)
                                                    setSearch('')
                                                    setSearchOpen(false)
                                                    navigate(isStudent ? 'My reports' : 'All issues register')
                                                }}
                                            >
                                                <span>{issue.title}</span>
                                                <small>{issue.category} · {issue.location}</small>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        <button
                            className={`icon-button ${searchOpen ? 'action-active' : ''}`}
                            onClick={() => {
                                setSearchOpen((open) => !open)
                                setShowNotifications(false)
                                setShowProfileMenu(false)
                            }}
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
                    {storageMode === 'local' && (
                        <div className="storage-warning" role="status">
                            <AlertCircle size={17} />
                            <span>
                                MongoDB is unavailable. Reports are being saved on this server and will not sync to Atlas yet.
                            </span>
                        </div>
                    )}
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
                                                            {issue.photoBefore && (
                                                                <span className="photo-attached-tag" title="Photo evidence attached (MongoDB)">
                                                                    <Camera size={11} /> Photo
                                                                </span>
                                                            )}
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
                                        onUpvote={handleUpvote}
                                        onUploadAfterPhoto={handleUploadAfterPhoto}
                                        saving={saving}
                                        autoNotifyWhatsApp={autoNotifyWhatsApp}
                                        setAutoNotifyWhatsApp={setAutoNotifyWhatsApp}
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
                                        <div style={{ marginTop: '8px' }}>
                                            <a
                                                href={`https://api.whatsapp.com/send?phone=${worker.phone.replace(/\D/g, '')}&text=${encodeURIComponent(`Hello ${worker.name}, this is SDMCET Estates Administration regarding campus maintenance.`)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="whatsapp-btn"
                                                style={{ padding: '6px 12px', fontSize: '11px' }}
                                            >
                                                📲 WhatsApp {worker.name.split(' ')[0]}
                                            </a>
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
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowForm(false)
                            setFormError('')
                        }
                    }}
                >
                    <form className="report-modal" onSubmit={createIssue} style={{ maxWidth: '580px' }} noValidate>
                        <div className="modal-head">
                            <div>
                                <p className="eyebrow">CAMPUS FIX SERVICE DESK</p>
                                <h2>Address a Campus Problem</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false)
                                    setFormError('')
                                }}
                                aria-label="Close"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        {formError && (
                            <div className="modal-error-alert" role="alert">
                                <AlertCircle size={16} />
                                <span>{formError}</span>
                            </div>
                        )}

                        <label>
                            Problem title
                            <input
                                id="report-title-input"
                                value={form.title}
                                onChange={(e) => {
                                    setForm({ ...form, title: e.target.value })
                                    if (formError) setFormError('')
                                }}
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
                                id="report-location-input"
                                value={form.location}
                                onChange={(e) => {
                                    setForm({ ...form, location: e.target.value })
                                    if (formError) setFormError('')
                                }}
                                placeholder="e.g. Mech Block, 2nd Floor, Room 204"
                                required
                            />
                        </label>

                        <label>
                            Detailed description
                            <textarea
                                id="report-desc-input"
                                value={form.description}
                                onChange={(e) => {
                                    setForm({ ...form, description: e.target.value })
                                    if (formError) setFormError('')
                                }}
                                placeholder="Describe the issue in detail to help the technician repair it..."
                                rows="3"
                                required
                            />
                        </label>

                        {/* 5. Photo Proof Upload (Stored in MongoDB) */}
                        <div className="photo-upload-container">
                            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: '#9ea392', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                                <span>📸 Attach Photo Proof (Optional)</span>
                                <span style={{ fontSize: '10px', color: '#efc15e', textTransform: 'none', fontWeight: 600 }}>Stored in MongoDB</span>
                            </label>
                            {form.photoBefore ? (
                                <div className="photo-preview-card">
                                    <img src={form.photoBefore} alt="Problem preview" className="photo-preview-img" />
                                    <div className="photo-preview-meta">
                                        <span>Photo attached ready to save</span>
                                        <button
                                            type="button"
                                            className="photo-remove-btn"
                                            onClick={() => setForm({ ...form, photoBefore: '' })}
                                        >
                                            <X size={13} /> Remove
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <label className="photo-dropzone">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                try {
                                                    const base64 = await compressImage(file)
                                                    setForm(prev => ({ ...prev, photoBefore: base64 }))
                                                } catch (err) {
                                                    alert(err.message || 'Failed to process image.')
                                                }
                                            }
                                        }}
                                    />
                                    <Camera size={22} style={{ color: '#efc15e', marginBottom: '4px' }} />
                                    <strong style={{ color: '#e6e2d3', fontSize: '12px' }}>Click or tap to snap / upload photo proof</strong>
                                    <small style={{ color: '#888d7b', fontSize: '10px' }}>Compressed & stored directly in MongoDB document</small>
                                </label>
                            )}
                        </div>

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

                        <button
                            id="submit-problem-btn"
                            className="submit-report-btn"
                            type="submit"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <span className="btn-spinner" />
                                    <span>Submitting report to campus desk...</span>
                                </>
                            ) : (
                                <>
                                    <FilePlus2 size={18} strokeWidth={2.4} />
                                    <span>Submit Problem Report</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}

            {/* ===================== WHATSAPP DISPATCH CONFIRMATION MODAL ===================== */}
            {dispatchSuccessModal && (
                <div
                    className="modal-backdrop"
                    onMouseDown={(e) => e.target === e.currentTarget && setDispatchSuccessModal(null)}
                >
                    <div className="report-modal whatsapp-success-modal" style={{ maxWidth: '520px', border: '1px solid #25d366' }}>
                        <div className="modal-head">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#25d366', display: 'grid', placeItems: 'center', color: '#fff' }}>
                                    <Check size={18} strokeWidth={3} />
                                </div>
                                <div>
                                    <p className="eyebrow" style={{ color: '#25d366' }}>DISPATCH SUCCESSFUL</p>
                                    <h2 style={{ fontSize: '18px' }}>Task Allocated to Technician</h2>
                                </div>
                            </div>
                            <button type="button" onClick={() => setDispatchSuccessModal(null)} aria-label="Close">
                                <X size={19} />
                            </button>
                        </div>

                        <div className="dispatch-summary-box">
                            <div className="dispatch-summary-item">
                                <span>Assigned Technician</span>
                                <strong>👷 {dispatchSuccessModal.worker.name} ({dispatchSuccessModal.worker.trade})</strong>
                            </div>
                            <div className="dispatch-summary-item">
                                <span>WhatsApp Phone</span>
                                <strong style={{ color: '#25d366' }}>📱 {dispatchSuccessModal.worker.phone}</strong>
                            </div>
                            <div className="dispatch-summary-item">
                                <span>Campus Location</span>
                                <strong>📍 {dispatchSuccessModal.issue.location}</strong>
                            </div>
                            <div className="dispatch-summary-item">
                                <span>Problem</span>
                                <strong>🔧 {dispatchSuccessModal.issue.title}</strong>
                            </div>
                            <div className="dispatch-summary-item">
                                <span>Priority</span>
                                <strong style={{ color: '#f59e0b' }}>🚨 {dispatchSuccessModal.issue.priority}</strong>
                            </div>
                        </div>

                        <p style={{ fontSize: '12.5px', color: '#c4cbba', marginTop: '12px', lineHeight: 1.5 }}>
                            The complete work order ticket with exact location and instructions is ready. Click below to open WhatsApp and message <strong>{dispatchSuccessModal.worker.name}</strong> directly:
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
                            <a
                                href={dispatchSuccessModal.whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="whatsapp-btn-large"
                                onClick={() => setDispatchSuccessModal(null)}
                            >
                                <span>📲 Open WhatsApp & Send Work Order</span>
                                <ArrowUpRight size={17} />
                            </a>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <a
                                    href={`tel:${dispatchSuccessModal.worker.phone.replace(/\s+/g, '')}`}
                                    className="call-worker-btn"
                                >
                                    <Phone size={15} /> Call {dispatchSuccessModal.worker.name.split(' ')[0]}
                                </a>
                                <button
                                    type="button"
                                    className="modal-secondary-btn"
                                    onClick={() => setDispatchSuccessModal(null)}
                                    style={{ flex: 1 }}
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
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
    onUpvote,
    onUploadAfterPhoto,
    saving,
    autoNotifyWhatsApp,
    setAutoNotifyWhatsApp,
}) {
    const [pendingDeleteId, setPendingDeleteId] = useState(null)
    const [flowNotice, setFlowNotice] = useState('')
    const [lightboxPhoto, setLightboxPhoto] = useState(null)

    // Clear flow notice toast automatically
    useEffect(() => {
        if (!flowNotice) return
        const timer = setTimeout(() => setFlowNotice(''), 3500)
        return () => clearTimeout(timer)
    }, [flowNotice])

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

    // Real-time values taking admin changes into account
    const effectiveStatus = isAdmin ? (adminForm.status || issue.status) : issue.status
    const effectivePriority = isAdmin ? (adminForm.priority || issue.priority) : issue.priority
    const effectiveWorker = isAdmin ? (adminForm.assignedWorker || issue.assignedWorker) : issue.assignedWorker

    const hasWorker = effectiveWorker && effectiveWorker !== 'Unassigned'
    const isResolved = effectiveStatus === 'Resolved'
    const isInProgress = effectiveStatus === 'In progress' || isResolved
    const activeWorkerDetails = getWorkerDetails(adminForm.assignedWorker)
    const assignedWorkerInfo = getWorkerDetails(effectiveWorker)

    // Recommended technician based on issue category
    const getRecommendedWorker = () => {
        const cat = (issue.category || '').toLowerCase()
        if (cat.includes('electr')) return CAMPUS_WORKERS.find(w => w.trade === 'Electrician') || CAMPUS_WORKERS[0]
        if (cat.includes('plumb') || cat.includes('water')) return CAMPUS_WORKERS.find(w => w.trade === 'Plumber') || CAMPUS_WORKERS[1]
        if (cat.includes('it') || cat.includes('network') || cat.includes('wi-fi')) return CAMPUS_WORKERS.find(w => w.trade.includes('IT')) || CAMPUS_WORKERS[2]
        if (cat.includes('furnit') || cat.includes('carpent')) return CAMPUS_WORKERS.find(w => w.trade.includes('Carpenter')) || CAMPUS_WORKERS[3]
        if (cat.includes('sanit') || cat.includes('clean') || cat.includes('housekeep')) return CAMPUS_WORKERS.find(w => w.trade.includes('Housekeeping')) || CAMPUS_WORKERS[4]
        return CAMPUS_WORKERS.find(w => w.trade.includes('Civil')) || CAMPUS_WORKERS[0]
    }
    const recommendedWorker = getRecommendedWorker()

    // Stepper calculation
    const step1Done = true
    const step2Done = Boolean(effectivePriority)
    const step3Done = Boolean(hasWorker || isInProgress)
    const step4Done = isResolved

    const currentStepIndex = isResolved ? 4 : (hasWorker || effectiveStatus === 'In progress') ? 3 : 2
    const progressPercent = isResolved ? 100 : (hasWorker || effectiveStatus === 'In progress') ? 75 : 50
    const progressLabel = isResolved 
        ? '100% Resolved' 
        : effectiveStatus === 'In progress' 
            ? '75% In Progress' 
            : hasWorker 
                ? '60% Dispatched' 
                : '50% Under Review'

    // Interactive step node click handlers
    const handleStepClick = (stepNum) => {
        if (!isAdmin) return
        if (stepNum === 1) {
            setAdminForm(prev => ({ ...prev, status: 'Open' }))
            setFlowNotice('Stage set to Step 1: Open / Logged')
        } else if (stepNum === 2) {
            const nextPri = { Low: 'Medium', Medium: 'High', High: 'Urgent', Urgent: 'Low' }[adminForm.priority || 'Medium'] || 'Urgent'
            setAdminForm(prev => ({ ...prev, priority: nextPri }))
            setFlowNotice(`Stage 2 Priority cycled to ${nextPri}`)
        } else if (stepNum === 3) {
            if (!hasWorker) {
                const rec = recommendedWorker
                setAdminForm(prev => ({
                    ...prev,
                    assignedWorker: `${rec.name} (${rec.trade})`,
                    status: prev.status === 'Open' ? 'In progress' : prev.status,
                }))
                setFlowNotice(`Auto-assigned ${rec.name} (${rec.trade})`)
            } else {
                setFlowNotice(`Technician: ${effectiveWorker}`)
            }
        } else if (stepNum === 4) {
            const newSt = isResolved ? 'In progress' : 'Resolved'
            setAdminForm(prev => ({ ...prev, status: newSt }))
            setFlowNotice(`Stage set to Step 4: ${newSt}`)
        }
    }

    const handleQuickSetStatus = (st) => {
        setAdminForm(prev => ({ ...prev, status: st }))
        setFlowNotice(`Status updated to "${st}"`)
    }

    const handleQuickAutoAssign = () => {
        const rec = recommendedWorker
        setAdminForm(prev => ({
            ...prev,
            assignedWorker: `${rec.name} (${rec.trade})`,
            status: prev.status === 'Open' ? 'In progress' : prev.status,
        }))
        setFlowNotice(`Assigned ${rec.name} (${rec.trade})`)
    }

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

            {/* VISUAL INTERACTIVE LIFECYCLE FLOW CHART & PIPELINE */}
            <div className="lifecycle-flowchart-card">
                <div className="flowchart-header">
                    <div className="flowchart-title-wrap">
                        <span className="flowchart-kicker">WORKFLOW PIPELINE</span>
                        <h4 className="flowchart-title">Resolution Lifecycle</h4>
                    </div>
                    <div className={`flowchart-badge ${statusClass(effectiveStatus)}`}>
                        <span className={`pulse-dot ${statusClass(effectiveStatus)}`} />
                        <span>{progressLabel}</span>
                    </div>
                </div>

                {/* Animated Horizontal Progress Track */}
                <div className="flowchart-progress-bar-bg">
                    <div 
                        className="flowchart-progress-bar-fill" 
                        style={{ width: `${progressPercent}%` }} 
                    />
                </div>

                {/* 4 Connected Flow Nodes (Working Buttons) */}
                <div className="flowchart-steps-grid">
                    {/* STEP 1: SUBMITTED */}
                    <button
                        type="button"
                        className={`flow-step-node completed ${currentStepIndex === 1 ? 'current' : ''}`}
                        onClick={() => handleStepClick(1)}
                        title={isAdmin ? "Click to set status to Open" : "Report Submitted"}
                    >
                        <div className="flow-node-circle">
                            <Check size={14} className="node-icon-check" />
                        </div>
                        <span className="flow-node-num">STEP 1</span>
                        <strong className="flow-node-title">Submitted</strong>
                        <span className="flow-node-sub">Logged</span>
                    </button>

                    <div className={`flow-connector-line ${step2Done ? 'active' : ''}`} />

                    {/* STEP 2: PRIORITY */}
                    <button
                        type="button"
                        className={`flow-step-node ${step2Done ? 'completed' : ''} ${currentStepIndex === 2 ? 'current' : ''}`}
                        onClick={() => handleStepClick(2)}
                        title={isAdmin ? `Click to cycle priority (Current: ${effectivePriority})` : `Priority: ${effectivePriority}`}
                    >
                        <div className="flow-node-circle">
                            <span className="node-num-indicator">{effectivePriority ? <Zap size={13} /> : '2'}</span>
                        </div>
                        <span className="flow-node-num">STEP 2</span>
                        <strong className="flow-node-title">Priority</strong>
                        <span className={`flow-node-sub badge-priority ${String(effectivePriority).toLowerCase()}`}>
                            {effectivePriority || 'Pending'}
                        </span>
                    </button>

                    <div className={`flow-connector-line ${step3Done ? 'active' : ''}`} />

                    {/* STEP 3: TECHNICIAN */}
                    <button
                        type="button"
                        className={`flow-step-node ${step3Done ? 'completed' : ''} ${currentStepIndex === 3 ? 'current' : ''}`}
                        onClick={() => handleStepClick(3)}
                        title={isAdmin ? (hasWorker ? `Worker: ${effectiveWorker}` : `Click to auto-assign ${recommendedWorker.name}`) : "Technician Allocation"}
                    >
                        <div className="flow-node-circle">
                            <span className="node-num-indicator">{step3Done ? <HardHat size={14} /> : '3'}</span>
                        </div>
                        <span className="flow-node-num">STEP 3</span>
                        <strong className="flow-node-title">Technician</strong>
                        <span className="flow-node-sub badge-worker">
                            {hasWorker ? effectiveWorker.split(' ')[0] : 'Unassigned'}
                        </span>
                    </button>

                    <div className={`flow-connector-line ${step4Done ? 'active' : ''}`} />

                    {/* STEP 4: RESOLVED */}
                    <button
                        type="button"
                        className={`flow-step-node ${step4Done ? 'completed' : ''} ${currentStepIndex === 4 ? 'current' : ''}`}
                        onClick={() => handleStepClick(4)}
                        title={isAdmin ? (isResolved ? "Click to reopen ticket" : "Click to mark as resolved") : "Final Resolution"}
                    >
                        <div className="flow-node-circle">
                            <span className="node-num-indicator">{step4Done ? <Check size={14} /> : '4'}</span>
                        </div>
                        <span className="flow-node-num">STEP 4</span>
                        <strong className="flow-node-title">Resolved</strong>
                        <span className={`flow-node-sub ${step4Done ? 'badge-resolved' : ''}`}>
                            {step4Done ? 'Verified' : 'Pending'}
                        </span>
                    </button>
                </div>

                {/* Instant Feedback Pill if clicked */}
                {flowNotice && (
                    <div className="flowchart-notice-banner">
                        <Sparkles size={13} />
                        <span>{flowNotice}</span>
                    </div>
                )}

                {/* DEDICATED WORKING BUTTONS ON THE FLOW CHART */}
                {isAdmin ? (
                    <div className="flowchart-actions-toolbar">
                        <div className="flow-actions-label">
                            <Wrench size={12} />
                            <span>FLOW CONTROLS:</span>
                        </div>
                        <div className="flow-actions-row">
                            {/* In Progress Button */}
                            <button
                                type="button"
                                className={`flow-action-btn progress ${effectiveStatus === 'In progress' ? 'is-active' : ''}`}
                                onClick={() => handleQuickSetStatus('In progress')}
                                title="Advance workflow to In progress"
                            >
                                <Zap size={13} />
                                <span>{effectiveStatus === 'In progress' ? 'In Progress' : 'Set In Progress'}</span>
                            </button>

                            {/* Auto-Assign Worker or WhatsApp Button */}
                            {!hasWorker ? (
                                <button
                                    type="button"
                                    className="flow-action-btn worker"
                                    onClick={handleQuickAutoAssign}
                                    title={`Assign specialized ${recommendedWorker.trade}`}
                                >
                                    <HardHat size={13} />
                                    <span>Assign {recommendedWorker.name.split(' ')[0]}</span>
                                </button>
                            ) : (
                                <a
                                    href={buildWhatsAppUrl(assignedWorkerInfo?.phone || activeWorkerDetails?.phone || recommendedWorker.phone, issue, adminForm)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flow-action-btn whatsapp"
                                    title="Open WhatsApp chat with worker immediately"
                                >
                                    <span>📲 Worker WhatsApp</span>
                                </a>
                            )}

                            {/* Mark Resolved or Reopen Button */}
                            {!isResolved ? (
                                <button
                                    type="button"
                                    className="flow-action-btn resolve"
                                    onClick={() => handleQuickSetStatus('Resolved')}
                                    title="Mark issue as completely fixed and resolved"
                                >
                                    <CheckCircle2 size={13} />
                                    <span>Mark Resolved</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="flow-action-btn reopen"
                                    onClick={() => handleQuickSetStatus('In progress')}
                                    title="Reopen this issue for further maintenance"
                                >
                                    <RefreshCw size={13} />
                                    <span>Reopen Issue</span>
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flowchart-student-status-box">
                        <div className="student-status-row">
                            <Clock3 size={13} />
                            <span>
                                {isResolved
                                    ? 'Estates Office verified this issue as resolved.'
                                    : hasWorker
                                        ? `Campus technician ${issue.assignedWorker} is assigned and on campus.`
                                        : 'Awaiting technician assignment from Estates & Maintenance.'}
                            </span>
                        </div>
                    </div>
                )}
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

            {/* MONGODB PHOTO EVIDENCE (BEFORE & AFTER) */}
            <div className="detail-photo-section">
                <div className="photo-section-head">
                    <span className="photo-section-kicker">📸 CAMPUS PHOTO EVIDENCE (MONGODB PROOF)</span>
                    <span className="photo-section-tag">
                        {issue.photoBefore || issue.photoAfter ? 'Visual Evidence Attached' : 'No Photo Yet'}
                    </span>
                </div>
                <div className="photo-cards-grid">
                    {/* Before Fix Card */}
                    <div className="evidence-card">
                        <div className="evidence-card-label before">
                            <span>Before Repair (Reported)</span>
                        </div>
                        {issue.photoBefore ? (
                            <div className="evidence-img-wrap" onClick={() => setLightboxPhoto(issue.photoBefore)}>
                                <img src={issue.photoBefore} alt="Reported problem" className="evidence-img" />
                                <span className="evidence-expand-hint"><Eye size={12} /> Expand Photo</span>
                            </div>
                        ) : (
                            <div className="evidence-empty-box">
                                <ImageIcon size={22} style={{ opacity: 0.35, color: '#9ea392' }} />
                                <span>No initial photo provided</span>
                            </div>
                        )}
                    </div>

                    {/* After Fix Card */}
                    <div className="evidence-card">
                        <div className="evidence-card-label after">
                            <span>After Repair (Resolution Proof)</span>
                        </div>
                        {issue.photoAfter ? (
                            <div className="evidence-img-wrap" onClick={() => setLightboxPhoto(issue.photoAfter)}>
                                <img src={issue.photoAfter} alt="Resolution proof" className="evidence-img" />
                                <span className="evidence-expand-hint"><Check size={12} /> Verified Fix</span>
                            </div>
                        ) : (
                            <div className="evidence-empty-box">
                                <HardHat size={22} style={{ opacity: 0.35, color: '#efc15e' }} />
                                <span>{isResolved ? 'Repair completed' : 'Awaiting fix verification'}</span>
                                {isAdmin && (
                                    <label className="attach-proof-btn">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0]
                                                if (file && onUploadAfterPhoto) {
                                                    try {
                                                        const base64 = await compressImage(file)
                                                        onUploadAfterPhoto(issue._id, base64)
                                                    } catch (err) {
                                                        alert(err.message || 'Image processing failed.')
                                                    }
                                                }
                                            }}
                                        />
                                        <Camera size={12} /> Attach Fix Photo
                                    </label>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

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
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                    <HardHat size={14} /> {issue.assignedWorker}
                                </span>
                                {isAdmin && assignedWorkerInfo && (
                                    <a
                                        href={buildWhatsAppUrl(assignedWorkerInfo.phone, issue)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="whatsapp-quick-chip"
                                        title="Open WhatsApp chat with worker"
                                    >
                                        📲 WhatsApp ({assignedWorkerInfo.phone})
                                    </a>
                                )}
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
                                    className={`status-segment-btn ${statusClass(st)} ${adminForm.status === st ? 'active' : ''}`}
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

                        {/* Direct WhatsApp Worker Dispatch Box */}
                        {activeWorkerDetails && (
                            <div className="whatsapp-dispatch-card">
                                <div className="whatsapp-dispatch-card-head">
                                    <span className="whatsapp-badge">
                                        <span className="pulse-dot active" style={{ background: '#25d366', boxShadow: '0 0 8px #25d366' }} />
                                        WhatsApp Instant Dispatch
                                    </span>
                                    <span className="whatsapp-phone-display">📱 {activeWorkerDetails.phone}</span>
                                </div>
                                <p className="whatsapp-card-desc">
                                    When allocated, <strong>{activeWorkerDetails.name}</strong> ({activeWorkerDetails.trade}) will be notified with the problem, location, urgency, and instructions directly on his WhatsApp.
                                </p>

                                <div className="whatsapp-ticket-preview">
                                    <div className="preview-line"><span>📍 Location:</span> <strong>{issue.location}</strong></div>
                                    <div className="preview-line"><span>🔧 Problem:</span> <strong>{issue.title}</strong></div>
                                    <div className="preview-line"><span>⚡ Priority:</span> <strong>{adminForm.priority} Priority</strong></div>
                                </div>

                                <a
                                    href={buildWhatsAppUrl(activeWorkerDetails.phone, issue, adminForm)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="whatsapp-btn"
                                >
                                    📲 Open WhatsApp & Dispatch Work Order Now
                                </a>

                                <label className="whatsapp-auto-toggle">
                                    <input
                                        type="checkbox"
                                        checked={autoNotifyWhatsApp}
                                        onChange={(e) => setAutoNotifyWhatsApp && setAutoNotifyWhatsApp(e.target.checked)}
                                    />
                                    <span>Immediately open WhatsApp to notify worker upon clicking Save</span>
                                </label>
                            </div>
                        )}
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

                    {/* SEPARATE BUTTONS FOR SAVE AND DISPATCH */}
                    <div className="admin-action-btn-group">
                        <button
                            className="admin-save-btn"
                            type="button"
                            onClick={(e) => onSaveAdmin(e, { shouldOpenWhatsApp: false })}
                            disabled={saving}
                        >
                            {saving ? (
                                'Saving changes...'
                            ) : (
                                <>
                                    <CheckCircle2 size={15} /> Save Changes
                                </>
                            )}
                        </button>

                        {activeWorkerDetails && (
                            <a
                                href={buildWhatsAppUrl(activeWorkerDetails.phone, issue, adminForm)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="admin-dispatch-whatsapp-btn"
                                onClick={() => {
                                    onSaveAdmin(null, { shouldOpenWhatsApp: false })
                                }}
                            >
                                <span>📲</span> Dispatch to {activeWorkerDetails.name.split(' ')[0]} via WhatsApp
                            </a>
                        )}
                    </div>
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

            {/* LIGHTBOX MODAL FOR HIGH-RES PHOTO INSPECTION */}
            {lightboxPhoto && (
                <div className="photo-lightbox-backdrop" onClick={() => setLightboxPhoto(null)}>
                    <div className="photo-lightbox-modal" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="lightbox-close-btn"
                            onClick={() => setLightboxPhoto(null)}
                            aria-label="Close photo"
                        >
                            <X size={18} />
                        </button>
                        <img src={lightboxPhoto} alt="Full resolution proof from MongoDB" className="lightbox-img" />
                        <div className="lightbox-caption">
                            <span>📸 Campus Fix Photo Evidence • Stored in MongoDB Document</span>
                        </div>
                    </div>
                </div>
            )}
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
