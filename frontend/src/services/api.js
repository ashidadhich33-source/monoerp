import axios from 'axios';
import { handleApiError, showErrorToast, showSuccessToast } from '../utils/errorHandler';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
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
        
        // Show error toast for non-401 errors
        if (error.response?.status !== 401) {
          const errorMessage = handleApiError(error, 'API request');
          showErrorToast(errorMessage);
        }
        
        return Promise.reject(error);
      }
    );
  }

  setToken(token) {
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.api.defaults.headers.common['Authorization'];
    }
  }

  // Auth endpoints
  async login(name, password, macAddress) {
    const response = await this.api.post('/api/auth/login', {
      name: name,
      password: password,
      mac_address: macAddress
    });
    return response.data;
  }

  async logout() {
    const response = await this.api.post('/api/auth/logout');
    return response.data;
  }

  async verifyNetwork() {
    const response = await this.api.get('/api/auth/verify-network');
    return response.data;
  }

  // Staff endpoints
  async getStaffDashboard(staffId) {
    const response = await this.api.get(`/api/staff/dashboard/${staffId}`);
    return response.data;
  }

  async checkIn(macAddress) {
    const response = await this.api.post('/api/staff/attendance/check-in', {
      mac_address: macAddress
    });
    return response.data;
  }

  async checkOut() {
    const response = await this.api.post('/api/staff/attendance/check-out');
    return response.data;
  }

  async getAttendanceHistory(limit = 30) {
    const response = await this.api.get(`/api/staff/attendance/history?limit=${limit}`);
    return response.data;
  }

  async getPersonalSales(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await this.api.get(`/api/staff/sales/personal?${params}`);
    return response.data;
  }

  async getAllStaffSales(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await this.api.get(`/api/staff/sales/all-staff?${params}`);
    return response.data;
  }

  async getRankings(periodType) {
    const response = await this.api.get(`/api/staff/rankings/${periodType}`);
    return response.data;
  }

  async getSalaryDetails(monthYear) {
    const response = await this.api.get(`/api/staff/salary/details/${monthYear}`);
    return response.data;
  }

  async getCurrentTargets() {
    const response = await this.api.get('/api/staff/targets/current');
    return response.data;
  }

  async getAchievements() {
    const response = await this.api.get('/api/staff/achievements');
    return response.data;
  }

  // Admin endpoints
  async getAdminDashboard() {
    const response = await this.api.get('/api/admin/dashboard');
    return response.data;
  }

  async getStaffList(skip = 0, limit = 100) {
    const response = await this.api.get(`/api/admin/staff/list?skip=${skip}&limit=${limit}`);
    return response.data;
  }

  async createStaff(staffData) {
    const response = await this.api.post('/api/admin/staff/create', staffData);
    return response.data;
  }

  async updateStaff(staffId, staffData) {
    const response = await this.api.put(`/api/admin/staff/update/${staffId}`, staffData);
    return response.data;
  }

  async deleteStaff(staffId) {
    const response = await this.api.delete(`/api/admin/staff/delete/${staffId}`);
    return response.data;
  }

  async addSales(salesData) {
    const response = await this.api.post('/api/admin/sales/add', salesData);
    return response.data;
  }

  async bulkUploadSales(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await this.api.post('/api/admin/sales/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getSalesReport(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await this.api.get(`/api/admin/sales/report?${params}`);
    return response.data;
  }

  async setTarget(targetData) {
    const response = await this.api.post('/api/admin/targets/set', targetData);
    return response.data;
  }

  async getTargetsList() {
    const response = await this.api.get('/api/admin/targets/list');
    return response.data;
  }

  async addBrand(brandData) {
    const response = await this.api.post('/api/admin/brands/add', brandData);
    return response.data;
  }

  async getBrands() {
    const response = await this.api.get('/api/admin/brands/list');
    return response.data;
  }

  async createBrand(brandData) {
    const response = await this.api.post('/api/admin/brands/add', brandData);
    return response.data;
  }

  async updateBrand(brandId, brandData) {
    const response = await this.api.put(`/api/admin/brands/update/${brandId}`, brandData);
    return response.data;
  }

  async deleteBrand(brandId) {
    const response = await this.api.delete(`/api/admin/brands/delete/${brandId}`);
    return response.data;
  }

  async issueAdvance(advanceData) {
    const response = await this.api.post('/api/admin/advance/issue', advanceData);
    return response.data;
  }

  async getAdvances() {
    const response = await this.api.get('/api/admin/advance/list');
    return response.data;
  }

  async addAdvance(advanceData) {
    const response = await this.api.post('/api/admin/advance/issue', advanceData);
    return response.data;
  }

  async updateAdvanceDeduction(advanceId, deductionData) {
    const response = await this.api.put(`/api/admin/advance/update-deduction/${advanceId}`, deductionData);
    return response.data;
  }

  async deleteAdvance(advanceId) {
    const response = await this.api.delete(`/api/admin/advance/delete/${advanceId}`);
    return response.data;
  }

  async calculateSalaries(monthYear) {
    const response = await this.api.get(`/api/admin/salary/calculate/${monthYear}`);
    return response.data;
  }

  async approveSalaries(monthYear) {
    const params = monthYear ? `?month_year=${monthYear}` : '';
    const response = await this.api.post(`/api/admin/salary/approve${params}`);
    return response.data;
  }

  async getSalaryReport(monthYear) {
    const params = monthYear ? `?month_year=${monthYear}` : '';
    const response = await this.api.get(`/api/admin/salary/report${params}`);
    return response.data;
  }

  async createBackup() {
    const response = await this.api.post('/api/admin/backup/create');
    return response.data;
  }

  async listBackups() {
    const response = await this.api.get('/api/admin/backup/list');
    return response.data;
  }

  async restoreBackup(backupId) {
    const response = await this.api.post(`/api/admin/backup/restore/${backupId}`);
    return response.data;
  }

  async getBackupStatus() {
    const response = await this.api.get('/api/admin/backup/status');
    return response.data;
  }

  // Setup endpoints
  async getSetupStatus() {
    const response = await this.api.get('/api/setup/status');
    return response.data;
  }

  // Company info for salary slips
  async getCompanyInfo() {
    const response = await this.api.get('/api/admin/company-info');
    return response.data;
  }

  async createCompany(companyData) {
    const response = await this.api.post('/api/setup/company', companyData);
    return response.data;
  }

  async createAdmin(adminData) {
    const response = await this.api.post('/api/setup/admin', adminData);
    return response.data;
  }

  async completeSetup(setupData) {
    const response = await this.api.post('/api/setup/complete', setupData);
    return response.data;
  }

  // Missing admin endpoints
  async updateSales(salesId, salesData) {
    const response = await this.api.put(`/api/admin/sales/update/${salesId}`, salesData);
    return response.data;
  }

  async deleteSales(salesId) {
    const response = await this.api.delete(`/api/admin/sales/delete/${salesId}`);
    return response.data;
  }

  async updateTarget(targetId, targetData) {
    const response = await this.api.put(`/api/admin/targets/update/${targetId}`, targetData);
    return response.data;
  }

  async deleteTarget(targetId) {
    const response = await this.api.delete(`/api/admin/targets/delete/${targetId}`);
    return response.data;
  }

  async updateBrand(brandId, brandData) {
    const response = await this.api.put(`/api/admin/brands/update/${brandId}`, brandData);
    return response.data;
  }

  async deleteBrand(brandId) {
    const response = await this.api.delete(`/api/admin/brands/delete/${brandId}`);
    return response.data;
  }

  async updateAdvance(advanceId, advanceData) {
    const response = await this.api.put(`/api/admin/advance/update/${advanceId}`, advanceData);
    return response.data;
  }

  async deleteAdvance(advanceId) {
    const response = await this.api.delete(`/api/admin/advance/delete/${advanceId}`);
    return response.data;
  }

  // Staff management endpoints
  async updateStaffStatus(staffId, isActive) {
    const response = await this.api.put(`/api/admin/staff/update/${staffId}`, { is_active: isActive });
    return response.data;
  }

  // Salary management endpoints
  async getSalaryList(monthYear) {
    const params = monthYear ? `?month_year=${monthYear}` : '';
    const response = await this.api.get(`/api/admin/salary/report${params}`);
    return response.data;
  }

  async approveSalary(salaryId) {
    const response = await this.api.put(`/api/admin/salary/approve/${salaryId}`);
    return response.data;
  }

  async rejectSalary(salaryId) {
    const response = await this.api.put(`/api/admin/salary/reject/${salaryId}`);
    return response.data;
  }

  async bulkApproveSalary(monthYear) {
    const params = monthYear ? `?month_year=${monthYear}` : '';
    const response = await this.api.post(`/api/admin/salary/approve${params}`);
    return response.data;
  }

  // Attendance management endpoints
  async getAllStaffAttendance(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await this.api.get(`/api/admin/attendance/report?${params}`);
    return response.data;
  }

  async updateAttendance(attendanceId, attendanceData) {
    const response = await this.api.put(`/api/admin/attendance/update/${attendanceId}`, attendanceData);
    return response.data;
  }

  // Reports endpoints
  async getSalesReport(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await this.api.get(`/api/admin/reports/sales?${params}`);
    return response.data;
  }

  async getAttendanceReport(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await this.api.get(`/api/admin/reports/attendance?${params}`);
    return response.data;
  }

  async getPerformanceReport(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await this.api.get(`/api/admin/reports/performance?${params}`);
    return response.data;
  }

  // Settings endpoints
  async getSystemSettings() {
    const response = await this.api.get('/api/admin/settings');
    return response.data;
  }

  async updateSystemSettings(settings) {
    const response = await this.api.put('/api/admin/settings', settings);
    return response.data;
  }

  // Staff specific endpoints
  async getCurrentTargets() {
    const response = await this.api.get('/api/staff/targets/current');
    return response.data;
  }

  async getAchievements() {
    const response = await this.api.get('/api/staff/achievements');
    return response.data;
  }

  async getRankings(periodType) {
    const response = await this.api.get(`/api/staff/rankings/${periodType}`);
    return response.data;
  }

  // File upload endpoints
  async uploadSalesExcel(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await this.api.post('/api/admin/sales/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Export endpoints
  async exportSalesCSV(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await this.api.get(`/api/admin/reports/sales/export/csv?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async exportSalesPDF(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await this.api.get(`/api/admin/reports/sales/export/pdf?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async exportAttendanceCSV(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await this.api.get(`/api/admin/reports/attendance/export/csv?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async exportAttendancePDF(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await this.api.get(`/api/admin/reports/attendance/export/pdf?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async generateSalarySlipPDF(staffId, monthYear) {
    const response = await this.api.get(`/api/admin/salary/slip/${staffId}/${monthYear}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Template download endpoints
  async downloadSalesTemplate() {
    const response = await this.api.get('/api/admin/sales/template', {
      responseType: 'blob'
    });
    return response.data;
  }

  async downloadAttendanceTemplate() {
    const response = await this.api.get('/api/admin/attendance/template', {
      responseType: 'blob'
    });
    return response.data;
  }

  // Notification endpoints
  async getNotifications(limit = 50, offset = 0, unreadOnly = false) {
    const params = new URLSearchParams();
    params.append('limit', limit);
    params.append('offset', offset);
    if (unreadOnly) params.append('unread_only', 'true');
    
    const response = await this.api.get(`/api/admin/notifications?${params}`);
    return response.data;
  }

  async markNotificationRead(notificationId) {
    const response = await this.api.put(`/api/admin/notifications/${notificationId}/read`);
    return response.data;
  }

  async markAllNotificationsRead() {
    const response = await this.api.put('/api/admin/notifications/read-all');
    return response.data;
  }

  async getNotificationStatistics() {
    const response = await this.api.get('/api/admin/notifications/statistics');
    return response.data;
  }

  async sendAttendanceReminder(staffId) {
    const response = await this.api.post(`/api/admin/notifications/send-attendance-reminder/${staffId}`);
    return response.data;
  }

  async sendSystemAlert(message, alertType = 'system') {
    const response = await this.api.post('/api/admin/notifications/send-system-alert', {
      message,
      alert_type: alertType
    });
    return response.data;
  }

  // Backup endpoints
  async getBackupHistory() {
    const response = await this.api.get('/api/admin/backup/list');
    return response.data;
  }

  async deleteBackup(backupId) {
    const response = await this.api.delete(`/api/admin/backup/delete/${backupId}`);
    return response.data;
  }
}

export const apiService = new ApiService();