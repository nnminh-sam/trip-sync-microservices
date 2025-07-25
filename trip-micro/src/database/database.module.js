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
var DatabaseModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const models_1 = require("../../../location-micro/src/models");
let DatabaseModule = DatabaseModule_1 = class DatabaseModule {
    constructor() {
        this.logger = new common_1.Logger(DatabaseModule_1.name);
        this.logger.log('Connected Successfully to MySQL Database');
    }
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = DatabaseModule_1 = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => {
                    return {
                        type: 'mysql',
                        host: configService.get('MYSQL_HOST'),
                        port: parseInt(configService.get('MYSQL_PORT') || '3306', 10),
                        username: configService.get('MYSQL_USER'),
                        password: configService.get('MYSQL_PASSWORD'),
                        database: configService.get('MYSQL_DATABASE'),
                        entities: models_1.tableSchemas,
                        synchronize: true,
                        logging: true,
                    };
                },
                inject: [config_1.ConfigService],
            }),
        ],
    }),
    __metadata("design:paramtypes", [])
], DatabaseModule);
//# sourceMappingURL=database.module.js.map