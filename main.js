const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// 尝试使用系统的 ffprobe 命令
let ffmpegPath = 'ffprobe';

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // 设置中文菜单
    const template = [
        {
            label: '文件',
            submenu: [
                {
                    label: '退出',
                    role: 'quit'
                }
            ]
        },
        {
            label: '编辑',
            submenu: [
                {
                    label: '撤销',
                    role: 'undo'
                },
                {
                    label: '重做',
                    role: 'redo'
                },
                {
                    type: 'separator'
                },
                {
                    label: '剪切',
                    role: 'cut'
                },
                {
                    label: '复制',
                    role: 'copy'
                },
                {
                    label: '粘贴',
                    role: 'paste'
                },
                {
                    label: '删除',
                    role: 'delete'
                },
                {
                    label: '全选',
                    role: 'selectAll'
                }
            ]
        },
        {
            label: '视图',
            submenu: [
                {
                    label: '刷新',
                    role: 'reload'
                },
                {
                    label: '强制刷新',
                    role: 'forceReload'
                },
                {
                    label: '切换开发者工具',
                    role: 'toggleDevTools'
                },
                {
                    type: 'separator'
                },
                {
                    label: '重置缩放',
                    role: 'resetZoom'
                },
                {
                    label: '放大',
                    role: 'zoomIn'
                },
                {
                    label: '缩小',
                    role: 'zoomOut'
                },
                {
                    type: 'separator'
                },
                {
                    label: '全屏',
                    role: 'togglefullscreen'
                }
            ]
        },
        {
            label: '窗口',
            submenu: [
                {
                    label: '最小化',
                    role: 'minimize'
                },
                {
                    label: '关闭',
                    role: 'close'
                }
            ]
        },
        {
            label: '帮助',
            submenu: [
                {
                    label: '主页',
                    click: () => {
                        const { shell } = require('electron');
                        shell.openExternal('https://github.com/tinygeeker');
                    }
                },
                {
                    label: '打赏',
                    click: () => {
                        mainWindow.webContents.executeJavaScript(`
                            // 创建打赏模态框
                            const donateModal = document.createElement('div');
                            donateModal.className = 'donate-modal show';
                            donateModal.id = 'donate-modal';
                            
                            donateModal.innerHTML = \`
                                <div class="donate-content">
                                    <h3>支持开发者</h3>
                                    <img src="https://tinygeeker.github.io/assets/user/donate.jpg" alt="打赏二维码" style="max-width: 95%; max-height: 700px;">
                                    <button class="donate-close">关闭</button>
                                </div>
                            \`;
                            
                            document.body.appendChild(donateModal);
                            
                            // 添加关闭按钮事件监听器
                            const closeButton = donateModal.querySelector('.donate-close');
                            closeButton.addEventListener('click', () => {
                                donateModal.classList.remove('show');
                                setTimeout(() => {
                                    document.body.removeChild(donateModal);
                                }, 300);
                            });
                        `);
                    }
                },
                {
                    type: 'separator'
                },
                {
                    label: '关于',
                    role: 'about'
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    mainWindow.loadFile('index.html');
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (mainWindow === null) createWindow();
});

ipcMain.on('get-movie-info', (event, moviePath) => {
    getMovieInfo(moviePath).then(info => {
        event.reply('movie-info', info);
    }).catch(err => {
        event.reply('movie-info', { error: err.message });
    });
});

ipcMain.on('scan-directory', (event, directoryPath) => {
    console.log('Received scan-directory request for:', directoryPath);
    scanDirectory(directoryPath).then(result => {
        console.log('Scan result:', result);
        event.reply('directory-scan', result);
    }).catch(err => {
        console.error('Scan error:', err);
        event.reply('directory-scan', { error: err.message });
    });
});

function scanDirectory(directoryPath) {
    return new Promise((resolve, reject) => {
        const result = {
            folders: [],
            movies: []
        };

        console.log('Starting to scan directory:', directoryPath);

        try {
            // 使用更简单的方法来扫描目录
            const items = fs.readdirSync(directoryPath);

            console.log('Found items in', directoryPath, ':', items);

            items.forEach(item => {
                const itemPath = path.join(directoryPath, item);
                
                console.log('Processing item:', item, 'path:', itemPath);
                
                try {
                    const stats = fs.statSync(itemPath);
                    
                    console.log('Item stats:', item, 'is directory:', stats.isDirectory(), 'is file:', stats.isFile());
                    
                    if (stats.isDirectory()) {
                        console.log('Adding folder:', item);
                        result.folders.push({
                            name: item,
                            path: itemPath
                        });
                    } else if (stats.isFile()) {
                        console.log('Checking file:', item);
                        console.log('Is video file:', isVideoFile(item));
                        if (isVideoFile(item)) {
                            console.log('Adding movie:', item);
                            result.movies.push({
                                name: item,
                                path: itemPath
                            });
                        }
                    }
                } catch (err) {
                    console.error('Error checking item:', item, err);
                }
            });

            console.log('Final scanned folders:', result.folders);
            console.log('Final scanned movies:', result.movies);

            resolve(result);
        } catch (err) {
            console.error('Error scanning directory:', err);
            reject(err);
        }
    });
}

function isVideoFile(filename) {
    // 简化视频文件检测，直接检查是否包含常见的视频扩展名
    const lowerFilename = filename.toLowerCase();
    const isVideo = lowerFilename.endsWith('.mp4') || 
                   lowerFilename.endsWith('.mkv') || 
                   lowerFilename.endsWith('.avi') || 
                   lowerFilename.endsWith('.mov') || 
                   lowerFilename.endsWith('.wmv') || 
                   lowerFilename.endsWith('.flv') || 
                   lowerFilename.endsWith('.webm');
    console.log('Checking file:', filename, 'is video:', isVideo);
    return isVideo;
}

function getMovieInfo(moviePath) {
    return new Promise((resolve, reject) => {
        const cmd = ffmpegPath;
        const args = [
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            moviePath
        ];

        const proc = spawn(cmd, args);
        let output = '';

        proc.stdout.on('data', (data) => {
            output += data;
        });

        proc.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        proc.on('close', (code) => {
            if (code === 0) {
                try {
                    const info = JSON.parse(output);
                    resolve(info);
                } catch (err) {
                    // 如果解析失败，返回一个基本的信息对象
                    resolve({
                        format: {
                            format_name: path.extname(moviePath).substring(1),
                            filename: moviePath
                        },
                        streams: []
                    });
                }
            } else {
                // 如果 ffprobe 命令失败，返回一个基本的信息对象
                resolve({
                    format: {
                        format_name: path.extname(moviePath).substring(1),
                        filename: moviePath
                    },
                    streams: []
                });
            }
        });

        // 添加错误处理，确保即使 spawn 失败也能返回基本信息
        proc.on('error', (err) => {
            console.error(`Error spawning ffprobe: ${err.message}`);
            resolve({
                format: {
                    format_name: path.extname(moviePath).substring(1),
                    filename: moviePath
                },
                streams: []
            });
        });
    });
}