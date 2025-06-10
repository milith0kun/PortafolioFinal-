/**
 * 🔐 MODELO DE SESIÓN
 * 
 * Gestiona sesiones activas de usuarios:
 * - Tokens de sesión y refresh
 * - Información del dispositivo/navegador
 * - Timestamps de actividad
 * - Estado de la sesión
 * - Rol activo en la sesión
 * 
 * Campos principales:
 * - id, usuario_id, token_hash
 * - refresh_token_hash, rol_activo_id
 * - ip_address, user_agent
 * - expires_at, last_activity
 */

// TODO: Gestión de tokens JWT y refresh
// TODO: Tracking de dispositivos/IPs
// TODO: Expiración automática de sesiones
// TODO: Límite de sesiones simultáneas
// TODO: Logs de actividad por sesión
