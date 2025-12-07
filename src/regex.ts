/**
 * @fileoverview Regular expressions for URL and link detection.
 * @module regex
 */

/**
 * Regex pattern to validate a complete URL string.
 * Matches URLs starting with http(s):// or www.
 * Must match the entire string (anchored with ^ and $).
 */
export const urlRegex =
	/^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})$/i;

/**
 * Regex pattern to find URLs within a line of text.
 * Global flag enabled for multiple matches.
 */
export const lineRegex =
	/(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;

/**
 * Regex pattern to validate a complete Markdown link format.
 * Matches `[text](url)` format, anchored to match entire string.
 */
export const linkRegex =
	/^\[([^[\]]*)\]\((https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})\)$/i;

/**
 * Regex pattern to find Markdown links within a line of text.
 * Global flag enabled for multiple matches.
 */
export const linkLineRegex =
	/\[([^[\]]*)\]\((https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})\)/gi;

/**
 * Regex pattern to detect image file extensions.
 * Used to filter out image URLs from card link processing.
 */
export const imageRegex = /\.(gif|jpe?g|tiff?|png|webp|bmp|tga|psd|ai)$/i;
