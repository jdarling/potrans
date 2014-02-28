potrans
==========

A wrapper to translate PO and POT files (GetText format).  Currently only supports http://www.freetranslation.com/ api.  Hope to add other translation services some day.

Usage
-------

1) Signup for a FreeTranslation.com account
2) Setup a project and retrieve the API key
3) Call the bin/potrans with your API key

Options
-------

```
  Usage: potrans.js [options]

  Options:

    -h, --help                output usage information
    -V, --version             output the version number
    -a, --apikey <apikey>     The API key to use to interact with freetranslation.com
    -t, --template <file>     The POT (PO Template) file to work from
    -l, --language <lang>     The language code to translate to
    -f, --from [lang]         The language code to translate from, default eng
    -o, --outfile             Name of output file, default <language>.po in POT folder
    -L, --languages [filter]  Returns a list of all languages and codes to translate to
    -n, --name [name]         Sets the name of the language in the PO output file, defaults to language name from FreeTranslation.com
    -F, --forceupdate         Forces an update to the PO file even if no new strings are found, useful for changing names
```

Usage from node.js application
------------------------------

See bin/potrans.js source code for now.

langs.json
-----------

Contains a listing (up to the date specified at the top of the file in the code: false object) of the full or partial Locale to language and code for FreeTranslation.com.