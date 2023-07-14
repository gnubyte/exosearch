#!/bin/bash

set -e

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run the installer as root or using sudo."
  exit 1
fi

# Set variables
PACKAGE_NAME="tailing-package"
SERVICE_NAME="tailing-service"
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"
INSTALL_DIR="/opt/$PACKAGE_NAME"

# Function to display error and exit
display_error() {
  echo "Error: $1"
  exit 1
}

# Function to enable and start the service
enable_and_start_service() {
  systemctl enable $SERVICE_NAME
  systemctl start $SERVICE_NAME
}

# Function to display installation summary
display_installation_summary() {
  echo "Installation completed!"
  echo "Package Name: $PACKAGE_NAME"
  echo "Install Directory: $INSTALL_DIR"
  echo "Service Name: $SERVICE_NAME"
}

# Create installation directory
mkdir -p $INSTALL_DIR

# Copy package files to installation directory
cp -r ./* $INSTALL_DIR || display_error "Failed to copy package files."

# Set permissions
chown -R root:root $INSTALL_DIR
chmod -R 755 $INSTALL_DIR

# Create service file
echo "[Unit]
Description=Tailing Package Service
After=network.target

[Service]
Type=simple
ExecStart=$INSTALL_DIR/index.js
Restart=always

[Install]
WantedBy=multi-user.target" > $SERVICE_FILE || display_error "Failed to create service file."

# Reload systemd
systemctl daemon-reload

# Enable and start the service
enable_and_start_service

# Display installation summary
display_installation_summary

exit 0
