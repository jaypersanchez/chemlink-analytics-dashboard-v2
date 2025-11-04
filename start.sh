#!/bin/bash

# Start Flask app in background with auto-reload and ngrok tunnel
# Usage: ./start.sh [prod|uat|dev]
# Default: prod

PID_FILE="flask_app.pid"
NGROK_PID_FILE="ngrok.pid"
LOG_FILE="flask_app.log"
NGROK_LOG_FILE="ngrok.log"

# Get environment from argument or default to prod
ENV=${1:-prod}

# Validate environment
if [ "$ENV" != "prod" ] && [ "$ENV" != "uat" ] && [ "$ENV" != "dev" ]; then
    echo "❌ Invalid environment: $ENV"
    echo "Usage: ./start.sh [prod|uat|dev]"
    echo "Default: prod"
    exit 1
fi

# Check if app is already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "Flask app is already running with PID $OLD_PID"
        echo "Use ./stop.sh to stop it first"
        exit 1
    else
        echo "Removing stale PID file"
        rm "$PID_FILE"
    fi
fi

# Switch to specified environment (if .env exists)
if [ -f ".env" ]; then
    echo "Switching to $ENV environment..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/^APP_ENV=.*/APP_ENV=$ENV/" .env
    else
        sed -i "s/^APP_ENV=.*/APP_ENV=$ENV/" .env
    fi
    echo "✅ Environment set to: $ENV"
    echo ""
fi

# Start Flask app in background with caffeinate to prevent sleep
echo "Starting Flask app V2 in background with caffeinate..."
nohup caffeinate -i python3 app.py > "$LOG_FILE" 2>&1 &
APP_PID=$!

# Save PID to file
echo $APP_PID > "$PID_FILE"

# Wait a moment and check if it started successfully
sleep 2

if ps -p $APP_PID > /dev/null; then
    echo "✅ Flask app V2 started successfully!"
    echo "   PID: $APP_PID"
    echo "   URL: http://127.0.0.1:5001"
    echo "   Logs: tail -f $LOG_FILE"
    echo ""
else
    echo "❌ Failed to start Flask app"
    echo "Check $LOG_FILE for errors"
    rm "$PID_FILE"
    exit 1
fi

# Start ngrok tunnel on port 5001
echo "Starting ngrok tunnel..."
nohup ngrok http 5001 > "$NGROK_LOG_FILE" 2>&1 &
NGROK_PID=$!
echo $NGROK_PID > "$NGROK_PID_FILE"

# Wait for ngrok to initialize
sleep 3

if ps -p $NGROK_PID > /dev/null; then
    # Extract ngrok URL from the API
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | head -1)
    
    echo "✅ ngrok tunnel started successfully!"
    echo "   PID: $NGROK_PID"
    if [ -n "$NGROK_URL" ]; then
        echo "   Public URL: $NGROK_URL"
    fi
    echo "   Dashboard: http://localhost:4040"
    echo ""
    echo "To stop: ./stop.sh"
else
    echo "❌ Failed to start ngrok"
    echo "Check $NGROK_LOG_FILE for errors"
    rm "$NGROK_PID_FILE"
fi
