"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var org, d1, d2, modules, i, d;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Seeding database...');
                    return [4 /*yield*/, prisma.organization.create({
                            data: {
                                name: 'XARC HQ',
                                licenseQuota: 150,
                            },
                        })];
                case 1:
                    org = _a.sent();
                    return [4 /*yield*/, prisma.device.create({
                            data: {
                                deviceId: 'dev-1',
                                machineName: 'XARC-SERVER-01',
                                friendlyName: 'Main Controller',
                                status: 'ONLINE',
                                healthScore: 98,
                                organizationId: org.id,
                            },
                        })];
                case 2:
                    d1 = _a.sent();
                    return [4 /*yield*/, prisma.device.create({
                            data: {
                                deviceId: 'dev-2',
                                machineName: 'XARC-NODE-02',
                                friendlyName: 'Access Terminal',
                                status: 'OFFLINE',
                                healthScore: 45,
                                isCritical: true,
                                organizationId: org.id,
                            },
                        })];
                case 3:
                    d2 = _a.sent();
                    return [4 /*yield*/, Promise.all([
                            prisma.module.create({
                                data: {
                                    name: 'Fire Safety VR',
                                    description: 'Comprehensive fire safety and extinguisher training.',
                                    category: 'Safety',
                                    version: '1.2.0',
                                },
                            }),
                            prisma.module.create({
                                data: {
                                    name: 'Electrical Safety',
                                    description: 'High voltage electrical hazard awareness.',
                                    category: 'Safety',
                                    version: '1.0.5',
                                },
                            }),
                            prisma.module.create({
                                data: {
                                    name: 'Forklift Simulator',
                                    description: 'Forklift operation and certification simulator.',
                                    category: 'Operations',
                                    version: '2.1.0',
                                },
                            }),
                            prisma.module.create({
                                data: {
                                    name: 'Maintenance Guide',
                                    description: 'AR overlays for standard machine maintenance.',
                                    category: 'Maintenance',
                                    version: '1.5.0',
                                },
                            }),
                        ])];
                case 4:
                    modules = _a.sent();
                    // Create Licenses
                    return [4 /*yield*/, prisma.systemLicense.create({
                            data: {
                                deviceId: d1.id,
                                moduleName: 'Fire Safety VR',
                                status: 'Active',
                                expiresAt: new Date(Date.now() + 10000000000),
                            },
                        })];
                case 5:
                    // Create Licenses
                    _a.sent();
                    return [4 /*yield*/, prisma.systemLicense.create({
                            data: {
                                deviceId: d2.id,
                                moduleName: 'Access Control',
                                status: 'Expired',
                                expiresAt: new Date(Date.now() - 10000000000),
                            },
                        })];
                case 6:
                    _a.sent();
                    i = 0;
                    _a.label = 7;
                case 7:
                    if (!(i < 7)) return [3 /*break*/, 10];
                    d = new Date();
                    d.setDate(d.getDate() - i);
                    return [4 /*yield*/, prisma.usageMetric.create({
                            data: {
                                deviceId: d1.id,
                                moduleName: 'Orchestrator Core',
                                usageHours: Math.floor(Math.random() * 10) + 10,
                                efficiency: Math.floor(Math.random() * 20) + 80,
                                metricDate: d,
                            },
                        })];
                case 8:
                    _a.sent();
                    _a.label = 9;
                case 9:
                    i++;
                    return [3 /*break*/, 7];
                case 10:
                    console.log('Database seeded!');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
