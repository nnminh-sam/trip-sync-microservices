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
exports.BaseRequestFilterDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class BaseRequestFilterDto {
    constructor() {
        this.sortBy = 'id';
        this.order = 'asc';
        this.page = 1;
        this.size = 10;
    }
}
exports.BaseRequestFilterDto = BaseRequestFilterDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Field to sort by',
        required: false,
        example: 'createdAt',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BaseRequestFilterDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sort order',
        required: false,
        enum: ['asc', 'desc'],
        example: 'asc',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['asc', 'desc']),
    __metadata("design:type", String)
], BaseRequestFilterDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Page number (starts from 1)',
        required: false,
        default: 1,
        example: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], BaseRequestFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of items per page',
        required: false,
        default: 10,
        example: 10,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], BaseRequestFilterDto.prototype, "size", void 0);
//# sourceMappingURL=base-request-filter.dto.js.map