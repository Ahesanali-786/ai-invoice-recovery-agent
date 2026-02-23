import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import {
  BuildingOfficeIcon, UsersIcon, DocumentTextIcon, ChartPieIcon,
  UserCircleIcon, Cog6ToothIcon, Bars3Icon, XMarkIcon,
  ChevronDownIcon, CheckIcon, SparklesIcon, PlusIcon,
  ArrowRightOnRectangleIcon, HomeIcon, BellIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AIAgentPanel from './AIAgentPanel'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'AI Assistant', href: '/ai-assistant', icon: SparklesIcon },
  { name: 'Clients', href: '/clients', icon: UsersIcon },
  { name: 'Invoices', href: '/invoices', icon: DocumentTextIcon },
  { name: 'Create Invoice', href: '/invoices/create', icon: PlusIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartPieIcon },
]

const userNavigation = [
  { name: 'Organizations', href: '/organizations', icon: BuildingOfficeIcon },
  { name: 'Profile', href: '/profile', icon: UserCircleIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: organizations } = useQuery('organizations', () =>
    axios.get('/api/organizations').then(res => res.data),
    { enabled: !!user }
  )

  const currentOrg = organizations?.find((org: any) => org.is_current)

  const switchOrgMutation = useMutation(
    (orgId: number) => axios.post(`/api/organizations/${orgId}/switch`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('organizations')
        queryClient.invalidateQueries('user')
        toast.success('Organization switched')
        setOrgDropdownOpen(false)
      },
      onError: () => {
        toast.error('Failed to switch organization')
      },
    }
  )

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/')

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50">
        <div className="flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
              <DocumentTextIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">Invoice Recovery</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {sidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <span className="font-semibold text-slate-900">Menu</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <XMarkIcon className="h-5 w-5 text-slate-500" />
                </button>
              </div>
              <div className="p-4 space-y-6">
                {/* Main Nav */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Menu</p>
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive(item.href)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className={`h-5 w-5 ${isActive(item.href) ? 'text-blue-600' : 'text-slate-400'}`} />
                      {item.name}
                    </Link>
                  ))}
                </div>

                {/* Settings */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Settings</p>
                  {userNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive(item.href)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className={`h-5 w-5 ${isActive(item.href) ? 'text-blue-600' : 'text-slate-400'}`} />
                      {item.name}
                    </Link>
                  ))}
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col bg-white border-r border-slate-200">
          {/* Logo Section */}
          <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-100">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
              <DocumentTextIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Invoice Recovery
            </span>
          </div>

          <div className="flex-1 flex flex-col overflow-y-auto py-4">
            {/* Main Navigation */}
            <nav className="flex-1 px-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${isActive(item.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <div className={`p-1.5 rounded-md transition-colors ${isActive(item.href) ? 'bg-blue-100' : 'bg-slate-100 group-hover:bg-white'}`}>
                    <item.icon className={`h-4 w-4 ${isActive(item.href) ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'}`} />
                  </div>
                  <span className="truncate">{item.name}</span>
                  {item.name === 'AI Assistant' && (
                    <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full">
                      New
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            {/* Bottom Section */}
            <div className="px-3 pt-4 mt-4 border-t border-slate-100 space-y-4">
              {/* Organization Switcher */}
              {currentOrg && organizations && organizations.length >= 1 && (
                <div className="relative">
                  <button
                    onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all border border-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-md flex items-center justify-center">
                        <BuildingOfficeIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className="truncate max-w-[140px]">{currentOrg.name}</span>
                    </div>
                    <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform ${orgDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {orgDropdownOpen && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        {organizations.map((org: any) => (
                          <button
                            key={org.id}
                            onClick={() => !org.is_current && switchOrgMutation.mutate(org.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg transition-colors ${org.is_current ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                              }`}
                          >
                            <BuildingOfficeIcon className="h-4 w-4" />
                            <span className="flex-1 truncate">{org.name}</span>
                            {org.is_current && <CheckIcon className="h-4 w-4 text-blue-600" />}
                          </button>
                        ))}
                        <div className="border-t border-slate-100 mt-1 pt-1">
                          <Link
                            to="/organizations"
                            onClick={() => setOrgDropdownOpen(false)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <PlusIcon className="h-4 w-4" />
                            <span className="flex-1">Manage Organizations</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* User Navigation */}
              <div className="space-y-1">
                {userNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${isActive(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <item.icon className={`h-4 w-4 ${isActive(item.href) ? 'text-blue-600' : 'text-slate-400'}`} />
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* User Profile & Logout */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <div className="flex items-center gap-3">
                  <img
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=0D8ABC&color=fff`}
                    alt={user?.name}
                    className="h-10 w-10 rounded-full ring-2 ring-white shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:pl-72 min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left - Page Title & Breadcrumb */}
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-slate-900">
                {navigation.find(n => isActive(n.href))?.name || 'Dashboard'}
              </h1>
            </div>

            {/* Right - Search, Notifications, Profile */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-64 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <BellIcon className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    3
                  </span>
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50">
                    <div className="p-4 border-b border-slate-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">Notifications</h3>
                        <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                          Mark all read
                        </button>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <div className="p-3 hover:bg-slate-50 border-b border-slate-100 cursor-pointer">
                        <p className="text-sm text-slate-800 font-medium">Payment Received</p>
                        <p className="text-xs text-slate-500 mt-0.5">Invoice #INV-001 paid by Client ABC</p>
                        <p className="text-xs text-slate-400 mt-1">2 minutes ago</p>
                      </div>
                      <div className="p-3 hover:bg-slate-50 border-b border-slate-100 cursor-pointer">
                        <p className="text-sm text-slate-800 font-medium">Overdue Invoice</p>
                        <p className="text-xs text-slate-500 mt-0.5">Invoice #INV-015 is now overdue</p>
                        <p className="text-xs text-slate-400 mt-1">1 hour ago</p>
                      </div>
                      <div className="p-3 hover:bg-slate-50 cursor-pointer">
                        <p className="text-sm text-slate-800 font-medium">New Client Added</p>
                        <p className="text-xs text-slate-500 mt-0.5">TechStart Inc. has been added</p>
                        <p className="text-xs text-slate-400 mt-1">3 hours ago</p>
                      </div>
                    </div>
                    <div className="p-3 border-t border-slate-100">
                      <Link to="/notifications" className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                        View all notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-3 p-1.5 pr-3 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <img
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=0D8ABC&color=fff`}
                    alt={user?.name}
                    className="h-8 w-8 rounded-full ring-2 ring-white shadow-sm"
                  />
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl z-50">
                    <div className="p-4 border-b border-slate-100">
                      <p className="font-semibold text-slate-900">{user?.name}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <nav className="p-2">
                      {userNavigation.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setProfileDropdownOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.href) ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          <item.icon className={`h-4 w-4 ${isActive(item.href) ? 'text-blue-600' : 'text-slate-400'}`} />
                          {item.name}
                        </Link>
                      ))}
                    </nav>
                    <div className="p-2 border-t border-slate-100">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <AIAgentPanel />
    </div>
  )
}
