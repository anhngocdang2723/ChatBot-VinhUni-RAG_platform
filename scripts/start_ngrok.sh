#!/bin/bash

# Đường dẫn tới thư mục frontend
FRONTEND_PATH="/frontend"
SCRIPT_PATH="$(dirname "$0")"

echo "🚀 Starting ngrok..."
# Khởi động ngrok trong nền
ngrok http 8000 --host-header="localhost:8000" > /dev/null &

# Đợi ngrok chạy
sleep 4

echo "🌐 Getting ngrok URL..."
# Chạy script Python để cập nhật URL vào .env.local
python3 "$SCRIPT_PATH/update_ngrok_url.py"

# Kiểm tra xem script Python có chạy thành công không
if [ $? -ne 0 ]; then
  echo "❌ Error: Could not update ngrok URL."
  exit 1
fi

echo "🔄 Restarting frontend to apply changes..."
# Chạy frontend
cd "$FRONTEND_PATH" || exit
npm start
