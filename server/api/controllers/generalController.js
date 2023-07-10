const path = require('path');

const dashboardView = async (req, res) => {
    res.sendFile(path.join(__dirname, '../views/dashboard.html'));
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

module.exports = { dashboardView, landingView, loginView, logoutView};