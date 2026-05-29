module Views
end

class Views::Base < Phlex::HTML
  include Phlex::Rails::Helpers
  include Rails.application.routes.url_helpers

  def view_context
    @view_context ||= controller.view_context
  end
end
