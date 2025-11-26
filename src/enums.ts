export enum EventType {
  CONFERENCE = 'CONFERENCE',
  WORKSHOP = 'WORKSHOP',
  SEMINAR = 'SEMINAR',
  WEBINAR = 'WEBINAR',
  MEETING = 'MEETING',
  EXPOSITION = 'EXPOSITION',
  FESTIVAL = 'FESTIVAL',
  SPORTING_EVENT = 'SPORTING_EVENT',
  CONCERT = 'CONCERT',
  GALA = 'GALA',
  SYMPOSIUM = 'SYMPOSIUM',
  SUMMIT = 'SUMMIT',
  OTHER = 'OTHER',
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ARCHIVED = 'ARCHIVED',
}

export enum Currency {
  USD = 'USD', // United States Dollar
  EUR = 'EUR', // Euro
  JPY = 'JPY', // Japanese Yen
  GBP = 'GBP', // British Pound Sterling
  CAD = 'CAD', // Canadian Dollar
  INR = 'INR', // Indian Rupee
  FBU = 'FBU', // Burundian Franc
  AUD = 'AUD', // Australian Dollar
  CHF = 'CHF', // Swiss Franc
  CNY = 'CNY', // Chinese Yuan
  BRL = 'BRL', // Brazilian Real
  RUB = 'RUB', // Russian Ruble
  ZAR = 'ZAR', // South African Rand
  KRW = 'KRW', // South Korean Won
  SGD = 'SGD', // Singapore Dollar
  NZD = 'NZD', // New Zealand Dollar
  MXN = 'MXN', // Mexican Peso
  HKD = 'HKD', // Hong Kong Dollar
  SEK = 'SEK', // Swedish Krona
  NOK = 'NOK', // Norwegian Krone
  TRY = 'TRY', // Turkish Lira
  AED = 'AED', // United Arab Emirates Dirham
  SAR = 'SAR', // Saudi Riyal
  THB = 'THB', // Thai Baht
}

export enum TarifType {
  FLAT_CHARGE = 'FLAT_CHARGE',
  PERCENTAGE_CHARGE = 'PERCENTAGE_CHARGE',
  FLAT_DISCOUNT = 'FLAT_DISCOUNT',
  PERCENTAGE_DISCOUNT = 'PERCENTAGE_DISCOUNT',
}

export enum FieldType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  DATE = 'DATE',
  DATE_TIME = 'DATE_TIME',
  TEXT_AREA = 'TEXT_AREA',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  URL = 'URL',
  SELECT_ONE = 'SELECT_ONE',
  SELECT_MULTIPLE = 'SELECT_MULTIPLE',
}

export enum FileType {
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  GIF = 'image/gif',
  WEBP = 'image/webp',
  SVG = 'image/svg+xml',
  PDF = 'application/pdf',
  DOC = 'application/msword',
  DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLS = 'application/vnd.ms-excel',
  XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  PPT = 'application/vnd.ms-powerpoint',
  PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.document',
  TXT = 'text/plain',
  CSV = 'text/csv',
  MP3 = 'audio/mpeg',
  MP4 = 'video/mp4',
}

export enum ValueType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export enum SpeakerType {
  SPEAKER = 'SPEAKER',
  MODERATOR = 'MODERATOR',
  PANELIST = 'PANELIST',
  PRESENTER = 'PRESENTER',
  GUEST = 'GUEST',
  KEYNOTE_SPEAKER = 'KEYNOTE_SPEAKER',
  VIP = 'VIP',
  FACILITATOR = 'FACILITATOR',
  WORKSHOP_LEADER = 'WORKSHOP_LEADER',
  TRAINER = 'TRAINER',
  GUEST_OF_HONOR = 'GUEST_OF_HONOR',
  ANALYST = 'ANALYST',
  INFLUENCER = 'INFLUENCER',
  ROUNDTABLE_HOST = 'ROUNDTABLE_HOST',
}

export enum EventFormat {
  ONLINE = 'ONLINE',
  IN_PERSON = 'IN_PERSON',
  HYBRID = 'HYBRID',
  OTHER = 'OTHER',
}

export enum AssetCategory {
  EQUIPMENT = 'EQUIPMENT',
  SUPPLIES = 'SUPPLIES',
  MATERIALS = 'MATERIALS',
  SERVICES = 'SERVICES',
  OTHER = 'OTHER',
}

export enum SessionType {
  KEYNOTE = 'KEYNOTE',
  WORKSHOP = 'WORKSHOP',
  PANEL_DISCUSSION = 'PANEL_DISCUSSION',
  BREAK = 'BREAK',
  LUNCH = 'LUNCH',
  NETWORKING = 'NETWORKING',
  CLOSING_REMARKS = 'CLOSING_REMARKS',
  OTHER = 'OTHER',
  SESSION = 'SESSION',
}

export enum Timezone {
  UTC = 'UTC',
  EST = 'America/New_York',
  PST = 'America/Los_Angeles',
  GMT = 'Europe/London',
  CAT = 'Africa/Bujumbura',
  CST = 'America/Chicago',
  MST = 'America/Denver',
  AEST = 'Australia/Sydney',
  JST = 'Asia/Tokyo',
  IST = 'Asia/Kolkata',
  CET = 'Europe/Paris',
  EET = 'Europe/Athens',
  WET = 'Europe/Lisbon',
  SGT = 'Asia/Singapore',
  HKT = 'Asia/Hong_Kong',
  BRT = 'America/Sao_Paulo',
  ART = 'America/Argentina/Buenos_Aires',
  AEDT = 'Australia/Melbourne',
  NZST = 'Pacific/Auckland',
  MST7MDT = 'America/Phoenix', // Mountain Standard Time (no DST)
  AKST = 'America/Anchorage',
  HST = 'Pacific/Honolulu',
  AST = 'America/Halifax',
  SAST = 'Africa/Johannesburg',
  KST = 'Asia/Seoul',
}

export enum ActualityType {
  NEWS = 'NEWS',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  UPDATE = 'UPDATE',
  BLOG_POST = 'BLOG_POST',
  PRESS_RELEASE = 'PRESS_RELEASE',
}

export enum RegistrationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export enum UserRole {
  // Realm-Level Roles (Global across all tenants)
  SUPER_ADMIN = 'SUPER_ADMIN', // Full platform control
  SUPPORT_AGENT = 'SUPPORT_AGENT', // Cross-tenant support staff
  USER = 'USER', // Base authenticated user

  // Client-Level Roles (Specific to the event-management-service)
  TENANT_OWNER = 'TENANT_OWNER', // The primary owner of the tenant account
  TENANT_ADMIN = 'TENANT_ADMIN', // Manages the entire tenant (organization)
  EVENT_MANAGER = 'EVENT_MANAGER', // Manages all aspects of a specific event
  EVENT_STAFF = 'EVENT_STAFF', // General staff for an event (e.g., check-in, support)
  CONTENT_MODERATOR = 'CONTENT_MODERATOR', // Moderates user-generated content
  SPEAKER = 'SPEAKER', // A presenter or speaker at an event
  EXHIBITOR = 'EXHIBITOR', // Represents a company at a booth or expo
  EVENT_GUEST = 'EVENT_GUEST', // A general attendee or participant
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}
