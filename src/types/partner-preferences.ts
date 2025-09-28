export interface PartnerPreferences {
  locations?: string[];
  maxTravelDistance?: number;
  notifications?: {
    email: boolean;
    sms: boolean;
  };
  specialties?: string[];
}