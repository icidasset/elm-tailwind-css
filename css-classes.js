import hashwasm from "hash-wasm"
import fs from "fs"
import postcss from "postcss"
import stringify from "fast-stable-stringify"


// This'll generate an Elm module with a function for each CSS class we have.
// It will also generate a "CSS table" with the "css_class <=> elm_function" relation.
// This "CSS table" makes it possible to only keep the CSS that's actually used.
const plugin = async (flags, root, result) => {

  const functions = []
  const lookup = {}

  const processSelector = (selector, rule) => {
    if (!selector.startsWith(".")) return

    const cls = selector
      .replace(/^\./, "")
      .replace(/\\\./g, ".")
      .replace(/\s?>\s?.*/, "")
      .replace(/::.*$/, "")
      .replace(/:not\([^\)]*\)/g, "")
      .replace(
        /(:(active|after|before|checked|disabled|focus|focus-within|hover|visited|nth-child\((even|odd)\)|(first|last)-child))+$/,
        ""
      )
      .replace(/\\\//g, "/")
      .replace(/\\([/])/g, "\\\\$1")
      .replace(/\\([:])/g, "$1")

    const elmVariable = cls
      .replace(/:/g, "__")
      .replace(/__-/g, "__neg_")
      .replace(/^-/g, "neg_")
      .replace(/-/g, "_")
      .replace(/\./g, "_")
      .replace(/\//g, "over")

    const elmVarWithProperCase = flags.elmNameStyle === "camel"
      ? elmVariable.replace(/(_+\w)/g, g => g.replace(/_/g, "").toUpperCase())
      : elmVariable

    if (lookup[elmVarWithProperCase]) return

    const css = rule
      .toString()
      .replace(/\s+/g, " ")
      .replace(/(\w)\{/g, "$1 {")

    functions.push(
      `{-| This represents the \`.${cls}\` class.\n` +
      `\n    ${css}` +
      `\n-}\n` +
      `${elmVarWithProperCase} : Html.Attribute msg\n` +
      `${elmVarWithProperCase} = A.class "${cls}"\n`
    )

    lookup[elmVarWithProperCase] = cls
  }

  root.walkRules(rule => {
    [].concat(...rule.selector.split(",").map(a => a.split(" ")))
      .forEach(s => processSelector(s, rule))
  })

  const tmpDir = `./elm-stuff/elm-tailwind-css/${flags.elmModule}`
  fs.mkdirSync(tmpDir, { recursive: true })

  const header = `module ${flags.elmModule} exposing (..)\n\n`
  const imports = [ "import Html", "import Html.Attributes as A" ]
  const contents = header + imports.join("\n") + "\n\n" + functions.join("\n\n")
  const table = stringify(lookup)
  const hash = await hashwasm.xxhash32(table, 1)
  const previousHash = fs.readFileSync(`${tmpDir}/css-table.cache`, { flag: "a+", encoding: "utf-8" })

  if (hash === previousHash) return;

  fs.writeFileSync(`${tmpDir}/css-table.cache`, hash)
  fs.writeFileSync(`${tmpDir}/css-table.json`, table)
  fs.writeFileSync(flags.elmPath, contents)

}


export default flags => ({
  postcssPlugin: "elm-css-classes",
  Once (root, { result }) { return plugin(flags, root, result) }
})
