"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListDataDto = void 0;
class ListDataDto {
    constructor() {
        this.data = [];
    }
    static build(options) {
        const { data, page, size, total } = options;
        const totalPages = Math.ceil(total / size) || 1;
        const dto = new ListDataDto();
        dto.data = data;
        dto.count = data.length;
        dto.pagination = {
            page,
            size,
            totalPages,
        };
        return dto;
    }
}
exports.ListDataDto = ListDataDto;
//# sourceMappingURL=list-data.dto.js.map