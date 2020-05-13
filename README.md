__Use Tailwind CSS with Elm.__

_Generates an Elm module with functions for all your CSS selectors and the ones from Tailwind. For the production build it filters out all the unused selectors and minifies the css file._

In other words, pretty much a CLI for [monty5811/postcss-elm-tailwind](https://github.com/monty5811/postcss-elm-tailwind) and [FullHuman/purgecss](https://github.com/FullHuman/purgecss), plus CSS minifying.

## Usage

```shell
npm install elm-tailwind-css --save-dev
npx etc --help

# Make a CSS build with all the Tailwind stuff
# and generate the Elm module
npx etc Sheet.css
  --config tailwind.config.js
  --elm-path Tailwind.elm
  --output build/sheet.css

# Make a minified & purged CSS build
NODE_ENV=production npx etc Sheet.css
  --config tailwind.config.js
  --output build/sheet.css

  --purge-content ./build/**/*.html
  --purge-content ./build/app.js
```

See the `demo` directory in this repo for more details.
