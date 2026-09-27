# frozen_string_literal: true

# One page per tag, across every collection.
#
# Jekyll's own `site.tags` only ever sees posts, and this site tags films,
# snippets, prompts, trips and gear as well — so a tag page built from it
# would quietly show a third of what carries the tag. This generator walks
# EVERY collection instead, groups by the tag's slug (so `Analytics` and
# `analytics` are one subject, as they are on /tags/), and writes a page
# per group at /tags/<slug>/.
#
# The pages carry no content of their own: `layout: tag` renders the group,
# and /tags/ remains the index of all of them.
#
# NOTE: a _plugins/ generator runs when Jekyll is invoked by us — which is
# what .github/workflows/jekyll.yml does. It would NOT run on github.com's
# legacy "build from branch" Pages mode. If you switch to that, delete this
# file and the tag links fall back to the anchors on /tags/, which still
# work.
module Scratchpad
  class TagPage < Jekyll::Page
    def initialize(site, base, slug, label, entries)
      @site = site
      @base = base
      @dir  = File.join('tags', slug)
      @name = 'index.html'

      process(@name)
      read_yaml(File.join(base, '_layouts'), 'tag.html')

      data['layout']      = 'tag'
      data['tag']         = label
      data['tag_slug']    = slug
      data['tag_count']   = entries.size
      data['title']       = label
      data['description'] =
        "Everything tagged #{label} — #{entries.size} " \
        "#{entries.size == 1 ? 'entry' : 'entries'} across the site."
      # The docs are sorted here rather than in the template so the page
      # and the index agree on what "latest" means.
      data['entries'] = entries.sort_by { |d| d.data['date'] || Time.at(0) }.reverse
    end
  end

  class TagPageGenerator < Jekyll::Generator
    safe true
    priority :low

    def generate(site)
      return if site.config['tag_pages'] == false

      groups = Hash.new { |h, k| h[k] = { label: nil, docs: [] } }

      site.collections.each_value do |collection|
        collection.docs.each do |doc|
          Array(doc.data['tags']).each do |tag|
            slug = Jekyll::Utils.slugify(tag.to_s)
            next if slug.empty?

            # First spelling seen wins, and the newest entry is seen first
            # on /tags/ — so keep that order here too.
            groups[slug][:label] ||= tag.to_s
            groups[slug][:docs] << doc
          end
        end
      end

      groups.each do |slug, group|
        site.pages << TagPage.new(site, site.source, slug, group[:label], group[:docs].uniq)
      end

      Jekyll.logger.info 'Tag pages:', "generated #{groups.size} at /tags/<slug>/"
    end
  end
end
