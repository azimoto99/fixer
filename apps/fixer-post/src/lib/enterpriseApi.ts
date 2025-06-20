import { api } from './api';
import type { 
  EnterpriseClient, 
  JobTemplate, 
  WorkerPool, 
  BulkJobOperation 
} from '@fixer/shared';

// Enterprise Analytics Types
export interface EnterpriseMetrics {
  jobsPosted: number;
  fillRate: number;
  avgTimeToFill: number;
  totalPayout: number;
  period: string;
}

export interface BulkJobData {
  title: string;
  description: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
    city: string;
    state: string;
    zipCode: string;
  };
  category: 'cleaning' | 'maintenance' | 'security' | 'landscaping' | 'moving';
  payRate: {
    type: 'hourly' | 'fixed';
    amount: number;
    currency: 'USD';
  };
  schedule: {
    startDate: string;
    endDate?: string;
    recurring?: boolean;
    frequency?: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[];
  };
  requirements: string[];
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  workerCount: number;
  estimatedDuration: number;
  clientNotes?: string;
  backgroundCheckRequired: boolean;
  equipmentProvided: boolean;
  parkingAvailable: boolean;
}

export interface BulkJobRequest {
  jobs: BulkJobData[];
  templateId?: string;
  publishImmediately: boolean;
  notifyWorkers: boolean;
  scheduledPublishDate?: string;
}

export interface BulkJobResponse {
  success: boolean;
  operationId: string;
  created: number;
  failed: number;
  jobs: any[];
  failures: any[];
}

export interface WorkerPoolCriteria {
  minimumRating: number;
  requiredSkills: string[];
  backgroundCheckRequired: boolean;
  experienceLevel: 'entry' | 'intermediate' | 'expert';
  maxDistanceFromJobs: number;
  availability: {
    daysOfWeek: number[];
    timeSlots: Array<{
      start: string;
      end: string;
    }>;
  };
  autoInviteToJobs: boolean;
}

