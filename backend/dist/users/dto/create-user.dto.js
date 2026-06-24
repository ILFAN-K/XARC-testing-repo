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
exports.CreateUserDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const update_role_dto_1 = require("./update-role.dto");
/**
 * Request-body DTO for creating a new user via the admin panel.
 *
 * The `role` field is validated against the shared `ALLOWED_ROLES` constant
 * so that allowed values stay in sync with `UpdateRoleDto`.
 *
 * @example
 * {
 *   "fullName": "Jane Doe",
 *   "email": "jane.doe@example.com",
 *   "role": "STUDENT",
 *   "sendInvitation": true
 * }
 */
class CreateUserDto {
    constructor() {
        this.sendInvitation = true;
    }
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Full name of the user',
        example: 'Jane Doe',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'fullName must not be empty' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Email address (must be a valid email)',
        example: 'jane.doe@example.com',
    }),
    (0, class_validator_1.IsEmail)({}, { message: 'email must be a valid email address' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'email must not be empty' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Role to assign to the new user',
        enum: update_role_dto_1.ALLOWED_ROLES,
        example: 'STUDENT',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'role must not be empty' }),
    (0, class_validator_1.IsIn)(update_role_dto_1.ALLOWED_ROLES, {
        message: `role must be one of ${update_role_dto_1.ALLOWED_ROLES.join(', ')}`,
    }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether to send an invitation email upon creation',
        default: true,
        required: false,
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'sendInvitation must be a boolean' }),
    __metadata("design:type", Boolean)
], CreateUserDto.prototype, "sendInvitation", void 0);
//# sourceMappingURL=create-user.dto.js.map