import sys

import uvicorn

from druids.preview import create_app

if __name__ == "__main__":
    app = create_app(login="--login" in sys.argv)
    uvicorn.run(app, host="127.0.0.1", port=8338)
