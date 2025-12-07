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

export default class ObsidianAutoCardLink extends Plugin {
	settings?: ObsidianAutoCardLinkSettings;

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

	private getEditor(): Editor | undefined {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return;
		return view.editor;
	}

	private getUrlFromLink(link: string): string {
		const urlRegex = new RegExp(linkRegex);
		const regExpExecArray = urlRegex.exec(link);
		if (regExpExecArray === null || regExpExecArray.length < 2) {
			return "";
		}
		return regExpExecArray[2];
	}

	onunload() {
		console.log("unloading auto-card-link");
	}

	private async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
