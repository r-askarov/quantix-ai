
export interface CachedProduct {
  barcode: string;
  name: string;
  supplier?: string;
  price?: number;
  lastUsed: number;
}

export class BarcodeCache {
  private static readonly CACHE_KEY = 'barcodeCache';
  private static readonly MAX_CACHE_SIZE = 1000;
  private static readonly CACHE_EXPIRY_DAYS = 30;

  /**
   * Get product from cache by barcode
   */
  static getProduct(barcode: string): CachedProduct | null {
    try {
      const cache = this.getCache();
      const product = cache[barcode];
      
      if (product && this.isNotExpired(product.lastUsed)) {
        // Update last used timestamp
        product.lastUsed = Date.now();
        this.saveCache(cache);
        return product;
      }
      
      // Remove expired entry
      if (product) {
        delete cache[barcode];
        this.saveCache(cache);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting product from cache:', error);
      return null;
    }
  }

  /**
   * Add or update product in cache
   */
  static setProduct(product: CachedProduct): void {
    try {
      const cache = this.getCache();
      
      // Add/update product with current timestamp
      cache[product.barcode] = {
        ...product,
        lastUsed: Date.now()
      };
      
      // Clean cache if it's too large
      this.cleanCache(cache);
      this.saveCache(cache);
    } catch (error) {
      console.error('Error saving product to cache:', error);
    }
  }

  /**
   * Search for products with fuzzy matching
   */
  static fuzzySearch(barcode: string): CachedProduct[] {
    try {
      const cache = this.getCache();
      const matches: CachedProduct[] = [];
      
      for (const cachedBarcode in cache) {
        const product = cache[cachedBarcode];
        
        if (this.isNotExpired(product.lastUsed)) {
          // Check for partial matches (allowing 1-2 character differences)
          if (this.isFuzzyMatch(barcode, cachedBarcode)) {
            matches.push(product);
          }
        }
      }
      
      // Sort by similarity and last used
      return matches.sort((a, b) => {
        const aScore = this.getSimilarityScore(barcode, a.barcode);
        const bScore = this.getSimilarityScore(barcode, b.barcode);
        
        if (aScore !== bScore) {
          return bScore - aScore; // Higher score first
        }
        
        return b.lastUsed - a.lastUsed; // More recent first
      });
    } catch (error) {
      console.error('Error in fuzzy search:', error);
      return [];
    }
  }

  /**
   * Clear expired entries from cache
   */
  static cleanExpired(): void {
    try {
      const cache = this.getCache();
      let hasChanges = false;
      
      for (const barcode in cache) {
        if (!this.isNotExpired(cache[barcode].lastUsed)) {
          delete cache[barcode];
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        this.saveCache(cache);
      }
    } catch (error) {
      console.error('Error cleaning cache:', error);
    }
  }

  /**
   * Get cache size and statistics
   */
  static getCacheStats(): { size: number; expired: number; total: number } {
    try {
      const cache = this.getCache();
      const total = Object.keys(cache).length;
      let expired = 0;
      
      for (const barcode in cache) {
        if (!this.isNotExpired(cache[barcode].lastUsed)) {
          expired++;
        }
      }
      
      return {
        size: total - expired,
        expired,
        total
      };
    } catch {
      return { size: 0, expired: 0, total: 0 };
    }
  }

  // Private methods
  private static getCache(): Record<string, CachedProduct> {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  }

  private static saveCache(cache: Record<string, CachedProduct>): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error saving cache to localStorage:', error);
    }
  }

  private static isNotExpired(timestamp: number): boolean {
    const expiryTime = this.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - timestamp < expiryTime;
  }

  private static cleanCache(cache: Record<string, CachedProduct>): void {
    const entries = Object.entries(cache);
    
    if (entries.length <= this.MAX_CACHE_SIZE) {
      return;
    }
    
    // Sort by last used (oldest first) and remove excess entries
    entries.sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    
    const toRemove = entries.length - this.MAX_CACHE_SIZE;
    for (let i = 0; i < toRemove; i++) {
      delete cache[entries[i][0]];
    }
  }

  private static isFuzzyMatch(barcode1: string, barcode2: string): boolean {
    if (barcode1 === barcode2) return true;
    
    // Allow up to 2 character differences for fuzzy matching
    const maxDifferences = 2;
    const minLength = Math.min(barcode1.length, barcode2.length);
    
    if (Math.abs(barcode1.length - barcode2.length) > maxDifferences) {
      return false;
    }
    
    let differences = 0;
    for (let i = 0; i < minLength; i++) {
      if (barcode1[i] !== barcode2[i]) {
        differences++;
        if (differences > maxDifferences) {
          return false;
        }
      }
    }
    
    return differences <= maxDifferences;
  }

  private static getSimilarityScore(barcode1: string, barcode2: string): number {
    if (barcode1 === barcode2) return 100;
    
    const longer = barcode1.length > barcode2.length ? barcode1 : barcode2;
    const shorter = barcode1.length > barcode2.length ? barcode2 : barcode1;
    
    if (longer.length === 0) return 100;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return ((longer.length - editDistance) / longer.length) * 100;
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator  // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}
