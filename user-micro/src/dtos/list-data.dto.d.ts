export declare class ListDataDto<T> {
    data: T[];
    count: number;
    pagination: {
        page: number;
        size: number;
        totalPages: number;
    };
    static build<T>(options: {
        data: T[];
        page: number;
        size: number;
        total: number;
    }): ListDataDto<T>;
}
