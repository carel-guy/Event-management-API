import { Observable } from 'rxjs';

export interface RegistrationService {
  getRegistrationDetails(
    request: GetRegistrationDetailsRequest,
  ): Observable<GetRegistrationDetailsResponse>;
  ping(request: PingRequest): Observable<PingResponse>;
}

export interface GetRegistrationDetailsRequest {
  registrationId: string;
  tenantId: string;
}

export interface GetRegistrationDetailsResponse {
  id: string;
  tenantId: string;
  eventId: string;
  userId: string;
  qrCodeId?: string;
  badgeGenerated: boolean;
  badgeUrl?: string;
  qrValidated: boolean;
  lastValidationAt?: string;
  owner?: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  sexe?: string;
  dateOfBirth?: string;
  yearOfBirth?: number;
  birthPlace?: string;
  imageUrl?: string;
  countryOfBirth?: string;
  nationality?: string;
  profession?: string;
  professionDocId?: string;
  organization?: string;
  institution?: string;
  specialRequirements?: string;
  terms: boolean;
  housingMode?: string;
  accommodationType?: string;
  isForeigner: boolean;
  needsVisa?: boolean;
  typeDocument?: string;
  documentNumber?: string;
  placeOfIssue?: string;
  dateOfIssue?: string;
  expirationDate?: string;
  passportPhotoId?: string;
  passportCopyId?: string;
  purposeOfTravel?: string;
  dateOfArrivalInBurundi?: string;
  currentVisaCopyId?: string;
  maritalStatus?: string;
  fatherFirstName?: string;
  fatherLastName?: string;
  motherFirstName?: string;
  motherLastName?: string;
  province?: string;
  commune?: string;
  zone?: string;
  colline?: string;
  fullAddress?: string;
  contactPerson?: string;
  contactNumber?: string;
  referencePersonFirst?: string;
  referencePersonLast?: string;
  phoneNumberReference?: string;
  category?: string;
  qrCodeFileId: string;
  registrationDate?: string;
  language?: string;
  documents?: DocumentInfo[];
  assignedTariffId?: string;
  price?: number;
  paymentStatus?: string;
}

export interface PingRequest {}

export interface PingResponse {
  message: string;
  timestamp: string; // Using string to avoid dependency issues with Timestamp proto
}

export interface DocumentInfo {
  requiredDocumentId: string;
  fileReferenceId: string;
}
