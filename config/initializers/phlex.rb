module Views
end

Rails.autoloaders.main.push_dir(
  Rails.root.join("app/views"), namespace: Views
)
