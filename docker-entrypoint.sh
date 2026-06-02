#!/bin/sh
set -e

# Initialize persistent volume data on first run
echo "=== Initializing data directory ==="

# Copy users.json if it doesn't exist on the volume
if [ ! -f /data/users.json ]; then
  echo "Initializing users.json..."
  if [ -f /app/src/data/users.json ]; then
    cp /app/src/data/users.json /data/users.json
  else
    echo '{"users":[{"id":"admin","name":"彭芳","password":"e7cbc649d39043dc728aa728a2ef89da:b037d497278c149f744d7409260ef3570a61b5236d67d068e9816afd7bdbcfa4c600fe4ab0d4012a30612845e64ac2919d16ec2f89bc473a93bd5adebcb27dca","role":"admin","department":"预防医学教研室","createdAt":"2026-06-01T03:35:29.075Z"}],"pendingInvites":[]}' > /data/users.json
  fi
  echo "users.json initialized."
else
  echo "users.json already exists, skipping."
fi

# Create documents directory and metadata if needed
mkdir -p /data/documents
if [ ! -f /data/documents/metadata.json ]; then
  echo "Initializing metadata.json..."
  echo '{"documents":[]}' > /data/documents/metadata.json
  echo "metadata.json initialized."
else
  echo "metadata.json already exists, skipping."
fi

echo "=== Data directory ready ==="

# Execute the main command (node server.js)
exec "$@"
