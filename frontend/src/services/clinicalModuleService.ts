import { apiClient } from './apiClient';
import type { Patient } from '@/types';

export interface ClinicalModuleRecord {
  id: string;
  module_key: string;
  data: Record<string, any>;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ClinicalModuleReferences {
  patients: Patient[];
  doctors: Array<{ id: string; name: string; specialty?: string }>;
}

export const clinicalModuleService = {
  async getAll(moduleKey: string, search = '') {
    const response = await apiClient.get(`/clinical-modules/${moduleKey}`, {
      params: search ? { search } : undefined
    });
    return response.data;
  },

  async getReferences(moduleKey: string): Promise<{ success: boolean; data: ClinicalModuleReferences }> {
    const response = await apiClient.get(`/clinical-modules/${moduleKey}/references`);
    return response.data;
  },

  async create(moduleKey: string, payload: Partial<ClinicalModuleRecord>) {
    const response = await apiClient.post(`/clinical-modules/${moduleKey}`, payload);
    return response.data;
  },

  async update(moduleKey: string, id: string, payload: Partial<ClinicalModuleRecord>) {
    const response = await apiClient.put(`/clinical-modules/${moduleKey}/${id}`, payload);
    return response.data;
  },

  async delete(moduleKey: string, id: string) {
    const response = await apiClient.delete(`/clinical-modules/${moduleKey}/${id}`);
    return response.data;
  }
};