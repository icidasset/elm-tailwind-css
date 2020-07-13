#!/usr/bin/env node --no-warnings


import { createRequire } from "module"
import autoprefixer from "autoprefixer"
import csso from "postcss-csso"
import fs from "fs"
import elmTailwind from "postcss-elm-tailwind"
import path from "path"
import process from "process"
import postcss from "postcss"
import purgecss from "@fullhuman/postcss-purgecss"
import tailwind from "tailwindcss"


const meow = createRequire(import.meta.url)("meow")
const isProduction = (process.env.NODE_ENV === "production")


// ⌨️


const cli = meow(`
    Usage
      $ etc <input> <flags>

    Options
      --config, -c          Provide a Tailwind configuration file
      --output, -o          Output path (default: build/stylesheet.css)

      🌳  Elm Options

      https://github.com/monty5811/postcss-elm-tailwind

      --elm-path, -e        [REQUIRED] Path for the generated Elm Tailwind file
      --elm-name-style, -n  Naming style for Elm functions, "snake" (default) or "camel"

      🚽  PurgeCSS Options

      https://purgecss.com/CLI.html
      You can add these flags multiple times:

      --purge-content       [REQUIRED*] Glob that should be analyzed by PurgeCSS
      --purge-whitelist     CSS selector not to be removed by PurgeCSS

      * Only when used with NODE_ENV=production

    Examples
      $ etc src/stylesheet.css
          --config tailwind.config.js
          --elm-path src/Library/Tailwind.elm
          --output build/stylesheet.css

      $ NODE_ENV=production etc src/stylesheet.css
          --config tailwind.config.js
          --output build/stylesheet.css
          --purge-content build/elmApp.js
`, {
  flags: {
    config: {
      type: "string",
      alias: "c"
    },
    elmNameStyle: {
      type: "string",
      alias: "n",
      default: "snake"
    },
    elmPath: {
      type: "string",
      alias: "e",
      isRequired: _ => !isProduction
    },
    output: {
      type: "string",
      alias: "o",
      default: "build/stylesheet.css"
    },
    purgeContent: {
      type: "string",
      isMultiple: true,
      isRequired: _ => isProduction
    },
    purgeWhitelist: {
      type: "string",
      isMultiple: true
    }
  }
})



// 🏔


const tailwindConfigPromise = ( async () => {
  if (cli.flags.config) {
    const { default: config } = await import(
      path.join(process.env.PWD, cli.flags.config)
    )

    return config

  } else {
    return undefined

  }
})()

const input = cli.input[0]
const output = cli.flags.output



// FLOW


const flow = maybeTailwindConfig => [

  tailwind({ ...(maybeTailwindConfig || {}), purge: false }),

  // Generate Elm module based on our Tailwind configuration
  // OR: make CSS as small as possible by removing style rules we don't need
  isProduction

  ? purgecss({
    content: cli.flags.purgeContent,
    whitelist: cli.flags.purgeWhitelist,

    // Taken from Tailwind src
    // https://github.com/tailwindcss/tailwindcss/blob/61ab9e32a353a47cbc36df87674702a0a622fa96/src/lib/purgeUnusedStyles.js#L84
    defaultExtractor: content => {
      const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || []
      const innerMatches = content.match(/[^<>"'`\s.(){}[\]#=%]*[^<>"'`\s.(){}[\]#=%:]/g) || []
      return broadMatches.concat(innerMatches)
    }
  })

  : elmTailwind({
    elmFile: cli.flags.elmPath,
    elmModuleName: cli.flags.elmPath.split("/").slice(-1)[0].replace(/\.\w+$/, ""),
    nameStyle: cli.flags.elmNameStyle
  }),

  // Add vendor prefixes where necessary
  autoprefixer,

  // Minify CSS if needed
  ...(isProduction ? [ csso({ comments: false }) ] : [])

]



// BUILD


tailwindConfigPromise.then(async maybeTailwindConfig => {
  fs.mkdirSync(
    output.split("/").slice(0, -1).join("/"),
    { recursive: true }
  )

  const css = fs.readFileSync(input)
  const cfg = flow(maybeTailwindConfig)
  const res = await postcss(cfg).process(css, { from: input, to: output })

  fs.writeFileSync(output, res.css)
})
