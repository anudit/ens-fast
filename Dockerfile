FROM rustlang/rust:nightly

ARG PORT

ENV ROCKET_ADDRESS=0.0.0.0

WORKDIR /app
COPY . .

RUN cargo build --release

CMD ROCKET_PORT=$PORT ./target/release/ens-fast
