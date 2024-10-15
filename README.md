This plugin remembers the cursor position for each open tab.
When you reopen Obsidian, the cursor every editor will be placed at the last position you left it.

I often have multiple widows and tab splits. If Obsidian crashes or I have to quit, I lose the whole 
context on what I was working on.  This plugin remembers the cursor position for each tab.

**What's missing** 

**Save and restore scroll position**
I was able to get the scroll position but not to set it back.

**Better event handling**
Currently we're reacting to `'active-leaf-change'` but this is more or less random / accidental. 
We should listen to events that affect both scroll and cursor position.


## Related plugins
This started as a frustration 
https://forum.obsidian.md/t/persistent-editor-view-state-on-restart/83575/4

I tried to find a plugin but couldn't find something that's focused on the UI state rather than 
files. 
- https://github.com/ludovicchabant/obsidian-remember-file-state
- https://github.com/dy-sh/obsidian-remember-cursor-position/
- https://github.com/clehene/obsidian-remember-view-state

This said, I'm happy to contribute to any of these plugins if they want to add this feature.
So feel free to copy and paste this in your own plugins and share it back :) 

------

What's affecting scroll

window size 
vertically change means either top or bottom must be chosen ? who wins
- this is common when restoring from maximized horizontally to some BS apple leaving room for stage
horizontally change means left or right - left wins

monitors changing / and restoring on different monitors..


whatever
- cursor wins on editor windows
- scroll wins on view windows

bottom wins on scroll?
because at the "end" 


font size / zoom level 

