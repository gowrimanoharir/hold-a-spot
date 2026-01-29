// Input validation utilities

/**
 * Validate email format
 * @param email - Email string to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format
 * @param id - UUID string to validate
 * @returns true if valid UUID
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Validate ISO date string
 * @param dateString - Date string to validate
 * @returns true if valid ISO date
 */
export function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.toISOString() === dateString;
}

/**
 * Validate that a value is a positive number
 * @param value - Value to check
 * @returns true if positive number
 */
export function isPositiveNumber(value: unknown): boolean {
  return typeof value === 'number' && !isNaN(value) && value > 0;
}

/**
 * Sanitize email (lowercase, trim)
 * @param email - Email to sanitize
 * @returns Sanitized email
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validate facility type
 * @param type - Type string to validate
 * @returns true if valid facility type
 */
export function isValidFacilityType(type: string): type is 'court' | 'bay' {
  return type === 'court' || type === 'bay';
}

/**
 * Validate reservation status
 * @param status - Status string to validate
 * @returns true if valid status
 */
export function isValidReservationStatus(
  status: string
): status is 'confirmed' | 'cancelled' | 'completed' {
  return status === 'confirmed' || status === 'cancelled' || status === 'completed';
}

/**
 * Validate that required fields are present in an object
 * @param obj - Object to validate
 * @param requiredFields - Array of required field names
 * @returns Object with valid flag and missing fields
 */
export function validateRequiredFields(
  obj: Record<string, unknown>,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing = requiredFields.filter((field) => {
    const value = obj[field];
    return value === undefined || value === null || value === '';
  });
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Create error response object
 * @param message - Error message
 * @param details - Additional error details
 * @param code - Error code
 * @returns Error response object
 */
export function createErrorResponse(
  message: string,
  details?: string,
  code?: string
): { error: string; details?: string; code?: string } {
  return {
    error: message,
    ...(details && { details }),
    ...(code && { code }),
  };
}

/**
 * Validate booking time is not in the past
 * @param time - Time to check
 * @returns Object with valid flag and error message
 */
export function validateNotInPast(time: Date | string): { valid: boolean; error?: string } {
  const checkTime = typeof time === 'string' ? new Date(time) : time;
  const now = new Date();
  
  if (checkTime < now) {
    return {
      valid: false,
      error: 'Cannot book time slots in the past',
    };
  }
  
  return { valid: true };
}

/**
 * Validate query parameter is present
 * @param param - Parameter value
 * @param paramName - Name of parameter for error message
 * @returns Object with valid flag and error message
 */
export function validateQueryParam(
  param: string | null | undefined,
  paramName: string
): { valid: boolean; error?: string; value?: string } {
  if (!param) {
    return {
      valid: false,
      error: `Missing required parameter: ${paramName}`,
    };
  }
  
  return {
    valid: true,
    value: param,
  };
}
