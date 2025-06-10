/**
 * 📄 MODELO DE DOCUMENTO
 * 
 * Define documentos subidos al sistema:
 * - Información del archivo (nombre, tipo, tamaño)
 * - Ubicación en el portafolio
 * - Estado de verificación
 * - Metadatos del documento
 * - Historial de versiones
 * 
 * Campos principales:
 * - id, carpeta_id, nombre_original
 * - nombre_archivo, tipo_mime, tamaño
 * - estado_verificacion, es_obligatorio
 * - metadatos, version_actual
 * - uploaded_at, verified_at
 */

// TODO: Versionado automático de documentos
// TODO: Metadatos extraídos automáticamente
// TODO: Estados de verificación (pendiente, aprobado, rechazado)
// TODO: Soft delete con papelera
// TODO: Checksums para integridad
