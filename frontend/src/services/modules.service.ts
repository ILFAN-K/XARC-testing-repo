import { apiGet, apiPost, apiDelete, apiPatch } from './api';
import { Module } from '@/types/module';

const mapModule = (m: any): Module => ({
  ...m,
  licensedSystems: m.assignedLicenses,
  assignedSystemsList: (m.assignments || []).map((a: any) => ({
    id: a.id,
    deviceId: a.deviceId,
    name: a.device?.friendlyName || a.device?.machineName || 'Unknown System',
    device: a.device,
  })),
  utilizationPercentage: m.utilizationPercentage,
  healthStatus: m.healthStatus,
});

export async function fetchModules(search?: string, filter?: string, sort?: string): Promise<Module[]> {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (filter) params.append('filter', filter.toLowerCase().replace(' ', '-'));
    if (sort) params.append('sort', sort.toLowerCase());
    
    const query = params.toString();
    const data = await apiGet<any[]>(`/modules${query ? `?${query}` : ''}`);
    return data.map(mapModule);
  } catch (error) {
    console.error('Failed to fetch modules:', error);
    return [];
  }
}

export async function fetchModuleDetails(id: string): Promise<Module | null> {
  try {
    const data = await apiGet<any>(`/modules/${id}`);
    return mapModule(data);
  } catch (error) {
    console.error(`Failed to fetch module details for ${id}:`, error);
    return null;
  }
}

export async function fetchAvailableSystems(id: string): Promise<any[]> {
  try {
    return await apiGet<any[]>(`/modules/${id}/available-systems`);
  } catch (error) {
    console.error(`Failed to fetch available systems for module ${id}:`, error);
    return [];
  }
}

export async function assignModuleToSystem(id: string, deviceId: string): Promise<Module | null> {
  try {
    const data = await apiPost<{ deviceId: string }, any>(`/modules/${id}/assign`, { deviceId });
    return mapModule(data);
  } catch (error) {
    console.error(`Failed to assign module ${id} to system ${deviceId}:`, error);
    throw error;
  }
}

export async function assignModuleToSystemsBulk(id: string, deviceIds: string[]): Promise<Module | null> {
  try {
    const data = await apiPost<{ deviceIds: string[] }, any>(`/modules/${id}/assign-bulk`, { deviceIds });
    return mapModule(data);
  } catch (error) {
    console.error(`Failed to bulk assign module ${id} to systems:`, error);
    throw error;
  }
}

export async function getAvailableModulesForLaunch(deviceIds: string[]): Promise<Module[]> {
  try {
    const data = await apiPost<{ deviceIds: string[] }, any>(`/modules/available-for-launch`, { deviceIds });
    return data.map(mapModule);
  } catch (error) {
    console.error(`Failed to fetch available modules for devices:`, error);
    return [];
  }
}

export async function removeModuleAssignment(id: string, assignmentId: string): Promise<Module | null> {
  try {
    const data = await apiDelete<any>(`/modules/${id}/assignments/${assignmentId}`);
    return mapModule(data);
  } catch (error) {
    console.error(`Failed to remove assignment ${assignmentId} from module ${id}:`, error);
    throw error;
  }
}

export async function purchaseModuleLicenses(id: string, additionalLicenses: number): Promise<Module | null> {
  try {
    const data = await apiPatch<{ additionalLicenses: number }, any>(`/modules/${id}/licenses`, { additionalLicenses });
    return mapModule(data);
  } catch (error) {
    console.error(`Failed to purchase licenses for module ${id}:`, error);
    throw error;
  }
}
