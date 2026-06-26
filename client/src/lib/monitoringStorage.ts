const MONITORING_ACTIVITY_KEY = 'monitoring_activity_detail';
const MONITORING_CONTEXT_KEY = 'monitoring_context';

export interface MonitoringContext {
  role: 'prodi' | 'jurusan';
}

export function getMonitoringActivityDetail<T = any>(): T | null {
  try {
    const data = localStorage.getItem(MONITORING_ACTIVITY_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setMonitoringActivityDetail(data: any): void {
  localStorage.setItem(MONITORING_ACTIVITY_KEY, JSON.stringify(data));
}

export function clearMonitoringActivityDetail(): void {
  localStorage.removeItem(MONITORING_ACTIVITY_KEY);
}

export function getMonitoringContext(): MonitoringContext | null {
  try {
    const data = localStorage.getItem(MONITORING_CONTEXT_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setMonitoringContext(ctx: MonitoringContext): void {
  localStorage.setItem(MONITORING_CONTEXT_KEY, JSON.stringify(ctx));
}

export function clearMonitoringContext(): void {
  localStorage.removeItem(MONITORING_CONTEXT_KEY);
}
