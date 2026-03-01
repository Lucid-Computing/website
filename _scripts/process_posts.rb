#!/usr/bin/env ruby
# Script to process blog posts and generate JSON data file
# This runs before Jekyll builds on GitHub Pages

require 'yaml'
require 'json'
require 'fileutils'
require 'date'

# Load kramdown for markdown conversion (optional - only if available)
# This should be available via bundler in GitHub Actions
kramdown_available = false
begin
  require 'kramdown'
  kramdown_available = true
rescue LoadError
  # kramdown not available - we'll skip HTML conversion
  # This is okay for the insights page which only needs metadata
  puts "Note: kramdown not available, skipping HTML conversion (metadata only)"
end

posts_dir = File.join(__dir__, '..', 'blog', 'posts')
data_dir = File.join(__dir__, '..', '_data')
FileUtils.mkdir_p(data_dir)

processed_posts = []

Dir.glob(File.join(posts_dir, '*.md')).each do |file_path|
  content = File.read(file_path, encoding: 'UTF-8')
  
  # Parse frontmatter
  if content =~ /\A---\s*\n(.*?)\n---\s*\n(.*)\z/m
    # Old format: content after frontmatter
    frontmatter_text = $1
    markdown_content = $2
  elsif content =~ /\A---\s*\n(.*?)\n---\s*\z/m
    # CMS format: content is in frontmatter, no content after
    frontmatter_text = $1
    markdown_content = ''
  else
    puts "Warning: No frontmatter found in #{file_path}"
    next
  end
  
  begin
    # Use safe_load with permitted classes to allow Date objects
    frontmatter = YAML.safe_load(frontmatter_text, permitted_classes: [Date, Time])
    
    if frontmatter.nil?
      puts "Warning: Failed to parse YAML in #{file_path}"
      next
    end
    
    # Convert Date objects to strings for JSON serialization
    if frontmatter['date'].is_a?(Date) || frontmatter['date'].is_a?(Time)
      frontmatter['date'] = frontmatter['date'].to_s
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
      puts "Skipping unpublished post: #{file_path}"
      next
    end
    
    # Convert markdown to HTML using kramdown (if available)
    html_content = ''
    if kramdown_available && markdown_content && !markdown_content.strip.empty?
      html_content = Kramdown::Document.new(markdown_content, input: 'GFM', hard_wrap: false, auto_ids: true).to_html
    elsif markdown_content && !markdown_content.strip.empty?
      # If kramdown is not available, just use the markdown content as-is
      # The insights page doesn't need HTML content anyway
      html_content = markdown_content
    end
    
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
    
    processed_posts << post_data
    puts "Processed: #{post_data['title']} (#{post_data['slug']})"
  rescue => e
    puts "Error processing #{file_path}: #{e.message}"
    puts e.backtrace.first(3).join("\n")
  end
end

# Sort posts by date (newest first)
processed_posts.sort_by! { |p| p['date'] }.reverse!

# Write to JSON file that Jekyll can read
# Jekyll expects data files to be YAML or JSON
output_file = File.join(data_dir, 'processed_posts.json')
File.write(output_file, JSON.pretty_generate(processed_posts))

# Also copy to a served location for direct HTTP access
# This allows the JavaScript to fetch it directly when Jekyll isn't running
served_data_dir = File.join(__dir__, '..', 'data')
FileUtils.mkdir_p(served_data_dir)
served_output_file = File.join(served_data_dir, 'processed_posts.json')
File.write(served_output_file, JSON.pretty_generate(processed_posts))

puts "\nProcessed #{processed_posts.length} posts"
puts "Output written to #{output_file}"
puts "Also copied to #{served_output_file} for direct HTTP access"

