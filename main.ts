import {EditorPosition, MarkdownView, Plugin, WorkspaceLeaf,} from 'obsidian';

const isDev = process.env.NODE_ENV === 'development';

interface PluginSettings {
	tabs: Record<string, TabState>;
}

const DEFAULT_SETTINGS: PluginSettings = {
	tabs: {}
}

interface TabState {
	id: string;
	name: string;
	index: number;
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
	loadedTabs = new Map<string, boolean>();

	async onload() {
		this.registerEvent(this.app.workspace.on('active-leaf-change', this.onLeafChange));
		this.app.workspace.onLayoutReady(() => {
			this.restoreActiveLeaves();
		});
		this.removeOrphanLeaves()
	}

	onunload() {
	}

	removeOrphanLeaves = async () => {
		if (!this.initialized) {
			return;
		}

		// Get the IDs of currently open markdown leaves
		const openLeafIds = new Set(
			// @ts-ignore this is not visible, yet the best way to get an id
			this.app.workspace.getLeavesOfType('markdown').map(leaf => leaf.id)
		);

		// Check which tabs in settings are no longer open and remove them
		Object.keys(this.settings.tabs).forEach(tabId => {
			if (!openLeafIds.has(tabId)) {
				delete this.settings.tabs[tabId]; // Remove the tab from settings
				if (isDev) {
					console.log(`Removed closed tab ${tabId} from settings.`);
				}
			}
		});
		await this.saveSettings();
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async saveTabsStates() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			return
		}
		// Save all and avoide mixing things up when tabs are moved around, closed, etc.
		this.app.workspace.getLeavesOfType('markdown')
		.filter(v => (v.view as MarkdownView).editor != null)
		.forEach((leaf, index) => {
			const markdownView = leaf.view as MarkdownView;
			const cursor = markdownView.editor.getCursor()
			const name = markdownView.getDisplayText();
			// @ts-ignore
			const id = leaf.id;
			const scrollInfo = markdownView.editor.getScrollInfo()
			if (cursor.line === 0) {
				console.log(`Not saving ${name} with 0 cursor`);
				return;
			}
			this.settings.tabs[id] = {id, name, cursor, scroll: scrollInfo, index}
		})
		if (isDev) {
			console.log('Saving tabs', this.settings.tabs)
		}

		await this.saveSettings();
	}


	async restoreActiveLeaves() {
		if (this.initialized) {
			return
		}

		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

		// initialize tabs with all open tabs
		const leaves = this.app.workspace.getLeavesOfType('markdown');

		if (isDev) {
			console.log("Loading tabs", this.settings.tabs)
			console.log('views ', leaves.length)
		}
		// set initialized to true here. If something fails we bail out
		this.initialized = true;

		// set all tabs at the saved offset
		leaves
		// .map(leaf => {
		// 	console.log(leaf)
		// 	return leaf;
		// })
		.filter(v => (v.view as MarkdownView).editor != null)
		.forEach((leaf, index) => {
			this.restoreLeaf(leaf, index);
		})
	}

	private restoreLeaf(leaf: WorkspaceLeaf, index: number) {
		const markdownView = leaf.view as MarkdownView;
		// @ts-ignore this is not visible, yet the best way to get an id that's
		let leafId = leaf.id;
		this.loadedTabs.set(leafId, true);
		const tabState = this.settings.tabs[leafId] || {line: 0, ch: 0};
		let cursor = tabState.cursor || {line: 0, ch: 0};
		let scrollPosition = tabState.scroll;
		if (tabState.cursor === undefined) {
			console.log("WTF empty cursor after setting tabstate " + tabState.cursor);
		}
		console.log('setting cursor for tab', index, leaf.getDisplayText(), leafId, tabState.cursor.line)
		markdownView.editor.setCursor(cursor);
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
	}


	onLeafChange = async (leaf: WorkspaceLeaf) => {
		console.log('⚡️leaf change', leaf);
		if (!this.initialized) {
			return
		}
		// @ts-ignore
		let leafId = leaf.id;
		let isLoaded = this.loadedTabs.has(leafId);
		if (isLoaded) {
			console.log(`leafId ${leafId} already loaded returning`);

			// 👇👇👇👇👇👇👇👇👇👇👇👇👇
			// doulbe trigger event on first editor 
			// return;
		}
		let tabStates = Object.values(this.settings.tabs).filter(v => v.id === leafId);
		let hasState = tabStates.length > 0;
		if (!hasState) {
			console.log(`leaf ${leafId} no state found`);
			return
		}
		if (tabStates[0].cursor.line === 0) {
			console.log(`leaf ${leafId} ignoring empty state`);
		}
		this.loadedTabs.set(leafId, true)
		this.restoreLeaf(leaf, 0)
		console.log(`leaf ${leafId} restored `);
		await this.saveTabsStates();

	}
}
