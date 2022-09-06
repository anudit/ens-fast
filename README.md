# Local-first ENS Resolver

## Setup

1. Make sure that your system has [Rust](https://www.rust-lang.org/tools/install) installed.
2. Clone the repo,
    ```
    git clone https://github.com/anudit/ens-fast
    ```
3. Create a `.env` file (like the `.env.sample` file) in the root directory cloned with the following variables,
    ```
    PROFILE=""
    WEB3STORAGE_TOKEN=""
    ```
    - Profile: `dev`, `release`
    - (Optional) Create a Web3.storage API key [here](https://web3.storage/tokens/?create=true) for snapshot cron.

3. Run it.
    ```
    cargo run --release
    ```
4. Test it out.

## API

Enpoint: http://localhost:8000

- [GET] `/ens/resolve/<ens-name>`

    Example [`http://localhost:8000/ens/resolve/vitalik.eth`](http://localhost:8000/ens/resolve/nick.eth)

- [GET] `/ens/resolve-full/<ens-name>`

    Example [`http://localhost:8000/ens/resolve-full/vitalik.eth`](http://localhost:8000/ens/resolve-full/nick.eth)

- [POST] `/ens/resolve/batch`

    Example [`http://localhost:8000/ens/resolve/batch`](http://localhost:8000/ens/resolve/batch)

    Body,
    ```json
    {
        "ens": [
            "nick.eth",
            "daws.eth"
        ]
    }
    ```

    Resp,
    ```json
    {
        "daws.eth": {
            "address": "0xc0deaf6bd3f0c6574a6a625ef2f22f62a5150eab",
            "created": 1632334969,
            "expiry": 1853233633
        },
        "nick.eth": {
            "address": "0xb8c2c29ee19d8307cb7255e1cd9cbde883a267d5",
            "created": 1571924851,
            "expiry": 1698131707
        }
    }
    ```

- [POST] `/ens/resolve-full/batch`

    Example [`http://localhost:8000/ens/resolve-full/batch`](http://localhost:8000/ens/resolve-full/batch)

    Body,
    ```json
    {
        "ens": [
            "daws.eth",
            "nick.eth",
        ]
    }
    ```
