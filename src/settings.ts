import { type App, PluginSettingTab, Setting } from "obsidian";

import { i18n } from "src/lang/i18n";
import type ObsidianAutoCardLink from "src/main";

export interface ObsidianAutoCardLinkSettings {
	showInMenuItem: boolean;
	enhanceDefaultPaste: boolean;
}

export const DEFAULT_SETTINGS: ObsidianAutoCardLinkSettings = {
	showInMenuItem: true,
	enhanceDefaultPaste: false,
};

export class ObsidianAutoCardLinkSettingTab extends PluginSettingTab {
	plugin: ObsidianAutoCardLink;

	constructor(app: App, plugin: ObsidianAutoCardLink) {
		super(app, plugin);
		this.plugin = plugin;
	}

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
