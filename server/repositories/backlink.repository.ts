import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { 
  backlinkProfiles, 
  backlinks, 
  backlinkHistory, 
  outgoingLinks,
  BacklinkProfile, 
  InsertBacklinkProfile,
  Backlink,
  InsertBacklink,
  BacklinkHistory,
  OutgoingLink,
  InsertOutgoingLink
} from '@shared/schema';
import { db } from '../db';

/**
 * Repository for backlink profile operations
 */
export class BacklinkProfileRepository extends BaseRepository<BacklinkProfile, InsertBacklinkProfile> {
  constructor() {
    super(backlinkProfiles);
  }

  /**
   * Find profiles by user ID
   */
  async findByUserId(userId: string): Promise<BacklinkProfile[]> {
    return this.findMany({
      where: eq(backlinkProfiles.userId, userId),
      orderBy: [desc(backlinkProfiles.updatedAt)]
    });
  }

  /**
   * Find profile by URL
   */
  async findByUrl(url: string): Promise<BacklinkProfile | null> {
    return this.findOne(eq(backlinkProfiles.url, url));
  }

  /**
   * Find profile by domain
   */
  async findByDomain(domain: string): Promise<BacklinkProfile | null> {
    return this.findOne(eq(backlinkProfiles.domain, domain));
  }

