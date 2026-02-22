import type { MaintenanceRequest, ServiceCategoryInfo } from '../types';

export const SERVICE_CATEGORIES: ServiceCategoryInfo[] = [
  { id: 'plumbing', label: 'Plumbing', icon: '🔧', color: '#3B82F6' },
  { id: 'electrical', label: 'Electrical', icon: '⚡', color: '#F59E0B' },
  { id: 'ac', label: 'AC / HVAC', icon: '❄️', color: '#06B6D4' },
  { id: 'general', label: 'General', icon: '🛠️', color: '#8B5CF6' },
];

export const mockRequests: MaintenanceRequest[] = [
  {
    id: 'r1', tenantId: 'tenant-1', tenantName: 'Ahmed Al Rashid',
    tenantPhone: '+971501234567',
    propertyAddress: 'Marina Tower, Apt 2301, Dubai Marina',
    category: 'ac',
    description: 'AC not cooling properly, making loud noise when turned on. Unit is a split system installed 3 years ago.',
    images: [], status: 'pending',
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    lat: 25.0800, lng: 55.1400, estimatedCost: 450, distance: 2.3,
    estimatedTravelTime: '8 min',
  },
  {
    id: 'r2', tenantId: 'tenant-2', tenantName: 'Fatima Al Maktoum',
    tenantPhone: '+971509876543',
    propertyAddress: 'Burj Vista, Apt 1502, Downtown Dubai',
    category: 'plumbing',
    description: 'Water leaking from bathroom sink, urgent repair needed. Water is pooling on the floor.',
    images: [], status: 'pending',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    lat: 25.2000, lng: 55.2700, estimatedCost: 350, distance: 1.1,
    estimatedTravelTime: '4 min',
  },
  {
    id: 'r3', tenantId: 'tenant-3', tenantName: 'John Smith',
    tenantPhone: '+971508765432',
    propertyAddress: 'Palm View, Villa 45, Palm Jumeirah',
    category: 'electrical',
    description: 'Multiple power outlets not working in living room. Breaker keeps tripping.',
    images: [], status: 'assigned', assignedHandymanId: 'h1',
    assignedHandymanName: 'Current User',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    lat: 25.0650, lng: 55.1700, estimatedCost: 500, distance: 4.5,
    estimatedTravelTime: '15 min',
  },
  {
    id: 'r4', tenantId: 'tenant-4', tenantName: 'Maria Garcia',
    tenantPhone: '+971506543210',
    propertyAddress: 'JBR Walk, Apt 801, JBR',
    category: 'general',
    description: 'Door lock broken, cannot lock front door properly. Need urgent replacement.',
    images: [], status: 'pending',
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    lat: 25.1100, lng: 55.1350, estimatedCost: 200, distance: 3.2,
    estimatedTravelTime: '11 min',
  },
  {
    id: 'r5', tenantId: 'tenant-5', tenantName: 'Khalid Ibrahim',
    tenantPhone: '+971507778899',
    propertyAddress: 'Business Bay Tower, Apt 3201',
    category: 'plumbing',
    description: 'Kitchen faucet dripping constantly. Washer needs replacement.',
    images: [], status: 'pending',
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
    lat: 25.1850, lng: 55.2568, estimatedCost: 250, distance: 1.8,
    estimatedTravelTime: '6 min',
  },
];

export const getCategoryInfo = (category: string): ServiceCategoryInfo | undefined =>
  SERVICE_CATEGORIES.find((c) => c.id === category);

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending': return '#F59E0B';
    case 'assigned': return '#3B82F6';
    case 'accepted': return '#8B5CF6';
    case 'in_progress': return '#059669';
    case 'completed': return '#10B981';
    case 'cancelled': return '#EF4444';
    default: return '#6B7280';
  }
};

