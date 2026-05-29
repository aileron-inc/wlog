class VillagesController < ApplicationController
  self.defaults = { village_id: "", day: "", source: "villager", spoiler: "false", page: "1", per_page: "50", tag: "" }.freeze

  validates :index do
    string :tag, strong: true
    string :page, strong: true
    string :per_page, strong: true
  end

  validates :show do
    string :village_id, strong: true
    string :day, strong: true
    string :source, strong: true
    string :spoiler, strong: true
    string :page, strong: true
    string :per_page, strong: true
  end

  def index = render(inertia: "villages/index", props: PropsQuery.find("villages/index", defaults:, permitted_params:).call)
  def show = render(inertia: "villages/#{params[:id]}", props: PropsQuery.find("villages/#{params[:id]}", defaults:, permitted_params:).call)
end
