/**
 * @fileoverview Processor for rendering cardlink code blocks in preview mode.
 * @module code_block_processor
 */

import {
	type App,
	ButtonComponent,
	getLinkpath,
	Notice,
	parseYaml,
} from "obsidian";

import { NoRequiredParamsError, YamlParseError } from "src/errors";
import type { LinkMetadata } from "src/interfaces";
import { CheckIf } from "./checkif";

/**
 * Processes cardlink code blocks and renders them as styled card elements.
 */
export class CodeBlockProcessor {
	/** Reference to the Obsidian App instance */
	app: App;

	/**
	 * Creates a new CodeBlockProcessor.
	 * @param app - The Obsidian App instance
	 */
	constructor(app: App) {
		this.app = app;
	}

	/**
	 * Processes the cardlink code block source and renders it.
	 * @param source - The YAML source content of the code block
	 * @param el - The HTML element to render into
	 */
	async run(source: string, el: HTMLElement) {
		try {
			const data = this.parseLinkMetadataFromYaml(source);
			el.appendChild(this.genLinkEl(data));
		} catch (error) {
			if (error instanceof NoRequiredParamsError) {
				el.appendChild(this.genErrorEl(error.message));
			} else if (error instanceof YamlParseError) {
				el.appendChild(this.genErrorEl(error.message));
			} else if (error instanceof TypeError) {
				el.appendChild(
					this.genErrorEl("internal links must be surrounded by" + " quotes."),
				);
				console.log(error);
			} else {
				console.log("Code Block: cardlink unknown error", error);
			}
		}
	}

	/**
	 * Parses YAML content into LinkMetadata.
	 * Handles tab-to-space conversion for YAML compatibility.
	 * @param source - The raw YAML source string
	 * @returns Parsed link metadata
	 * @throws {YamlParseError} When YAML parsing fails
	 * @throws {NoRequiredParamsError} When required fields are missing
	 */
	private parseLinkMetadataFromYaml(source: string): LinkMetadata {
		let yaml: Partial<LinkMetadata>;

		let indent = -1;
		source = source
			.split(/\r?\n|\r|\n/g)
			.map((line) =>
				line.replace(/^\t+/g, (tabs) => {
					const n = tabs.length;
					if (indent < 0) {
						indent = n;
					}
					return " ".repeat(n);
				}),
			)
			.join("\n");

		try {
			yaml = parseYaml(source) as Partial<LinkMetadata>;
		} catch (error) {
			console.log(error);
			throw new YamlParseError(
				"failed to parse yaml. Check debug console for more detail.",
			);
		}

		if (!yaml || !yaml.url || !yaml.title) {
			throw new NoRequiredParamsError(
				"required params[url, title] are not found.",
			);
		}

		return {
			url: yaml.url,
			title: yaml.title,
			description: yaml.description,
			host: yaml.host,
			favicon: yaml.favicon,
			image: yaml.image,
			indent,
		};
	}

	/**
	 * Generates an error display element.
	 * @param errorMsg - The error message to display
	 * @returns HTML element showing the error
	 */
	private genErrorEl(errorMsg: string): HTMLElement {
		const containerEl = document.createElement("div");
		containerEl.addClass("auto-card-link-error-container");

		const spanEl = document.createElement("span");
		spanEl.textContent = `cardlink error: ${errorMsg}`;
		containerEl.appendChild(spanEl);

		return containerEl;
	}

	/**
	 * Generates the card link HTML element from metadata.
	 * Creates a styled card with title, description, favicon, and thumbnail.
	 * @param data - The link metadata to render
	 * @returns The complete card HTML element
	 */
	private genLinkEl(data: LinkMetadata): HTMLElement {
		const containerEl = document.createElement("div");
		containerEl.addClass("auto-card-link-container");
		containerEl.setAttr("data-auto-card-link-depth", data.indent);

		const cardEl = document.createElement("a");
		cardEl.addClass("auto-card-link-card");
		cardEl.setAttr("href", data.url);
		containerEl.appendChild(cardEl);

		const mainEl = document.createElement("div");
		mainEl.addClass("auto-card-link-main");
		cardEl.appendChild(mainEl);

		const titleEl = document.createElement("div");
		titleEl.addClass("auto-card-link-title");
		titleEl.textContent = data.title;
		mainEl.appendChild(titleEl);

		if (data.description) {
			const descriptionEl = document.createElement("div");
			descriptionEl.addClass("auto-card-link-description");
			descriptionEl.textContent = data.description;
			mainEl.appendChild(descriptionEl);
		}

		const hostEl = document.createElement("div");
		hostEl.addClass("auto-card-link-host");
		mainEl.appendChild(hostEl);

		if (data.favicon) {
			if (!CheckIf.isUrl(data.favicon))
				data.favicon = this.getLocalImagePath(data.favicon);

			const faviconEl = document.createElement("img");
			faviconEl.addClass("auto-card-link-favicon");
			faviconEl.setAttr("src", data.favicon);
			hostEl.appendChild(faviconEl);
		}

		if (data.host) {
			const hostNameEl = document.createElement("span");
			hostNameEl.textContent = data.host;
			hostEl.appendChild(hostNameEl);
		}

		if (data.image) {
			if (!CheckIf.isUrl(data.image))
				data.image = this.getLocalImagePath(data.image);

			const thumbnailEl = document.createElement("img");
			thumbnailEl.addClass("auto-card-link-thumbnail");
			thumbnailEl.setAttr("src", data.image);
			thumbnailEl.setAttr("draggable", "false");
			cardEl.appendChild(thumbnailEl);
		}

		new ButtonComponent(containerEl)
			.setClass("auto-card-link-copy-url")
			.setClass("clickable-icon")
			.setIcon("copy")
			.setTooltip(`Copy URL\n${data.url}`)
			.onClick(() => {
				navigator.clipboard.writeText(data.url);
				new Notice("URL copied to your clipboard");
			});

		return containerEl;
	}

	/**
	 * Resolves an internal Obsidian link to a resource path.
	 * @param link - The internal link in `[[filename]]` format
	 * @returns The resolved resource path or the original link if not found
	 */
	private getLocalImagePath(link: string): string {
		link = link.slice(2, -2); // remove [[]]
		const imageRelativePath = this.app.metadataCache.getFirstLinkpathDest(
			getLinkpath(link),
			"",
		)?.path;

		if (!imageRelativePath) return link;

		return this.app.vault.adapter.getResourcePath(imageRelativePath);
	}
}
