import {EditorPosition, MarkdownView, Plugin, WorkspaceLeaf,} from 'obsidian';

const isDev = process.env.NODE_ENV === 'development';

interface PluginSettings {
	tabs: Record<string, TabState>;
}

const DEFAULT_SETTINGS: PluginSettings = {
	tabs: {}
}

interface TabState {
	cursor: EditorPosition;
	scroll: {
		top: number;
		left: number;
	}
}

// noinspection JSUnusedGlobalSymbols
export default class RememberViewStatePlugin extends Plugin {
	settings: PluginSettings;

	initialized = false;

	async onload() {
		this.registerEvent(this.app.workspace.on('active-leaf-change', this.handleActiveLeafChange));
		this.app.workspace.onLayoutReady(() => {
			this.loadSettings();
		});
	}

	onunload() {
	}

	async loadSettings() {
		if (this.initialized) {
			return
		}

		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

		// initialize tabs with all open tabs
		const markdownViews = this.app.workspace.getLeavesOfType('markdown');

		if (isDev) {
			console.log("Loading tabs", this.settings.tabs)
			console.log('views ', markdownViews.length)
		}
		// set initialized to true here. If something fails we bail out
		this.initialized = true;

		// set all tabs at the saved offset
		markdownViews.forEach((view, index) => {
			const markdownView = view.view as MarkdownView;
			const tabState = this.settings.tabs[index] || {line: 0, ch: 0};
			let cursor = tabState.cursor;
			let scrollPosition = tabState.scroll;
			// @ts-ignore this is not visible, yet the best way to get an id that's
			let viewId = view.id;
			if (isDev) {
				console.log('setting cursor for tab', index, view.getDisplayText(), viewId, tabState)
				console.log('setting scroll for tab', index, view.getDisplayText(), viewId, scrollPosition)
			}
			markdownView.editor.setCursor(cursor || {line: 0, ch: 0});
			// attempting to set the scroll position
			// NOTE this is not working as expected
			// The problem is getScrollInfo() returns a different object than the one we saved.
			// Moreover, it returns a value in pixels and this sets one in lines.
			// Moreover, none of the APIs are documented.
			// This centers the scroll to cursor position
			markdownView.editor.scrollIntoView({
				from: {line: cursor.line, ch: cursor.ch},
				to: {line: cursor.line, ch: cursor.ch}
			}, true)
		})
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	handleActiveLeafChange = async (leaf: WorkspaceLeaf) => {
		if (!this.initialized) {
			return
		}
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (markdownView) {
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
			if (isDev) {
				console.log('Saving tabs', this.settings.tabs)
			}

			await this.saveSettings();
		}

	}
}
