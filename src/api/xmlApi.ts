import { apiFetch } from './client';
import type { XmlFieldCatalogueDto, XmlInspectNodeDto } from '../types/api';

export const xmlApi = {
  searchXmlFields: (sourceType: string, search: string) =>
    apiFetch<XmlFieldCatalogueDto[]>(
      `/api/v1/xml-fields?sourceType=${encodeURIComponent(sourceType)}&search=${encodeURIComponent(search)}`
    ),

  inspectXml: (xmlFileName: string) =>
    apiFetch<XmlInspectNodeDto>('/api/v1/xml/inspect', {
      method: 'POST',
      body: JSON.stringify({ xmlFileName }),
    }),
};
