import { apiFetch } from './client';
import type { TemplateDto, FieldMappingDto, PreviewResponse } from '../types/api';

export const templatesApi = {
  getTemplates: () =>
    apiFetch<TemplateDto[]>('/api/v1/templates'),

  getTemplate: (templateId: number) =>
    apiFetch<TemplateDto>(`/api/v1/templates/${templateId}`),

  getTemplateFields: (templateId: number) =>
    apiFetch<FieldMappingDto[]>(`/api/v1/templates/${templateId}/fields`),

  createField: (templateId: number, payload: Omit<FieldMappingDto, 'id' | 'templateId'>) =>
    apiFetch<FieldMappingDto>(`/api/v1/templates/${templateId}/fields`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateField: (
    templateId: number,
    fieldId: number,
    payload: Omit<FieldMappingDto, 'id' | 'templateId'>
  ) =>
    apiFetch<FieldMappingDto>(`/api/v1/templates/${templateId}/fields/${fieldId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteField: (templateId: number, fieldId: number) =>
    apiFetch<void>(`/api/v1/templates/${templateId}/fields/${fieldId}`, {
      method: 'DELETE',
    }),

  previewTemplate: (templateId: number, xmlFileName: string) =>
    apiFetch<PreviewResponse>(`/api/v1/templates/${templateId}/preview`, {
      method: 'POST',
      body: JSON.stringify({ xmlFileName }),
    }),
};
