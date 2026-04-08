import { apiClient } from './apiClient';

export interface Department {
  id: string;
  display_name: string;
  description?: string | null;
  price?: number | string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const departmentService = {
  async getAll() {
    const response = await apiClient.get('/departments');
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/departments/${id}`);
    return response.data;
  },

  async create(data: Partial<Department>) {
    const response = await apiClient.post('/departments', data);
    return response.data;
  },

  async update(id: string, data: Partial<Department>) {
    const response = await apiClient.put(`/departments/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/departments/${id}`);
    return response.data;
  }
};
