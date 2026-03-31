export interface CodexVersion {
  id: string;
  appId: string;
  orgId: string;
  version: number;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  description?: string;
  screenCount?: number;
  localeCount?: number;
  createdBy: { id: string; name: string | null; email: string };
  reviewedBy?: { id: string; name: string | null; email: string } | null;
  reviewedAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CodexScreen {
  id: string;
  versionId: string;
  slug: string;
  name: string;
  description?: string;
  screenType?: string;
  sortOrder: number;
  image?: CodexScreenImage | null;
  regionCount?: number;
  confirmedRegionCount?: number;
  locales?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CodexScreenImage {
  id: string;
  originalUrl: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  mimeType?: string;
  sizeBytes?: number;
}

export interface CodexRegion {
  id: string;
  screenId: string;
  contentKey: string;
  extractedText?: string;
  confidence?: number;
  semanticRole?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  isConfirmed: boolean;
  isIgnored: boolean;
  userKey?: string;
}

export interface CodexContent {
  id: string;
  screenId: string;
  locale: string;
  contentTree: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CodexLocale {
  id: string;
  appId: string;
  locale: string;
  name: string;
  isBase: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
