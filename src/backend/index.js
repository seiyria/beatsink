const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const open = require('open');

const Config = require('electron-config');
const config = new Config();

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;

const Xray = require('x-ray');
const x = Xray().throttle(5, '1s');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const createWindow = () => {

  const opts = { 
    show: false,
    webPreferences: { nodeIntegration: true } 
  };

  Object.assign(opts, config.get('winBounds'));

  if(!opts.height) opts.height = 768;
  if(!opts.width) opts.width = 1024;

  // Create the browser window.
  mainWindow = new BrowserWindow(opts);
  mainWindow.setMenu(null);
  
  mainWindow.once('ready-to-show', mainWindow.show);

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '..', 'frontend', 'index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  mainWindow.on('close', () => {
    config.set('winBounds', mainWindow.getBounds());
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    open(url);
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.on('run-check-sync', (event, args = {}) => {
  const { query } = args;

  x(`https://bsaber.com/?s=${encodeURIComponent(query.toLowerCase())}`, 'article.post', [
    {
      title: '.entry-title a@title',
      link: '.entry-title a@href',
      oneclickLink: '.-one-click@href',
      difficulties: ['.post-difficulty']
    }
  ])
  .paginate('.page-numbers.next@href')
  .then(allSongs => {
    return allSongs.filter(x => x.difficulties.length > 0);
  })
  .then(allSongs => {
    event.reply('check-sync-update', { query, allSongs });
  });

});