  /**
   * Update scan timestamp
   */
  async updateLastScan(profileId: number): Promise<BacklinkProfile | null> {
    return this.updateById(profileId, {
      lastScanAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Update backlink counts
   */
  async updateBacklinkCounts(profileId: number, counts: {
    totalBacklinks?: number;
    newBacklinks?: number;
    lostBacklinks?: number;
    dofollow?: number;
    nofollow?: number;
    domainAuthority?: number;
  }): Promise<BacklinkProfile | null> {
    return this.updateById(profileId, {
      ...counts,
      updatedAt: new Date()
    });
  }

  /**
   * Get profiles due for scanning
   */
  async getProfilesDueForScan(): Promise<BacklinkProfile[]> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // This is a simplified version - in a real implementation, you'd want to
    // filter based on the scanFrequency field and lastScanAt timestamp
    return this.findMany({
      where: and(
        lte(backlinkProfiles.lastScanAt, oneWeekAgo)
      ),
      orderBy: [desc(backlinkProfiles.lastScanAt)]
    });
  }
}

/**
 * Repository for backlink operations
 */
export class BacklinkRepository extends BaseRepository<Backlink, InsertBacklink> {
  constructor() {
    super(backlinks);
  }

  /**
   * Find backlinks by profile ID
   */
  async findByProfileId(profileId: number): Promise<Backlink[]> {
    return this.findMany({
      where: eq(backlinks.profileId, profileId),
      orderBy: [desc(backlinks.lastChecked)]
    });
  }

  /**
   * Find active backlinks
   */
  async findActiveBacklinks(profileId: number): Promise<Backlink[]> {
    return this.findMany({
      where: and(
        eq(backlinks.profileId, profileId),
        eq(backlinks.status, 'active')
      ),
      orderBy: [desc(backlinks.lastChecked)]
    });
  }

  /**
   * Find lost backlinks
   */
  async findLostBacklinks(profileId: number): Promise<Backlink[]> {
    return this.findMany({
      where: and(
        eq(backlinks.profileId, profileId),
        eq(backlinks.status, 'lost')
      ),
      orderBy: [desc(backlinks.lastChecked)]
    });
  }

  /**
   * Find dofollow backlinks
   */
  async findDofollowBacklinks(profileId: number): Promise<Backlink[]> {
    return this.findMany({
      where: and(
        eq(backlinks.profileId, profileId),
        eq(backlinks.isDofollow, true),
        eq(backlinks.status, 'active')
      ),
      orderBy: [desc(backlinks.domainAuthority)]
    });
  }

  /**
   * Find backlinks by source domain
   */
  async findBySourceDomain(profileId: number, sourceDomain: string): Promise<Backlink[]> {
    return this.findMany({
      where: and(
        eq(backlinks.profileId, profileId),
        eq(backlinks.sourceDomain, sourceDomain)
      ),
      orderBy: [desc(backlinks.lastChecked)]
    });
  }

  /**
   * Update backlink status
   */
  async updateStatus(backlinkId: number, status: 'active' | 'lost' | 'redirected'): Promise<Backlink | null> {
    return this.updateById(backlinkId, {
      status,
      lastChecked: new Date()
    });
  }

  /**
   * Get backlink statistics for a profile
   */
  async getBacklinkStats(profileId: number): Promise<{
    total: number;
    active: number;
    lost: number;
    dofollow: number;
    nofollow: number;
  }> {
    const [total, active, lost, dofollow, nofollow] = await Promise.all([
      this.count(eq(backlinks.profileId, profileId)),
      this.count(and(eq(backlinks.profileId, profileId), eq(backlinks.status, 'active'))),
      this.count(and(eq(backlinks.profileId, profileId), eq(backlinks.status, 'lost'))),
      this.count(and(eq(backlinks.profileId, profileId), eq(backlinks.isDofollow, true))),
      this.count(and(eq(backlinks.profileId, profileId), eq(backlinks.isDofollow, false)))
    ]);

    return { total, active, lost, dofollow, nofollow };
  }
}

/**
 * Repository for backlink history operations
 */
export class BacklinkHistoryRepository extends BaseRepository<BacklinkHistory, any> {
  constructor() {
    super(backlinkHistory);
  }

  /**
   * Find history by profile ID
   */
  async findByProfileId(profileId: number, limit?: number): Promise<BacklinkHistory[]> {
    return this.findMany({
      where: eq(backlinkHistory.profileId, profileId),
      orderBy: [desc(backlinkHistory.scanDate)],
      limit
    });
  }

  /**
   * Get latest scan for profile
   */
  async getLatestScan(profileId: number): Promise<BacklinkHistory | null> {
    const results = await this.findMany({
      where: eq(backlinkHistory.profileId, profileId),
      orderBy: [desc(backlinkHistory.scanDate)],
      limit: 1
    });
    return results[0] || null;
  }

  /**
   * Add scan result
   */
  async addScanResult(data: {
    profileId: number;
    totalBacklinks: number;
    newBacklinks: number;
    lostBacklinks: number;
    dofollow: number;
    nofollow: number;
    topReferringDomains?: any;
    domainAuthority?: number;
  }): Promise<BacklinkHistory> {
    return this.create(data);
  }

  /**
   * Get history for date range
   */
  async getHistoryForDateRange(profileId: number, startDate: Date, endDate: Date): Promise<BacklinkHistory[]> {
    return this.findMany({
      where: and(
        eq(backlinkHistory.profileId, profileId),
        gte(backlinkHistory.scanDate, startDate),
        lte(backlinkHistory.scanDate, endDate)
      ),
      orderBy: [desc(backlinkHistory.scanDate)]
    });
  }
}

/**
 * Repository for outgoing links operations
 */
export class OutgoingLinkRepository extends BaseRepository<OutgoingLink, InsertOutgoingLink> {
  constructor() {
    super(outgoingLinks);
  }

  /**
   * Find outgoing links by profile ID
   */
  async findByProfileId(profileId: number): Promise<OutgoingLink[]> {
    return this.findMany({
      where: eq(outgoingLinks.profileId, profileId),
      orderBy: [desc(outgoingLinks.lastChecked)]
    });
  }

  /**
   * Find broken outgoing links
   */
  async findBrokenLinks(profileId: number): Promise<OutgoingLink[]> {
    return this.findMany({
      where: and(
        eq(outgoingLinks.profileId, profileId),
        eq(outgoingLinks.status, 'broken')
      ),
      orderBy: [desc(outgoingLinks.lastChecked)]
    });
  }

  /**
   * Update link status
   */
  async updateStatus(linkId: number, status: 'active' | 'broken' | 'redirected'): Promise<OutgoingLink | null> {
    return this.updateById(linkId, {
      status,
      lastChecked: new Date()
    });
  }

  /**
   * Get outgoing link statistics
   */
  async getOutgoingLinkStats(profileId: number): Promise<{
    total: number;
    active: number;
    broken: number;
    redirected: number;
  }> {
    const [total, active, broken, redirected] = await Promise.all([
      this.count(eq(outgoingLinks.profileId, profileId)),
      this.count(and(eq(outgoingLinks.profileId, profileId), eq(outgoingLinks.status, 'active'))),
      this.count(and(eq(outgoingLinks.profileId, profileId), eq(outgoingLinks.status, 'broken'))),
      this.count(and(eq(outgoingLinks.profileId, profileId), eq(outgoingLinks.status, 'redirected')))
    ]);

    return { total, active, broken, redirected };
  }
}

// Export singleton instances
export const backlinkProfileRepository = new BacklinkProfileRepository();
export const backlinkRepository = new BacklinkRepository();
export const backlinkHistoryRepository = new BacklinkHistoryRepository();
export const outgoingLinkRepository = new OutgoingLinkRepository();