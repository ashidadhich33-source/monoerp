import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null) {
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.api.defaults.headers.common['Authorization'];
    }
  }

  // Auth endpoints
  async login(employeeCode: string, password: string, macAddress?: string) {
    const response: AxiosResponse = await this.api.post('/api/auth/login', {
      employee_code: employeeCode,
      password: password,
      mac_address: macAddress
    });
    return response.data;
  }

  async logout() {
    const response: AxiosResponse = await this.api.post('/api/auth/logout');
    return response.data;
  }

  async verifyNetwork() {
    const response: AxiosResponse = await this.api.get('/api/auth/verify-network');
    return response.data;
  }

  // Staff endpoints
  async getStaffDashboard(staffId: number) {
    const response: AxiosResponse = await this.api.get(`/api/staff/dashboard/${staffId}`);
    return response.data;
  }

  async checkIn(macAddress?: string) {
    const response: AxiosResponse = await this.api.post('/api/staff/attendance/check-in', {
      mac_address: macAddress
    });
    return response.data;
  }

  async checkOut() {
    const response: AxiosResponse = await this.api.post('/api/staff/attendance/check-out');
    return response.data;
  }

  async getAttendanceHistory(limit: number = 30) {
    const response: AxiosResponse = await this.api.get(`/api/staff/attendance/history?limit=${limit}`);
    return response.data;
  }

  async getPersonalSales(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response: AxiosResponse = await this.api.get(`/api/staff/sales/personal?${params}`);
    return response.data;
  }

  async getAllStaffSales(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response: AxiosResponse = await this.api.get(`/api/staff/sales/all-staff?${params}`);
    return response.data;
  }

  async getRankings(periodType: string) {
    const response: AxiosResponse = await this.api.get(`/api/staff/rankings/${periodType}`);
    return response.data;
  }

  async getSalaryDetails(monthYear: string) {
    const response: AxiosResponse = await this.api.get(`/api/staff/salary/details/${monthYear}`);
    return response.data;
  }

  async getCurrentTargets() {
    const response: AxiosResponse = await this.api.get('/api/staff/targets/current');
    return response.data;
  }

  async getAchievements() {
    const response: AxiosResponse = await this.api.get('/api/staff/achievements');
    return response.data;
  }

  // Admin endpoints
  async getStaffList(skip: number = 0, limit: number = 100) {
    const response: AxiosResponse = await this.api.get(`/api/admin/staff/list?skip=${skip}&limit=${limit}`);
    return response.data;
  }

  async createStaff(staffData: any) {
    const response: AxiosResponse = await this.api.post('/api/admin/staff/create', staffData);
    return response.data;
  }

  async updateStaff(staffId: number, staffData: any) {
    const response: AxiosResponse = await this.api.put(`/api/admin/staff/update/${staffId}`, staffData);
    return response.data;
  }

  async deleteStaff(staffId: number) {
    const response: AxiosResponse = await this.api.delete(`/api/admin/staff/delete/${staffId}`);
    return response.data;
  }

  async addSales(salesData: any) {
    const response: AxiosResponse = await this.api.post('/api/admin/sales/add', salesData);
    return response.data;
  }

  async bulkUploadSales(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response: AxiosResponse = await this.api.post('/api/admin/sales/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getSalesReport(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response: AxiosResponse = await this.api.get(`/api/admin/sales/report?${params}`);
    return response.data;
  }

  async setTarget(targetData: any) {
    const response: AxiosResponse = await this.api.post('/api/admin/targets/set', targetData);
    return response.data;
  }

  async getTargetsList() {
    const response: AxiosResponse = await this.api.get('/api/admin/targets/list');
    return response.data;
  }

  async addBrand(brandData: any) {
    const response: AxiosResponse = await this.api.post('/api/admin/brands/add', brandData);
    return response.data;
  }

  async getBrandsList() {
    const response: AxiosResponse = await this.api.get('/api/admin/brands/list');
    return response.data;
  }

  async issueAdvance(advanceData: any) {
    const response: AxiosResponse = await this.api.post('/api/admin/advance/issue', advanceData);
    return response.data;
  }

  async getAdvancesList() {
    const response: AxiosResponse = await this.api.get('/api/admin/advance/list');
    return response.data;
  }

  async calculateSalaries(monthYear: string) {
    const response: AxiosResponse = await this.api.get(`/api/admin/salary/calculate/${monthYear}`);
    return response.data;
  }

  async approveSalaries(monthYear?: string) {
    const params = monthYear ? `?month_year=${monthYear}` : '';
    const response: AxiosResponse = await this.api.post(`/api/admin/salary/approve${params}`);
    return response.data;
  }

  async getSalaryReport(monthYear?: string) {
    const params = monthYear ? `?month_year=${monthYear}` : '';
    const response: AxiosResponse = await this.api.get(`/api/admin/salary/report${params}`);
    return response.data;
  }

  async createBackup() {
    const response: AxiosResponse = await this.api.post('/api/admin/backup/create');
    return response.data;
  }

  async listBackups() {
    const response: AxiosResponse = await this.api.get('/api/admin/backup/list');
    return response.data;
  }

  async restoreBackup(backupId: string) {
    const response: AxiosResponse = await this.api.post(`/api/admin/backup/restore/${backupId}`);
    return response.data;
  }

  async getBackupStatus() {
    const response: AxiosResponse = await this.api.get('/api/admin/backup/status');
    return response.data;
  }
}

export const apiService = new ApiService();