.PHONY: fetch-main merge-main push-main publish serve sync pull-main

# Process blog posts before serving
process-posts:
	@echo "Processing blog posts..."
	bundle exec ruby _scripts/process_posts.rb

# Fetch latest changes from origin (doesn't merge)
fetch-main:
	@echo "Fetching latest changes from origin/main..."
	git fetch origin main

# Merge remote changes, handling divergent branches automatically
merge-main: fetch-main
	@echo "Merging remote changes from origin/main..."
	@git pull --no-rebase origin main
	@echo "Regenerating processed_posts.json after merge..."
	@bundle exec ruby _scripts/process_posts.rb || ruby _scripts/process_posts.rb

# Sync with remote: fetch, merge, and regenerate posts
sync: merge-main
	@echo "Sync complete!"

# Alias for sync (more intuitive name)
pull-main: sync

# Push local changes to origin
push-main:
	@echo "Pushing local changes to origin/main..."
	git push origin main

# Documentation Security
encrypt-docs:
	@echo "Locking documentation..."
	@node _scripts/encrypt_docs.js
	@echo "Documentation secured in /secret-docs"

decrypt-docs:
	@echo "Unlocking documentation..."
	@node _scripts/encrypt_docs.js --decrypt
	@echo "Source files restored in _docs_src"

# Update publish to ensure docs are locked
publish: sync encrypt-docs
	@echo "Publishing to origin/main..."
	@if [ -n "$$(git status --porcelain secret-docs/)" ]; then \
		echo "Committing locked documentation..."; \
		git add secret-docs/; \
		git commit -m "Secure documentation update"; \
	fi
	@if ! git diff --quiet _data/processed_posts.json data/processed_posts.json 2>/dev/null; then \
		echo "Committing regenerated processed_posts.json..."; \
		git add _data/processed_posts.json data/processed_posts.json; \
		git commit -m "Regenerate processed_posts.json"; \
	fi
	@git push origin main

# Serve Jekyll site locally for testing
serve: process-posts
	@echo "Starting Jekyll server..."
	bundle exec jekyll serve

