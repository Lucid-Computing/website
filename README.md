# Lucid Computing Landing Page

A static website for Lucid Computing, featuring a landing page, insights blog, password-protected secret docs, and content managed through CloudCannon CMS.

## Overview

This repository contains the source code for the Lucid Computing website. The site showcases:
- **Landing Page** (`index.html`) - Main marketing page with hero, features, and CTA sections
- **Insights Blog** (`insights.html`) - Blog listing page displaying published articles
- **Article Pages** (`article.html`) - Individual blog post template
- **Secret Docs** (`secret-docs/`) - Password-protected presentations and documents (see below)

The site uses **Jekyll** for static site generation and is deployed via **Cloudflare Pages**. It also supports **CloudCannon CMS** for content editing.

## Secret Docs

The `secret-docs/` directory hosts password-protected HTML pages. These are ideal for sharing confidential presentations, investor decks, or internal documents via a public URL without exposing the content to unauthorized viewers.

### How it works

1. Place your source HTML files in `_docs_src/`
2. Run `make encrypt-docs`
3. Each file is encrypted with AES-256-CBC and wrapped in a self-contained HTML lockbox
4. The encrypted files are output to `secret-docs/` and can be served as normal pages
5. Visitors are prompted for a password before content is revealed — no server-side logic required

### Setting the password

The encryption password is read from (in order of priority):
1. `DOCS_PASSWORD` environment variable
2. `.docspassword` file (gitignored)
3. Default fallback (for local testing only)

### Commands

```bash
# Encrypt source docs into secret-docs/
make encrypt-docs

# Decrypt back to _docs_src/ for editing
make decrypt-docs

# Full publish: sync, encrypt, commit, and push
make publish
```

### CI/CD

The `website-deploy.yml` GitHub Action handles website deployment via Cloudflare Pages.

## Write a Blog Post

### OPTION 1: Pages CMS Editor

1. Go to https://app.pagescms.org/lucid-computing/landingpage/main/collection/blog

2. Press "Add New Entry"

3. Create a new blog post. Content editors can use the CloudCannon interface to:
- Edit page content without touching code
- Upload and manage images
- Create and edit blog posts
- Manage blog post metadata (title, slug, date, author, tags, etc.)

4. Set `publish: true` in the frontmatter when ready to publish

### OPTION 2: Create a Markdown in your IDE


1. Create a new markdown file in `blog/posts/` with the naming convention:
   ```
   YYYY-MM-DD-post-slug.md
   ```

2. Add YAML frontmatter at the top of the file:
   ```yaml
   title: Your Post Title
   slug: your-post-slug
   date: YYYY-MM-DD
   author: Author Name
   tags:
     - Tag 1
     - Tag 2
   image: media/image-path.png
   description: Short description for preview
   publish: true  # Set to true to publish the post
   content: |-
   # Your Post Content
   ```

3. Set `publish: true` in the frontmatter when ready to publish

## Local Development

To test the site locally with Jekyll:

```bash
# First time setup
bundle install

# Process posts and serve
make serve
# or: bundle exec jekyll serve
```

**Note:** The `make serve` command automatically processes blog posts before starting the server. The site will be available at `http://localhost:4000`

## Syncing with CMS Changes

### Why Divergent Branches Occur

When working with a CMS (like Pages CMS), you may encounter a "divergent branches" error when trying to pull changes. This happens because:

1. **CMS changes**: Someone edits content through the CMS, which commits directly to the `main` branch
2. **Local changes**: You make changes locally (e.g., fixing image paths, updating code)
3. **Divergence**: Both branches have different commits, creating a fork in the git history

Git needs to know how to reconcile these differences, which is why you see the error:
```
fatal: Need to specify how to reconcile divergent branches.
```

### One-Command Solution

Simply run:

```bash
make sync
```

This command does the following:
1. **Fetch**: Downloads the latest commits from `origin/main`
2. **Merge**: Creates a merge commit combining CMS changes with your local work
3. **Regenerate**: Updates `_data/processed_posts.json` to include all published posts

If there are actual merge conflicts (same file edited in conflicting ways), Git will pause and ask you to resolve them manually. This is rare when CMS edits are separate from code changes.

## Blog Post Fields

Each blog post supports the following frontmatter fields:

- **`title`** (string) - Post title
- **`slug`** (string) - URL-friendly identifier
- **`date`** (date) - Publication date (YYYY-MM-DD)
- **`author`** (string) - Author name
- **`tags`** (list) - Array of tag strings
- **`image`** (image) - Cover image path
- **`description`** (string) - Short description for previews
- **`publish`** (boolean) - Whether the post should be published (default: true)
- **`content`** (rich-text) - Post content (markdown) - stored in frontmatter for CMS compatibility

## How It Works

- **Jekyll** processes markdown files in `blog/posts/` automatically
- Posts with `publish: true` appear on the live site
- Content is converted from markdown to HTML during build
- Cloudflare Pages builds the site automatically on every push
- No manual conversion scripts needed!
