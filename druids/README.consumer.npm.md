<!--
README template for an *npm* consumer app of the druidforms design framework — a Lit app
with its own bundler, or a browser extension. Copy to the consumer's repo root as
README.md and replace every @placeholder@. Header, *about* and the disclaimer stay
verbatim; *install* / *build* keep their shape and only gain the app's own steps.
For a pip / container app use README.consumer.md instead.
-->

<div align="center">

# <img src="https://raw.githubusercontent.com/creepytree/druidforms/main/assets/leaf_swatch.svg" width="42" alt="" align="absmiddle">@appname@

@Browser extension | Lit web app@ for @purpose@

<a href="example.png"><img src="example.png" width="666" alt="Example"></a>

</div>

# about

@One sentence feature and purpose@

@- Feature list@

# build

@Requirements list — node version, package manager@

```bash
npm install
npm run build
```

`.npmrc` carries `allow-git=all`: the framework installs from git, which npm 12 refuses by
default. The build writes @dist@.

# install

## @browser@ — load unpacked

1. open `@chrome://extensions@` and enable developer mode
2. **Load unpacked** → pick the @dist@ directory
3. @pin the toolbar icon / open the side panel@

## from a release

```bash
@unzip @appname@.zip@
```

# settings

Set in @the options page@:

| Setting   | Default   | Description   |
| --------- | --------- | ------------- |
| @setting@ | @default@ | @description@ |

## @server / backend@

@What the app talks to and how it is configured — host, port, API key, permissions@

# permissions

@Only if this is an extension: one row per manifest permission and why it is needed@

| Permission   | Why   |
| ------------ | ----- |
| @permission@ | @why@ |

---

> **Disclaimer:** fully agentic project — built entirely by AI against the [druidforms](https://github.com/creepytree/druidforms) design framework (see [AGENTS.md](AGENTS.md)).
