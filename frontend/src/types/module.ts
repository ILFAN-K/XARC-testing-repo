/** Status a module can have. */
export type ModuleStatus = 'ACTIVE' | 'READY' | 'INACTIVE' | 'ERROR';

/** A single training/safety module. */
export interface Module {
  id: string;
  /** Module display name, e.g. "Fire Safety VR 2.0" */
  name: string;
  /** Short descriptor, e.g. "Industrial Emergency Protocol" */
  description: string;
  /** Semantic version string */
  version: string;
  /** Icon key for the card (mapped to Lucide icons) */
  iconKey: 'flame' | 'zap' | 'forklift' | 'shield' | 'hard-hat' | 'box';
  
  /** License Type */
  licenseType: string;
  /** Number of purchased licenses */
  purchasedLicenses: number;
  /** Number of currently licensed systems */
  licensedSystems: number;
  /** Number of available licenses */
  availableLicenses: number;
  /** List of assigned systems */
  assignedSystemsList: { id: string; deviceId?: string; name: string; location?: string; device?: any }[];

  /** Current operational status */
  status: ModuleStatus;
  /** Badge label displayed on the card (e.g. "ACTIVE", "READY") — API-ready */
  badgeLabel?: string;
}

/** Summary stat for the modules page header. */
export interface ModuleSummaryStat {
  id: string;
  label: string;
  value: string | number;
  /** Optional sub-text below the value */
  subText?: string;
  /** Optional sub-text colour variant */
  subTextVariant?: 'success' | 'warning' | 'default';
  /** Optional progress bar (0–100) */
  progress?: number;
}
