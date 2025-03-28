import os
import requests

try:
    # Lấy URL ngrok từ API của ngrok (mặc định chạy trên localhost:4040)
    response = requests.get("http://localhost:4040/api/tunnels")
    tunnels = response.json()["tunnels"]
    for tunnel in tunnels:
        if tunnel["proto"] == "https":
            api_url = tunnel["public_url"] + "/api"
            # Đường dẫn tới file .env.local trong frontend
            env_path = "frontend\.env.local"
            with open(env_path, "w") as f:
                f.write(f"REACT_APP_API_URL={api_url}\n")
            print(f"✅ Updated .env.local with: {api_url}")
            break
except Exception as e:
    print(f"❌ Error updating .env.local: {e}")
