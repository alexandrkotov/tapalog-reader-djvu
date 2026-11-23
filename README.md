# DjVu reader for Tapalog Reader

A plugin that lets [Tapalog Reader](https://github.com/alexandrkotov/tapalog-reader) open `.djvu` and `.djv` books. Tapalog Reader itself has no DjVu reader, because the only JavaScript decoder, [DjVu.js](https://github.com/RussCoder/djvujs), is GPL v2 and the program is MIT. A plugin is a separate folder that you add yourself, so the two licenses never mix: **this repository is GNU GPL v2**, the program stays MIT.

## What it does

- Continuous scroll or one page at a time, zoom, "fit the whole page", keys and drag to scroll.
- A strip of page previews and the table of contents on the left.
- Search in the text of the pages, with the found words marked (a scan without a text layer has nothing to search).
- Covers for the library (the first page; a file over 300 MB gets none, because the whole file has to be read).
- Places in bookmarks and share links.

## Install

You need Tapalog Reader **0.16.0 or newer** (it gives plugin API 2; **Settings → Plugins** shows the number).

1. Download `tapalog-reader-djvu-X.Y.Z.zip` from [Releases](../../releases) and check it against `SHA256SUMS.txt`.
2. Unzip it into the `plugins` folder next to the program (make the folder if there is none; it can also be set with `--plugins` or `TAPALOG_PLUGINS`). You get `plugins/djvu/plugin.json` and the other files beside it.
3. Restart the program. **Settings → Plugins** lists "DjVu reader"; `.djvu` books now open in the library.

To update, replace the `djvu` folder with the new one and restart. To remove, delete the folder.

## Safety

The plugin is **isolated** (`"api": 2`, `"isolated": true`): it runs in a sandboxed frame, so it cannot read the program's page, cookies or storage, cannot act with the reader's login, and reaches no site but the program's own address. The book is handed to it by message. Only the person who runs the server can install a plugin; see [Plugins](https://github.com/alexandrkotov/tapalog-reader/blob/main/guide/plugins.md) in the guide.

Because a sandboxed frame has no storage, the choice of one page or continuous scroll and of the side strip travels with the place in the book (a bookmark or a share link opens the same way), and the buttons follow the language of the browser.

## What is in here

| File | What it is |
| --- | --- |
| `djvu/plugin.json` | the plugin's manifest |
| `djvu/reader.js` | the reader, written for Tapalog Reader |
| `djvu/djvu.js` | the DjVu.js library 0.5.4 (`djvujs-dist`), bundled for the browser: https://github.com/RussCoder/djvujs |
| `djvu/GNU_GPL_v2`, `djvu/LICENSE.md` | the license of DjVu.js and the notices it asks to keep |

`LICENSE` is the GNU GPL v2 for the whole repository.

## Release

Change `version` in `djvu/plugin.json`, commit, then push a tag with the same number (`v1.3.0`). A workflow builds `tapalog-reader-djvu-X.Y.Z.zip` and `SHA256SUMS.txt` and attaches them to a draft release; press Publish there. The workflow stops if the tag and the version differ.

---

# Читалка DjVu для Tapalog Reader

Плагин, который учит [Tapalog Reader](https://github.com/alexandrkotov/tapalog-reader) открывать `.djvu` и `.djv`. В самой программе читалки DjVu нет: единственный декодер на JavaScript, [DjVu.js](https://github.com/RussCoder/djvujs), под GPL v2, а программа под MIT. Плагин — отдельная папка, которую вы кладёте сами, так что лицензии не смешиваются: **этот репозиторий под GNU GPL v2**, программа остаётся MIT.

## Что умеет

- Сплошная прокрутка или по одной странице, масштаб, «страница целиком», клавиши и перетаскивание.
- Лента миниатюр страниц и оглавление слева.
- Поиск по тексту страниц с отметкой найденных слов (у скана без текстового слоя искать нечего).
- Обложки для библиотеки (первая страница; у файла больше 300 МБ обложки нет: файл надо прочитать целиком).
- Место в закладках и в ссылках для чтения.

## Установка

Нужен Tapalog Reader **0.16.0 или новее** (он даёт API плагинов 2; номер виден в **Настройки → Плагины**).

1. Скачайте `tapalog-reader-djvu-X.Y.Z.zip` из [Releases](../../releases) и сверьте с `SHA256SUMS.txt`.
2. Распакуйте в папку `plugins` рядом с программой (создайте её, если нет; её можно задать и через `--plugins` или `TAPALOG_PLUGINS`). Получится `plugins/djvu/plugin.json` и остальные файлы рядом.
3. Перезапустите программу. В **Настройки → Плагины** появится «DjVu reader», а `.djvu` в библиотеке начнут открываться.

Обновить: заменить папку `djvu` новой и перезапустить. Удалить: стереть папку.

## Безопасность

Плагин **изолирован** (`"api": 2`, `"isolated": true`): он работает в песочнице, не видит страницу, куки и хранилище программы, не действует от имени читателя и не ходит никуда, кроме адреса самой программы. Книгу ему передают сообщением. Установить плагин может только тот, кто запускает сервер; подробности в разделе [Plugins](https://github.com/alexandrkotov/tapalog-reader/blob/main/guide/plugins.md) руководства.

В песочнице нет хранилища, поэтому выбор «по одной / сплошной» и боковой ленты едет вместе с местом в книге (закладка или ссылка откроются так же), а подписи кнопок следуют языку браузера.
