/**
 * @fileoverview Type definitions for link metadata.
 * @module interfaces
 */

/**
 * Metadata extracted from a URL for rendering as a card link.
 */
export interface LinkMetadata {
	/** The URL of the link */
	url: string;
	/** The title of the linked page */
	title: string;
	/** Optional description or summary of the linked page */
	description?: string;
	/** The hostname of the URL (e.g., "github.com") */
	host?: string;
	/** URL to the site's favicon image */
	favicon?: string;
	/** URL to the Open Graph or preview image */
	image?: string;
	/** Indentation level for nested code blocks */
	indent: number;
}
