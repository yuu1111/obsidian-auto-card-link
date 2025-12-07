/**
 * @fileoverview Generator for creating cardlink code blocks from URLs.
 * @module code_block_generator
 */

import { type Editor, Notice, requestUrl } from "obsidian";
import { EditorExtensions } from "src/editor_enhancements";
import type { LinkMetadata } from "src/interfaces";
import { LinkMetadataParser } from "src/link_metadata_parser";

/**
 * Generates cardlink code blocks by fetching metadata from URLs.
 */
export class CodeBlockGenerator {
	/** Reference to the Obsidian editor instance */
	editor: Editor;

	/**
	 * Creates a new CodeBlockGenerator.
	 * @param editor - The Obsidian editor instance
	 */
	constructor(editor: Editor) {
		this.editor = editor;
	}

	/**
	 * Converts a URL to a cardlink code block.
	 * Shows a placeholder while fetching, then replaces with the code block.
	 * @param url - The URL to convert
	 */
	async convertUrlToCodeBlock(url: string): Promise<void> {
		const selectedText = this.editor.getSelection();

		// Generate a unique id for find/replace operations.
		const pasteId = this.createBlockHash();
		const fetchingText = `[Fetching Data#${pasteId}](${url})`;

		// Instantly paste so you don't wonder if paste is broken
		this.editor.replaceSelection(fetchingText);

		const linkMetadata = await this.fetchLinkMetadata(url);

		const text = this.editor.getValue();
		const start = text.indexOf(fetchingText);

		if (start < 0) {
			console.log(
				`Unable to find text "${fetchingText}" in current editor, bailing out; link ${url}`,
			);
			return;
		}

		const end = start + fetchingText.length;
		const startPos = EditorExtensions.getEditorPositionFromIndex(text, start);
		const endPos = EditorExtensions.getEditorPositionFromIndex(text, end);

		// if failed to link metadata, show notification and revert
		if (!linkMetadata) {
			new Notice("Couldn't fetch link metadata");
			this.editor.replaceRange(selectedText || url, startPos, endPos);
			return;
		}
		this.editor.replaceRange(this.genCodeBlock(linkMetadata), startPos, endPos);
	}

	/**
	 * Generates the cardlink code block string from metadata.
	 * @param linkMetadata - The metadata to include in the code block
	 * @returns The formatted code block string
	 */
	genCodeBlock(linkMetadata: LinkMetadata): string {
		const codeBlockTexts = ["\n```cardlink"];
		codeBlockTexts.push(`url: ${linkMetadata.url}`);
		codeBlockTexts.push(`title: "${linkMetadata.title}"`);
		if (linkMetadata.description)
			codeBlockTexts.push(`description: "${linkMetadata.description}"`);
		if (linkMetadata.host) codeBlockTexts.push(`host: ${linkMetadata.host}`);
		if (linkMetadata.favicon)
			codeBlockTexts.push(`favicon: ${linkMetadata.favicon}`);
		if (linkMetadata.image) codeBlockTexts.push(`image: ${linkMetadata.image}`);
		codeBlockTexts.push("```\n");
		return codeBlockTexts.join("\n");
	}

	/**
	 * Fetches and parses metadata from a URL.
	 * @param url - The URL to fetch metadata from
	 * @returns The parsed metadata or undefined if fetch fails
	 */
	private async fetchLinkMetadata(
		url: string,
	): Promise<LinkMetadata | undefined> {
		const res = await (async () => {
			try {
				return requestUrl({ url });
			} catch (e) {
				console.log(e);
				return;
			}
		})();
		if (!res || res.status !== 200) {
			console.log(`bad response. response status code was ${res?.status}`);
			return;
		}

		const parser = new LinkMetadataParser(url, res.text);
		return parser.parse();
	}

	/**
	 * Creates a random 4-character hash for unique placeholder identification.
	 * @returns A random alphanumeric string
	 */
	private createBlockHash(): string {
		let result = "";
		const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
		const charactersLength = characters.length;
		for (let i = 0; i < 4; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	}
}
