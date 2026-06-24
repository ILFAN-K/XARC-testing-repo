"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleEfficiencyResponseDto = exports.ModuleEfficiencyItemDto = exports.LiveSOPEntryDto = exports.EfficiencyResponseDto = exports.PerformanceResponseDto = exports.LicenseStatusResponseDto = exports.DashboardSummaryResponseDto = exports.GetSummaryQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class GetSummaryQueryDto {
}
exports.GetSummaryQueryDto = GetSummaryQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Organization ID to filter summary metrics by.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetSummaryQueryDto.prototype, "organizationId", void 0);
class DashboardSummaryResponseDto {
}
exports.DashboardSummaryResponseDto = DashboardSummaryResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 142 }),
    __metadata("design:type", Number)
], DashboardSummaryResponseDto.prototype, "totalRegisteredPCs", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 128 }),
    __metadata("design:type", Number)
], DashboardSummaryResponseDto.prototype, "totalLicensedPCs", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 112 }),
    __metadata("design:type", Number)
], DashboardSummaryResponseDto.prototype, "onlineSystems", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 16 }),
    __metadata("design:type", Number)
], DashboardSummaryResponseDto.prototype, "offlineSystems", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 124 }),
    __metadata("design:type", Number)
], DashboardSummaryResponseDto.prototype, "activeLicenses", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 150 }),
    __metadata("design:type", Number)
], DashboardSummaryResponseDto.prototype, "totalPurchasedLicenses", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 82.7 }),
    __metadata("design:type", Number)
], DashboardSummaryResponseDto.prototype, "licenseUtilization", void 0);
class LicenseStatusResponseDto {
}
exports.LicenseStatusResponseDto = LicenseStatusResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 92 }),
    __metadata("design:type", Number)
], LicenseStatusResponseDto.prototype, "active", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5 }),
    __metadata("design:type", Number)
], LicenseStatusResponseDto.prototype, "expiring", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3 }),
    __metadata("design:type", Number)
], LicenseStatusResponseDto.prototype, "expired", void 0);
class PerformanceResponseDto {
}
exports.PerformanceResponseDto = PerformanceResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1240 }),
    __metadata("design:type", Number)
], PerformanceResponseDto.prototype, "totalUsageHours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '30d' }),
    __metadata("design:type", String)
], PerformanceResponseDto.prototype, "period", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [65, 72, 80, 55, 90, 85, 78, 92] }),
    __metadata("design:type", Array)
], PerformanceResponseDto.prototype, "dailyUsage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ['2026-06-01', '2026-06-02'] }),
    __metadata("design:type", Array)
], PerformanceResponseDto.prototype, "dailyLabels", void 0);
class EfficiencyResponseDto {
}
exports.EfficiencyResponseDto = EfficiencyResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 88 }),
    __metadata("design:type", Number)
], EfficiencyResponseDto.prototype, "percentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Module Resource Utilization' }),
    __metadata("design:type", String)
], EfficiencyResponseDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [62, 68, 75, 71, 80, 78, 85] }),
    __metadata("design:type", Array)
], EfficiencyResponseDto.prototype, "weeklyData", void 0);
class LiveSOPEntryDto {
}
exports.LiveSOPEntryDto = LiveSOPEntryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1' }),
    __metadata("design:type", String)
], LiveSOPEntryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'DEV-001' }),
    __metadata("design:type", String)
], LiveSOPEntryDto.prototype, "deviceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'PC-101' }),
    __metadata("design:type", String)
], LiveSOPEntryDto.prototype, "systemName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Fire Safety' }),
    __metadata("design:type", String)
], LiveSOPEntryDto.prototype, "module", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Active' }),
    __metadata("design:type", String)
], LiveSOPEntryDto.prototype, "license", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ONLINE' }),
    __metadata("design:type", String)
], LiveSOPEntryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 92 }),
    __metadata("design:type", Number)
], LiveSOPEntryDto.prototype, "health", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-06-13T10:30:00Z', nullable: true }),
    __metadata("design:type", Object)
], LiveSOPEntryDto.prototype, "lastSeen", void 0);
class ModuleEfficiencyItemDto {
}
exports.ModuleEfficiencyItemDto = ModuleEfficiencyItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Fire Safety' }),
    __metadata("design:type", String)
], ModuleEfficiencyItemDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 92 }),
    __metadata("design:type", Number)
], ModuleEfficiencyItemDto.prototype, "utilization", void 0);
class ModuleEfficiencyResponseDto {
}
exports.ModuleEfficiencyResponseDto = ModuleEfficiencyResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 88 }),
    __metadata("design:type", Number)
], ModuleEfficiencyResponseDto.prototype, "averageUtilization", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ModuleEfficiencyItemDto] }),
    __metadata("design:type", Array)
], ModuleEfficiencyResponseDto.prototype, "modules", void 0);
//# sourceMappingURL=dashboard.dto.js.map