import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	WorkspaceLeaf,
	ValueComponent, EditorPosition,
} from 'obsidian';
import {ScrollInfo} from "codemirror";

// Remember to rename these classes and interfaces!

interface PluginSettings {
	mySetting: string;
	tabs: Record<string, TabState>;
}

const DEFAULT_SETTINGS: PluginSettings = {
	mySetting: 'default',
	tabs: {}
}

interface TabState {
	cursor: EditorPosition;
	scroll: {
		top: number;
		left: number;
	}
}

export default class RememberViewStatePlugin extends Plugin {
	settings: PluginSettings;

	initialized = false;

	async onload() {
		this.registerEvent(this.app.workspace.on('active-leaf-change', this.handleActiveLeafChange));
		this.app.workspace.onLayoutReady(() => { this.loadSettings(); });
	}

	onunload() {}

	async loadSettings() {
		if (this.initialized) {
			console.log('Already initialized, skipping')
			return
		}

		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

		// initialize tabs with all open tabs
		const markdownViews = this.app.workspace.getLeavesOfType('markdown');
		// set all tabs at the saved offset
		console.log("Loading tabs", this.settings.tabs)
		console.log('views ', markdownViews.length)

		// set initialized to true here. If something fails we bail out
		this.initialized = true;

		markdownViews.forEach((view, index) => {
			const markdownView = view.view as MarkdownView;
			const tabState = this.settings.tabs[index] || {line: 0, ch: 0};
			console.log('setting cursor for tab', index, view.getDisplayText(), view.id, tabState)
			markdownView.editor.setCursor(tabState.cursor || {line: 0, ch: 0});
		})
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	handleActiveLeafChange = async (leaf: WorkspaceLeaf) => {
		if (!this.initialized) { return }
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (markdownView) {
			const cursor = markdownView.editor.getCursor()
			let markdownViews = this.app.workspace.getLeavesOfType('markdown');

			// clear this.settings.tabs
			this.settings.tabs = {}
			// Save all and avoide mixing things up when tabs are moved around, closed, etc.
			markdownViews.forEach((view, index) => {
				const markdownView = view.view as MarkdownView;
				const cursor = markdownView.editor.getCursor()
				const scrollInfo = markdownView.editor.getScrollInfo()
				this.settings.tabs[index] = {cursor, scroll: scrollInfo}
			})

			await this.saveSettings();
		}

	}
}
