/**
 * @fileoverview
 * Japanese locale strings.
 * Implements the same structure as the English base locale.
 */
import type en from "./en";

const ja: typeof en = {
	commands: {
		pasteAndEnhance: "URLを貼り付けてカードリンクに変換",
		enhanceSelected: "選択したURLをカードリンクに変換",
	},

	settings: {
		enhanceDefaultPaste: {
			name: "デフォルト貼り付けを拡張",
			desc: "デフォルトの貼り付けコマンドでURLを貼り付ける際にリンクメタデータを取得する",
		},
		showInMenuItem: {
			name: "メニューにコマンドを追加",
			desc: "右クリックメニューにコマンドを追加するかどうか",
		},
	},
};

export default ja;
