class ApplicationController < ActionController::Base
  include InertiaRails::Controller
  allow_browser versions: :modern

  class_attribute :defaults, default: {}.freeze
end
