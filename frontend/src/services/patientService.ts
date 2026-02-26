import { Patient } from '@/types';
import { apiClient } from './apiClient';

export interface CreatePatientForm {
  nombre_completo: string;
  correo: string;
  telefono: string;
  antecedentes?: string;
}

export const patientService = {
  async getPatients(params: { page?: number; limit?: number; search?: string; isActive?: string } = {}): Promise<{ data: Patient[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.isActive) queryParams.append('isActive', params.isActive);

    const res = await apiClient.get<{ success: boolean; data: Patient[]; pagination: any }>(`/patients?${queryParams.toString()}`);
    return { data: res.data.data, pagination: res.data.pagination };
  },

  async getPatientById(id: string): Promise<Patient | null> {
    const res = await apiClient.get<{ success: boolean; data: Patient }>(`/patients/${id}`);
    return res.data.data;
  },

  async createPatient(data: CreatePatientForm): Promise<Patient> {
    const res = await apiClient.post<{ success: boolean; data: Patient }>('/patients', data);
    return res.data.data;
  },

  async updatePatient(id: string, data: Partial<CreatePatientForm>): Promise<Patient> {
    const res = await apiClient.put<{ success: boolean; data: Patient }>(`/patients/${id}`, data);
    return res.data.data;
  },

  async deletePatient(id: string): Promise<void> {
    await apiClient.delete(`/patients/${id}`);
  },

  async togglePatientStatus(id: string): Promise<Patient> {
    const res = await apiClient.patch<{ success: boolean; data: Patient }>(`/patients/${id}/toggle-status`);
    return res.data.data;
  }
};
