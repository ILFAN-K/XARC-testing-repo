const { Server } = require('socket.io');

const io = new Server(3001, { cors: { origin: '*' } });

console.log('Mock Hub listening on port 3001');

io.on('connection', (socket) => {
  console.log('Agent connected:', socket.id);
  
  setTimeout(() => {
    console.log('Sending install-aggregator command...');
    socket.emit('install-aggregator', {
      commandId: 'test-cmd-123',
      installerUrl: 'https://github.com/notepad-plus-plus/notepad-plus-plus/releases/download/v8.6.5/npp.8.6.5.Installer.exe',
      installerArguments: '/S',
      checksum: ''
    });
  }, 2000);

  socket.on('command-status', (data) => {
    console.log('AGENT STATUS:', data);
  });

  socket.on('heartbeat', (data) => {
    console.log('AGENT HEARTBEAT');
  });
});
