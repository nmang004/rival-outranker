import axios from 'axios';
import { JSDOM } from 'jsdom';
import { URL } from 'url';
import { db } from '../../db';
import { 
  backlinkProfiles, 
  backlinks, 
  outgoingLinks, 
  backlinkHistory,
  InsertBacklinkProfile,
  InsertOutgoingLink
} from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

// Function to extract domain from a URL
const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    console.error('Invalid URL:', url);
    return '';
  }
};

class BacklinkService {
  /**
   * Create a new backlink profile to track
   */
  async createProfile(profileData: InsertBacklinkProfile) {
    // Ensure the domain is extracted and stored
    const domain = extractDomain(profileData.url);
    
    // Insert the profile
    const result = await db.insert(backlinkProfiles)
      .values({
        ...profileData,
        domain,
      })
      .returning();
      
    return result[0];
  }
  
  /**
   * Get all backlink profiles for a user
   */
  async getProfilesByUser(userId: string) {
    return db.select()
      .from(backlinkProfiles)
      .where(eq(backlinkProfiles.userId, userId))
      .orderBy(desc(backlinkProfiles.createdAt));
  }
  
  /**
   * Get a specific backlink profile
   */
  async getProfile(profileId: number) {
    const results = await db.select()
      .from(backlinkProfiles)
      .where(eq(backlinkProfiles.id, profileId))
      .limit(1);
      
    return results[0];
  }
  
