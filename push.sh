#!/usr/bin/env bash

# ==============================================================================
# J-Pop Corner - Automated Git Add, Commit & Push Script
# Usage:
#   ./push.sh "Your commit message here"
#   or simply: ./push.sh  (will prompt for message or use default timestamp)
# ==============================================================================

set -e

# Terminal Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}====================================================${NC}"
echo -e "${CYAN}   🍿 J-Pop Corner: Git Stage, Commit & Push Script  ${NC}"
echo -e "${CYAN}====================================================${NC}"

# Detect current branch
BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
echo -e "🌿 Current Git Branch: ${YELLOW}${BRANCH}${NC}"

# Check for uncommitted changes or untracked files
if [ -z "$(git status --porcelain)" ] && [ -z "$(git log origin/${BRANCH}..${BRANCH} 2>/dev/null)" ]; then
  echo -e "${YELLOW}⚠️  No new changes to commit or push.${NC}"
  exit 0
fi

# Determine commit message
if [ -n "$1" ]; then
  COMMIT_MSG="$1"
else
  # Check if interactive terminal
  if [ -t 0 ]; then
    echo -e "${CYAN}Enter commit message (press Enter for default):${NC}"
    read -r USER_MSG
    if [ -n "$USER_MSG" ]; then
      COMMIT_MSG="$USER_MSG"
    else
      COMMIT_MSG="update: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
  else
    COMMIT_MSG="update: $(date '+%Y-%m-%d %H:%M:%S')"
  fi
fi

echo -e "\n${CYAN}📦 Staging all project changes...${NC}"
git add -A

# Check if there are changes to commit
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
  echo -e "${CYAN}💬 Committing with message: ${YELLOW}\"${COMMIT_MSG}\"${NC}"
  git commit -m "$COMMIT_MSG"
else
  echo -e "${YELLOW}ℹ️  Nothing new staged to commit. Pushing existing local commits...${NC}"
fi

echo -e "\n${CYAN}🚀 Pushing to remote repository (origin/${BRANCH})...${NC}"
git push origin "$BRANCH"

echo -e "\n${GREEN}✅ Successfully pushed changes to GitHub (${BRANCH})!${NC}"
echo -e "${CYAN}====================================================${NC}"
