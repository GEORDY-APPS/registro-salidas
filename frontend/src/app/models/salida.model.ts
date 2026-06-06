// src/app/models/salida.model.ts
export interface Salida {
  id?:        number;
  empresa:    string;
  ruta:       string;
  dni:        string;
  nombre:     string;
  firma_b64?: string;
  fecha?:     string;
}
