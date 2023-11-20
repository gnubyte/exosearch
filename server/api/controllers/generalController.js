const path = require('path');

const dashboardView = async (req, res) => {
    res.render('../api/views/dashboard');
}

const indexesView = async (req, res) => {
    res.render('../api/views/indexes');
}

const forwardersView = async (req, res) => {
    res.render('../api/views/forwarders');
}

const settingsView = async (req, res) => {
    res.render('../api/views/settings');
}
const landingView = async (req, res) => {
    res.sendFile(path.join(__dirname, '../views/landing.html'));
}
const loginView = async (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html'));
}
const logoutView = async (req, res) => {
    res.sendFile(path.join(__dirname, '../views/logout.html'));
}
const uploadView = async (req, res) => {
    res.sendFile(path.join(__dirname, '../views/upload.html'));
}
const searchView = async (req, res) => {
    res.render('../api/views/search')
}

module.exports = {
    dashboardView,
    landingView,
    loginView,
    logoutView,
    uploadView,
    searchView,
    forwardersView,
    indexesView,
    settingsView
};

