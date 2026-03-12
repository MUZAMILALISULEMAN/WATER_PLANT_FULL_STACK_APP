import subprocess
import os
import sys
import time

def run_stack():
    # Path to the Python executable inside your root .venv
    venv_python = os.path.join(os.getcwd(), ".venv", "Scripts", "python.exe")

    print("🚀 [BACKEND] Starting FastAPI...")
    backend = subprocess.Popen(
        [venv_python, "-m", "uvicorn", "main:app", "--reload"], 
        cwd="./backend", 
        shell=True
    )
    
    # Give the backend a 2-second head start
    time.sleep(2)

    print("🚀 [FRONTEND] Starting Vite...")
    frontend = subprocess.Popen(
        ["npm", "run", "dev"], 
        cwd="./frontecnd", 
        shell=True
    )

    print("\n✅ Both servers are attempting to run. Press Ctrl+C to stop both.\n")

    try:
        # This keeps the script alive while the processes run
        while True:
            pass
    except KeyboardInterrupt:
        print("\n🛑 Shutting down gracefully...")
        # Force kill on Windows to avoid "Port already in use" errors next time
        subprocess.run(f"taskkill /F /T /PID {backend.pid}", shell=True, capture_output=True)
        subprocess.run(f"taskkill /F /T /PID {frontend.pid}", shell=True, capture_output=True)
        print("👋 Done!")
        sys.exit()

if __name__ == "__main__":
    run_stack()