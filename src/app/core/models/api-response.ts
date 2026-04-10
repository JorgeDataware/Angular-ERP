/**
 * Interfaz estándar de respuesta del API Gateway.
 * Todas las respuestas siguen esta estructura: { statusCode, intOpCode, message, data[] }
 * El campo `data` es SIEMPRE un array, incluso para respuestas de un solo objeto.
 */
export interface ApiResponse<T = unknown> {
  statusCode: number;
  intOpCode: string;
  message: string;
  data: T[];
}

/**
 * Respuesta específica del endpoint POST /auth/login
 * data[0] contiene: { token, expiresAt, permissions[] }
 */
export interface LoginResponseData {
  token: string;
  expiresAt: string;
  permissions: string[];
}

/**
 * Respuesta específica del endpoint GET /users/me
 * data[0] contiene el perfil del usuario autenticado
 */
export interface UserMeResponseData {
  id: string;
  userName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
}
