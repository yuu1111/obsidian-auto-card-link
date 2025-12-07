/**
 * @fileoverview Utility class for validating URLs and link formats.
 * @module checkif
 */

import { imageRegex, linkRegex, urlRegex } from "src/regex";

/**
 * Static utility class for checking URL and link types.
 */
export class CheckIf {
	/**
	 * Checks if the given text is a valid URL.
	 * @param text - The text to validate
	 * @returns True if the text is a valid URL
	 */
	public static isUrl(text: string): boolean {
		const regex = new RegExp(urlRegex);
		return regex.test(text);
	}

	/**
	 * Checks if the given text is an image URL based on file extension.
	 * @param text - The text to validate
	 * @returns True if the text ends with an image file extension
	 */
	public static isImage(text: string): boolean {
		const regex = new RegExp(imageRegex);
		return regex.test(text);
	}

	/**
	 * Checks if the given text is a Markdown-formatted link.
	 * @param text - The text to validate
	 * @returns True if the text matches the `[text](url)` format
	 */
	public static isLinkedUrl(text: string): boolean {
		const regex = new RegExp(linkRegex);
		return regex.test(text);
	}
}
