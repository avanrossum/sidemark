const { Menu, app, dialog, shell } = require('electron');
const path = require('path');

function buildMenu({ getFocusedWindow, store, onOpen, onSave, onSaveAs, onNewFile, onNewWindow, onOpenFolder }) {
  const isMac = process.platform === 'darwin';

  const recentFiles = store.getRecentFiles();
  const recentSubmenu = recentFiles.length > 0
    ? [
        ...recentFiles.map((filePath) => ({
          label: path.basename(filePath),
          sublabel: filePath,
          click: () => onOpen(filePath),
        })),
        { type: 'separator' },
        {
          label: 'Clear Recent',
          click: () => {
            store.clearRecentFiles();
            buildAndSetMenu({ getFocusedWindow, store, onOpen, onSave, onSaveAs, onNewFile, onNewWindow, onOpenFolder });
          },
        },
      ]
    : [{ label: 'No Recent Files', enabled: false }];

  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              {
                label: 'Settings...',
                accelerator: 'Cmd+,',
                click: () => {
                  const win = getFocusedWindow();
                  if (win) win.webContents.send('show-settings');
                },
              },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => onNewFile(),
        },
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => onNewWindow(),
        },
        { type: 'separator' },
        {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(getFocusedWindow(), {
              properties: ['openFile'],
              filters: [
                { name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd', 'txt'] },
                { name: 'All Files', extensions: ['*'] },
              ],
            });
            if (!result.canceled && result.filePaths[0]) {
              onOpen(result.filePaths[0]);
            }
          },
        },
        {
          label: 'Open Folder...',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: async () => {
            const result = await dialog.showOpenDialog(getFocusedWindow(), {
              properties: ['openDirectory'],
            });
            if (!result.canceled && result.filePaths[0]) {
              onOpenFolder(result.filePaths[0]);
            }
          },
        },
        {
          label: 'Open Recent',
          submenu: recentSubmenu,
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => onSave(),
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => onSaveAs(),
        },
        {
          label: 'Duplicate',
          click: () => {
            const win = getFocusedWindow();
            if (win) win.webContents.send('duplicate-file');
          },
        },
        { type: 'separator' },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            const win = getFocusedWindow();
            if (win) win.webContents.send('close-tab');
          },
        },
        {
          label: 'Close Window',
          accelerator: 'CmdOrCtrl+Shift+W',
          click: () => {
            const win = getFocusedWindow();
            if (win) win.close(); // Triggers close handler → dirty check
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            const win = getFocusedWindow();
            if (win) win.webContents.send('toggle-search');
          },
        },
        {
          label: 'Find and Replace',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            const win = getFocusedWindow();
            if (win) win.webContents.send('toggle-search-replace');
          },
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [{ type: 'separator' }, { role: 'front' }]
          : [{ role: 'close' }]),
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Simple Markdown Editor',
          click: () => {
            const win = getFocusedWindow();
            if (win) win.webContents.send('show-about');
          },
        },
        { type: 'separator' },
        {
          label: 'Visit Website',
          click: () => shell.openExternal('https://mipyip.com'),
        },
        {
          label: 'View on GitHub',
          click: () => shell.openExternal('https://github.com/avanrossum/simple-markdown-editor'),
        },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

function buildAndSetMenu(deps) {
  const menu = buildMenu(deps);
  Menu.setApplicationMenu(menu);
}

module.exports = { buildMenu, buildAndSetMenu };
