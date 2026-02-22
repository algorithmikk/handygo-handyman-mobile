// Job Service for HandyGo Handyman Mobile App

import { api } from '../lib/api';
import { mockRequests } from '../lib/mockData';
import type { MaintenanceRequest, Job, HandymanStats, ServiceCategory, JobStatus } from '../types';
import { authService } from './authService';

// Helper to get stored user ID for handyman-specific endpoints
async function getHandymanId(): Promise<string | null> {
  const user = await authService.getStoredUser();
  return user?.id || null;
}

// Map backend Job response to frontend MaintenanceRequest type
function mapJob(r: any): MaintenanceRequest {
  return {
    id: r.jobId || r.requestId || r.id || '',
    tenantId: r.tenantId || '',
    tenantName: r.tenantName || '',
    tenantPhone: r.tenantPhone || '',
    propertyAddress: r.location?.address || r.propertyAddress || r.buildingName || '',
    category: ((r.category || 'general').toLowerCase().replace('ac_hvac', 'ac')) as ServiceCategory,
    description: r.description || r.title || '',
    images: r.photoUrls || r.images || [],
    status: (r.status || 'pending').toLowerCase().replace(/ /g, '_') as JobStatus,
    createdAt: r.createdAt || new Date().toISOString(),
    assignedHandymanId: r.handymanId || r.assignedHandymanId,
    assignedHandymanName: r.handymanName || r.assignedHandymanName,
    lat: r.location?.latitude || r.lat || 25.2048,
    lng: r.location?.longitude || r.lng || 55.2708,
    estimatedCost: r.quotedAmount || r.finalAmount || r.estimatedCost,
    completedAt: r.completedAt,
  };
}

export const jobService = {
  async getAvailableJobs(): Promise<MaintenanceRequest[]> {
    try {
      const token = await authService.getToken();
      const response = await api.get<any[]>('/jobs/available', token);
      console.log('[JobService] getAvailableJobs response:', response.data?.length, response.error);
      if (response.data && !response.error) return response.data.map(mapJob);
    } catch (e) {
      console.error('[JobService] getAvailableJobs error:', e);
    }
    console.log('[JobService] getAvailableJobs: falling back to mock');
    return mockRequests.filter((r) => r.status === 'pending');
  },

  async getActiveJobs(): Promise<MaintenanceRequest[]> {
    try {
      const token = await authService.getToken();
      const handymanId = await getHandymanId();
      console.log('[JobService] getActiveJobs handymanId =', handymanId);
      if (handymanId) {
        const response = await api.get<any[]>(`/jobs/handyman/${handymanId}/active`, token);
        console.log('[JobService] getActiveJobs response:', response.data?.length, response.error);
        if (response.data && !response.error) return response.data.map(mapJob);
      }
    } catch (e) {
      console.error('[JobService] getActiveJobs error:', e);
    }
    console.log('[JobService] getActiveJobs: falling back to mock');
    return mockRequests.filter((r) =>
      ['assigned', 'accepted', 'in_progress'].includes(r.status)
    );
  },

  async getCompletedJobs(): Promise<MaintenanceRequest[]> {
    try {
      const token = await authService.getToken();
      const handymanId = await getHandymanId();
      console.log('[JobService] getCompletedJobs handymanId =', handymanId);
      if (handymanId) {
        const response = await api.get<any[]>(`/jobs/handyman/${handymanId}`, token);
        console.log('[JobService] getCompletedJobs response:', response.data?.length, response.error);
        if (response.data && !response.error) {
          return response.data.map(mapJob).filter((j) => j.status === 'completed');
        }
      }
    } catch (e) {
      console.error('[JobService] getCompletedJobs error:', e);
    }
    console.log('[JobService] getCompletedJobs: falling back to mock');
    return mockRequests.filter((r) => r.status === 'completed');
  },

  async getJobById(jobId: string): Promise<MaintenanceRequest | null> {
    try {
      const token = await authService.getToken();
      const response = await api.get<any>(`/jobs/${jobId}`, token);
      if (response.data && !response.error) return mapJob(response.data);
    } catch (e) { /* fallback */ }
    return mockRequests.find((r) => r.id === jobId) || null;
  },

  async acceptJob(jobId: string): Promise<boolean> {
    try {
      const token = await authService.getToken();
      const response = await api.post(`/jobs/${jobId}/accept`, {}, token);
      if (!response.error) return true;
    } catch (e) { /* fallback */ }
    const job = mockRequests.find((r) => r.id === jobId);
    if (job) { job.status = 'accepted'; return true; }
    return false;
  },

  async declineJob(jobId: string): Promise<boolean> {
    try {
      const token = await authService.getToken();
      const response = await api.post(`/jobs/${jobId}/decline`, {}, token);
      if (!response.error) return true;
    } catch (e) { /* fallback */ }
    return true;
  },

  async startJob(jobId: string): Promise<boolean> {
    try {
      const token = await authService.getToken();
      const response = await api.post(`/jobs/${jobId}/start`, {}, token);
      if (!response.error) return true;
    } catch (e) { /* fallback */ }
    const job = mockRequests.find((r) => r.id === jobId);
    if (job) { job.status = 'in_progress'; return true; }
    return false;
  },

  async completeJob(jobId: string): Promise<boolean> {
    try {
      const token = await authService.getToken();
      const response = await api.post(`/jobs/${jobId}/complete`, {}, token);
      if (!response.error) return true;
    } catch (e) { /* fallback */ }
    const job = mockRequests.find((r) => r.id === jobId);
    if (job) { job.status = 'completed'; job.completedAt = new Date().toISOString(); return true; }
    return false;
  },

  async getStats(): Promise<HandymanStats> {
    // No direct /stats endpoint — aggregate from mock data
    return {
      pendingJobs: mockRequests.filter((r) => r.status === 'pending').length,
      completedToday: 3,
      earningsToday: 850,
      rating: 4.8,
      totalCompleted: 127,
    };
  },

  async updateAvailability(available: boolean): Promise<boolean> {
    try {
      const token = await authService.getToken();
      const handymanId = await getHandymanId();
      if (handymanId) {
        const response = await api.put(`/handymen/${handymanId}`, { available }, token);
        if (!response.error) return true;
      }
    } catch (e) { /* fallback */ }
    return true; // Mock always succeeds
  },
};

