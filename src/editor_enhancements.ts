/**
 * @fileoverview Editor utility functions for text selection and cursor manipulation.
 * @module editor_enhancements
 */

import type { Editor, EditorPosition } from "obsidian";

import { lineRegex, linkLineRegex } from "src/regex";

/**
 * Represents the start and end positions of a word or link in the editor.
 */
interface WordBoundaries {
	/** Starting position of the word */
	start: { line: number; ch: number };
	/** Ending position of the word */
	end: { line: number; ch: number };
}

/**
 * Static utility class for editor text manipulation.
 */
export class EditorExtensions {
	/**
	 * Gets the currently selected text, or expands selection to include the URL at cursor.
	 * If no text is selected, automatically selects the URL or link at the cursor position.
	 * @param editor - The Obsidian editor instance
	 * @returns The selected text
	 */
	public static getSelectedText(editor: Editor): string {
		if (!editor.somethingSelected()) {
			const wordBoundaries = EditorExtensions.getWordBoundaries(editor);
			editor.setSelection(wordBoundaries.start, wordBoundaries.end);
		}
		return editor.getSelection();
	}

	/**
	 * Checks if the cursor position is within the boundaries of a regex match.
	 * @param cursor - Current cursor position
	 * @param match - Regex match result
	 * @returns True if cursor is within the match boundaries
	 */
	private static isCursorWithinBoundaries(
		cursor: EditorPosition,
		match: RegExpMatchArray,
	): boolean {
		const startIndex = match.index ?? 0;
		const endIndex = startIndex + match[0].length;
		return startIndex <= cursor.ch && cursor.ch <= endIndex;
	}

	/**
	 * Finds the boundaries of a URL or Markdown link at the cursor position.
	 * First checks for Markdown links, then for plain URLs.
	 * @param editor - The Obsidian editor instance
	 * @returns The start and end positions of the URL/link, or cursor position if none found
	 */
	private static getWordBoundaries(editor: Editor): WordBoundaries {
		const cursor = editor.getCursor();

		// If its a normal URL token this is not a markdown link
		// In this case we can simply overwrite the link boundaries as-is
		const lineText = editor.getLine(cursor.line);
		// First check if we're in a link
		const linksInLine = lineText.matchAll(linkLineRegex);

		for (const match of linksInLine) {
			if (EditorExtensions.isCursorWithinBoundaries(cursor, match)) {
				const startCh = match.index ?? 0;
				return {
					start: {
						line: cursor.line,
						ch: startCh,
					},
					end: { line: cursor.line, ch: startCh + match[0].length },
				};
			}
		}

		// If not, check if we're in just a standard ol' URL.
		const urlsInLine = lineText.matchAll(lineRegex);

		for (const match of urlsInLine) {
			if (EditorExtensions.isCursorWithinBoundaries(cursor, match)) {
				const startCh = match.index ?? 0;
				return {
					start: { line: cursor.line, ch: startCh },
					end: { line: cursor.line, ch: startCh + match[0].length },
				};
			}
		}

		return {
			start: cursor,
			end: cursor,
		};
	}

	/**
	 * Converts a string index to an editor position (line and character).
	 * @param content - The full editor content
	 * @param index - The character index in the content
	 * @returns The editor position corresponding to the index
	 */
	public static getEditorPositionFromIndex(
		content: string,
		index: number,
	): EditorPosition {
		const substr = content.substr(0, index);

		let l = 0;
		let offset = -1;
		let r = -1;
		for (; (r = substr.indexOf("\n", r + 1)) !== -1; l++, offset = r);
		offset += 1;

		const ch = content.substr(offset, index - offset).length;

		return { line: l, ch: ch };
	}
}
