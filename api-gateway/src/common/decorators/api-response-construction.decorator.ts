import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ApiResponseDto } from 'src/dtos/api-response.dto';

export interface ApiResponseConstructionPayload<TModel extends Type<any>> {
  status: number;
  description: string;
  model?: TModel;
  isArray?: boolean;
}

export const ApiResponseConstruction = <TModel extends Type<any>>({
  status,
  description,
  model = null,
  isArray = false,
}: ApiResponseConstructionPayload<TModel>) => {
  const models = [ApiResponseDto];
  if (model) models.push(model);
  return applyDecorators(
    ApiExtraModels(...models),
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseDto) },
          {
            properties: {
              data:
                isArray && model
                  ? { type: 'array', items: { $ref: getSchemaPath(model) } }
                  : { $ref: getSchemaPath(model) },
              ...(isArray &&
                model && {
                  pagination: {
                    properties: {
                      page: {
                        type: 'number',
                        description: 'Current page number',
                      },
                      size: {
                        type: 'number',
                        description: 'Size of each pages',
                      },
                      totalPages: {
                        type: 'number',
                        description: 'Total number of pages',
                      },
                    },
                  },
                }),
            },
          },
        ],
      },
    }),
  );
};
