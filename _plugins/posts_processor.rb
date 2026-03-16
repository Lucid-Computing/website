module Jekyll
  class PostsProcessor < Generator
    safe true
    priority :lowest

    def generate(site)
      # Process markdown files in blog/posts directory
      posts_dir = File.join(site.source, 'blog', 'posts')
      return unless File.directory?(posts_dir)

      site.data['processed_posts'] = []
      
      Dir.glob(File.join(posts_dir, '*.md')).each do |file_path|
        content = File.read(file_path, encoding: 'UTF-8')
        
        # Parse frontmatter - match opening --- and closing ---
        if content =~ /\A---\s*\n(.*?)\n---\s*\n(.*)\z/m
          # Old format: content after frontmatter
          frontmatter_text = $1
          markdown_content = $2
        elsif content =~ /\A---\s*\n(.*?)\n---\s*\z/m
          # CMS format: content is in frontmatter, no content after
          frontmatter_text = $1
          markdown_content = ''
        else
          Jekyll.logger.warn "No frontmatter found in #{file_path}"
          next
        end
          
        # Parse YAML frontmatter
        begin
          frontmatter = YAML.safe_load(frontmatter_text, permitted_classes: [Date, Time, DateTime])
          
          if frontmatter.nil?
            Jekyll.logger.warn "Failed to parse YAML in #{file_path}"
            next
          end
          
          # Check if content is in frontmatter (CMS format)
          if frontmatter['content']
            # Extract content from frontmatter
            cms_content = frontmatter['content']
            # Remove leading 2 spaces from each line (YAML multiline string indentation)
            lines = cms_content.split("\n")
            dedented_lines = lines.map do |line|
              if line.start_with?('  ')
                line[2..-1]
              elsif line.strip.empty?
                ''
              else
                line
              end
            end
            markdown_content = dedented_lines.join("\n")
            frontmatter.delete('content')
          end
          
          # Only include published posts (default to true if not specified)
          publish = frontmatter['publish']
          if publish.nil?
            publish = true  # Default to published
          elsif publish.is_a?(String)
            publish = publish.downcase == 'true'
          end
          
          unless publish
            Jekyll.logger.info "Skipping unpublished post: #{file_path}"
            next
          end
          
          # Ensure we have content to convert
          if markdown_content.nil? || markdown_content.strip.empty?
            Jekyll.logger.warn "No content found in #{file_path}"
            next
          end
            
            # Convert markdown to HTML using Jekyll's markdown converter
            # Create a temporary document-like object for conversion
            require 'kramdown'
            html_content = Kramdown::Document.new(markdown_content, input: 'GFM', hard_wrap: false, auto_ids: true).to_html
            
            # Ensure tags is an array
            tags = frontmatter['tags']
            tags = [tags] unless tags.is_a?(Array)
            
            post_data = {
              'title' => frontmatter['title'] || '',
              'slug' => frontmatter['slug'] || File.basename(file_path, '.md'),
              'date' => frontmatter['date'] || '',
              'author' => frontmatter['author'] || '',
              'tags' => tags || [],
              'image' => frontmatter['image'] || '',
              'description' => frontmatter['description'] || '',
              'content' => html_content
            }
            
          site.data['processed_posts'] << post_data
          Jekyll.logger.info "Processed post: #{post_data['title']} (#{post_data['slug']})"
        rescue => e
          Jekyll.logger.error "Error processing #{file_path}: #{e.message}"
          Jekyll.logger.error e.backtrace.join("\n")
          next
        end
      end
      
      # Sort posts by date (newest first)
      site.data['processed_posts'].sort_by! { |p| p['date'] }.reverse!
    end
  end
end

