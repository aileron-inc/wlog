# syntax=docker/dockerfile:1.7
# check=error=true

# Reference: hairbook project Dockerfile pattern
# - Multi-stage build (base, build, final)
# - Falcon as web server

ARG MISE_VERSION=2025.12.10

# Stage 1: Base
FROM debian:bookworm-slim AS base

LABEL fly_launch_runtime="rails"

WORKDIR /rails

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y ca-certificates curl libjemalloc2 sqlite3 git libyaml-0-2 zlib1g libssl3 && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

ENV BUNDLE_DEPLOYMENT="1" \
    BUNDLE_PATH="/usr/local/bundle" \
    BUNDLE_WITHOUT="development:test" \
    RAILS_ENV="production"


# Stage 2: Build
FROM base AS build

ARG MISE_VERSION

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential libssl-dev libyaml-dev zlib1g-dev node-gyp pkg-config python-is-python3 && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

RUN curl --fail-with-body --location --show-error --silent https://mise.run | sh && \
    mv ~/.local/bin/mise /usr/local/bin/mise

COPY mise.toml ./
RUN mise trust && \
    mise install

RUN RUBY_VERSION=$(ls /root/.local/share/mise/installs/ruby | grep -E '^[0-9]' | head -1) && \
    BUN_VERSION=$(ls /root/.local/share/mise/installs/bun | grep -E '^[0-9]' | head -1) && \
    ln -s /root/.local/share/mise/installs/ruby/${RUBY_VERSION} /opt/ruby && \
    ln -s /root/.local/share/mise/installs/bun/${BUN_VERSION} /opt/bun

ENV PATH="/opt/ruby/bin:/opt/bun/bin:${PATH}"

COPY Gemfile Gemfile.lock ./
RUN --mount=type=cache,id=bundle-cache,target=/usr/local/bundle/cache bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

RUN SECRET_KEY_BASE_DUMMY=1 RAILS_GROUPS=assets ./bin/rails assets:precompile && \
    rm -rf node_modules

# Stage 3: Final
FROM base

RUN curl -fsS https://dotenvx.sh | sh

COPY --from=build "${BUNDLE_PATH}" "${BUNDLE_PATH}"
COPY --from=build /root/.local/share/mise/installs/ruby /root/.local/share/mise/installs/ruby
COPY --from=build /rails /rails

ENV PATH="/root/.local/share/mise/installs/ruby/4.0.4/bin:${PATH}"

RUN ruby --version && \
    bundle --version

ENTRYPOINT []
EXPOSE 8080
CMD ["./bin/entrypoint-app"]
