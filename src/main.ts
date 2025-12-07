/**
 * @fileoverview Main plugin entry point for Auto Card Link.
 * @module main
 */

import {
	type Editor,
	MarkdownView,
	type Menu,
	type MenuItem,
	Plugin,
} from "obsidian";
import { CheckIf } from "src/checkif";
import { CodeBlockGenerator } from "src/code_block_generator";
import { CodeBlockProcessor } from "src/code_block_processor";
import { EditorExtensions } from "src/editor_enhancements";
import { i18n } from "src/lang/i18n";
import { linkRegex } from "src/regex";
import {
	DEFAULT_SETTINGS,
	type ObsidianAutoCardLinkSettings,
	ObsidianAutoCardLinkSettingTab,
} from "src/settings";

/**
 * Main plugin class for Auto Card Link.
 * Automatically fetches metadata from URLs and creates card-styled links.
 * @extends Plugin
 */
export default class ObsidianAutoCardLink extends Plugin {
	/** Plugin settings */
	settings?: ObsidianAutoCardLinkSettings;

	/**
	 * Called when the plugin is loaded.
	 * Registers commands, event handlers, and settings.
	 */
	async onload() {
		await this.loadSettings();

		this.registerMarkdownCodeBlockProcessor("cardlink", async (source, el) => {
			const processor = new CodeBlockProcessor(this.app);
			await processor.run(source, el);
		});

		this.addCommand({
			id: "auto-card-link-paste-and-enhance",
			name: i18n.commands.pasteAndEnhance,
			editorCallback: async (editor: Editor) => {
				await this.manualPasteAndEnhanceURL(editor);
			},
			hotkeys: [],
		});

		this.addCommand({
			id: "auto-card-link-enhance-selected-url",
			name: i18n.commands.enhanceSelected,
			editorCheckCallback: (checking: boolean, editor: Editor) => {
				// if offline, not showing command
				if (!navigator.onLine) return false;

				if (checking) return true;

				this.enhanceSelectedURL(editor);
			},
			hotkeys: [
				{
					modifiers: ["Mod", "Shift"],
					key: "e",
				},
			],
		});

		this.registerEvent(this.app.workspace.on("editor-paste", this.onPaste));

		this.registerEvent(this.app.workspace.on("editor-menu", this.onEditorMenu));

		this.addSettingTab(new ObsidianAutoCardLinkSettingTab(this.app, this));
	}

	/**
	 * Converts selected URL(s) to card link code blocks.
	 * Handles both plain URLs and Markdown-formatted links.
	 * @param editor - The Obsidian editor instance
	 */
	private enhanceSelectedURL(editor: Editor): void {
		const selectedText = (
			EditorExtensions.getSelectedText(editor) || ""
		).trim();

		const codeBlockGenerator = new CodeBlockGenerator(editor);

		for (const line of selectedText.split(/[\n ]/)) {
			if (CheckIf.isUrl(line)) {
				codeBlockGenerator.convertUrlToCodeBlock(line);
			} else if (CheckIf.isLinkedUrl(line)) {
				const url = this.getUrlFromLink(line);
				codeBlockGenerator.convertUrlToCodeBlock(url);
			}
		}
	}

	/**
	 * Pastes clipboard content and converts URL to card link if applicable.
	 * Falls back to normal paste for non-URLs or offline mode.
	 * @param editor - The Obsidian editor instance
	 */
	private async manualPasteAndEnhanceURL(editor: Editor): Promise<void> {
		// if no clipboardText, do nothing
		const clipboardText = await navigator.clipboard.readText();
		if (clipboardText == null || clipboardText === "") {
			return;
		}

		// if offline, just paste
		if (!navigator.onLine) {
			editor.replaceSelection(clipboardText);
			return;
		}

		console.log(clipboardText);
		console.log(CheckIf.isUrl(clipboardText));

		// If not URL, just paste
		if (!CheckIf.isUrl(clipboardText) || CheckIf.isImage(clipboardText)) {
			editor.replaceSelection(clipboardText);
			return;
		}

		const codeBlockGenerator = new CodeBlockGenerator(editor);
		await codeBlockGenerator.convertUrlToCodeBlock(clipboardText);
		return;
	}

	/**
	 * Handles paste events to automatically convert URLs to card links.
	 * Only active when enhanceDefaultPaste setting is enabled.
	 * @param evt - The clipboard event
	 * @param editor - The Obsidian editor instance
	 */
	private onPaste = async (
		evt: ClipboardEvent,
		editor: Editor,
	): Promise<void> => {
		// if enhanceDefaultPaste is false, do nothing
		if (!this.settings?.enhanceDefaultPaste) return;

		// if offline, do nothing
		if (!navigator.onLine) return;

		if (evt.clipboardData == null) return;

		// If clipboardData includes any files, we return false to allow the default paste handler to take care of it.
		if (evt.clipboardData.files.length > 0) return;

		const clipboardText = evt.clipboardData.getData("text/plain");
		if (clipboardText == null || clipboardText === "") return;

		// If its not a URL, we return false to allow the default paste handler to take care of it.
		// Similarly, image urls don't have a meaningful attribute so downloading it
		// to fetching metadata is a waste of bandwidth.
		if (!CheckIf.isUrl(clipboardText) || CheckIf.isImage(clipboardText)) {
			return;
		}

		// We've decided to handle the paste, stop propagation to the default handler.
		evt.stopPropagation();
		evt.preventDefault();

		const codeBlockGenerator = new CodeBlockGenerator(editor);
		await codeBlockGenerator.convertUrlToCodeBlock(clipboardText);
		return;
	};

	/**
	 * Adds card link commands to the editor context menu.
	 * @param menu - The context menu to add items to
	 */
	private onEditorMenu = (menu: Menu) => {
		// if showInMenuItem setting is false, now showing menu item
		if (!this.settings?.showInMenuItem) return;

		menu.addItem((item: MenuItem) => {
			item
				.setTitle(i18n.commands.pasteAndEnhance)
				.setIcon("paste")
				.onClick(async () => {
					const editor = this.getEditor();
					if (!editor) return;
					this.manualPasteAndEnhanceURL(editor);
				});
		});

		// if offline, not showing enhance selected URL item
		if (!navigator.onLine) return;

		menu.addItem((item: MenuItem) => {
			item
				.setTitle(i18n.commands.enhanceSelected)
				.setIcon("link")
				.onClick(() => {
					const editor = this.getEditor();
					if (!editor) return;
					this.enhanceSelectedURL(editor);
				});
		});

		return;
	};

	/**
	 * Gets the active editor instance.
	 * @returns The editor instance or undefined if no active view
	 */
	private getEditor(): Editor | undefined {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return;
		return view.editor;
	}

	/**
	 * Extracts the URL from a Markdown link.
	 * @param link - The Markdown link in `[text](url)` format
	 * @returns The extracted URL or empty string if not found
	 */
	private getUrlFromLink(link: string): string {
		const urlRegex = new RegExp(linkRegex);
		const regExpExecArray = urlRegex.exec(link);
		if (regExpExecArray === null || regExpExecArray.length < 2) {
			return "";
		}
		return regExpExecArray[2];
	}

	/**
	 * Called when the plugin is unloaded.
	 */
	onunload() {
		console.log("unloading auto-card-link");
	}

	/**
	 * Loads plugin settings from storage.
	 */
	private async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	/**
	 * Saves plugin settings to storage.
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}
}
