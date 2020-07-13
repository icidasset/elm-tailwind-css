module App exposing (..)

import Browser
import Html
import Tailwind as T


main : Program () () ()
main =
    Browser.sandbox
        { init = ()
        , update = \_ _ -> ()
        , view = view
        }


view _ =
    Html.div
        [ T.dark__bg_black
        , T.translate_x_1over2
        ]
        []
