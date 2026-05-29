Wlog::Application.routes.draw do
  root "villages#index"
  get "villages/:id", to: "villages#show"
end
