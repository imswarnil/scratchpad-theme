# frozen_string_literal: true

# Packaging this as a Jekyll gem theme.
#
# The gem carries the LAYER anyone reuses — layouts, includes, sass, the
# built assets and the plugin — and nothing else: no content, no config, no
# demo. A site that depends on it gets those files as defaults and
# overrides any of them by creating a file of the same name in its own
# tree, which is how Jekyll's theme lookup works.
#
#   gem build scratchpad-theme.gemspec
#   gem push scratchpad-theme-<version>.gem
#
# In a site's Gemfile:
#
#   gem "scratchpad-theme"
#
# …and in its _config.yml:
#
#   theme: scratchpad-theme
#
# The repository itself is still a working site — that is the demo, and
# the way most people will start (`npx scratchpad-theme`). The gem is for
# people who want the theme under an existing site.
Gem::Specification.new do |spec|
  spec.name          = 'scratchpad-theme'
  spec.version       = '1.0.0'
  spec.authors       = ['Swarnil Singhai']
  spec.email         = ['hello@imswarnil.com']

  spec.summary       = 'A dev portfolio theme on Jekyll, composed from config rather than templates.'
  spec.description   = <<~TEXT
    Thirteen content collections, a resume that stands on its own, a tag page
    per tag, four ways to look at every listing, and a setup form that writes
    the config for you. What an entry page is made of — its parts, its
    widgets, its lead block and how wide it is — is data in _config.yml, not
    a template, so a new kind of page is a file you drop in and name.
  TEXT
  spec.homepage      = 'https://scratchpad.imswarnil.com'
  spec.license       = 'MIT'

  spec.metadata = {
    'homepage_uri'      => spec.homepage,
    'source_code_uri'   => 'https://github.com/imswarnil/scratchpad-theme',
    'documentation_uri' => 'https://scratchpad.imswarnil.com/docs/',
    'bug_tracker_uri'   => 'https://github.com/imswarnil/scratchpad-theme/issues',
  }

  # Only what a consuming site reuses. Content, config and the demo stay
  # in the repository, where they belong to the demo rather than to anyone
  # who installs this.
  spec.files = Dir.glob(
    '{_layouts,_includes,_sass,_plugins}/**/*',
    File::FNM_DOTMATCH,
  ).grep_v(%r{/\.}) + Dir.glob('assets/**/*').grep_v(%r{assets/img/demo/}) +
    %w[README.md LICENSE].select { |f| File.exist?(f) }

  spec.required_ruby_version = '>= 3.1'

  spec.add_runtime_dependency 'jekyll', '>= 4.3', '< 5.0'
  spec.add_runtime_dependency 'jekyll-feed', '~> 0.17'
  spec.add_runtime_dependency 'jekyll-include-cache', '~> 0.2'
  spec.add_runtime_dependency 'jekyll-paginate-v2', '~> 3.0'
  spec.add_runtime_dependency 'jekyll-redirect-from', '~> 0.16'
  spec.add_runtime_dependency 'jekyll-seo-tag', '~> 2.8'
  spec.add_runtime_dependency 'jekyll-sitemap', '~> 1.4'
end
