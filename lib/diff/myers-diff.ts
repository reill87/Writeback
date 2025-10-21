import { diff_match_patch } from 'diff-match-patch';

/**
 * Diff Change Types
 */
export type DiffChangeType = 'equal' | 'insert' | 'delete';

/**
 * Diff Change
 * 
 * Represents a single change in the diff.
 */
export interface DiffChange {
  /** Type of change */
  type: DiffChangeType;
  /** Text content */
  text: string;
  /** Start position in the original text */
  startPos?: number;
  /** Length of the change */
  length?: number;
}

/**
 * Diff Result
 * 
 * Result of comparing two texts.
 */
export interface DiffResult {
  /** Array of changes */
  changes: DiffChange[];
  /** Statistics */
  stats: {
    /** Total additions */
    additions: number;
    /** Total deletions */
    deletions: number;
    /** Total unchanged lines */
    unchanged: number;
    /** Percentage of similarity (0-100) */
    similarity: number;
  };
}

/**
 * Myers Diff Implementation
 * 
 * Wrapper around diff-match-patch with semantic cleanup.
 * 
 * Based on the Myers algorithm for computing optimal diffs:
 * - Fast and efficient for most text comparisons
 * - Semantic cleanup to merge related changes
 * - Character-level and word-level diff support
 */
export class MyersDiff {
  private dmp: any;
  
  constructor() {
    this.dmp = new diff_match_patch();
    
    // Configure for better readability
    this.dmp.Diff_Timeout = 1.0; // 1 second timeout
    this.dmp.Diff_EditCost = 4; // Cost of an edit operation
  }
  
  /**
   * Compare two texts and return diff result
   * 
   * @param text1 - Original text (left side)
   * @param text2 - Modified text (right side)
   * @param options - Diff options
   * @returns Diff result with changes and statistics
   */
  compare(
    text1: string, 
    text2: string,
    options: {
      /** Enable semantic cleanup (default: true) */
      semantic?: boolean;
      /** Enable efficiency cleanup (default: true) */
      efficiency?: boolean;
    } = {}
  ): DiffResult {
    const { semantic = true, efficiency = true } = options;
    
    // Compute initial diff
    let diffs = this.dmp.diff_main(text1, text2);
    
    // Apply cleanups
    if (efficiency) {
      this.dmp.diff_cleanupEfficiency(diffs);
    }
    
    if (semantic) {
      this.dmp.diff_cleanupSemantic(diffs);
    }
    
    // Convert to our format
    const changes: DiffChange[] = [];
    let startPos = 0;
    
    for (const [operation, text] of diffs) {
      const type = this.mapOperationType(operation);
      
      changes.push({
        type,
        text,
        startPos,
        length: text.length,
      });
      
      // Update position for next change
      if (type !== 'insert') {
        startPos += text.length;
      }
    }
    
    // Calculate statistics
    const stats = this.calculateStats(changes, text1.length, text2.length);
    
    return {
      changes,
      stats,
    };
  }
  
  /**
   * Compare texts line by line
   * 
   * More readable for large documents.
   * 
   * @param text1 - Original text
   * @param text2 - Modified text
   * @returns Line-based diff result
   */
  compareLines(text1: string, text2: string): DiffResult {
    // Split into lines
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    
    // Use line mode for better performance on large texts
    const [text1Encoded, text2Encoded, lineArray] = this.dmp.diff_linesToChars_(text1, text2);
    
    // Compute diff on encoded text
    const diffs = this.dmp.diff_main(text1Encoded, text2Encoded);
    
    // Convert back to lines
    this.dmp.diff_charsToLines_(diffs, lineArray);
    
    // Apply semantic cleanup
    this.dmp.diff_cleanupSemantic(diffs);
    
    // Convert to our format
    const changes: DiffChange[] = [];
    let lineNum = 0;
    
    for (const [operation, text] of diffs) {
      const type = this.mapOperationType(operation);
      
      changes.push({
        type,
        text,
        startPos: lineNum,
        length: text.split('\n').length - 1,
      });
      
      if (type !== 'insert') {
        lineNum += text.split('\n').length - 1;
      }
    }
    
    // Calculate statistics
    const stats = this.calculateStats(changes, lines1.length, lines2.length);
    
    return {
      changes,
      stats,
    };
  }
  
  /**
   * Get human-readable diff HTML
   * 
   * @param text1 - Original text
   * @param text2 - Modified text
   * @returns HTML string with highlighted changes
   */
  getHtml(text1: string, text2: string): string {
    const diffs = this.dmp.diff_main(text1, text2);
    this.dmp.diff_cleanupSemantic(diffs);
    return this.dmp.diff_prettyHtml(diffs);
  }
  
  /**
   * Calculate similarity percentage
   * 
   * @param text1 - Original text
   * @param text2 - Modified text
   * @returns Similarity percentage (0-100)
   */
  similarity(text1: string, text2: string): number {
    const diffs = this.dmp.diff_main(text1, text2);
    const totalLength = Math.max(text1.length, text2.length);
    
    if (totalLength === 0) return 100;
    
    let equalLength = 0;
    for (const [operation, text] of diffs) {
      if (operation === 0) { // EQUAL
        equalLength += text.length;
      }
    }
    
    return Math.round((equalLength / totalLength) * 100);
  }
  
  /**
   * Map diff-match-patch operation to our type
   */
  private mapOperationType(operation: number): DiffChangeType {
    switch (operation) {
      case -1: // DELETE
        return 'delete';
      case 0: // EQUAL
        return 'equal';
      case 1: // INSERT
        return 'insert';
      default:
        return 'equal';
    }
  }
  
  /**
   * Calculate diff statistics
   */
  private calculateStats(
    changes: DiffChange[], 
    originalLength: number, 
    modifiedLength: number
  ) {
    let additions = 0;
    let deletions = 0;
    let unchanged = 0;
    
    for (const change of changes) {
      switch (change.type) {
        case 'insert':
          additions += change.length || 0;
          break;
        case 'delete':
          deletions += change.length || 0;
          break;
        case 'equal':
          unchanged += change.length || 0;
          break;
      }
    }
    
    // Calculate similarity
    const totalLength = Math.max(originalLength, modifiedLength);
    const similarity = totalLength > 0 ? Math.round((unchanged / totalLength) * 100) : 100;
    
    return {
      additions,
      deletions,
      unchanged,
      similarity,
    };
  }
}

/**
 * Default Myers diff instance
 */
export const myersDiff = new MyersDiff();

/**
 * Convenience function for quick text comparison
 * 
 * @param text1 - Original text
 * @param text2 - Modified text
 * @returns Diff result
 */
export function compareTexts(text1: string, text2: string): DiffResult {
  return myersDiff.compare(text1, text2);
}

/**
 * Convenience function for line-based comparison
 * 
 * @param text1 - Original text
 * @param text2 - Modified text
 * @returns Line-based diff result
 */
export function compareLines(text1: string, text2: string): DiffResult {
  return myersDiff.compareLines(text1, text2);
}