const fs = require('fs');

const SEMAPHORE_DIR = './semaphore';
const ADMIN_CREATED_FILE = `${SEMAPHORE_DIR}/admincreated`;

const isAdminCreated = () => {
  return fs.existsSync(ADMIN_CREATED_FILE);
};

const setAdminCreated = () => {
  if (!fs.existsSync(SEMAPHORE_DIR)) {
    fs.mkdirSync(SEMAPHORE_DIR);
  }

  fs.writeFileSync(ADMIN_CREATED_FILE, '');
};

module.exports = { isAdminCreated, setAdminCreated };
