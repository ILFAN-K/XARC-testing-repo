import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(organizationId?: string) {
    const orgFilter = organizationId ? { organizationId } : {};

    // Get Device Stats
    const registeredFilter = { ...orgFilter, isRegistered: true };

    const onlineSystems = await this.prisma.device.count({
      where: { ...registeredFilter, status: 'ONLINE' },
    });
    const offlineSystems = await this.prisma.device.count({
      where: { ...registeredFilter, status: 'OFFLINE' },
    });

    // Total registered devices (regardless of license)
    const totalRegisteredPCs = await this.prisma.device.count({
      where: registeredFilter,
    });

    // Unique devices with at least one license
    const totalLicensedPCs = await this.prisma.device.count({
      where: { ...registeredFilter, licenses: { some: {} } },
    });

    // Get Active Licenses
    const deviceIds = (
      await this.prisma.device.findMany({
        where: registeredFilter,
        select: { id: true },
      })
    ).map((d) => d.id);

    const activeLicenses = await this.prisma.systemLicense.count({
      where: {
        deviceId: { in: deviceIds },
        status: 'Active',
      },
    });

    // License Utilization calculation
    let totalPurchasedLicenses = 0;
    if (organizationId) {
      const org = await this.prisma.organization.findUnique({
        where: { orgId: organizationId },
        select: { licenseQuota: true },
      });
      if (org) totalPurchasedLicenses = org.licenseQuota;
    } else {
      // Fallback if no org specified - sum all quotas
      const orgs = await this.prisma.organization.findMany({
        select: { licenseQuota: true },
      });
      totalPurchasedLicenses = orgs.reduce((sum, o) => sum + o.licenseQuota, 0);
    }

    let licenseUtilization = 0;
    if (totalPurchasedLicenses > 0) {
      licenseUtilization = (activeLicenses / totalPurchasedLicenses) * 100;
    }

    return {
      totalRegisteredPCs,
      totalLicensedPCs,
      onlineSystems,
      offlineSystems,
      activeLicenses,
      totalPurchasedLicenses,
      licenseUtilization: parseFloat(licenseUtilization.toFixed(1)),
    };
  }

  async getLicenseStatus(organizationId?: string) {
    const orgDeviceFilter = organizationId
      ? { device: { organizationId } }
      : {};

    const active = await this.prisma.systemLicense.count({
      where: { status: 'Active', ...orgDeviceFilter },
    });
    const expiring = await this.prisma.systemLicense.count({
      where: { status: 'Expiring', ...orgDeviceFilter },
    });
    const expired = await this.prisma.systemLicense.count({
      where: { status: 'Expired', ...orgDeviceFilter },
    });

    return {
      active,
      expiring,
      expired,
    };
  }

  async getPerformance(organizationId?: string) {
    // 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orgFilter = organizationId ? { device: { organizationId } } : {};
    const metrics = await this.prisma.usageMetric.findMany({
      where: {
        metricDate: { gte: thirtyDaysAgo },
        ...orgFilter,
      },
      orderBy: {
        metricDate: 'asc',
      },
    });

    const totalUsageHours = metrics.reduce((sum, m) => sum + m.usageHours, 0);

    // Group by date to get daily usage
    const dailyMap = new Map<string, number>();
    for (const m of metrics) {
      const dateStr = m.metricDate.toISOString().split('T')[0];
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + m.usageHours);
    }

    const dailyUsage = Array.from(dailyMap.values());
    const dailyLabels = Array.from(dailyMap.keys());

    return {
      totalUsageHours: Math.round(totalUsageHours),
      period: '30d',
      dailyUsage: dailyUsage.length > 0 ? dailyUsage : [0, 0, 0, 0, 0, 0, 0], // Fallback if no data
      dailyLabels: dailyLabels.length > 0 ? dailyLabels : [],
    };
  }

  async getEfficiency(organizationId?: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const orgFilter = organizationId ? { device: { organizationId } } : {};
    const metrics = await this.prisma.usageMetric.findMany({
      where: {
        metricDate: { gte: sevenDaysAgo },
        ...orgFilter,
      },
      orderBy: {
        metricDate: 'asc',
      },
    });

    let totalEfficiency = 0;
    const dailyMap = new Map<string, { sum: number; count: number }>();

    for (const m of metrics) {
      totalEfficiency += m.efficiency;
      const dateStr = m.metricDate.toISOString().split('T')[0];
      const current = dailyMap.get(dateStr) || { sum: 0, count: 0 };
      dailyMap.set(dateStr, {
        sum: current.sum + m.efficiency,
        count: current.count + 1,
      });
    }

    const percentage =
      metrics.length > 0 ? Math.round(totalEfficiency / metrics.length) : 0;

    const weeklyData = Array.from(dailyMap.values()).map((d) =>
      Math.round(d.sum / d.count),
    );

    return {
      percentage,
      label: 'Module Resource Utilization',
      weeklyData: weeklyData.length > 0 ? weeklyData : [0, 0, 0, 0, 0, 0, 0], // Fallback if no data
    };
  }

  async getModuleEfficiency(organizationId?: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const orgFilter = organizationId ? { device: { organizationId } } : {};
    const metrics = await this.prisma.usageMetric.findMany({
      where: {
        metricDate: { gte: sevenDaysAgo },
        moduleName: { not: null },
        ...orgFilter,
      },
      select: {
        moduleName: true,
        efficiency: true,
      },
    });

    // Group by module and average efficiency
    const moduleMap = new Map<string, { sum: number; count: number }>();
    for (const m of metrics) {
      if (!m.moduleName) continue;
      const current = moduleMap.get(m.moduleName) || { sum: 0, count: 0 };
      moduleMap.set(m.moduleName, {
        sum: current.sum + m.efficiency,
        count: current.count + 1,
      });
    }

    const modules = Array.from(moduleMap.entries()).map(([name, data]) => ({
      name,
      utilization: Math.round(data.sum / data.count),
    }));

    // Sort by utilization descending
    modules.sort((a, b) => b.utilization - a.utilization);

    const averageUtilization =
      modules.length > 0
        ? Math.round(modules.reduce((sum, m) => sum + m.utilization, 0) / modules.length)
        : 0;

    return {
      averageUtilization,
      modules,
    };
  }

  async getLiveSOP(organizationId?: string) {
    const orgFilter = organizationId ? { organizationId } : {};
    const devices = await this.prisma.device.findMany({
      where: { isRegistered: true, ...orgFilter },
      include: {
        licenses: true,
      },
      take: 50,
    });

    const getLicensePriority = (status: string) => {
      const upper = status.toUpperCase();
      if (upper === 'ACTIVE') return 1;
      if (upper === 'EXPIRING') return 2;
      if (upper === 'EXPIRED') return 3;
      if (upper === 'N/A') return 5;
      return 4; // OTHER
    };

    const mappedDevices = devices.map((device) => {
      let moduleName = 'N/A';
      let licenseStatus = 'N/A';

      if (device.licenses && device.licenses.length > 0) {
        // 1. Sort device licenses using LICENSE_PRIORITY
        const sortedLicenses = [...device.licenses].sort((a, b) => {
          return getLicensePriority(a.status) - getLicensePriority(b.status);
        });

        // 2. Select the highest-priority license
        const bestLicense = sortedLicenses[0];
        moduleName = bestLicense.moduleName;
        licenseStatus = bestLicense.status;
      }

      return {
        id: device.id,
        deviceId: device.deviceId,
        systemName: device.friendlyName || device.machineName,
        module: moduleName,
        license: licenseStatus,
        status: device.status,
        health: device.healthScore,
        lastSeen: device.lastSeen ? device.lastSeen.toISOString() : null,
      };
    });

    // Sort final Live SOP array using the same priority ranking
    mappedDevices.sort((a, b) => {
      return getLicensePriority(a.license) - getLicensePriority(b.license);
    });

    return mappedDevices;
  }
}
