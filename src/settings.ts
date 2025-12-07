/**
 * @fileoverview Plugin settings interface and settings tab UI.
 * @module settings
 */

import { type App, PluginSettingTab, Setting } from "obsidian";

import { i18n } from "src/lang/i18n";
import type ObsidianAutoCardLink from "src/main";

/**
 * Plugin settings configuration interface.
 */
export interface ObsidianAutoCardLinkSettings {
	/** Whether to show commands in the right-click context menu */
	showInMenuItem: boolean;
	/** Whether to automatically convert pasted URLs to card links */
	enhanceDefaultPaste: boolean;
}

/**
 * Default settings values.
 */
export const DEFAULT_SETTINGS: ObsidianAutoCardLinkSettings = {
	showInMenuItem: true,
	enhanceDefaultPaste: false,
};

/**
 * Settings tab UI for the Auto Card Link plugin.
 * @extends PluginSettingTab
 */
export class ObsidianAutoCardLinkSettingTab extends PluginSettingTab {
	/** Reference to the plugin instance */
	plugin: ObsidianAutoCardLink;

	/**
	 * Creates a new settings tab.
	 * @param app - The Obsidian App instance
	 * @param plugin - The plugin instance
	 */
	constructor(app: App, plugin: ObsidianAutoCardLink) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * Renders the settings UI.
	 */
	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName(i18n.settings.enhanceDefaultPaste.name)
			.setDesc(i18n.settings.enhanceDefaultPaste.desc)
			.addToggle((val) => {
				if (!this.plugin.settings) return;
				return val
					.setValue(this.plugin.settings.enhanceDefaultPaste)
					.onChange(async (value) => {
						if (!this.plugin.settings) return;
						this.plugin.settings.enhanceDefaultPaste = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName(i18n.settings.showInMenuItem.name)
			.setDesc(i18n.settings.showInMenuItem.desc)
			.addToggle((val) => {
				if (!this.plugin.settings) return;
				return val
					.setValue(this.plugin.settings.showInMenuItem)
					.onChange(async (value) => {
						if (!this.plugin.settings) return;
						this.plugin.settings.showInMenuItem = value;
						await this.plugin.saveSettings();
					});
			});
	}
}
