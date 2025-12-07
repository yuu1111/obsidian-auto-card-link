/**
 * @fileoverview Parser for extracting metadata from HTML pages.
 * @module link_metadata_parser
 */

import type { LinkMetadata } from "src/interfaces";

/**
 * Parses HTML content to extract link metadata (title, description, images, etc.).
 */
export class LinkMetadataParser {
	/** The original URL being parsed */
	url: string;
	/** The parsed HTML document */
	htmlDoc: Document;

	/**
	 * Creates a new LinkMetadataParser.
	 * @param url - The URL of the page
	 * @param htmlText - The raw HTML content to parse
	 */
	constructor(url: string, htmlText: string) {
		this.url = url;

		const parser = new DOMParser();
		const htmlDoc = parser.parseFromString(htmlText, "text/html");
		this.htmlDoc = htmlDoc;
	}

	/**
	 * Parses the HTML document and extracts link metadata.
	 * @returns The extracted metadata or undefined if title is not found
	 */
	async parse(): Promise<LinkMetadata | undefined> {
		const title = this.getTitle()
			?.replace(/\r\n|\n|\r/g, "")
			.replace(/\\/g, "\\\\")
			.replace(/"/g, '\\"')
			.trim();
		if (!title) return;

		const description = this.getDescription()
			?.replace(/\r\n|\n|\r/g, "")
			.replace(/\\/g, "\\\\")
			.replace(/"/g, '\\"')
			.trim();
		const { hostname } = new URL(this.url);
		const favicon = await this.getFavicon();
		const image = await this.getImage();

		return {
			url: this.url,
			title: title,
			description: description,
			host: hostname,
			favicon: favicon,
			image: image,
			indent: 0,
		};
	}

	/**
	 * Extracts the page title from Open Graph meta tag or title element.
	 * @returns The page title or undefined if not found
	 */
	private getTitle(): string | undefined {
		const ogTitle = this.htmlDoc
			.querySelector("meta[property='og:title']")
			?.getAttr("content");
		if (ogTitle) return ogTitle;

		const title = this.htmlDoc.querySelector("title")?.textContent;
		if (title) return title;
	}

	/**
	 * Extracts the page description from Open Graph or meta description tags.
	 * @returns The page description or undefined if not found
	 */
	private getDescription(): string | undefined {
		const ogDescription = this.htmlDoc
			.querySelector("meta[property='og:description']")
			?.getAttr("content");
		if (ogDescription) return ogDescription;

		const metaDescription = this.htmlDoc
			.querySelector("meta[name='description']")
			?.getAttr("content");
		if (metaDescription) return metaDescription;
	}

	/**
	 * Extracts the favicon URL from the link element.
	 * @returns The resolved favicon URL or undefined if not found
	 */
	private async getFavicon(): Promise<string | undefined> {
		const favicon = this.htmlDoc
			.querySelector("link[rel='icon']")
			?.getAttr("href");
		if (favicon) return await this.fixImageUrl(favicon);
	}

	/**
	 * Extracts the Open Graph image URL.
	 * @returns The resolved image URL or undefined if not found
	 */
	private async getImage(): Promise<string | undefined> {
		const ogImage = this.htmlDoc
			.querySelector("meta[property='og:image']")
			?.getAttr("content");
		if (ogImage) return await this.fixImageUrl(ogImage);
	}

	/**
	 * Resolves relative or protocol-relative image URLs to absolute URLs.
	 * Tests accessibility via https first, then http.
	 * @param url - The image URL to resolve
	 * @returns The resolved absolute URL
	 */
	private async fixImageUrl(url: string | undefined): Promise<string> {
		if (url === undefined) return "";
		const { hostname } = new URL(this.url);
		let image = url;
		// check if image url use double protocol
		if (url?.startsWith("//")) {
			//   check if url can access via https or http
			const testUrlHttps = `https:${url}`;
			const testUrlHttp = `http:${url}`;
			if (await checkUrlAccessibility(testUrlHttps)) {
				image = testUrlHttps;
			} else if (await checkUrlAccessibility(testUrlHttp)) {
				image = testUrlHttp;
			}
		} else if (url?.startsWith("/") && hostname) {
			//   check if image url is relative path
			const testUrlHttps = `https://${hostname}${url}`;
			const testUrlHttp = `http://${hostname}${url}`;
			const resUrlHttps = await checkUrlAccessibility(testUrlHttps);
			const resUrlHttp = await checkUrlAccessibility(testUrlHttp);
			//   check if url can access via https or http
			if (resUrlHttps) {
				image = testUrlHttps;
			} else if (resUrlHttp) {
				image = testUrlHttp;
			}
		}

		/**
		 * Checks if a URL is accessible by attempting to load it as an image.
		 * @param url - The URL to check
		 * @returns True if the image loads successfully
		 */
		async function checkUrlAccessibility(url: string): Promise<boolean> {
			return new Promise((resolve) => {
				const img = new Image();
				img.onload = () => resolve(true);
				img.onerror = () => resolve(false);
				img.src = url;
			});
		}

		return image;
	}
}
