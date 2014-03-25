#!/usr/bin/env node

var pofile = require('pofile')
  , request = require('request')
  , options = require('../lib/options')
  , pjson = require('../package.json')
  , async = require('async')
  , path = require('path')
  , potfileName
  , pofileName
  , endpoint = 'https://lc-api.sdl.com/translate'
  , assert = require('assert')
  , lib = require('../index')
  ;

if(options.languages){
  lib.getLanguages(options, options.languages, function(err, mappings){
    if(err){
      console.log(err);
      return ;
    }else{
      //var langs = Object.keys(mappings), i, l=langs.length, lang, code;
      var i, l=mappings.length, lang, code;
      var list = [];
      for(i=0; i<l; i++){
        lang = mappings[i].name;//langs[i]
        code = mappings[i].code;//mappings[lang];
        console.log(lang+' = '+code);
        //mappings[i].locale = '';
      }
      //(require('fs')).writeFileSync('./langs.json', JSON.stringify(mappings, null, '  '));
      if(l===0){
        console.log('No results found for '+options.languages);
      }
    }
  });
}else{
  lib.load(options, function(err, po){
    //assert(!err, err);
    if(err){
      console.log(options.pofileName);
      console.log(err);
      return ;
    }
    options.log = console.log;
    lib.translateStrings(options, po, function(err, response){
      assert(!err, err);
      if(response.total){
        console.log('Translated: '+response.success+' of '+response.total);
        if(response.skipped){
          console.log('Skipped: '+response.skipped+' of '+response.total);
        }
        if(response.failed){
          console.log('Failed: '+response.failed+' of '+response.total);
        }
      }else{
        console.log('Nothing to translate');
      }
      if(response.saved){
        console.log('PO saved to '+response.outfile);
      }
    });
  });
}