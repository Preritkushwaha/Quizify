const fs = require('fs');
const path = require('path');

exports.getLogs = (req, res) => {
  try {
    const logFilePath = path.join(__dirname, '..', 'server.log');
    const logs = fs.readFileSync(logFilePath, 'utf8');
    res.status(200).send(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching logs' });
  }
};
