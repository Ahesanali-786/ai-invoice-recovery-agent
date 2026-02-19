import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import {
  BuildingOfficeIcon, UsersIcon, DocumentTextIcon, ChartBarIcon, ChartPieIcon,
  UserCircleIcon, Cog6ToothIcon, BellIcon, Bars3Icon, XMarkIcon,
  ChevronDownIcon, CheckIcon, SparklesIcon
} from '@heroicons/react/24/outline'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AIAgentPanel from './AIAgentPanel'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
  { name: 'AI Assistant', href: '/ai-assistant', icon: SparklesIcon },
  { name: 'Clients', href: '/clients', icon: UsersIcon },
  { name: 'Invoices', href: '/invoices', icon: DocumentTextIcon },
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden">
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
          <div className="flex items-center gap-2">
            <BuildingOfficeIcon className="h-8 w-8 text-primary-600" />
            <span className="text-lg font-semibold text-gray-900">Invoice Recovery</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
          >
            {sidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
        {sidebarOpen && (
          <nav className="border-b border-gray-200 bg-white">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium ${location.pathname === item.href
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
            <div className="border-t border-gray-200 my-2"></div>
            {userNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium ${location.pathname === item.href
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        )}
      </div>

      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 items-center gap-2">
            <BuildingOfficeIcon className="h-8 w-8 text-primary-600" />
            <span className="text-lg font-semibold text-gray-900">Invoice Recovery</span>
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${location.pathname === item.href
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            ))}
          </nav>
          <div className="border-t border-gray-200 pt-4">
            {/* Organization Switcher */}
            {currentOrg && organizations && organizations.length >= 1 && (
              <div className="mb-4 relative">
                <button
                  onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <BuildingOfficeIcon className="h-4 w-4 text-primary-600" />
                    <span className="truncate">{currentOrg.name}</span>
                  </div>
                  <ChevronDownIcon className={`h-4 w-4 transition-transform ${orgDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {orgDropdownOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                    {organizations.map((org: any) => (
                      <button
                        key={org.id}
                        onClick={() => !org.is_current && switchOrgMutation.mutate(org.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 ${org.is_current ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                          }`}
                      >
                        <BuildingOfficeIcon className="h-4 w-4" />
                        <span className="flex-1 truncate">{org.name}</span>
                        {org.is_current && <CheckIcon className="h-4 w-4 text-primary-600" />}
                      </button>
                    ))}
                    <div className="border-t border-gray-200 mt-1 pt-1">
                      <Link
                        to="/organizations"
                        onClick={() => setOrgDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-gray-50"
                      >
                        <span className="flex-1">Manage Organizations</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            <nav className="flex flex-col gap-1 mb-3">
              {userNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${location.pathname === item.href
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`}
                alt={user?.name}
                className="h-10 w-10 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
              >
                <span className="sr-only">Logout</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="lg:pl-72">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <AIAgentPanel />
    </div>
  )
}
