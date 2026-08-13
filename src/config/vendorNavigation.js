import {
  BarChart3,
  ClipboardList,
  Clock,
  Home,
  IndianRupee,
  LifeBuoy,
  UserRound,
  Users,
  Package,
  MessageCircle,
  FileText,
} from 'lucide-react'

export const vendorNavigation = {
  headerTagline: 'Supply crews · attendance · payouts',
  bottomNav: [
    { id: 'home', to: '/vendor', label: 'Home', icon: Home, end: true },
    { id: 'jobs', to: '/vendor/jobs', label: 'Jobs', icon: ClipboardList },
    { id: 'crew', to: '/vendor/crew', label: 'Crew', icon: Users },
    { id: 'earnings', to: '/vendor/earnings', label: 'Pay', icon: IndianRupee },
    { id: 'profile', to: '/vendor/profile', label: 'Profile', icon: UserRound },
  ],
  drawerNav: [
    { id: 'home', to: '/vendor', label: 'Dashboard', icon: Home, end: true },
    { id: 'jobs', to: '/vendor/jobs', label: 'Supply allocations', icon: ClipboardList },
    { id: 'crew', to: '/vendor/crew', label: 'Workforce', icon: Users },
    { id: 'attendance', to: '/vendor/attendance', label: 'Attendance', icon: Clock },
    { id: 'earnings', to: '/vendor/earnings', label: 'Earnings & payouts', icon: IndianRupee },
    { id: 'mart', to: '/vendor/mart', label: 'My Products', icon: Package },
    { id: 'enquiries', to: '/vendor/mart/enquiries', label: 'Product Leads', icon: MessageCircle },
    { id: 'analytics', to: '/vendor/analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'support', to: '/vendor/support', label: 'Support', icon: LifeBuoy },
    { id: 'terms', to: '/vendor/terms', label: 'Terms & Conditions', icon: FileText },
    { id: 'privacy-policy', to: '/vendor/privacy-policy', label: 'Privacy Policy', icon: FileText },
    { id: 'faq', to: '/vendor/faq', label: 'FAQs', icon: FileText },
    { id: 'profile', to: '/vendor/profile', label: 'Profile & KYC', icon: UserRound },
  ],
}

export function getVendorTitle(pathname) {
  if (pathname.startsWith('/vendor/crew/new')) return 'Add crew'
  if (pathname.match(/\/vendor\/crew\/[^/]+$/)) return 'Crew member'
  if (pathname.startsWith('/vendor/crew')) return 'Crew'
  if (pathname.match(/\/vendor\/jobs\/[^/]+$/)) return 'Job'
  if (pathname.startsWith('/vendor/jobs')) return 'Jobs'
  if (pathname.startsWith('/vendor/attendance')) return 'Attendance'
  if (pathname.startsWith('/vendor/earnings')) return 'Earnings'
  if (pathname.startsWith('/vendor/analytics')) return 'Analytics'
  if (pathname.startsWith('/vendor/support')) return 'Support'
  if (pathname.startsWith('/vendor/terms')) return 'Terms'
  if (pathname.startsWith('/vendor/privacy-policy')) return 'Privacy Policy'
  if (pathname.startsWith('/vendor/faq')) return 'FAQs'
  if (pathname.startsWith('/vendor/mart/enquiries')) return 'Product Leads'
  if (pathname.startsWith('/vendor/mart/products')) return 'My Products'
  if (pathname.startsWith('/vendor/mart')) return 'Mart'
  if (pathname.startsWith('/vendor/profile')) return 'Profile'
  return 'Dashboard'
}
