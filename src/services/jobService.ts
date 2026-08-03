import { api } from '../lib/api';
import type { MaintenanceRequest, HandymanStats, ServiceCategory, JobStatus } from '../types';
import { authService } from './authService';

async function getHandymanUserId(): Promise<string | null> {
  const user = await authService.getUser();
  return user?.id || null;
}

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
    const token = await authService.getToken();
    const response = await api.get<any[]>('/jobs/available', token);
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to load available jobs');
    }
    return response.data.map(mapJob);
  },

  async getActiveJobs(): Promise<MaintenanceRequest[]> {
    const token = await authService.getToken();
    const profile = await api.get<any>('/handymen/profile', token);
    const handymanId = profile.data?.handymanId;
    if (!handymanId) throw new Error('Handyman profile not found');
    const response = await api.get<any[]>(`/jobs/handyman/${handymanId}/active`, token);
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to load active jobs');
    }
    return response.data.map(mapJob);
  },

  async getCompletedJobs(): Promise<MaintenanceRequest[]> {
    const token = await authService.getToken();
    const profile = await api.get<any>('/handymen/profile', token);
    const handymanId = profile.data?.handymanId;
    if (!handymanId) throw new Error('Handyman profile not found');
    const response = await api.get<any[]>(`/jobs/handyman/${handymanId}`, token);
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to load jobs');
    }
    return response.data.map(mapJob).filter((j) => j.status === 'completed');
  },

  async getJobById(jobId: string): Promise<MaintenanceRequest | null> {
    const token = await authService.getToken();
    const response = await api.get<any>(`/jobs/${jobId}`, token);
    if (response.error || !response.data) return null;
    return mapJob(response.data);
  },

  async acceptJob(jobId: string): Promise<boolean> {
    const token = await authService.getToken();
    const response = await api.post(`/jobs/${jobId}/accept`, {}, token);
    if (response.error) throw new Error(response.error);
    return true;
  },

  async declineJob(jobId: string): Promise<boolean> {
    const token = await authService.getToken();
    const response = await api.post(`/jobs/${jobId}/decline`, {}, token);
    if (response.error) throw new Error(response.error);
    return true;
  },

  async startJob(jobId: string): Promise<boolean> {
    const token = await authService.getToken();
    await api.post(`/jobs/${jobId}/en-route`, {}, token);
    const response = await api.post(`/jobs/${jobId}/start`, {}, token);
    if (response.error) throw new Error(response.error);
    return true;
  },

  async completeJob(
    jobId: string,
    finalAmount?: number,
    paymentMethod: string = 'CASH',
  ): Promise<boolean> {
    const token = await authService.getToken();
    const response = await api.post(
      `/jobs/${jobId}/complete`,
      { finalAmount, paymentMethod },
      token,
    );
    if (response.error) throw new Error(response.error);
    return true;
  },

  async getStats(): Promise<HandymanStats> {
    const active = await this.getActiveJobs().catch(() => []);
    const completed = await this.getCompletedJobs().catch(() => []);
    return {
      pendingJobs: active.length,
      completedToday: completed.filter((j) => {
        if (!j.completedAt) return false;
        const d = new Date(j.completedAt);
        const now = new Date();
        return d.toDateString() === now.toDateString();
      }).length,
      earningsToday: 0,
      rating: 0,
      totalCompleted: completed.length,
    };
  },

  async updateAvailability(available: boolean): Promise<boolean> {
    const token = await authService.getToken();
    const response = await api.put('/handymen/availability', { available }, token);
    if (response.error) throw new Error(response.error);
    return true;
  },

  async registerPushToken(pushToken: string): Promise<void> {
    const token = await authService.getToken();
    await api.put('/handymen/profile', { pushToken }, token);
  },
};
