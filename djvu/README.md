# DjVu reader plugin

Reads `.djvu` and `.djv` books in Tapalog Reader.

`djvu.js` is the DjVu.js library (https://github.com/RussCoder/djvujs, version 0.5.4 of `djvujs-dist`), bundled
for the browser; it is free software under the GNU General Public License v2 (see `GNU_GPL_v2` and `LICENSE.md`).
`reader.js` and `plugin.json` are the glue written for Tapalog Reader.

To use it, keep this folder inside the `plugins` folder next to the program and restart the program (it needs a program
that gives plugin API 2: see Settings → Plugins).

Version 1.1.0: cover thumbnails for the library (the first page; a file over 300 MB gets none, because the whole file
has to be read), the table of contents (☰) and "fit the whole page" (▭).

Version 1.2.0: continuous scroll (or one page at a time, the choice is remembered), a strip of page previews on the
left (▥, like the PDF reader's), search in the text of the pages with the found words marked (⌕; a scan has no text to
search), and previews and the next page are drawn between the pages being read so the reading stays quick.

Version 1.3.0: the plugin is isolated (`"api": 2`, `"isolated": true`). It runs in a sandboxed frame, so it cannot read
the program's page or cookies or act with the reader's login, and it reaches no site but the program's own address. The
book comes to it by message instead of an address; the decoder's worker is started from a `blob:` copy of `djvu.js`. A
sandboxed frame has no storage, so the choice of one page or continuous scroll and of the side strip now travels in the
place the reader reports (a bookmark or a share link opens the same way), and the language of the buttons follows the
browser's, not the program's.
