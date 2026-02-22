// TypeScript types for HandyGo Handyman Mobile App

export type ServiceCategory = 'plumbing' | 'electrical' | 'ac' | 'general';
export type JobStatus = 'pending' | 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImageUrl?: string;
  createdAt: string;
}

export interface Handyman {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  services: ServiceCategory[];
  available: boolean;
  rating: number;
  completedJobs: number;
  lat: number;
  lng: number;
  avatar?: string;
}

export interface MaintenanceRequest {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  propertyAddress: string;
  category: ServiceCategory;
  description: string;
  images: string[];
  status: JobStatus;
  createdAt: string;
  assignedHandymanId?: string;
  assignedHandymanName?: string;
  lat: number;
  lng: number;
  estimatedCost?: number;
  completedAt?: string;
  distance?: number;
  estimatedTravelTime?: string;
}

export interface Job {
  id: string;
  requestId: string;
  request: MaintenanceRequest;
  handymanId: string;
  status: JobStatus;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  totalCost: number;
  platformFee: number;
  handymanPayout: number;
}

export interface LoginRequest { email: string; password: string; }
export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  phoneNumber?: string;
  services?: ServiceCategory[];
  serviceCategories?: string[];
  licenseNumber?: string;
  bio?: string;
}
export interface AuthResponse { token: string; user: User; handyman?: Handyman; }

export interface ServiceCategoryInfo {
  id: ServiceCategory;
  label: string;
  icon: string;
  color: string;
}

export interface HandymanStats {
  pendingJobs: number;
  completedToday: number;
  earningsToday: number;
  rating: number;
  totalCompleted: number;
}

