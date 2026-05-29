class Views::Layouts::ApplicationLayout < Views::Base
  def initialize(page:, controller:)
    @page = page
    @controller = controller
  end

  %i[
  csrf_meta_tags
  csp_meta_tag
  vite_client_tag
  vite_react_refresh_tag
  vite_stylesheet_tag
  vite_javascript_tag
  ].each { |helper| register_output_helper helper }

  def view_context = @view_context ||= @controller.view_context

  def view_template
    doctype
    html do
      head do
        meta name: "viewport", content: "width=device-width, initial-scale=1"
        csrf_meta_tags
        csp_meta_tag
        vite_client_tag
        vite_react_refresh_tag
        vite_javascript_tag "inertia"
        link rel: "icon", type: "image/svg+xml", href: "/icon.svg"
        link rel: "icon", type: "image/png", href: "/icon.png"
      end

      body do
        script(data: { page: :app }, type: "application/json") { @page.to_json.html_safe }
        div id: "app"
      end
    end
  end
end
