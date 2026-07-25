export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type Centre = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  status: "ACTIVE" | "SUSPENDED" | "CLOSED";
  version: number;
};

export type Room = {
  id: string;
  centreId: string;
  name: string;
  capacity: number;
  occupiedPlaces: number;
  status: "ACTIVE" | "ARCHIVED";
  version: number;
};

export type ChildSummary = {
  id: string;
  centreId: string;
  roomId: string | null;
  displayName: string;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  version: number;
};

export type ChildDetails = ChildSummary & {
  firstName: string | null;
  lastName: string | null;
  preferredName: string | null;
  dateOfBirth: string | null;
  careNotes: string | null;
  enrolledAt: string | null;
  externalReference?: string;
};

export type ParentRelationship = {
  id: string;
  parentUserId: string;
  relationshipType: "MOTHER" | "FATHER" | "LEGAL_GUARDIAN" | "FOSTER_CARER" | "OTHER";
  status: "PENDING" | "ACTIVE" | "REVOKED";
  isLegalGuardian: boolean;
  mayAuthorizePickup: boolean;
  mayViewIncidents: boolean;
  version: number;
};
