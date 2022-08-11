FROM rustlang/rust:nightly

ARG PORT

ENV ROCKET_ADDRESS=0.0.0.0
ENV ROCKET_ENV=production
ENV PROFILE=release

WORKDIR /app
COPY . .

RUN cargo build --release

CMD ROCKET_PORT=$PORT ./target/release/ens-fast
