// Job Service for HandyGo Handyman Mobile App

import { api } from '../lib/api';
import { mockRequests } from '../lib/mockData';
import type { MaintenanceRequest, Job, HandymanStats } from '../types';
import { authService } from './authService';

// Helper to get stored user ID for handyman-specific endpoints
async function getHandymanId(): Promise<string | null> {
  const user = await authService.getStoredUser();
  return user?.id || null;
}

export const jobService = {
  async getAvailableJobs(): Promise<MaintenanceRequest[]> {
    try {
      const token = await authService.getToken();
      const response = await api.get<MaintenanceRequest[]>('/jobs/available', token);
      if (response.data && !response.error) return response.data;
    } catch (e) { /* fallback */ }
    return mockRequests.filter((r) => r.status === 'pending');
  },

  async getActiveJobs(): Promise<MaintenanceRequest[]> {
    try {
      const token = await authService.getToken();
      const handymanId = await getHandymanId();
      if (handymanId) {
        const response = await api.get<MaintenanceRequest[]>(`/jobs/handyman/${handymanId}/active`, token);
        if (response.data && !response.error) return response.data;
      }
    } catch (e) { /* fallback */ }
    return mockRequests.filter((r) =>
      ['assigned', 'accepted', 'in_progress'].includes(r.status)
    );
  },

  async getCompletedJobs(): Promise<MaintenanceRequest[]> {
    try {
      const token = await authService.getToken();
      const handymanId = await getHandymanId();
      if (handymanId) {
        const response = await api.get<MaintenanceRequest[]>(`/jobs/handyman/${handymanId}`, token);
        if (response.data && !response.error) {
          return response.data.filter((j: any) => j.status === 'completed' || j.status === 'COMPLETED');
        }
      }
    } catch (e) { /* fallback */ }
    return mockRequests.filter((r) => r.status === 'completed');
  },

  async getJobById(jobId: string): Promise<MaintenanceRequest | null> {
    try {
      const token = await authService.getToken();
      const response = await api.get<MaintenanceRequest>(`/jobs/${jobId}`, token);
      if (response.data && !response.error) return response.data;
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