  /**
   * Get backlinks for a profile
   */
  async getBacklinks(profileId: number, options: { status?: string, dofollow?: boolean, limit?: number, offset?: number } = {}) {
    const { status, dofollow, limit = 50, offset = 0 } = options;
    
    // Build conditions array
    const conditions = [eq(backlinks.profileId, profileId)];
    
    if (status) {
      conditions.push(eq(backlinks.status, status));
    }
    
    if (dofollow !== undefined) {
      conditions.push(eq(backlinks.isDofollow, dofollow));
    }
    
    // Execute query with all conditions at once
    return db.select()
      .from(backlinks)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(backlinks.firstDiscovered));
  }
  
  /**
   * Get outgoing links for a profile
   */
  async getOutgoingLinks(profileId: number, options: { status?: string, limit?: number, offset?: number } = {}) {
    const { status, limit = 50, offset = 0 } = options;
    
    // Build conditions array
    const conditions = [eq(outgoingLinks.profileId, profileId)];
    
    if (status) {
      conditions.push(eq(outgoingLinks.status, status));
    }
    
    // Execute query with all conditions at once
    return db.select()
      .from(outgoingLinks)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(outgoingLinks.firstDiscovered));
  }
  
  /**
   * Get backlink history for a profile
   */
  async getBacklinkHistory(profileId: number, limit = 12) {
    return db.select()
      .from(backlinkHistory)
      .where(eq(backlinkHistory.profileId, profileId))
      .limit(limit)
      .orderBy(desc(backlinkHistory.scanDate));
  }
  
  /**
   * Discover backlinks for a given domain using a third-party API
   * This is a placeholder - in production, you would integrate with
   * services like Ahrefs, Moz, SEMrush, or Majestic
   */
  async discoverBacklinks(domain: string, apiKey: string) {
    try {
      // This is where you would call an external API with your API key
      // For now, we'll simulate a response
      
      console.log(`Discovering backlinks for ${domain} using API key ${apiKey.substring(0, 4)}...`);
      
      // In a real implementation, you would make an API call like:
      // const response = await axios.get(`https://api.backlinkprovider.com/api/v1/backlinks?domain=${domain}`, {
      //   headers: { Authorization: `Bearer ${apiKey}` }
      // });
      
      // For now, let's return mock data
      return {
        success: true,
        message: 'Discovery started. Results will be updated soon.',
      };
    } catch (error) {
      console.error('Error discovering backlinks:', error);
      throw new Error('Failed to discover backlinks. Please try again later.');
    }
  }
  
  /**
   * Scan a URL to find all outgoing links
   */
  async scanOutgoingLinks(url: string, profileId: number) {
    try {
      // Fetch the page content
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEOAnalyzer/1.0; +http://example.com/bot)'
        },
        timeout: 10000
      });
      
      // Parse the HTML
      const dom = new JSDOM(response.data);
      const document = dom.window.document;
      
      // Find all links
      const links = document.querySelectorAll('a');
      const extractedLinks: Array<InsertOutgoingLink & { 
        targetPageAuthority?: number | null, 
        targetDomainAuthority?: number | null 
      }> = [];
      
      // Process each link
      for (const link of Array.from(links)) {
        const href = link.getAttribute('href');
        
        if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
          continue;
        }
        
        try {
          // Create absolute URL
          let absoluteUrl = href;
          if (href.startsWith('/')) {
            const urlObj = new URL(url);
            absoluteUrl = `${urlObj.protocol}//${urlObj.host}${href}`;
          } else if (!href.startsWith('http')) {
            const urlObj = new URL(url);
            absoluteUrl = `${urlObj.protocol}//${urlObj.host}/${href}`;
          }
          
          // Get anchor text and check rel attribute
          const anchorText = link.textContent?.trim() || '';
          const rel = link.getAttribute('rel') || '';
          const isDofollow = !rel.includes('nofollow');
          
          // Extract domain
          const targetDomain = extractDomain(absoluteUrl);
          
          // Only include external links
          if (targetDomain && !url.includes(targetDomain)) {
            extractedLinks.push({
              profileId,
              sourceUrl: url,
              targetUrl: absoluteUrl,
              targetDomain,
              anchorText,
              isDofollow,
              // We don't have these values without additional API calls
              targetPageAuthority: null,
              targetDomainAuthority: null
            });
          }
        } catch (linkError) {
          console.error('Error processing link:', href, linkError);
        }
      }
      
      // Store the links in the database
      for (const link of extractedLinks) {
        await db.insert(outgoingLinks)
          .values({
            profileId: link.profileId,
            sourceUrl: link.sourceUrl,
            targetUrl: link.targetUrl,
            targetDomain: link.targetDomain,
            anchorText: link.anchorText,
            isDofollow: link.isDofollow
          })
          .onConflictDoUpdate({
            target: [outgoingLinks.profileId, outgoingLinks.sourceUrl, outgoingLinks.targetUrl],
            set: { 
              lastChecked: new Date(),
              isDofollow: link.isDofollow,
              anchorText: link.anchorText
            }
          });
      }
      
      return {
        success: true,
        count: extractedLinks.length,
        links: extractedLinks
      };
    } catch (error) {
      console.error('Error scanning outgoing links:', error);
      throw new Error('Failed to scan outgoing links. Please try again later.');
    }
  }
  
  /**
   * Update backlink profile stats
   */
  async updateProfileStats(profileId: number) {
    try {
      // Get counts of different backlink statuses
      const [activeCount] = await db.select({ count: sql<number>`count(*)` })
        .from(backlinks)
        .where(and(
          eq(backlinks.profileId, profileId),
          eq(backlinks.status, 'active')
        ));
        
      const [dofollowCount] = await db.select({ count: sql<number>`count(*)` })
        .from(backlinks)
        .where(and(
          eq(backlinks.profileId, profileId),
          eq(backlinks.isDofollow, true)
        ));
        
      const [nofollowCount] = await db.select({ count: sql<number>`count(*)` })
        .from(backlinks)
        .where(and(
          eq(backlinks.profileId, profileId),
          eq(backlinks.isDofollow, false)
        ));
      
      // Update the profile with new stats
      await db.update(backlinkProfiles)
        .set({
          totalBacklinks: activeCount.count,
          dofollow: dofollowCount.count,
          nofollow: nofollowCount.count,
          updatedAt: new Date()
        })
        .where(eq(backlinkProfiles.id, profileId));
        
      // Add an entry to the history table
      const [profile] = await db.select()
        .from(backlinkProfiles)
        .where(eq(backlinkProfiles.id, profileId));
      
      // Calculate top referring domains
      const topDomains = await db.select({
        domain: backlinks.sourceDomain,
        count: sql<number>`count(*)`
      })
      .from(backlinks)
      .where(and(
        eq(backlinks.profileId, profileId),
        eq(backlinks.status, 'active')
      ))
      .groupBy(backlinks.sourceDomain)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(10);
      
      // Add a history record
      await db.insert(backlinkHistory)
        .values({
          profileId,
          totalBacklinks: profile.totalBacklinks,
          dofollow: profile.dofollow,
          nofollow: profile.nofollow,
          domainAuthority: profile.domainAuthority,
          topReferringDomains: topDomains
        });
      
      return {
        success: true,
        profile
      };
    } catch (error) {
      console.error('Error updating profile stats:', error);
      throw new Error('Failed to update profile statistics.');
    }
  }
}

export const backlinkService = new BacklinkService();