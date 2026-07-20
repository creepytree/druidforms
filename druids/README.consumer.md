<div align="center">

# <img src="https://raw.githubusercontent.com/creepytree/druidforms/main/assets/leaf_swatch.svg" width="42" alt="" align="center">@appname@

Mini webapp for @purpose@

[![Docker Hub](https://img.shields.io/docker/pulls/bitdruid/@appname@?logo=docker&logoColor=white&label=docker%20pulls)](https://hub.docker.com/r/bitdruid/@appname@)

<a href="example.png"><img src="example.png" width="666" alt="Example"></a>

</div>

# about

@One sentence feature and purpose@

@- Feature list@


# run

## docker

### get image
```bash
docker pull bitdruid/@appname@:latest
```
```bash
docker buildx build -t bitdruid/@appname@:latest . --load
```

### compose
```bash
docker-compose up -d
```

## script
```bash
bash start.sh [options]
```

Options:

@- Options list@

## cli

@Requirements list@

```bash
pipx install .
# or: uv tool install .
@appname@
```

Options:

@- Options list@

## envs

Table for envs:

| Variable   | Default   | Description   |
| ---------- | --------- | ------------- |
| @variable@ | @default@ | @description@ |

## volumes

Table for volumes:

| Volume   | Description   |
| -------- | ------------- |
| @volume@ | @description@ |

---

> **Disclaimer:** fully agentic project — built entirely by AI against the [druidforms](https://github.com/creepytree/druidforms) design framework (see [AGENTS.md](AGENTS.md)).
