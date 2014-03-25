var options = require('commander')
  , assert = require('assert')
  , path = require('path')
  , pjson = require('../package.json')
  ;

options
  .version('v'+pjson.version)
  .option('-a, --apikey <apikey>', 'The API key to use to interact with freetranslation.com')
  .option('-t, --template <file>', 'The POT (PO Template) file to work from')
  .option('-l, --language <lang>', 'The language code to translate to')
  .option('-f, --from [lang]', 'The language code to translate from, default eng', 'eng')
  .option('-o, --outfile [fileName]', 'Name of output file, default <language>.po in POT folder')
  .option('-L, --languages [filter]', 'Returns a list of all languages and codes to translate to')
  .option('-n, --name [name]', 'Language Name to use in output, defaults to Lanauge Name from FreeTranslation')
  .option('-F, --forceupdate', 'Force an update to the .po file even if there are no new strings, useful for changing names')
  .parse(process.argv)
  ;

assert(options.apikey, 'APIKey is required (-a or --apikey)');

if(!options.languages){
  assert(options.template, 'Template is required (-t or --template)');
  assert(options.language, 'Target language is required (-l or --language)');

  options.potfileName = path.resolve('./', options.template);
  options.pofileName = options.language + '.po';
  options.pofileName = path.resolve(path.dirname(options.potfileName), options.outfile||options.pofileName);
}

module.exports = options;