export const enterpriseApi = {
  // Analytics
  async getMetrics(period: string = '30d'): Promise<EnterpriseMetrics> {
    const response = await api.get<{ metrics: EnterpriseMetrics }>(`/enterprise/analytics/overview`, { params: { period } });
    return response.data!.metrics; // Use non-null assertion if confident data is present
  },

  async getJobAnalytics(period: string = '30d'): Promise<any> { // Define specific type if known
    const response = await api.get<any>(`/enterprise/analytics/jobs`, { params: { period } });
    return response.data;
  },

  async getWorkerAnalytics(poolId?: string): Promise<any> { // Define specific type if known
    const url = '/enterprise/analytics/workers';
    const params = poolId ? { poolId } : {};
    const response = await api.get<any>(url, { params });
    return response.data;
  },

  async getCostAnalytics(breakdown: string = 'location'): Promise<any> { // Define specific type if known
    const response = await api.get<any>(`/enterprise/analytics/costs`, { params: { breakdown } });
    return response.data;
  },

  // Bulk Job Operations
  async createBulkJobs(request: BulkJobRequest): Promise<BulkJobResponse> {
    const response = await api.post<BulkJobResponse>('/enterprise/jobs/bulk', request);
    return response.data!;
  },

  async updateBulkJobs(jobIds: string[], updates: any): Promise<any> { // Define specific type if known
    const response = await api.put<any>('/enterprise/jobs/bulk', {
      jobIds,
      updates
    });
    return response.data;
  },

  async getBulkOperations(): Promise<BulkJobOperation[]> {
    const response = await api.get<{ operations: BulkJobOperation[] }>('/enterprise/bulk-operations');
    return response.data!.operations;
  },

  async getBulkOperation(operationId: string): Promise<BulkJobOperation> {
    const response = await api.get<{ operation: BulkJobOperation }>(`/enterprise/bulk-operations/${operationId}`);
    return response.data!.operation;
  },

  // Job Templates
  async getTemplates(): Promise<JobTemplate[]> {
    const response = await api.get<{ templates: JobTemplate[] }>('/enterprise/templates');
    return response.data!.templates;
  },

  async createTemplate(template: Partial<JobTemplate>): Promise<JobTemplate> {
    const response = await api.post<{ template: JobTemplate }>('/enterprise/templates', template);
    return response.data!.template;
  },

  async updateTemplate(id: string, template: Partial<JobTemplate>): Promise<JobTemplate> {
    const response = await api.put<{ template: JobTemplate }>(`/enterprise/templates/${id}`, template);
    return response.data!.template;
  },

  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/enterprise/templates/${id}`);
  },

  async generateJobsFromTemplate(
    templateId: string, 
    dateRange: { start: string; end: string },
    locations?: string[],
    overrides?: any
  ): Promise<any> { // Define specific type if known
    const response = await api.post<any>(`/enterprise/templates/${templateId}/generate`, {
      dateRange,
      locations,
      overrides
    });
    return response.data;
  },

  // Worker Pools
  async getWorkerPools(): Promise<WorkerPool[]> {
    const response = await api.get<{ workerPools: WorkerPool[] }>('/enterprise/worker-pools');
    return response.data!.workerPools;
  },

  async createWorkerPool(pool: {
    name: string;
    description?: string;
    criteria: WorkerPoolCriteria;
    workerIds?: string[];
    autoInvite?: boolean;
  }): Promise<WorkerPool> {
    const response = await api.post<{ workerPool: WorkerPool }>('/enterprise/worker-pools', pool);
    return response.data!.workerPool;
  },

  async updateWorkerPool(id: string, pool: Partial<WorkerPool>): Promise<WorkerPool> {
    const response = await api.put<{ workerPool: WorkerPool }>(`/enterprise/worker-pools/${id}`, pool);
    return response.data!.workerPool;
  },

  async deleteWorkerPool(id: string): Promise<void> {
    await api.delete(`/enterprise/worker-pools/${id}`);
  },

  async addWorkersToPool(poolId: string, workerIds: string[]): Promise<void> {
    await api.post(`/enterprise/worker-pools/${poolId}/workers`, { workerIds });
  },

  async removeWorkersFromPool(poolId: string, workerIds: string[]): Promise<void> {
    // For DELETE with body, ensure api.delete handles it or use api.request directly if needed
    await api.delete(`/enterprise/worker-pools/${poolId}/workers`, { workerIds });
  },

  // CSV Import/Export
  async uploadCSV(file: File): Promise<BulkJobResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Use the generic post method from api client for multipart/form-data
    // The api.post method now handles FormData correctly.
    const response = await api.post<BulkJobResponse>('/enterprise/jobs/import-csv', formData);
    return response.data!;
  },

  async downloadTemplate(): Promise<Blob> {
    // Use the generic get method from api client for blob response
    const blob = await api.get('/enterprise/jobs/csv-template', {
      responseType: 'blob',
    });
    return blob;
  },

  async exportJobs(filters?: any): Promise<Blob> {
    const blob = await api.get('/enterprise/jobs/export', {
      params: filters,
      responseType: 'blob',
    });
    return blob;
  },

  // Enterprise Client Management
  async getEnterpriseProfile(): Promise<EnterpriseClient> {
    const response = await api.get<{ enterprise: EnterpriseClient }>('/enterprise/profile');
    return response.data!.enterprise;
  },

  async updateEnterpriseProfile(profile: Partial<EnterpriseClient>): Promise<EnterpriseClient> {
    const response = await api.put<{ enterprise: EnterpriseClient }>('/enterprise/profile', profile);
    return response.data!.enterprise;
  },

  // Compliance & Government Features
  async getComplianceReports(type?: string): Promise<any> { // Define specific type if known
    const response = await api.get<any>('/enterprise/compliance/reports', {
      params: { type }
    });
    return response.data;
  },

  async generateComplianceReport(config: any): Promise<any> { // Define specific type if known
    const response = await api.post<any>('/enterprise/compliance/generate', config);
    return response.data;
  },

  async getPrevailingWageData(location: string, jobType: string): Promise<any> { // Define specific type if known
    const response = await api.get<any>('/enterprise/compliance/prevailing-wage', {
      params: { location, jobType }
    });
    return response.data;
  },

  // Background Check Integration
  async initiateBackgroundCheck(workerId: string, level: string): Promise<any> { // Define specific type if known
    const response = await api.post<any>('/enterprise/background-checks', {
      workerId,
      level
    });
    return response.data;
  },

  async getBackgroundCheckStatus(checkId: string): Promise<any> { // Define specific type if known
    const response = await api.get<any>(`/enterprise/background-checks/${checkId}`);
    return response.data;
  }
};

// Helper functions for CSV processing
export const csvHelpers = {
  downloadTemplate() {
    const csvContent = [
      'title,description,category,address,city,state,zipCode,latitude,longitude,payAmount,payType,estimatedDuration,requirements,urgency,workerCount,backgroundCheckRequired,equipmentProvided,scheduledStart,clientNotes',
      'Office Cleaning,Daily office cleaning and maintenance,cleaning,"123 Main St, Suite 100",Springfield,IL,62701,39.7817,-89.6501,25.00,hourly,2,"vacuuming;dusting;trash removal",medium,1,false,true,2024-01-15T09:00:00Z,Please use eco-friendly products',
      'Lawn Maintenance,Weekly lawn mowing and edging,landscaping,"456 Oak Ave",Springfield,IL,62704,39.7990,-89.6540,150.00,fixed,3,"mowing;edging;leaf removal",low,2,false,true,2024-01-16T08:00:00Z,Equipment storage available in garage'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-jobs-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  },

  validateCSV(file: File): Promise<{ valid: boolean; errors: string[] }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        const errors: string[] = [];
        
        if (lines.length < 2) {
          errors.push('CSV must contain at least a header and one data row');
        }
        
        // Basic validation - could be expanded
        const requiredColumns = [
          'title', 'description', 'category', 'address', 'city', 'state', 
          'zipCode', 'latitude', 'longitude', 'payAmount', 'payType', 
          'estimatedDuration', 'scheduledStart'
        ];
        
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const missingColumns = requiredColumns.filter(col => !headers.includes(col));
          
          if (missingColumns.length > 0) {
            errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
          }
        }
        
        resolve({
          valid: errors.length === 0,
          errors
        });
      };
      reader.readAsText(file);
    });
  }
};
