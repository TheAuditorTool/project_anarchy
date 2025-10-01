#!/bin/bash
# ERROR 277: Bash build script in polyglot project
# Script coordination complexity

echo "Building polyglot project..."
python backend/main.py &
rustc backend/utils.rs
go build backend/database.go