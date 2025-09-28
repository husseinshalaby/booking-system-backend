export enum ResponseCodes {
  SUCCESS = 'SUCCESS',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_PENDING = 'BOOKING_PENDING',
  ALTERNATIVES_FOUND = 'ALTERNATIVES_FOUND',

  BAD_REQUEST = 'BAD_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
  MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',
  INVALID_DATE = 'INVALID_DATE',
  DATE_IN_PAST = 'DATE_IN_PAST',
  INVALID_TIME_RANGE = 'INVALID_TIME_RANGE',
  INVALID_SERVICE_TYPE = 'INVALID_SERVICE_TYPE',
  INVALID_COUNTRY = 'INVALID_COUNTRY',

  NO_AVAILABILITY = 'NO_AVAILABILITY',
  BOOKING_CANCELLED_FAILURE = 'BOOKING_CANCELLED_FAILURE',
  PARTNER_NOT_FOUND = 'PARTNER_NOT_FOUND',
  TIME_SLOT_UNAVAILABLE = 'TIME_SLOT_UNAVAILABLE',
  BOOKING_EXPIRED = 'BOOKING_EXPIRED',
  BOOKING_ALREADY_EXISTS = 'BOOKING_ALREADY_EXISTS',

  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export const ResponseMessages = {
  [ResponseCodes.SUCCESS]: 'Operation completed successfully',
  [ResponseCodes.BOOKING_CONFIRMED]: 'Booking confirmed successfully',
  [ResponseCodes.BOOKING_PENDING]:
    'Booking request created, awaiting confirmation',
  [ResponseCodes.ALTERNATIVES_FOUND]: 'Alternative time slots found',

  [ResponseCodes.BAD_REQUEST]: 'Invalid request parameters',
  [ResponseCodes.NOT_FOUND]: 'Resource not found',
  [ResponseCodes.MISSING_REQUIRED_FIELDS]: 'Required fields are missing',
  [ResponseCodes.INVALID_DATE]: 'Invalid date format',
  [ResponseCodes.DATE_IN_PAST]: 'Date cannot be in the past',
  [ResponseCodes.INVALID_TIME_RANGE]: 'Invalid time range',
  [ResponseCodes.INVALID_SERVICE_TYPE]: 'Invalid service type',
  [ResponseCodes.INVALID_COUNTRY]: 'Invalid country code',

  [ResponseCodes.NO_AVAILABILITY]:
    'No availability found for the requested time slot',
  [ResponseCodes.BOOKING_CANCELLED_FAILURE]:
    'No availability found, booking request cancelled',
  [ResponseCodes.PARTNER_NOT_FOUND]: 'Partner not found',
  [ResponseCodes.TIME_SLOT_UNAVAILABLE]: 'Time slot is no longer available',
  [ResponseCodes.BOOKING_EXPIRED]: 'Booking request has expired',
  [ResponseCodes.BOOKING_ALREADY_EXISTS]:
    'Booking already exists for this time slot',

  [ResponseCodes.INTERNAL_SERVER_ERROR]: 'Internal server error occurred',
  [ResponseCodes.DATABASE_ERROR]: 'Database operation failed',
  [ResponseCodes.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
};

export interface ApiResponse<T = any> {
  success: boolean;
  code: ResponseCodes;
  message: string;
  data?: T;
  uuid?: string;
}

export function createResponse<T>(
  success: boolean,
  code: ResponseCodes,
  data?: T,
  customMessage?: string,
  uuid?: string,
): ApiResponse<T> {
  return {
    success,
    code,
    message: customMessage || ResponseMessages[code],
    ...(data && { data }),
    ...(uuid && { uuid }),
  };
}

export function createSuccessResponse<T>(
  code: ResponseCodes = ResponseCodes.SUCCESS,
  data?: T,
  customMessage?: string,
  uuid?: string,
): ApiResponse<T> {
  return createResponse(true, code, data, customMessage, uuid);
}

export function createErrorResponse(
  code: ResponseCodes,
  customMessage?: string,
): ApiResponse {
  return createResponse(false, code, undefined, customMessage);
}
