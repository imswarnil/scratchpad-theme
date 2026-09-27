# frozen_string_literal: true

# One RSS feed per podcast series, at /podcast/<slug>/feed.xml.
#
# jekyll-feed writes a feed for posts, not for an arbitrary grouping of a
# collection — and a podcast with two shows in it needs two feeds, because
# a listener subscribes to a show rather than to a website. Each feed is a
# real file written at build time, so it works on GitHub Pages.
#
# The series are declared under `collections.podcast.series` in
# _config.yml; an episode joins one with `series: <slug>`.
module Scratchpad
  class PodcastFeed < Jekyll::Page
    def initialize(site, base, series, episodes)
      @site = site
      @base = base
      @dir  = File.join('podcast', series['slug'].to_s)
      @name = 'feed.xml'

      process(@name)
      read_yaml(File.join(base, '_layouts'), 'podcast-feed.xml')

      data['layout']   = 'podcast-feed'
      data['series']   = series
      data['episodes'] = episodes.sort_by { |d| d.data['date'] || Time.at(0) }.reverse
      data['sitemap']  = false
    end
  end

  class PodcastFeedGenerator < Jekyll::Generator
    safe true
    priority :low

    def generate(site)
      podcast = site.collections['podcast']
      return if podcast.nil?

      series = site.config.dig('collections', 'podcast', 'series')
      return if series.nil? || series.empty?

      written = 0
      series.each do |s|
        episodes = podcast.docs.select { |d| d.data['series'].to_s == s['slug'].to_s }
        next if episodes.empty?

        site.pages << PodcastFeed.new(site, site.source, s, episodes)
        written += 1
      end

      Jekyll.logger.info 'Podcast feeds:', "generated #{written} at /podcast/<series>/feed.xml"
    end
  end
end
